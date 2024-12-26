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
    outcome?: string;
  };
}

interface CollaborationDocument extends mongoose.Document {
  teamId: mongoose.Types.ObjectId;
  activity: Activity[];
  metrics: {
    totalTime: number;
    averageParticipation: number;
    productivityScore: number;
  };
  getActivityHeatmap(days: number): number[];
}

const ParticipantSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  contribution: {
    type: Number,
    default: 0
  }
});

const ActivitySchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true
  },
  type: {
    type: String,
    enum: ['meeting', 'task', 'focus-session', 'code-review', 'pair-programming'],
    required: true
  },
  duration: {
    type: Number,
    required: true
  },
  participants: [ParticipantSchema],
  platform: {
    type: String,
    enum: ['slack', 'google-meet', 'zoom', 'in-person', 'other'],
    required: true
  },
  metadata: {
    title: String,
    description: String,
    outcome: String
  }
});

const CollaborationSchema = new mongoose.Schema({
  teamId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: true
  },
  activity: [ActivitySchema],
  metrics: {
    totalTime: { type: Number, default: 0 },
    averageParticipation: { type: Number, default: 0 },
    productivityScore: { type: Number, default: 0 }
  }
});

// Method to generate activity heatmap data
CollaborationSchema.methods.getActivityHeatmap = function(days: number): number[] {
  const heatmapData = new Array(days).fill(0);
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  this.activity.forEach((activity: Activity) => {
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
