import express from 'express';
import { dbHelper } from '../config/dbHelper.js';
import { apiService } from '../services/apiService.js';
import { calculateStreak } from '../utils/streakCalculator.js';

const router = express.Router();

// Get cached statistics for a user
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const stats = await dbHelper.getStatistics(userId);
    res.json(stats);
  } catch (error) {
    console.error('Stats fetch error for userId', req.params.userId, error);
    res.status(500).json({ error: error.message });
  }
});

// Sync and cache fresh statistics from CF, LC, CC APIs
router.post('/:userId/sync', async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await dbHelper.getUserById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const syncPromises = [];

    // Sync Codeforces
    if (user.codeforcesHandle) {
      syncPromises.push(
        apiService.fetchCodeforces(user.codeforcesHandle).then(data => {
          if (data) return dbHelper.upsertStatistics(userId, 'Codeforces', data);
        }).catch(err => console.error(`CF Sync Failed: ${err.message}`))
      );
    }

    // Sync LeetCode
    if (user.leetcodeHandle) {
      syncPromises.push(
        apiService.fetchLeetCode(user.leetcodeHandle).then(data => {
          if (data) return dbHelper.upsertStatistics(userId, 'LeetCode', data);
        }).catch(err => console.error(`LC Sync Failed: ${err.message}`))
      );
    }

    // Sync CodeChef
    if (user.codechefHandle) {
      syncPromises.push(
        apiService.fetchCodeChef(user.codechefHandle).then(data => {
          if (data) return dbHelper.upsertStatistics(userId, 'CodeChef', data);
        }).catch(err => console.error(`CC Sync Failed: ${err.message}`))
      );
    }

    await Promise.all(syncPromises);
    
    // Fetch and return the updated statistics
    const updatedStats = await dbHelper.getStatistics(userId);

    // Sync goals currentValue too!
    const goals = await dbHelper.getGoals(userId);
    for (const goal of goals) {
      let updatedVal = goal.currentValue;
      if (goal.targetType === 'solved_count') {
        if (goal.platform === 'All') {
          updatedVal = updatedStats.reduce((sum, s) => sum + (s.solvedCount || 0), 0);
        } else {
          const platStat = updatedStats.find(s => s.platform === goal.platform);
          updatedVal = platStat ? (platStat.solvedCount || 0) : 0;
        }
      } else if (goal.targetType === 'rating') {
        const platStat = updatedStats.find(s => s.platform === goal.platform);
        updatedVal = platStat ? (platStat.currentRating || 0) : 0;
      } else if (goal.targetType === 'streak_count') {
        const progress = await dbHelper.getSheetProgress(userId);
        const patternToMatch = goal.platform === 'GFG' ? 'gfg_potd' : 'potd';
        const filteredProgress = progress.filter(p => p.patternId === patternToMatch && p.status === 'solved');
        updatedVal = calculateStreak(filteredProgress);
      }
      
      const isCompleted = updatedVal >= goal.targetValue;
      await dbHelper.updateGoal(goal._id, { currentValue: updatedVal, isCompleted });
    }

    res.json(updatedStats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Fetch Global Leaderboard
router.get('/leaderboard/:userId', async (req, res) => {
  try {
    // Fetch all users to create a global leaderboard
    const leaderboardUsers = await dbHelper.getUsers();

    const results = [];
    for (const u of leaderboardUsers) {
      const uStats = await dbHelper.getStatistics(u._id);
      
      const cfStat = uStats.find(s => s.platform === 'Codeforces');
      const ccStat = uStats.find(s => s.platform === 'CodeChef');
      const lcStat = uStats.find(s => s.platform === 'LeetCode');

      const cfRating = cfStat ? cfStat.currentRating : 0;
      const ccRating = ccStat ? ccStat.currentRating : 0;
      const lcRating = lcStat ? lcStat.currentRating : 0;

      let sumRatings = 0;
      let countPlatforms = 0;

      if (cfRating > 0) { sumRatings += cfRating; countPlatforms++; }
      if (ccRating > 0) { sumRatings += ccRating; countPlatforms++; }
      if (lcRating > 0) { sumRatings += lcRating; countPlatforms++; }

      const averageRating = countPlatforms > 0 ? Math.round(sumRatings / countPlatforms) : 0;

      const totalSolved = uStats.reduce((acc, s) => acc + (s.solvedCount || 0), 0);
      
      results.push({
        userId: u._id,
        username: u.username,
        codeforcesRating: cfRating,
        codechefRating: ccRating,
        leetcodeSolved: lcStat ? lcStat.solvedCount : 0,
        totalSolved,
        averageRating,
        codeforcesHandle: u.codeforcesHandle,
        codechefHandle: u.codechefHandle,
        leetcodeHandle: u.leetcodeHandle
      });
    }

    // Sort by averageRating desc by default
    results.sort((a, b) => b.averageRating - a.averageRating);
    res.json(results);
  } catch (error) {
    console.error('Leaderboard error for userId', req.params.userId, error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
