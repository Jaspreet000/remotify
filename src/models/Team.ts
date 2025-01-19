import mongoose from 'mongoose';

export interface ITeamMember {
  userId: mongoose.Types.ObjectId;
  role: 'leader' | 'member';
  joinedAt: Date;
}

export interface ITeamChallenge {
  id: mongoose.Types.ObjectId;
  name: string;
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  status: 'active' | 'completed';
  participants: { userId: mongoose.Types.ObjectId }[];
  progress: number;
  target: number;
  rewards: {
    points: number;
    badges: string[];
  };
}

export interface ITeamStats {
  totalFocusTime: number;
  averageFocusTime: number;
  averageProductivity: number;
  collaborationScore: number;
}

export interface ITeamAchievement {
  id: mongoose.Types.ObjectId;
  name: string;
  title: string;
  description: string;
  unlockedAt: Date;
  type: 'focus' | 'collaboration' | 'milestone';
}

export interface ITeam {
  name: string;
  members: ITeamMember[];
  challenges: ITeamChallenge[];
  stats: ITeamStats;
  achievements: ITeamAchievement[];
}

const teamSchema = new mongoose.Schema<ITeam>({
  name: { type: String, required: true },
  members: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: ['leader', 'member'], default: 'member' },
    joinedAt: { type: Date, default: Date.now },
  }],
  challenges: [{
    _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
    name: String,
    title: String,
    description: String,
    startDate: Date,
    endDate: Date,
    status: { type: String, enum: ['active', 'completed'], default: 'active' },
    participants: [{
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    }],
  }],
  stats: {
    totalFocusTime: { type: Number, default: 0 },
    averageFocusTime: { type: Number, default: 0 },
    averageProductivity: { type: Number, default: 0 },
    collaborationScore: { type: Number, default: 0 },
  },
  achievements: [{
    _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
    name: String,
    title: String,
    description: String,
    unlockedAt: Date,
    type: { type: String, enum: ['focus', 'collaboration', 'milestone'] },
  }],
}, {
  timestamps: true,
});

export default mongoose.models.Team || mongoose.model<ITeam>('Team', teamSchema); 