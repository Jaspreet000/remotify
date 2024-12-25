import mongoose from 'mongoose';

interface LeaderboardDocument extends mongoose.Document {
  user: mongoose.Types.ObjectId;
  focusHours: number;
  tasksCompleted: number;
  level: number;
  experience: number;
  badges: string[];
  achievements: string[];
  weeklyStreak: number;
  lastActive: Date;
  score: number;
}

const LeaderboardSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  focusHours: { type: Number, default: 0 },
  tasksCompleted: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  experience: { type: Number, default: 0 },
  badges: [String],
  achievements: [String],
  weeklyStreak: { type: Number, default: 0 },
  lastActive: { type: Date, default: Date.now },
  score: { type: Number, default: 0 }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Calculate score based on various metrics
LeaderboardSchema.pre('save', function(next) {
  const weightedScore = 
    (this.focusHours * 10) +
    (this.tasksCompleted * 5) +
    (this.level * 100) +
    (this.experience * 0.1) +
    (this.badges.length * 50) +
    (this.achievements.length * 25) +
    (this.weeklyStreak * 15);
  
  this.score = Math.round(weightedScore);
  next();
});

export default mongoose.models.Leaderboard as mongoose.Model<LeaderboardDocument> ||
  mongoose.model<LeaderboardDocument>('Leaderboard', LeaderboardSchema);
