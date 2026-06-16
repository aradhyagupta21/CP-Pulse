import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import userRoutes from './routes/userRoutes.js';
import statRoutes from './routes/statRoutes.js';
import goalRoutes from './routes/goalRoutes.js';
import contestRoutes from './routes/contestRoutes.js';
import simulatorRoutes from './routes/simulatorRoutes.js';
import sheetRoutes from './routes/sheetRoutes.js';
import potdRoutes from './routes/potdRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS
app.use(cors());

// Body parser
app.use(express.json());

// Connect Database
connectDB();

// Test route
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    message: 'Competitive Programming Tracker API is active',
    timestamp: new Date()
  });
});

// Mount routes
app.use('/api/users', userRoutes);
app.use('/api/stats', statRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/contests', contestRoutes);
app.use('/api/simulator', simulatorRoutes);
app.use('/api/sheet', sheetRoutes);
app.use('/api/potd', potdRoutes);

import { dbHelper } from './config/dbHelper.js';
import { apiService } from './services/apiService.js';

// Automatic Daily Sync Task
const dailySyncAllUsers = async () => {
  console.log('[Scheduler] Running automatic daily profiles sync...');
  try {
    const users = await dbHelper.getUsers();
    for (const user of users) {
      const userId = user._id;
      const syncPromises = [];

      if (user.codeforcesHandle) {
        syncPromises.push(
          apiService.fetchCodeforces(user.codeforcesHandle).then(data => {
            if (data) return dbHelper.upsertStatistics(userId, 'Codeforces', data);
          }).catch(e => console.warn(`[CF Auto-Sync] failed for ${user.username}: ${e.message}`))
        );
      }

      if (user.leetcodeHandle) {
        syncPromises.push(
          apiService.fetchLeetCode(user.leetcodeHandle).then(data => {
            if (data) return dbHelper.upsertStatistics(userId, 'LeetCode', data);
          }).catch(e => console.warn(`[LC Auto-Sync] failed for ${user.username}: ${e.message}`))
        );
      }

      if (user.codechefHandle) {
        syncPromises.push(
          apiService.fetchCodeChef(user.codechefHandle).then(data => {
            if (data) return dbHelper.upsertStatistics(userId, 'CodeChef', data);
          }).catch(e => console.warn(`[CC Auto-Sync] failed for ${user.username}: ${e.message}`))
        );
      }

      await Promise.all(syncPromises);

      // Add a 2-second delay between users to prevent hitting rate limits
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Sync user goals
      const updatedStats = await dbHelper.getStatistics(userId);
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
        }
        
        const isCompleted = updatedVal >= goal.targetValue;
        await dbHelper.updateGoal(goal._id, { currentValue: updatedVal, isCompleted });
      }
    }
    console.log('[Scheduler] Automatic daily profiles synchronization complete.');
  } catch (err) {
    console.error('[Scheduler] daily sync error:', err.message);
  }
};

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  
  // Set interval to sync profiles every 24 hours
  setInterval(dailySyncAllUsers, 24 * 60 * 60 * 1000);
  
  // Trigger a quick startup background sync after 5 seconds to verify scheduler
  setTimeout(dailySyncAllUsers, 5000);
});
