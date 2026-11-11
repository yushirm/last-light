import test from 'node:test';
import assert from 'node:assert/strict';
import { scanContent, checkPath, auditFiles } from '../scripts/check-public-safety.mjs';

const labels = (text) => scanContent(text).map((finding) => finding.label);

test('source text and normal game configuration are permitted', () => {
  assert.deepEqual(labels('const stage = "https://example.test/last-light/";'), []);
  assert.deepEqual(checkPath('src/simulation.js'), []);
  assert.deepEqual(checkPath('.github/workflows/ci.yml'), []);
});

test('email addresses and personal filesystem paths are flagged without allowlisting a person', () => {
  const email = 'sample' + String.fromCharCode(64) + 'example.test';
  assert.ok(labels('Contact ' + email).includes('Email address'));
  assert.ok(labels('/' + 'Users/private-user/Desktop').includes('Personal home folder path'));
});

test('credential headers are flagged', () => {
  const marker = '-----BEGIN ' + 'PRIVATE KEY-----';
  assert.ok(labels(marker).includes('Private key header'));
});

test('local secrets and data files cannot be committed', () => {
  for (const file of ['.env', '.env.production', 'archive.zip', '.ssh/id_ed25519', 'backup.db', 'credentials.json']) {
    assert.notDeepEqual(checkPath(file), [], file);
  }
});

test('existing files are scanned without exposing matching secret values', () => {
  assert.deepEqual(auditFiles(new URL('../', import.meta.url).pathname, ['README.md']).filter((f) => f.label === 'Email address'), []);
});
