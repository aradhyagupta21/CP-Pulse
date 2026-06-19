import express from 'express';
import { dbHelper } from '../config/dbHelper.js';
import { calculateStreak } from '../utils/streakCalculator.js';

const router = express.Router();

// Get user goals
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const goals = await dbHelper.getGoals(userId);
    res.json(goals);
  } catch (error) {
    console.error('Goals error for userId', req.params.userId, error);
    res.status(500).json({ error: error.message });
  }
});

// Create user goal
router.post('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { title, platform, targetType, targetValue } = req.body;

    if (!title || !platform || !targetType || !targetValue) {
      return res.status(400).json({ error: 'All fields (title, platform, targetType, targetValue) are required.' });
    }

    // Initialize currentValue based on user's current cached stats
    let currentValue = 0;
    const stats = await dbHelper.getStatistics(userId);

    if (targetType === 'solved_count') {
      if (platform === 'All') {
        currentValue = stats.reduce((sum, s) => sum + (s.solvedCount || 0), 0);
      } else {
        const platStat = stats.find(s => s.platform === platform);
        currentValue = platStat ? (platStat.solvedCount || 0) : 0;
      }
    } else if (targetType === 'rating') {
      const platStat = stats.find(s => s.platform === platform);
      currentValue = platStat ? (platStat.currentRating || 0) : 0;
    } else if (targetType === 'streak_count') {
      const progress = await dbHelper.getSheetProgress(userId);
      const patternToMatch = platform === 'GFG' ? 'gfg_potd' : 'potd';
      const filteredProgress = progress.filter(p => p.patternId === patternToMatch && p.status === 'solved');
      currentValue = calculateStreak(filteredProgress);
    }

    const isCompleted = currentValue >= Number(targetValue);

    const goal = await dbHelper.createGoal(userId, {
      title,
      platform,
      targetType,
      targetValue: Number(targetValue),
      currentValue,
      isCompleted
    });

    res.status(201).json(goal);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update goal
router.put('/:goalId', async (req, res) => {
  try {
    const { goalId } = req.params;
    const { title, targetValue, isCompleted } = req.body;
    
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (targetValue !== undefined) updateData.targetValue = Number(targetValue);
    if (isCompleted !== undefined) updateData.isCompleted = !!isCompleted;

    const updated = await dbHelper.updateGoal(goalId, updateData);
    if (!updated) {
      return res.status(404).json({ error: 'Goal not found' });
    }
    
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete goal
router.delete('/:goalId', async (req, res) => {
  try {
    const { goalId } = req.params;
    const deleted = await dbHelper.deleteGoal(goalId);
    if (!deleted) {
      return res.status(404).json({ error: 'Goal not found' });
    }
    res.json({ message: 'Goal deleted successfully', goal: deleted });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
