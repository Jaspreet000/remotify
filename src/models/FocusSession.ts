import { Schema, model, Document, models } from 'mongoose';

export interface IFocusSession extends Document {
  userId: Schema.Types.ObjectId;
  startTime: Date;
  endTime?: Date;
  duration: number;
  type: 'focus' | 'break';
  status: 'active' | 'completed' | 'interrupted';
  focusScore: number;
  distractions: Array<{
    timestamp: Date;
    type: string;
    duration: number;
    recoveryTime: number;
    postRecoveryScore: number;
  }>;
  breaks: Array<{
    startTime: Date;
    duration: number;
    type: 'short' | 'long';
    effectivenessScore: number;
  }>;
  tasks: Array<{
    description: string;
    completed: boolean;
    completedAt?: Date;
  }>;
  notes: string;
  environment: {
    location: string;
    noiseLevel: 'quiet' | 'moderate' | 'noisy';
    deviceType: 'desktop' | 'mobile' | 'tablet';
  };
  metrics: {
    keystrokes: number;
    mouseClicks: number;
    screenTime: number;
    tabSwitches: number;
    focusTimePercentage: number;
  };
}

const focusSessionSchema = new Schema<IFocusSession>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  startTime: { type: Date, required: true },
  endTime: Date,
  duration: { type: Number, required: true }, // in minutes
  type: { type: String, enum: ['focus', 'break'], required: true },
  status: { 
    type: String, 
    enum: ['active', 'completed', 'interrupted'],
    default: 'active'
  },
  focusScore: { 
    type: Number,
    min: 0,
    max: 100,
    default: 100
  },
  distractions: [{
    timestamp: { type: Date, required: true },
    type: { type: String, required: true },
    duration: { type: Number, required: true }, // in seconds
    recoveryTime: { type: Number, required: true }, // in seconds
    postRecoveryScore: { type: Number, required: true }
  }],
  breaks: [{
    startTime: { type: Date, required: true },
    duration: { type: Number, required: true }, // in minutes
    type: { type: String, enum: ['short', 'long'], required: true },
    effectivenessScore: { type: Number, min: 0, max: 100 }
  }],
  tasks: [{
    description: { type: String, required: true },
    completed: { type: Boolean, default: false },
    completedAt: Date
  }],
  notes: { type: String, default: '' },
  environment: {
    location: { type: String, default: 'unknown' },
    noiseLevel: { 
      type: String, 
      enum: ['quiet', 'moderate', 'noisy'],
      default: 'moderate'
    },
    deviceType: { 
      type: String, 
      enum: ['desktop', 'mobile', 'tablet'],
      default: 'desktop'
    }
  },
  metrics: {
    keystrokes: { type: Number, default: 0 },
    mouseClicks: { type: Number, default: 0 },
    screenTime: { type: Number, default: 0 }, // in seconds
    tabSwitches: { type: Number, default: 0 },
    focusTimePercentage: { type: Number, default: 100 }
  }
}, {
  timestamps: true
});

// Pre-save hook to calculate focus score based on distractions and metrics
focusSessionSchema.pre('save', function(next) {
  if (this.isModified('distractions') || this.isModified('metrics')) {
    const distractionImpact = this.distractions.length * 5;
    const metricsScore = calculateMetricsScore(this.metrics);
    this.focusScore = Math.max(0, Math.min(100, 100 - distractionImpact + metricsScore));
  }
  next();
});

function calculateMetricsScore(metrics: IFocusSession['metrics']): number {
  const focusBonus = metrics.focusTimePercentage >= 90 ? 10 : 0;
  const productivityScore = Math.min(
    10,
    (metrics.keystrokes + metrics.mouseClicks) / 1000
  );
  return focusBonus + productivityScore;
}

// Indexes for better query performance
focusSessionSchema.index({ userId: 1, startTime: -1 });
focusSessionSchema.index({ status: 1 });
focusSessionSchema.index({ 'tasks.completed': 1 });

export default models.FocusSession || model<IFocusSession>('FocusSession', focusSessionSchema);
