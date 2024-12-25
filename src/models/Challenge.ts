import mongoose from 'mongoose';

const ChallengeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: String,
  type: {
    type: String,
    enum: ['daily', 'weekly', 'achievement', 'team'],
    required: true
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    required: true
  },
  requirements: {
    focusTime: Number, // minutes
    sessions: Number,
    productivity: Number, // minimum score
    teamParticipation: Number // percentage for team challenges
  },
  rewards: {
    experience: Number,
    badges: [String],
    specialPerks: [String]
  },
  aiGenerated: {
    type: Boolean,
    default: false
  },
  startDate: Date,
  endDate: Date,
  participants: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    progress: Number,
    completed: Boolean,
    completedAt: Date
  }],
  teamId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  }
}, {
  timestamps: true
});

export default mongoose.models.Challenge || mongoose.model('Challenge', ChallengeSchema); 