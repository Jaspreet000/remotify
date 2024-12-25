import mongoose from 'mongoose';

interface TeamInfo {
  name: string;
  role: {
    type: string;
    enum: ['member', 'lead', 'admin'];
    default: 'member';
  };
  joinedAt: Date;
}

const WorkSessionSchema = new mongoose.Schema({
  startTime: { type: Date, required: true },
  endTime: { type: Date },
  taskType: { type: String },
  focusScore: { type: Number, min: 0, max: 100 },
  breaks: [{
    startTime: { type: Date },
    endTime: { type: Date },
    duration: { type: Number } // in minutes
  }],
  distractions: [{
    timestamp: { type: Date },
    type: { type: String }, // e.g., 'social-media', 'email', 'notification'
    duration: { type: Number } // in minutes
  }],
}, { timestamps: true });

const HabitAnalysisSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  productiveHours: { type: Number, default: 0 },
  breakPattern: {
    frequency: { type: Number }, // breaks per hour
    avgDuration: { type: Number }, // average break duration in minutes
    quality: { type: String, enum: ['good', 'needs-improvement', 'poor'] }
  },
  focusMetrics: {
    averageScore: { type: Number },
    longestStreak: { type: Number }, // in minutes
    distractionFrequency: { type: Number }
  },
  aiSuggestions: [{
    type: { type: String, enum: ['break', 'focus', 'habit', 'environment'] },
    suggestion: String,
    priority: { type: Number, min: 1, max: 5 }
  }]
}, { timestamps: true });

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt: Date;
}

interface Badge {
  id: string;
  name: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  category: 'focus' | 'productivity' | 'collaboration' | 'streak';
  earnedAt: Date;
}

interface GameStats {
  level: number;
  experience: number;
  streak: {
    current: number;
    longest: number;
    lastActiveDate: Date;
  };
  achievements: Achievement[];
  badges: Badge[];
  milestones: {
    totalFocusHours: number;
    tasksCompleted: number;
    collaborationScore: number;
    perfectDays: number;
  };
  rankings: {
    global: number;
    monthly: number;
    teamRank: number;
    lastUpdated: Date;
  };
}

interface AdminControls {
  canManageUsers: boolean;
  canManageTeams: boolean;
  canConfigurePlatform: boolean;
  canViewAnalytics: boolean;
  accessLevel: 'full' | 'limited';
}

interface SystemSettings {
  emailNotifications: {
    dailyDigest: boolean;
    weeklyReport: boolean;
    teamUpdates: boolean;
    achievementAlerts: boolean;
  };
  pushNotifications: {
    focusReminders: boolean;
    breakReminders: boolean;
    teamMentions: boolean;
    milestoneAlerts: boolean;
  };
  privacy: {
    shareStats: boolean;
    showOnLeaderboard: boolean;
    publicProfile: boolean;
    activityVisibility: 'public' | 'team' | 'private';
  };
  accessibility: {
    highContrast: boolean;
    fontSize: 'small' | 'medium' | 'large';
    reduceAnimations: boolean;
    screenReaderOptimized: boolean;
  };
  integrationPreferences: {
    defaultCalendar: 'google' | 'outlook' | 'apple';
    defaultCommunication: 'slack' | 'teams' | 'discord';
    autoSync: boolean;
    syncFrequency: 'realtime' | 'hourly' | 'daily';
  };
}

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    preferences: {
      dailyFocusHours: { type: Number, default: 8 },
      notifications: { type: Boolean, default: true },
      theme: { type: String, default: 'light' },
      tools: [{ type: String }],
      workSchedule: {
        startTime: { type: String, default: '09:00' },
        endTime: { type: String, default: '17:00' },
        preferredBreakDuration: { type: Number, default: 15 }, // in minutes
        workDays: [{ type: Number }] // 0-6 for Sunday-Saturday
      },
      focus: {
        defaultDuration: { type: Number, default: 25 }, // Default Pomodoro duration
        breakDuration: { type: Number, default: 5 }, // Default break duration
        longBreakDuration: { type: Number, default: 15 }, // Default long break duration
        sessionsBeforeLongBreak: { type: Number, default: 4 },
        autoStartBreaks: { type: Boolean, default: false },
        notifications: {
          enabled: { type: Boolean, default: true },
          sound: { type: Boolean, default: true },
          desktop: { type: Boolean, default: true }
        },
        blockedSites: [String], // List of websites to block during focus
        blockedApps: [String], // List of apps to block during focus
      }
    },
    profile: {
      bio: { type: String, default: '' },
      avatar: { type: String, default: '' },
      goals: [{ 
        title: String,
        targetDate: Date,
        completed: { type: Boolean, default: false }
      }],
    },
    workSessions: [WorkSessionSchema],
    habitAnalysis: [HabitAnalysisSchema],
    productivityStats: {
      dailyAverage: { type: Number, default: 0 },
      weeklyTotal: { type: Number, default: 0 },
      monthlyProgress: [{
        date: Date,
        score: Number
      }]
    },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    lastLogin: { type: Date },
    isActive: { type: Boolean, default: true },
    focusStats: {
      totalSessions: { type: Number, default: 0 },
      totalFocusTime: { type: Number, default: 0 }, // in minutes
      averageFocusScore: { type: Number, default: 0 },
      streaks: {
        current: { type: Number, default: 0 },
        longest: { type: Number, default: 0 },
        lastSessionDate: Date
      },
      weeklyGoal: { type: Number, default: 0 }, // in minutes
      weeklyProgress: { type: Number, default: 0 } // in minutes
    },
    teams: [{
      name: String,
      role: { 
        type: String, 
        enum: ['member', 'lead', 'admin'],
        default: 'member'
      },
      joinedAt: { type: Date, default: Date.now }
    }],
    collaboration: {
      availability: {
        schedule: [{
          day: { type: Number, min: 0, max: 6 }, // 0 = Sunday
          startTime: String, // HH:mm format
          endTime: String
        }],
        timezone: { type: String, default: 'UTC' }
      },
      preferences: {
        meetingPreference: {
          type: String,
          enum: ['morning', 'afternoon', 'flexible'],
          default: 'flexible'
        },
        maxDailyMeetings: { type: Number, default: 4 },
        notificationPreferences: {
          slack: { type: Boolean, default: true },
          email: { type: Boolean, default: true },
          calendar: { type: Boolean, default: true }
        }
      },
      stats: {
        meetingsAttended: { type: Number, default: 0 },
        tasksCollaborated: { type: Number, default: 0 },
        averageContribution: { type: Number, default: 0 },
        recentCollaborators: [{
          userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
          count: Number,
          lastInteraction: Date
        }]
      },
      integrations: {
        slack: {
          userId: String,
          accessToken: String,
          workspaces: [{
            id: String,
            name: String,
            channels: [String]
          }]
        },
        googleCalendar: {
          connected: { type: Boolean, default: false },
          refreshToken: String,
          settings: {
            autoSync: { type: Boolean, default: true },
            visibility: { type: String, default: 'private' }
          }
        }
      }
    },
    gamification: {
      stats: {
        level: { type: Number, default: 1 },
        experience: { type: Number, default: 0 },
        streak: {
          current: { type: Number, default: 0 },
          longest: { type: Number, default: 0 },
          lastActiveDate: Date
        }
      },
      achievements: [{
        id: String,
        name: String,
        description: String,
        icon: String,
        unlockedAt: { type: Date, default: Date.now }
      }],
      badges: [{
        id: String,
        name: String,
        tier: {
          type: String,
          enum: ['bronze', 'silver', 'gold', 'platinum'],
          default: 'bronze'
        },
        category: {
          type: String,
          enum: ['focus', 'productivity', 'collaboration', 'streak']
        },
        earnedAt: { type: Date, default: Date.now }
      }],
      milestones: {
        totalFocusHours: { type: Number, default: 0 },
        tasksCompleted: { type: Number, default: 0 },
        collaborationScore: { type: Number, default: 0 },
        perfectDays: { type: Number, default: 0 }
      },
      rankings: {
        global: { type: Number, default: 0 },
        monthly: { type: Number, default: 0 },
        teamRank: { type: Number, default: 0 },
        lastUpdated: { type: Date, default: Date.now }
      }
    },
    settings: {
      system: {
        emailNotifications: {
          dailyDigest: { type: Boolean, default: true },
          weeklyReport: { type: Boolean, default: true },
          teamUpdates: { type: Boolean, default: true },
          achievementAlerts: { type: Boolean, default: true }
        },
        pushNotifications: {
          focusReminders: { type: Boolean, default: true },
          breakReminders: { type: Boolean, default: true },
          teamMentions: { type: Boolean, default: true },
          milestoneAlerts: { type: Boolean, default: true }
        },
        privacy: {
          shareStats: { type: Boolean, default: true },
          showOnLeaderboard: { type: Boolean, default: true },
          publicProfile: { type: Boolean, default: true },
          activityVisibility: { 
            type: String, 
            enum: ['public', 'team', 'private'], 
            default: 'team' 
          }
        },
        accessibility: {
          highContrast: { type: Boolean, default: false },
          fontSize: { 
            type: String, 
            enum: ['small', 'medium', 'large'], 
            default: 'medium' 
          },
          reduceAnimations: { type: Boolean, default: false },
          screenReaderOptimized: { type: Boolean, default: false }
        },
        integrationPreferences: {
          defaultCalendar: { 
            type: String, 
            enum: ['google', 'outlook', 'apple'], 
            default: 'google' 
          },
          defaultCommunication: { 
            type: String, 
            enum: ['slack', 'teams', 'discord'], 
            default: 'slack' 
          },
          autoSync: { type: Boolean, default: true },
          syncFrequency: { 
            type: String, 
            enum: ['realtime', 'hourly', 'daily'], 
            default: 'realtime' 
          }
        }
      }
    },
    adminControls: {
      canManageUsers: { type: Boolean, default: false },
      canManageTeams: { type: Boolean, default: false },
      canConfigurePlatform: { type: Boolean, default: false },
      canViewAnalytics: { type: Boolean, default: false },
      accessLevel: { 
        type: String, 
        enum: ['full', 'limited'], 
        default: 'limited' 
      }
    }
  },
  { timestamps: true }
);

// Add method to safely return user data without sensitive information
UserSchema.methods.toSafeObject = function() {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

// Add method to get recent habit analysis
UserSchema.methods.getRecentHabitAnalysis = function(days = 7) {
  const recent = this.habitAnalysis
    .sort((a: any, b: any) => b.date - a.date)
    .slice(0, days);
  
  return {
    analysis: recent,
    summary: {
      averageProductiveHours: recent.reduce((acc: number, curr: any) => 
        acc + curr.productiveHours, 0) / recent.length,
      topSuggestions: recent.flatMap((a: any) => 
        a.aiSuggestions.filter((s: any) => s.priority >= 4)
      ).slice(0, 3)
    }
  };
};

// Add method to update focus stats
UserSchema.methods.updateFocusStats = async function(session: any) {
  this.focusStats.totalSessions += 1;
  this.focusStats.totalFocusTime += session.duration;
  
  // Update average focus score
  const totalScore = (this.focusStats.averageFocusScore * (this.focusStats.totalSessions - 1) + session.focusScore);
  this.focusStats.averageFocusScore = Math.round(totalScore / this.focusStats.totalSessions);
  
  // Update streaks
  const lastSession = this.focusStats.streaks.lastSessionDate;
  const today = new Date();
  if (lastSession && isConsecutiveDay(lastSession, today)) {
    this.focusStats.streaks.current += 1;
    this.focusStats.streaks.longest = Math.max(
      this.focusStats.streaks.longest,
      this.focusStats.streaks.current
    );
  } else {
    this.focusStats.streaks.current = 1;
  }
  this.focusStats.streaks.lastSessionDate = today;

  // Update weekly progress
  const startOfWeek = getStartOfWeek(today);
  if (session.startTime >= startOfWeek) {
    this.focusStats.weeklyProgress += session.duration;
  } else {
    this.focusStats.weeklyProgress = session.duration;
  }

  await this.save();
};

// Add method to get collaboration insights
UserSchema.methods.getCollaborationInsights = async function() {
  const teams = await Promise.all(
    this.teams.map(async (team: TeamInfo) => {
      const collaboration = await mongoose.model('Collaboration').findOne({
        team: team.name
      });
      
      return {
        name: team.name,
        role: team.role,
        metrics: collaboration?.metrics || {},
        heatmap: collaboration?.generateHeatmap() || [],
        recentActivity: (collaboration?.activity || [])
          .slice(-5)
          .map((a: {
            type: string;
            date: Date;
            duration: number;
            metadata: { title: string };
          }) => ({
            type: a.type,
            date: a.date,
            duration: a.duration,
            title: a.metadata.title
          }))
      };
    })
  );

  return {
    teams,
    personalStats: this.collaboration.stats,
    availability: this.collaboration.availability,
    integrations: {
      slack: this.collaboration.integrations.slack.workspaces.map((w: { name: string }) => w.name),
      googleCalendar: this.collaboration.integrations.googleCalendar.connected
    }
  };
};

// Helper functions
function isConsecutiveDay(date1: Date, date2: Date): boolean {
  const diffTime = Math.abs(date2.getTime() - date1.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays === 1;
}

function getStartOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}

// Add method to update experience and level
UserSchema.methods.updateExperience = async function(points: number) {
  const baseXP = 1000; // Base XP needed for level 1
  const scalingFactor = 1.5; // How much more XP is needed for each level

  this.gamification.stats.experience += points;
  
  // Calculate new level based on total XP
  let xpNeeded = baseXP;
  let newLevel = 1;
  let remainingXP = this.gamification.stats.experience;

  while (remainingXP >= xpNeeded) {
    remainingXP -= xpNeeded;
    newLevel++;
    xpNeeded = Math.floor(baseXP * Math.pow(scalingFactor, newLevel - 1));
  }

  if (newLevel > this.gamification.stats.level) {
    // Level up rewards
    await this.unlockAchievement('level_milestone', `Reached Level ${newLevel}`);
  }

  this.gamification.stats.level = newLevel;
  await this.save();
};

// Add method to unlock achievements
UserSchema.methods.unlockAchievement = async function(id: string, name: string) {
  const existingAchievement = this.gamification.achievements.find((a: { id: string }) => a.id === id);
  if (!existingAchievement) {
    this.gamification.achievements.push({
      id,
      name,
      description: `Unlocked ${name}`,
      icon: `achievements/${id}.svg`,
      unlockedAt: new Date()
    });
    
    // Grant experience points for achievement
    await this.updateExperience(500);
    await this.save();
  }
};

// Add method to award badges
UserSchema.methods.awardBadge = async function(
  category: 'focus' | 'productivity' | 'collaboration' | 'streak',
  tier: 'bronze' | 'silver' | 'gold' | 'platinum'
) {
  const badgeId = `${category}_${tier}`;
  const existingBadge = this.gamification.badges.find((b: { id: string }) => b.id === badgeId);
  
  if (!existingBadge) {
    this.gamification.badges.push({
      id: badgeId,
      name: `${tier.charAt(0).toUpperCase() + tier.slice(1)} ${category}`,
      tier,
      category,
      earnedAt: new Date()
    });

    // Grant experience points based on badge tier
    const xpPoints = {
      bronze: 100,
      silver: 250,
      gold: 500,
      platinum: 1000
    };

    await this.updateExperience(xpPoints[tier]);
    await this.save();
  }
};

// Add method to update rankings
UserSchema.methods.updateRankings = async function() {
  const [globalRank, monthlyRank, teamRank] = await Promise.all([
    this.calculateGlobalRank(),
    this.calculateMonthlyRank(),
    this.calculateTeamRank()
  ]);

  this.gamification.rankings = {
    global: globalRank,
    monthly: monthlyRank,
    teamRank,
    lastUpdated: new Date()
  };

  await this.save();
};

// Add method to update system settings
UserSchema.methods.updateSettings = async function(
  settingPath: string, 
  value: any
) {
  const pathParts = settingPath.split('.');
  let current = this.settings.system;
  
  for (let i = 0; i < pathParts.length - 1; i++) {
    current = current[pathParts[i]];
  }
  
  current[pathParts[pathParts.length - 1]] = value;
  await this.save();
  
  // Trigger relevant updates based on setting changes
  if (settingPath.startsWith('privacy')) {
    await this.updatePrivacyDependencies();
  } else if (settingPath.startsWith('integrationPreferences')) {
    await this.syncIntegrationSettings();
  }
};

// Add method for admin to manage team roles
UserSchema.methods.manageTeamRole = async function(
  userId: string,
  teamId: string,
  newRole: 'member' | 'lead' | 'admin'
) {
  if (!this.adminControls.canManageTeams) {
    throw new Error('Unauthorized: Insufficient permissions');
  }

  const targetUser = await this.model('User').findById(userId);
  if (!targetUser) {
    throw new Error('User not found');
  }

  const teamIndex = targetUser.teams.findIndex((t: { _id: { toString: () => string } }) => t._id.toString() === teamId);
  if (teamIndex === -1) {
    throw new Error('Team not found');
  }

  targetUser.teams[teamIndex].role = newRole;
  await targetUser.save();

  // Log the role change
  await this.logAdminAction({
    action: 'ROLE_CHANGE',
    targetUser: userId,
    team: teamId,
    details: { oldRole: targetUser.teams[teamIndex].role, newRole }
  });
};

// Add method to log admin actions
UserSchema.methods.logAdminAction = async function(actionData: {
  action: string;
  targetUser: string;
  team?: string;
  details: any;
}) {
  const AdminLog = this.model('AdminLog');
  await AdminLog.create({
    admin: this._id,
    ...actionData,
    timestamp: new Date()
  });
};

export default mongoose.models.User || mongoose.model('User', UserSchema);
