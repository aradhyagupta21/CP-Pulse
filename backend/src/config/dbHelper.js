import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { checkMongoConnection } from './db.js';
import User from '../models/User.js';
import Statistics from '../models/Statistics.js';
import Goal from '../models/Goal.js';
import SimulationRecord from '../models/SimulationRecord.js';
import SheetProgress from '../models/SheetProgress.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '../../data');

// Ensure data directory exists for JSON fallback
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const USERS_FILE = path.join(DATA_DIR, 'users.json');
const STATS_FILE = path.join(DATA_DIR, 'statistics.json');
const GOALS_FILE = path.join(DATA_DIR, 'goals.json');
const SIMULATIONS_FILE = path.join(DATA_DIR, 'simulations.json');
const SHEET_FILE = path.join(DATA_DIR, 'sheet.json');

// Initialize files if they don't exist
const initFile = (filePath) => {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify([], null, 2));
  }
};
initFile(USERS_FILE);
initFile(STATS_FILE);
initFile(GOALS_FILE);
initFile(SIMULATIONS_FILE);
initFile(SHEET_FILE);

const readJSON = (filePath) => {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch (err) {
    return [];
  }
};

const writeJSON = (filePath, data) => {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
};

export const dbHelper = {
  // --- USER METHODS ---
  async getUsers() {
    if (checkMongoConnection()) {
      return await User.find({});
    } else {
      return readJSON(USERS_FILE);
    }
  },

  async getUserById(id) {
    if (checkMongoConnection()) {
      return await User.findById(id);
    } else {
      const users = readJSON(USERS_FILE);
      return users.find(u => u._id === id) || null;
    }
  },

  async getUserByUsername(username) {
    if (checkMongoConnection()) {
      return await User.findOne({ username: new RegExp(`^${username}$`, 'i') });
    } else {
      const users = readJSON(USERS_FILE);
      return users.find(u => u.username.toLowerCase() === username.toLowerCase()) || null;
    }
  },

  async getUserByIdentifier(identifier) {
    if (checkMongoConnection()) {
      return await User.findOne({
        $or: [
          { username: new RegExp(`^${identifier}$`, 'i') },
          { email: new RegExp(`^${identifier}$`, 'i') }
        ]
      });
    } else {
      const users = readJSON(USERS_FILE);
      return users.find(u => 
        u.username.toLowerCase() === identifier.toLowerCase() || 
        (u.email && u.email.toLowerCase() === identifier.toLowerCase())
      ) || null;
    }
  },

  async createUser(userData) {
    if (checkMongoConnection()) {
      const newUser = new User(userData);
      return await newUser.save();
    } else {
      const users = readJSON(USERS_FILE);
      const existing = users.find(u => u.username.toLowerCase() === userData.username.toLowerCase());
      if (existing) {
        throw new Error('User already exists');
      }
      const newUser = {
        _id: 'u_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
        username: userData.username,
        email: userData.email || '',
        phone: userData.phone || '',
        password: userData.password,
        fullName: userData.fullName || '',
        location: userData.location || '',
        college: userData.college || '',
        branch: userData.branch || '',
        graduationYear: userData.graduationYear || '',
        cgpa: userData.cgpa || '',
        codeforcesHandle: userData.codeforcesHandle || '',
        codechefHandle: userData.codechefHandle || '',
        leetcodeHandle: userData.leetcodeHandle || '',
        friends: userData.friends || [],
        credentials: userData.credentials || [],
        createdAt: new Date(),
        updatedAt: new Date()
      };
      users.push(newUser);
      writeJSON(USERS_FILE, users);
      return newUser;
    }
  },

  async updateUser(id, userData) {
    if (checkMongoConnection()) {
      return await User.findByIdAndUpdate(id, userData, { new: true });
    } else {
      const users = readJSON(USERS_FILE);
      const index = users.findIndex(u => u._id === id);
      if (index === -1) return null;
      
      const updatedUser = {
        ...users[index],
        ...userData,
        updatedAt: new Date()
      };
      users[index] = updatedUser;
      writeJSON(USERS_FILE, users);
      return updatedUser;
    }
  },

  async deleteUser(id) {
    if (checkMongoConnection()) {
      await User.findByIdAndDelete(id);
      await Statistics.deleteMany({ userId: id });
      await Goal.deleteMany({ userId: id });
      await SimulationRecord.deleteMany({ userId: id });
      await SheetProgress.deleteMany({ userId: id });
      return true;
    } else {
      let users = readJSON(USERS_FILE);
      users = users.filter(u => u._id !== id);
      writeJSON(USERS_FILE, users);

      let stats = readJSON(STATS_FILE);
      stats = stats.filter(s => s.userId !== id);
      writeJSON(STATS_FILE, stats);

      let goals = readJSON(GOALS_FILE);
      goals = goals.filter(g => g.userId !== id);
      writeJSON(GOALS_FILE, goals);

      let sims = readJSON(SIMULATIONS_FILE);
      sims = sims.filter(s => s.userId !== id);
      writeJSON(SIMULATIONS_FILE, sims);

      let sheet = readJSON(SHEET_FILE);
      sheet = sheet.filter(s => s.userId !== id);
      writeJSON(SHEET_FILE, sheet);

      return true;
    }
  },

  // --- STATISTICS METHODS ---
  async getStatistics(userId) {
    const idStr = userId.toString();
    if (checkMongoConnection()) {
      return await Statistics.find({ userId });
    } else {
      const stats = readJSON(STATS_FILE);
      return stats.filter(s => s.userId === idStr);
    }
  },

  async getStatisticsByPlatform(userId, platform) {
    const idStr = userId.toString();
    if (checkMongoConnection()) {
      return await Statistics.findOne({ userId, platform });
    } else {
      const stats = readJSON(STATS_FILE);
      return stats.find(s => s.userId === idStr && s.platform === platform) || null;
    }
  },

  async upsertStatistics(userId, platform, statData) {
    const idStr = userId.toString();
    if (checkMongoConnection()) {
      return await Statistics.findOneAndUpdate(
        { userId, platform },
        { ...statData, userId, platform, lastUpdated: new Date() },
        { new: true, upsert: true }
      );
    } else {
      const stats = readJSON(STATS_FILE);
      const index = stats.findIndex(s => s.userId === idStr && s.platform === platform);
      const updatedStat = {
        _id: index !== -1 ? stats[index]._id : 's_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
        userId: idStr,
        platform,
        currentRating: statData.currentRating || 0,
        maxRating: statData.maxRating || 0,
        contestsCount: statData.contestsCount || 0,
        solvedCount: statData.solvedCount || 0,
        solvedByTopic: statData.solvedByTopic || {},
        difficultyDistribution: statData.difficultyDistribution || {},
        ratingHistory: statData.ratingHistory || [],
        recentSubmissions: statData.recentSubmissions || [],
        lastUpdated: new Date(),
        createdAt: index !== -1 ? stats[index].createdAt : new Date(),
        updatedAt: new Date()
      };

      if (index !== -1) {
        stats[index] = updatedStat;
      } else {
        stats.push(updatedStat);
      }
      writeJSON(STATS_FILE, stats);
      return updatedStat;
    }
  },

  // --- GOAL METHODS ---
  async getGoals(userId) {
    const idStr = userId.toString();
    if (checkMongoConnection()) {
      return await Goal.find({ userId });
    } else {
      const goals = readJSON(GOALS_FILE);
      return goals.filter(g => g.userId === idStr);
    }
  },

  async createGoal(userId, goalData) {
    const idStr = userId.toString();
    if (checkMongoConnection()) {
      const newGoal = new Goal({ ...goalData, userId });
      return await newGoal.save();
    } else {
      const goals = readJSON(GOALS_FILE);
      const newGoal = {
        _id: 'g_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
        userId: idStr,
        title: goalData.title,
        platform: goalData.platform,
        targetType: goalData.targetType,
        targetValue: Number(goalData.targetValue),
        currentValue: Number(goalData.currentValue || 0),
        isCompleted: !!goalData.isCompleted,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      goals.push(newGoal);
      writeJSON(GOALS_FILE, goals);
      return newGoal;
    }
  },

  async updateGoal(goalId, goalData) {
    if (checkMongoConnection()) {
      return await Goal.findByIdAndUpdate(goalId, goalData, { new: true });
    } else {
      const goals = readJSON(GOALS_FILE);
      const index = goals.findIndex(g => g._id === goalId);
      if (index === -1) return null;
      
      const updatedGoal = {
        ...goals[index],
        ...goalData,
        updatedAt: new Date()
      };
      goals[index] = updatedGoal;
      writeJSON(GOALS_FILE, goals);
      return updatedGoal;
    }
  },

  async deleteGoal(goalId) {
    if (checkMongoConnection()) {
      return await Goal.findByIdAndDelete(goalId);
    } else {
      const goals = readJSON(GOALS_FILE);
      const index = goals.findIndex(g => g._id === goalId);
      if (index === -1) return null;
      const deleted = goals.splice(index, 1)[0];
      writeJSON(GOALS_FILE, goals);
      return deleted;
    }
  },

  // --- SIMULATION METHODS ---
  async getSimulationRecords(userId) {
    const idStr = userId.toString();
    if (checkMongoConnection()) {
      return await SimulationRecord.find({ userId }).sort({ createdAt: -1 });
    } else {
      const records = readJSON(SIMULATIONS_FILE);
      return records.filter(r => r.userId === idStr).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
  },

  async createSimulationRecord(userId, recordData) {
    const idStr = userId.toString();
    if (checkMongoConnection()) {
      const newRecord = new SimulationRecord({ ...recordData, userId });
      return await newRecord.save();
    } else {
      const records = readJSON(SIMULATIONS_FILE);
      const newRecord = {
        _id: 'sim_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
        userId: idStr,
        division: recordData.division,
        targetRating: recordData.targetRating,
        solvedCount: Number(recordData.solvedCount || 0),
        totalScore: Number(recordData.totalScore || 0),
        predictedRatingChange: Number(recordData.predictedRatingChange || 0),
        performanceRating: Number(recordData.performanceRating || 0),
        createdAt: new Date()
      };
      records.push(newRecord);
      writeJSON(SIMULATIONS_FILE, records);
      return newRecord;
    }
  },

  // --- SHEET PROGRESS METHODS ---
  async getSheetProgress(userId) {
    const idStr = userId.toString();
    if (checkMongoConnection()) {
      return await SheetProgress.find({ userId });
    } else {
      const records = readJSON(SHEET_FILE);
      return records.filter(r => r.userId === idStr);
    }
  },

  async upsertSheetProgress(userId, problemId, patternId, status) {
    const idStr = userId.toString();
    if (checkMongoConnection()) {
      return await SheetProgress.findOneAndUpdate(
        { userId, problemId },
        { userId, problemId, patternId, status, updatedAt: new Date() },
        { new: true, upsert: true }
      );
    } else {
      const records = readJSON(SHEET_FILE);
      const index = records.findIndex(r => r.userId === idStr && r.problemId === problemId);
      
      const updatedRecord = {
        _id: index !== -1 ? records[index]._id : 'sheet_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
        userId: idStr,
        problemId,
        patternId,
        status,
        updatedAt: new Date()
      };

      if (index !== -1) {
        records[index] = updatedRecord;
      } else {
        records.push(updatedRecord);
      }
      writeJSON(SHEET_FILE, records);
      return updatedRecord;
    }
  }
};
