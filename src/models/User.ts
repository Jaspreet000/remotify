import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    image: String,
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    blockedSites: [
      {
        url: String,
        isBlocked: {
          type: Boolean,
          default: true,
        },
      },
    ],
    productivitySettings: {
      workDuration: {
        type: Number,
        default: 25,
      },
      shortBreakDuration: {
        type: Number,
        default: 5,
      },
      longBreakDuration: {
        type: Number,
        default: 15,
      },
      sessionsUntilLongBreak: {
        type: Number,
        default: 4,
      },
      soundEnabled: {
        type: Boolean,
        default: true,
      },
      notificationsBlocked: {
        type: Boolean,
        default: false,
      },
      noiseReduction: {
        enabled: {
          type: Boolean,
          default: false,
        },
        sensitivity: {
          type: Number,
          min: 0,
          max: 100,
          default: 50,
        },
      },
      focusMode: {
        enabled: {
          type: Boolean,
          default: false,
        },
        blockLevel: {
          type: String,
          enum: ['strict', 'moderate', 'lenient'],
          default: 'moderate',
        },
      },
    },
    focusSessions: [
      {
        startTime: Date,
        endTime: Date,
        type: {
          type: String,
          enum: ['focus', 'break'],
        },
        productivity: {
          type: Number,
          min: 0,
          max: 100,
        },
      },
    ],
    productivityPeaks: [
      {
        dayOfWeek: {
          type: Number,
          min: 0,
          max: 6,
        },
        hourOfDay: {
          type: Number,
          min: 0,
          max: 23,
        },
        score: {
          type: Number,
          min: 0,
          max: 100,
        },
      },
    ],
    analyticsData: {
      lastUpdated: Date,
      predictiveMetrics: {
        projectedFocusTime: Number,
        projectedProductivity: Number,
        recommendedBreaks: Number,
        nextWeekForecast: [
          {
            date: String,
            predictedScore: Number,
          },
        ],
      },
      teamComparison: {
        averageFocusTime: Number,
        averageProductivity: Number,
        ranking: Number,
        topPerformers: [
          {
            name: String,
            score: Number,
          },
        ],
      },
      burnoutMetrics: {
        riskLevel: {
          type: String,
          enum: ['low', 'medium', 'high'],
          default: 'low',
        },
        riskFactors: [String],
        recommendations: [String],
        wellnessScore: {
          type: Number,
          min: 0,
          max: 100,
        },
      },
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.User || mongoose.model('User', userSchema);
