import mongoose from 'mongoose';

const GoalSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  platform: {
    type: String,
    enum: ['Codeforces', 'CodeChef', 'LeetCode', 'GFG', 'All'],
    required: true
  },
  targetType: {
    type: String,
    enum: ['solved_count', 'rating', 'streak_count'],
    required: true
  },
  targetValue: {
    type: Number,
    required: true
  },
  currentValue: {
    type: Number,
    default: 0
  },
  isCompleted: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

export default mongoose.models.Goal || mongoose.model('Goal', GoalSchema);
