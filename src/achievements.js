export const ACHIEVEMENTS=Object.freeze({
 first_light:['First Light','Defeat your first shadow'],safe_harbour:['Safe Harbour','Guide your first ship'],night_watch:['Night Watch','Clear Night 1'],three_suns:['Three Suns','Clear Night 3'],shipwright:['Shipwright','Purchase your first Workshop upgrade'],fleet_keeper:['Fleet Keeper','Guide ten ships'],the_dawn:['The Dawn','Bring back the Sun'],again_again:['Again, Again','Reach Endless Wave 5']
});
export function awardAchievement(save,id){if(!Object.hasOwn(ACHIEVEMENTS,id)||save.achievements.includes(id))return false;save.achievements.push(id);return true;}
