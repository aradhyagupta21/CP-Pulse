import mongoose from 'mongoose';

const simulationRecordSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  division: {
    type: String,
    required: true,
    enum: ['Div 1', 'Div 2', 'Div 3', 'Div 4', 'Custom']
  },
  targetRating: {
    type: Number,
    required: true
  },
  solvedCount: {
    type: Number,
    required: true,
    default: 0
  },
  totalScore: {
    type: Number,
    required: true,
    default: 0
  },
  predictedRatingChange: {
    type: Number,
    required: true,
    default: 0
  },
  performanceRating: {
    type: Number,
    required: true,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const SimulationRecord = mongoose.model('SimulationRecord', simulationRecordSchema);

export default SimulationRecord;
