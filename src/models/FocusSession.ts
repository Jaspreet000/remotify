import mongoose from 'mongoose';
import { generateFocusSuggestions } from '@/lib/aiService';

const DistractionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['website', 'app', 'notification', 'other'],
    required: true
  },
  timestamp: { type: Date, default: Date.now },
  details: String
});

const FocusSessionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  startTime: { type: Date, default: Date.now },
  endTime: Date,
  duration: { type: Number, required: true }, // in minutes
  isCompleted: { type: Boolean, default: false },
  focusScore: { type: Number, min: 0, max: 100 },
  blockedItems: [{
    type: { type: String, enum: ['website', 'app'] },
    name: String
  }],
  distractions: [DistractionSchema],
  breaks: [{
    startTime: Date,
    endTime: Date,
    duration: Number, // in minutes
    type: { type: String, enum: ['planned', 'unplanned'] }
  }],
  notes: String,
  mood: {
    before: { type: Number, min: 1, max: 5 },
    after: { type: Number, min: 1, max: 5 }
  },
  aiSuggestions: [{
    type: String,
    timestamp: Date,
    category: {
      type: String,
      enum: ['break', 'focus', 'environment', 'habit']
    },
    priority: {
      type: Number,
      min: 1,
      max: 5
    }
  }],
  environment: {
    noise: {
      type: String,
      enum: ['quiet', 'moderate', 'loud']
    },
    lighting: {
      type: String,
      enum: ['dark', 'dim', 'bright']
    },
    temperature: Number
  },
  productivity: {
    energyLevel: {
      type: Number,
      min: 1,
      max: 5
    },
    stressLevel: {
      type: Number,
      min: 1,
      max: 5
    },
    satisfaction: {
      type: Number,
      min: 1,
      max: 5
    }
  }
}, {
  timestamps: true
});

// Calculate focus score before saving
FocusSessionSchema.pre('save', async function(next) {
  if (this.isCompleted && !this.focusScore) {
    if (!this.endTime || !this.startTime) return 0;

    const plannedDuration = this.duration * 60 * 1000;
    const actualDuration = this.endTime.getTime() - this.startTime.getTime();
    
    // Calculate base score
    let score = 100;
    
    // Time management factor
    const durationDiff = Math.abs(plannedDuration - actualDuration) / plannedDuration;
    score -= durationDiff * 20;
    
    // Distraction impact
    const distractionImpact = this.distractions.reduce((acc, d) => {
      // Weight different types of distractions differently
      const weights = {
        'notification': 2,
        'website': 3,
        'app': 3,
        'other': 1
      };
      return acc + (weights[d.type] || 1);
    }, 0);
    score -= distractionImpact * 5;
    
    // Break efficiency
    const breakEfficiency = this.breaks.reduce((acc, b) => {
      return acc + (b.type === 'planned' ? 1 : -1);
    }, 0);
    score += breakEfficiency * 2;
    
    // Environmental factors
    if (this.environment) {
      const optimalConditions = {
        noise: 'quiet',
        lighting: 'bright'
      };
      if (this.environment.noise === optimalConditions.noise) score += 5;
      if (this.environment.lighting === optimalConditions.lighting) score += 5;
    }
    
    // Ensure score stays within bounds
    this.focusScore = Math.max(0, Math.min(100, Math.round(score)));
  }
  next();
});

// Method to get session statistics
FocusSessionSchema.methods.getStats = function() {
  return {
    totalDuration: this.duration,
    actualDuration: this.endTime ? 
      Math.round((this.endTime.getTime() - this.startTime.getTime()) / (60 * 1000)) : 
      null,
    distractionCount: this.distractions.length,
    breakCount: this.breaks.length,
    focusScore: this.focusScore,
    productivity: {
      score: this.focusScore,
      factors: {
        distractions: this.distractions.length,
        breaks: this.breaks.length,
        completion: this.isCompleted
      }
    }
  };
};

// Add AI-powered methods
FocusSessionSchema.methods.getPersonalizedSuggestions = async function() {
  const suggestions = await generateFocusSuggestions({
    focus: {
      defaultDuration: this.duration,
      breakDuration: this.breaks.length,
      sessionsBeforeLongBreak: 4,
      blockedSites: [],
      blockedApps: []
    },
    notifications: {
      enabled: true,
      breakReminders: true,
      progressUpdates: true,
      teamActivity: true
    },
    theme: {
      mode: 'light',
      color: 'blue'
    }
  });
  
  this.aiSuggestions.push(...suggestions);
  await this.save();
  return suggestions;
};

export default mongoose.models.FocusSession || mongoose.model('FocusSession', FocusSessionSchema);
