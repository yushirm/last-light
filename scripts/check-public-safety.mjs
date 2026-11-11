/**
 * Minimal, dependency-free guard against accidentally publishing common PII
 * and secrets. It checks source committed to Git, not ignored local files.
 * It deliberately prints only filenames and rule names, never secret values.
 * This is a safety net, not comprehensive secret scanning.
 */
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SKIP_DIRECTORIES = new Set(['.git', '.idea', '.vscode', 'node_modules', 'coverage', 'dist', 'build', '.cache']);
const MAX_FILE_SIZE = 2_000_000;
// These two published game captures were reviewed before inclusion.
// Keep the checksums explicit so a later binary replacement needs another review.
const REVIEWED_MEDIA = new Map([
  ['docs/media/title.gif', 'eefb55de33144165c704ea574ec6e955e83afbd113a26dbee292cadc3092689e'],
  ['docs/media/gameplay.gif', '9463e12f438221376a6271a57c1d08e8855b87ad5c47da9edeea685c6cad4a3a'],
]);

const SENSITIVE_PATHS = [
  /(^|\/)\.env(?:\.|$)/i,
  /(^|\/)(?:\.npmrc|\.pypirc|\.netrc|credentials\.json|service-account[^/]*\.json|[^/]*-service-account\.json)$/i,
  /(^|\/)(?:id_rsa|id_ed25519|id_ecdsa)(?:\.pub)?$/i,
  /(^|\/)(?:\.ssh|\.aws|\.gnupg|\.secrets|secrets)(?:\/|$)/i,
  /\.(?:pem|key|p8|p12|pfx|jks|keystore|sqlite|sqlite3|db|bak|backup|zip|7z|tar|tgz)$/i,
  /\.tar\.gz$/i,
];

const SENSITIVE_CONTENT = [
  ['Email address', /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/],
  ['Private key header', /-----BEGIN (?:[A-Z]+ )?PRIVATE KEY-----/],
  ['GitHub access token', /\b(?:gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,})\b/],
  ['Cloud access key', /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/],
  ['Google API key', /\bAIza[0-9A-Za-z_-]{35}\b/],
  ['Slack token', /\bxox[baprs]-[A-Za-z0-9-]{16,}\b/],
  ['Live payment key', /\bsk_live_[A-Za-z0-9]{16,}\b/],
  ['Embedded credential assignment', /\b(?:api[_-]?key|client[_-]?secret|password|access[_-]?token)\s*[:=]\s*['"`][^'"`\n]{12,}['"`]/i],
  ['Personal home folder path', /(?:\/Users\/|\/home\/)[A-Za-z0-9._-]+(?:\/|\b)/],
  ['Windows user folder path', /\b[A-Za-z]:\\Users\\[^\\\s'"`]+/],
];

export function checkPath(relativePath) {
  const clean = relativePath.split(path.sep).join('/');
  return SENSITIVE_PATHS.some((pattern) => pattern.test(clean)) ? ['Sensitive filename or directory'] : [];
}

export function scanContent(content) {
  const findings = [];
  for (const [label, pattern] of SENSITIVE_CONTENT) {
    const match = pattern.exec(content);
    if (match) findings.push({ label, line: content.slice(0, match.index).split('\n').length });
  }
  return findings;
}

function walk(dir, base = '') {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const relative = base ? `${base}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      if (!SKIP_DIRECTORIES.has(entry.name)) files.push(...walk(path.join(dir, entry.name), relative));
    } else files.push(relative);
  }
  return files;
}

function listSourceFiles() {
  try {
    const output = execFileSync('git', ['-C', ROOT, 'ls-files', '-z', '--cached'], {
      encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 8000,
    });
    if (output) return output.split('\0').filter(Boolean);
  } catch { /* Local source archives do not have Git metadata. */ }
  return walk(ROOT);
}

export function auditFiles(root, files) {
  const findings = [];
  for (const relative of files) {
    const safeRelative = relative.split(path.sep).join('/');
    if (safeRelative.startsWith('../') || path.isAbsolute(relative)) {
      findings.push({ path: safeRelative, label: 'File path leaves repository' });
      continue;
    }
    const absolute = path.resolve(root, relative);
    if (!absolute.startsWith(path.resolve(root) + path.sep)) {
      findings.push({ path: safeRelative, label: 'File path leaves repository' });
      continue;
    }
    for (const label of checkPath(safeRelative)) findings.push({ path: safeRelative, label });
    let stats;
    try { stats = fs.lstatSync(absolute); }
    catch { findings.push({ path: safeRelative, label: 'Tracked file is missing' }); continue; }
    if (!stats.isFile()) {
      findings.push({ path: safeRelative, label: 'Non-regular file requires review' });
      continue;
    }
    if (stats.size > MAX_FILE_SIZE) {
      findings.push({ path: safeRelative, label: 'Oversized file requires manual review' });
      continue;
    }
    const bytes = fs.readFileSync(absolute);
    if (bytes.includes(0)) {
      const approvedDigest = REVIEWED_MEDIA.get(safeRelative);
      const verifiedCapture = approvedDigest &&
        bytes.subarray(0, 6).toString('ascii') === 'GIF89a' &&
        createHash('sha256').update(bytes).digest('hex') === approvedDigest;
      if (verifiedCapture) continue;
      findings.push({ path: safeRelative, label: 'Binary file requires metadata review' });
      continue;
    }
    const source = bytes.toString('utf8');
    for (const finding of scanContent(source)) findings.push({ path: safeRelative, ...finding });
    if (safeRelative.startsWith('.github/workflows/') && /\.ya?ml$/i.test(safeRelative)) {
      if (/^\s*pull_request_target\s*:/m.test(source)) {
        findings.push({ path: safeRelative, label: 'Privileged pull_request_target trigger' });
      }
      for (const match of source.matchAll(/^\s*(?:-\s*)?uses:\s*([^\s#]+)/gm)) {
        if (!match[1].startsWith('./') && !/@[a-f0-9]{40}$/i.test(match[1])) {
          findings.push({ path: safeRelative, label: 'Action reference is not pinned to a full commit SHA' });
        }
      }
    }
  }
  return findings;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const files = listSourceFiles();
  const findings = auditFiles(ROOT, files);
  if (findings.length) {
    console.error(`Public-safety check failed: ${findings.length} finding(s) in ${files.length} files.`);
    for (const finding of findings) {
      console.error(`- ${finding.path}${finding.line ? `:${finding.line}` : ''}: ${finding.label}`);
    }
    console.error('No matched values are printed. Review any findings privately before committing.');
    process.exitCode = 1;
  } else {
    console.log(`Public-safety check passed: ${files.length} source files, no obvious secrets or PII found.`);
  }
}
