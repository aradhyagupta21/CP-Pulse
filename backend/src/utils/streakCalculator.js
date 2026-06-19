export const calculateStreak = (progressArray) => {
  if (!progressArray || progressArray.length === 0) return 0;
  
  const dates = [...new Set(
    progressArray
      .map(p => p.updatedAt ? new Date(p.updatedAt) : null)
      .filter(d => d && !isNaN(d.valueOf()))
      .map(d => d.toISOString().split('T')[0])
  )].sort();
  
  if (dates.length === 0) return 0;
  
  let currentStreak = 0;
  const todayStr = new Date().toISOString().split('T')[0];
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  
  if (dates.includes(todayStr) || dates.includes(yesterdayStr)) {
    currentStreak = 1;
    let check = dates.includes(todayStr) ? todayStr : yesterdayStr;
    while (true) {
      const d = new Date(check + 'T00:00:00Z');
      d.setUTCDate(d.getUTCDate() - 1);
      const prev = d.toISOString().split('T')[0];
      if (dates.includes(prev)) {
        currentStreak++;
        check = prev;
      } else {
        break;
      }
    }
  }
  return currentStreak;
};
