import mongoose from 'mongoose';

interface TeamMember {
  userId: mongoose.Types.ObjectId;
  role: 'admin' | 'member';
  joinedAt: Date;
}

interface TeamSession {
  userId: mongoose.Types.ObjectId;
  startTime: Date;
  duration: number;
  type: 'focus' | 'collaboration';
  productivity: number;
}

interface TeamMetrics {
  totalFocusTime: number;
  averageProductivity: number;
  collaborationScore: number;
  activeMembers: number;
}

interface TeamDocument extends mongoose.Document {
  name: string;
  description: string;
  members: TeamMember[];
  sessions: TeamSession[];
  metrics: TeamMetrics;
  settings: {
    focusGoals: {
      daily: number;
      weekly: number;
    };
    collaborationRules: {
      minMeetingParticipants: number;
      maxMeetingDuration: number;
    };
  };
  calculateMetrics(): Promise<TeamMetrics>;
  getProductivityTrend(days: number): Promise<number[]>;
  getCollaborationScore(): Promise<number>;
}

interface Session {
  startTime: Date;
  duration: number;
}

const TeamSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  members: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['admin', 'member'],
      default: 'member'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  sessions: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    startTime: Date,
    duration: Number,
    type: {
      type: String,
      enum: ['focus', 'collaboration']
    },
    productivity: Number
  }],
  metrics: {
    totalFocusTime: { type: Number, default: 0 },
    averageProductivity: { type: Number, default: 0 },
    collaborationScore: { type: Number, default: 0 },
    activeMembers: { type: Number, default: 0 }
  },
  settings: {
    focusGoals: {
      daily: { type: Number, default: 4 },
      weekly: { type: Number, default: 20 }
    },
    collaborationRules: {
      minMeetingParticipants: { type: Number, default: 2 },
      maxMeetingDuration: { type: Number, default: 60 }
    }
  }
}, { timestamps: true });

TeamSchema.methods.calculateMetrics = async function(): Promise<TeamMetrics> {
  const recentSessions = this.sessions.filter((session: Session) => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return session.startTime >= thirtyDaysAgo;
  });

  const totalFocusTime = recentSessions.reduce((acc: number, session: TeamSession) => {
    return session.type === 'focus' ? acc + session.duration : acc;
  }, 0);

  const productiveSessions = recentSessions.filter((session: TeamSession) => session.productivity);
  const averageProductivity = productiveSessions.length > 0
    ? productiveSessions.reduce((acc: number, session: TeamSession) => acc + session.productivity, 0) / productiveSessions.length
    : 0;

  const activeMembers = new Set(recentSessions.map((s: TeamSession) => s.userId.toString())).size;
  const memberCount = this.members.length;
  const participationRate = memberCount > 0 ? (activeMembers / memberCount) * 100 : 0;

  const metrics: TeamMetrics = {
    totalFocusTime,
    averageProductivity,
    collaborationScore: participationRate,
    activeMembers
  };

  this.metrics = metrics;
  await this.save();

  return metrics;
};

TeamSchema.methods.getProductivityTrend = async function(days: number): Promise<number[]> {
  const trend = new Array(days).fill(0);
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  this.sessions.forEach((session: TeamSession) => {
    if (session.startTime >= startDate) {
      const dayIndex = Math.floor(
        (session.startTime.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)
      );
      if (dayIndex >= 0 && dayIndex < days) {
        trend[dayIndex] = (trend[dayIndex] * session.productivity) / 2;
      }
    }
  });

  return trend;
};

TeamSchema.methods.getCollaborationScore = async function(): Promise<number> {
  const activeMembers = new Set(this.sessions.map((s: TeamSession) => s.userId.toString())).size;
  return (activeMembers / this.members.length) * 100;
};

export default mongoose.models.Team || mongoose.model<TeamDocument>('Team', TeamSchema); 