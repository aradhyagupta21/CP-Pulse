import express from 'express';
import { dbHelper } from '../config/dbHelper.js';
import { calculateStreak } from '../utils/streakCalculator.js';

const router = express.Router();

// Get user's sheet progress
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const progress = await dbHelper.getSheetProgress(userId);
    res.json(progress);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update a problem's status
router.post('/update', async (req, res) => {
  try {
    const { userId, problemId, patternId, status } = req.body;
    
    if (!userId || !problemId || !patternId || !status) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const updatedProgress = await dbHelper.upsertSheetProgress(userId, problemId, patternId, status);

    // Auto-update streak goals
    if (patternId === 'potd' || patternId === 'gfg_potd') {
      const goals = await dbHelper.getGoals(userId);
      const streakGoals = goals.filter(g => g.targetType === 'streak_count');
      if (streakGoals.length > 0) {
        const allProgress = await dbHelper.getSheetProgress(userId);
        
        for (const goal of streakGoals) {
          const matchPattern = goal.platform === 'GFG' ? 'gfg_potd' : 'potd';
          if (patternId === matchPattern) {
            const filtered = allProgress.filter(p => p.patternId === matchPattern && p.status === 'solved');
            const newStreak = calculateStreak(filtered);
            await dbHelper.updateGoal(goal._id, { 
              currentValue: newStreak, 
              isCompleted: newStreak >= goal.targetValue 
            });
          }
        }
      }
    }

    res.json(updatedProgress);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
