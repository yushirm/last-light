import {awardAchievement} from './achievements.js';
export function settleRun(save,run,outcome){if(run.rewardsSettled)return run.earnedBanked||0;run.rewardsSettled=true;run.ended=true;save.stats.totalKills+=run.kills;save.stats.totalRescues+=run.rescuedShips;
 if(save.stats.totalRescues>=10)awardAchievement(save,'fleet_keeper');
 if(run.mode==='endless'){save.stats.endlessBestScore=Math.max(save.stats.endlessBestScore,Math.floor(run.score));save.stats.endlessBestWave=Math.max(save.stats.endlessBestWave,run.waveIndex);save.stats.endlessLongestSeconds=Math.max(save.stats.endlessLongestSeconds,Math.floor(run.elapsedTotal));run.earnedBanked=0;return 0;}
 const complete=save.campaign.completedNights.includes(run.night);let award=0;
 if(outcome==='victory'){
  award=complete?Math.floor(run.runStarlight*.25):run.runStarlight;
  save.campaign.nightClearCounts[run.night]++;save.campaign.nightBestScores[run.night]=Math.max(save.campaign.nightBestScores[run.night],Math.floor(run.score));
  save.stats.totalNightVictories++;
  if(!complete){save.campaign.completedNights.push(run.night);save.campaign.completedNights.sort((a,b)=>a-b);save.campaign.highestUnlockedNight=Math.max(save.campaign.highestUnlockedNight,Math.min(7,run.night+1));}
  if(run.night===1)awardAchievement(save,'night_watch');if(run.night===3)awardAchievement(save,'three_suns');if(run.night===7){save.campaign.campaignComplete=true;awardAchievement(save,'the_dawn');}
 }else award=Math.floor(run.runStarlight*.25);
 save.economy.bankedStarlight+=award;run.earnedBanked=award;return award;
}
