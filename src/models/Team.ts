import mongoose from 'mongoose';

const TeamSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  admins: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  sessions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FocusSession'
  }],
  settings: {
    minFocusHours: {
      type: Number,
      default: 4
    },
    recommendedBreaks: {
      type: Number,
      default: 3
    },
    collaborationHours: {
      start: {
        type: Number,
        default: 9 // 9 AM
      },
      end: {
        type: Number,
        default: 17 // 5 PM
      }
    },
    notifications: {
      sessionAlerts: {
        type: Boolean,
        default: true
      },
      progressUpdates: {
        type: Boolean,
        default: true
      },
      teamAchievements: {
        type: Boolean,
        default: true
      }
    }
  },
  metrics: {
    averageProductivity: Number,
    collaborationScore: Number,
    weeklyParticipation: Number,
    lastUpdated: Date
  }
}, {
  timestamps: true
});

// Calculate team metrics before saving
TeamSchema.pre('save', async function(next) {
  if (this.isModified('sessions')) {
    const recentSessions = this.sessions.filter((s: any) => 
      new Date(s.startTime) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    );

    this.metrics = {
      averageProductivity: calculateAverageProductivity(recentSessions),
      collaborationScore: calculateCollaborationScore(recentSessions, this.members),
      weeklyParticipation: calculateParticipation(recentSessions, this.members),
      lastUpdated: new Date()
    };
  }
  next();
});

// Helper functions
function calculateAverageProductivity(sessions: any[]) {
  return sessions.length > 0
    ? sessions.reduce((acc, s) => acc + (s.focusScore || 0), 0) / sessions.length
    : 0;
}

function calculateCollaborationScore(sessions: any[], members: any[]) {
  // Implement collaboration score calculation
  return 0;
}

function calculateParticipation(sessions: any[], members: any[]) {
  if (!members.length) return 0;
  const activeMembers = new Set(sessions.map(s => s.user.toString())).size;
  return (activeMembers / members.length) * 100;
}

export default mongoose.models.Team || mongoose.model('Team', TeamSchema); 