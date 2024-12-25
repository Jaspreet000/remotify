import mongoose from 'mongoose';

// Interfaces
interface Participant {
  userId: mongoose.Types.ObjectId;
  contribution: number;
}

interface Activity {
  date: Date;
  type: 'meeting' | 'task' | 'focus-session' | 'code-review' | 'pair-programming';
  duration: number;
  participants: Participant[];
  platform: 'slack' | 'google-meet' | 'zoom' | 'in-person' | 'other';
  metadata: {
    title: string;
    description?: string;
    location?: string;
    tags: string[];
  };
}

interface CollaborationDocument extends mongoose.Document {
  team: string;
  activity: Activity[];
  metrics: {
    weeklyMeetingHours: number;
    avgParticipation: number;
    productivityScore: number;
  };
  integrations: {
    slack: {
      enabled: boolean;
      workspaceId: string;
      channels: string[];
    };
    googleCalendar: {
      enabled: boolean;
      calendarIds: string[];
    };
  };
  calculateMetrics: () => Promise<{
    weeklyMeetingHours: number;
    avgParticipation: number;
    productivityScore: number;
  }>;
  generateHeatmap: (days?: number) => number[];
}

const ActivitySchema = new mongoose.Schema({
  date: { type: Date, required: true },
  type: {
    type: String,
    enum: ['meeting', 'task', 'focus-session', 'code-review', 'pair-programming'],
    required: true
  },
  duration: { type: Number, required: true },
  participants: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    contribution: { type: Number, min: 0, max: 100 }
  }],
  platform: {
    type: String,
    enum: ['slack', 'google-meet', 'zoom', 'in-person', 'other']
  },
  metadata: {
    title: String,
    description: String,
    location: String,
    tags: [String]
  }
}, { timestamps: true });

const CollaborationSchema = new mongoose.Schema({
  team: {
    type: String,
    required: true,
    index: true
  },
  activity: [ActivitySchema],
  metrics: {
    weeklyMeetingHours: { type: Number, default: 0 },
    avgParticipation: { type: Number, default: 0 },
    productivityScore: { type: Number, default: 0 }
  },
  integrations: {
    slack: {
      enabled: { type: Boolean, default: false },
      workspaceId: String,
      channels: [String]
    },
    googleCalendar: {
      enabled: { type: Boolean, default: false },
      calendarIds: [String]
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for getting team members
CollaborationSchema.virtual('members', {
  ref: 'User',
  localField: 'team',
  foreignField: 'teams',
  justOne: false
});

// Method to calculate team metrics
CollaborationSchema.methods.calculateMetrics = async function(this: CollaborationDocument) {
  const activities = this.activity;
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  const weeklyMeetings = activities.filter(a => 
    a.date >= weekAgo && 
    a.type === 'meeting'
  );
  
  this.metrics.weeklyMeetingHours = weeklyMeetings.reduce(
    (acc, curr) => acc + curr.duration, 0
  ) / 60;

  const members = await (this.populate('members') as any).members;
  const participationRates = activities.map(a => 
    (a.participants.length / members.length) * 100
  );
  
  this.metrics.avgParticipation = participationRates.reduce(
    (acc, curr) => acc + curr, 0
  ) / participationRates.length;

  const productivityFactors = {
    meetingEfficiency: this.metrics.weeklyMeetingHours <= 10 ? 100 : 
      Math.max(0, 100 - (this.metrics.weeklyMeetingHours - 10) * 5),
    participation: this.metrics.avgParticipation,
    activityDiversity: new Set(activities.map(a => a.type)).size * 20
  };

  this.metrics.productivityScore = Math.round(
    Object.values(productivityFactors).reduce((acc, curr) => acc + curr, 0) / 
    Object.keys(productivityFactors).length
  );

  await this.save();
  return this.metrics;
};

// Method to generate heatmap data
CollaborationSchema.methods.generateHeatmap = function(this: CollaborationDocument, days = 30) {
  const heatmapData = new Array(days).fill(0);
  const now = new Date();
  const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  this.activity.forEach(activity => {
    if (activity.date >= startDate) {
      const dayIndex = Math.floor(
        (activity.date.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)
      );
      if (dayIndex >= 0 && dayIndex < days) {
        heatmapData[dayIndex] += activity.duration;
      }
    }
  });

  return heatmapData;
};

export default mongoose.models.Collaboration as mongoose.Model<CollaborationDocument> || 
  mongoose.model<CollaborationDocument>('Collaboration', CollaborationSchema);
