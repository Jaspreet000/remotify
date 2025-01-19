import type { UserPreferences } from '@/app/api/dashboard/route';
import mongoose from 'mongoose';
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

export interface ProductivityData {
  sessions: {
    startTime: Date;
    duration: number;
    focusScore: number;
    distractions: string[];
  }[];
  habits: {
    summary: {
      averageProductivity: number;
      commonPatterns: string[];
    };
  };
  preferences: {
    workHours: {
      start: string;
      end: string;
    };
    focusPreferences: {
      duration: number;
      breaks: number;
    };
  };
}

export interface TeamData {
  metrics: TeamMetrics;
  sessions: {
    date: Date;
    duration: number;
    participants: string[];
    productivity: number;
  }[];
  members: {
    id: string;
    productivity: number;
    focusHours: number;
  }[];
}

interface UserStats {
  level: number;
  experience: number;
  achievements: Array<{
    id: string;
    name: string;
    date: Date;
  }>;
  recentActivity: Array<{
    type: string;
    score: number;
    timestamp: Date;
  }>;
}

interface WorkSession {
  _id: mongoose.Types.ObjectId;
  startTime: Date;
  duration: number;
  focusScore: number;
}

export interface UserData {
  focusStats: {
    totalSessions: number;
    totalFocusTime: number;
    averageFocusScore: number;
    todayProgress: {
      completedSessions: number;
      totalFocusTime: number;
      targetHours: number;
    };
  };
  recentSessions: WorkSession[];
  preferences: UserPreferences;
  habitAnalysis: HabitAnalysis;
}

export interface TeamMetrics {
  totalFocusHours: number;
  averageProductivity: number;
  activeMembers: number;
  totalSessions: number;
  weeklyParticipation: number;
}

interface HabitAnalysis {
  date: Date;
  focusTime: number;
  productivity: number;
  distractions: number;
  breaks: number;
  summary: {
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
  };
}

export interface TeamInsights {
  strengths: string[];
  improvements: string[];
  collaborationScore: number;
  performanceTrend: 'rising' | 'stable' | 'declining';
  recommendations: string[];
  focusPatterns: {
    peakHours: string[];
    commonBreakTimes: string[];
    productiveWeekdays: string[];
  };
  teamDynamics: {
    synergy: number;
    communicationEffectiveness: number;
    challengeParticipation: number;
  };
}

export async function analyzeProductivityPatterns(data: ProductivityData) {
  try {
    const prompt = `Analyze these productivity patterns and provide insights:
    ${JSON.stringify(data, null, 2)}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    try {
      return JSON.parse(text);
    } catch (error) {
      return getDefaultProductivityInsights();
    }
  } catch (error) {
    console.error('AI Analysis Error:', error);
    return getDefaultProductivityInsights();
  }
}

export async function generateFocusSuggestions(userPreferences: UserPreferences) {
  try {
    const prompt = `Suggest focus improvements based on: ${JSON.stringify(userPreferences)}`;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    try {
      return JSON.parse(text);
    } catch (error) {
      return getDefaultFocusSuggestions();
    }
  } catch (error) {
    console.error('Focus Suggestions Error:', error);
    return getDefaultFocusSuggestions();
  }
}

export async function getPersonalizedRecommendations(userData: any) {
  try {
    const prompt = `Analyze this user's work patterns and provide personalized recommendations:
    - Total Focus Sessions: ${userData.focusStats.totalSessions}
    - Average Focus Score: ${userData.focusStats.averageFocusScore}%
    - Total Focus Time: ${userData.focusStats.totalFocusTime} minutes
    - Today's Progress: ${userData.focusStats.todayProgress.totalFocusTime} minutes

    Provide three recommendations for each category:
    1. Daily habits for better productivity
    2. Areas that need improvement
    3. Work-life balance tips

    Format your response as a JSON object with these exact keys: dailyHabits (array), improvements (array), workLifeBalance (array). Each array should contain exactly 3 string items.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    try {
      return JSON.parse(text);
    } catch (parseError) {
      // If JSON parsing fails, try to extract content between curly braces
      const match = text.match(/{[\s\S]*}/);
      if (match) {
        return JSON.parse(match[0]);
      }
      throw parseError;
    }
  } catch (error) {
    console.error('AI Recommendations Error:', error);
    return {
      dailyHabits: [
        "Start your day with a 25-minute focused work session",
        "Take regular 5-minute breaks every hour",
        "Plan your most important tasks the night before"
      ],
      improvements: [
        "Try to increase your average focus score",
        "Add more variety to your work sessions",
        "Maintain a consistent daily schedule"
      ],
      workLifeBalance: [
        "Set clear boundaries between work and personal time",
        "Take proper lunch breaks away from your desk",
        "End your workday at a consistent time"
      ]
    };
  }
}

export async function getProductivityInsights(userData: any) {
  try {
    const prompt = `Analyze this user's focus session data and provide insights:
    - Recent Sessions: ${JSON.stringify(userData.recentSessions.slice(-5))}
    - Focus Stats: ${JSON.stringify(userData.focusStats)}
    
    Provide four insights, one for each type:
    1. A productivity pattern you've noticed
    2. A trend in focus scores
    3. An area needing improvement
    4. A notable achievement
    
    Format your response as a JSON array where each object has these exact properties:
    - type: one of "pattern", "trend", "improvement", or "achievement"
    - title: a short title for the insight
    - description: a detailed explanation
    - actionableSteps: an array of 2-3 specific steps to take

    Keep the response concise and ensure valid JSON formatting.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    try {
      return JSON.parse(text);
    } catch (parseError) {
      // If JSON parsing fails, try to extract content between square brackets
      const match = text.match(/\[[\s\S]*\]/);
      if (match) {
        return JSON.parse(match[0]);
      }
      throw parseError;
    }
  } catch (error) {
    console.error('AI Insights Error:', error);
    return [
      {
        type: "pattern",
        title: "Peak Productivity Hours",
        description: "You tend to be most productive in the morning hours",
        actionableSteps: [
          "Schedule important tasks during morning hours",
          "Protect your morning time from interruptions"
        ]
      },
      {
        type: "trend",
        title: "Improving Focus Scores",
        description: "Your focus scores have been steadily improving",
        actionableSteps: [
          "Continue your current routine",
          "Document what works best for you"
        ]
      },
      {
        type: "improvement",
        title: "Break Consistency",
        description: "Break patterns could be more regular",
        actionableSteps: [
          "Set break reminders",
          "Follow a structured break schedule"
        ]
      },
      {
        type: "achievement",
        title: "Session Milestone",
        description: "You've completed a significant number of focused sessions",
        actionableSteps: [
          "Celebrate your progress",
          "Share your success techniques"
        ]
      }
    ];
  }
}

export async function generateDailyChallenge(userData: any) {
  try {
    const prompt = `Create a personalized daily challenge based on:
    - Average Focus Score: ${userData.focusStats.averageFocusScore}%
    - Today's Focus Time: ${userData.focusStats.todayProgress.totalFocusTime} minutes
    - Target Hours: ${userData.focusStats.todayProgress.targetHours} hours

    Create a challenge that is:
    1. Achievable but stretching
    2. Specific and measurable
    3. Rewarding appropriately

    Format your response as a JSON object with these exact properties:
    - title: string (short, catchy title)
    - description: string (clear explanation)
    - target: object with properties: sessions (number) and minFocusScore (number)
    - rewardPoints: number (between 50-200)

    Keep the response concise and ensure valid JSON formatting.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    try {
      return JSON.parse(text);
    } catch (parseError) {
      // If JSON parsing fails, try to extract content between curly braces
      const match = text.match(/{[\s\S]*}/);
      if (match) {
        return JSON.parse(match[0]);
      }
      throw parseError;
    }
  } catch (error) {
    console.error('Daily Challenge Error:', error);
    return {
      title: "Focus Marathon",
      description: "Complete 4 focused work sessions of 25 minutes each",
      target: { sessions: 4, minFocusScore: 85 },
      rewardPoints: 100
    };
  }
}

export async function getWorkflowOptimizations(userData: any) {
  try {
    const prompt = `Analyze work patterns and suggest optimizations:
    - Preferences: ${JSON.stringify(userData.preferences)}
    - Recent Activity: ${JSON.stringify(userData.recentSessions.slice(-3))}
    
    Provide three suggestions for each category:
    1. Schedule optimization
    2. Environment setup
    3. Focus techniques

    Format your response as a JSON object with these exact keys: schedule (array), environment (array), techniques (array). Each array should contain exactly 3 string items.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    try {
      return JSON.parse(text);
    } catch (parseError) {
      // If JSON parsing fails, try to extract content between curly braces
      const match = text.match(/{[\s\S]*}/);
      if (match) {
        return JSON.parse(match[0]);
      }
      throw parseError;
    }
  } catch (error) {
    console.error('Workflow Optimization Error:', error);
    return {
      schedule: [
        "Align deep work with your peak energy hours",
        "Group similar tasks together",
        "Schedule buffer time between focused sessions"
      ],
      environment: [
        "Optimize your workspace lighting",
        "Maintain an organized desk",
        "Use noise-canceling solutions"
      ],
      techniques: [
        "Try the Pomodoro Technique",
        "Practice mindful transitions between tasks",
        "Use time-blocking for better focus"
      ]
    };
  }
}

export async function getTeamSyncSuggestions(teamData: any) {
  try {
    const prompt = `Analyze team collaboration data:
    - Team Size: ${teamData.members.length}
    - Average Productivity: ${teamData.metrics.averageProductivity}%
    - Recent Sessions: ${JSON.stringify(teamData.sessions.slice(-3))}
    
    Provide three suggestions for each category:
    1. Team synchronization
    2. Collaboration opportunities
    3. Group productivity

    Format your response as a JSON object with these exact keys: synchronization (array), collaboration (array), productivity (array). Each array should contain exactly 3 string items.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    try {
      return JSON.parse(text);
    } catch (parseError) {
      // If JSON parsing fails, try to extract content between curly braces
      const match = text.match(/{[\s\S]*}/);
      if (match) {
        return JSON.parse(match[0]);
      }
      throw parseError;
    }
  } catch (error) {
    console.error('Team Sync Suggestions Error:', error);
    return {
      synchronization: [
        "Schedule regular team focus sessions",
        "Align break times for better communication",
        "Set team-wide deep work hours"
      ],
      collaboration: [
        "Create shared focus goals",
        "Implement pair productivity sessions",
        "Share productivity wins and learnings"
      ],
      productivity: [
        "Use team challenges to boost motivation",
        "Share effective focus techniques",
        "Celebrate team productivity milestones"
      ]
    };
  }
}

export async function generatePersonalizedChallenges(userStats: UserStats) {
  try {
    const prompt = `Create productivity challenges based on: ${JSON.stringify(userStats)}`;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    try {
      return parseChallenges(text);
    } catch (error) {
      return getDefaultChallenges();
    }
  } catch (error) {
    console.error('AI Challenge Generation Error:', error);
    return getDefaultChallenges();
  }
}

export async function analyzeTeamDynamics(teamData: TeamData) {
  try {
    const prompt = `Analyze team collaboration patterns: ${JSON.stringify(teamData)}`;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return text || getDefaultTeamAnalysis();
  } catch (error) {
    console.error('Team Analysis Error:', error);
    return getDefaultTeamAnalysis();
  }
}

export async function analyzeUserPerformance(user: any) {
  try {
    const prompt = `Analyze this user's performance data and provide insights:
      ${JSON.stringify({
        workSessions: user.workSessions,
        stats: user.stats,
        achievements: user.achievements
      }, null, 2)}
      
      Provide insights in the following format:
      1. List 3 strengths
      2. List 2 areas for improvement
      3. Rate consistency (0-100)
      4. Determine performance trend (rising/stable/declining)`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parse AI response
    const insights = parseUserPerformanceResponse(text);

    return {
      strengths: insights.strengths,
      improvements: insights.improvements,
      consistency: insights.consistency,
      trend: insights.trend
    };
  } catch (error) {
    console.error('Error analyzing user performance:', error);
    return {
      strengths: ['Shows dedication to improvement'],
      improvements: ['Can increase session duration'],
      consistency: 75,
      trend: 'stable'
    };
  }
}

function extractStrengths(analysis: string): string[] {
  const strengthsMatch = analysis.match(/Strengths:?\s*((?:[-•]\s*[^\n]+\n*)+)/i);
  if (!strengthsMatch) return ['Consistent work sessions'];
  
  return strengthsMatch[1]
    .split('\n')
    .map(s => s.replace(/^[-•]\s*/, '').trim())
    .filter(s => s.length > 0)
    .slice(0, 3);
}

function extractImprovements(analysis: string): string[] {
  const improvementsMatch = analysis.match(/Areas for Improvement:?\s*((?:[-•]\s*[^\n]+\n*)+)/i);
  if (!improvementsMatch) return ['Increase focus duration'];
  
  return improvementsMatch[1]
    .split('\n')
    .map(s => s.replace(/^[-•]\s*/, '').trim())
    .filter(s => s.length > 0)
    .slice(0, 3);
}

function calculateConsistencyFromAnalysis(analysis: string): number {
  const consistencyMatch = analysis.match(/Consistency Score:?\s*(\d+)/i);
  if (consistencyMatch) {
    return Math.min(parseInt(consistencyMatch[1]), 100);
  }
  return 75; // Default value
}

function determineTrend(analysis: string): 'rising' | 'stable' | 'declining' {
  const trendMatch = analysis.match(/Performance Trend:?\s*(rising|stable|declining)/i);
  if (trendMatch) {
    return trendMatch[1].toLowerCase() as 'rising' | 'stable' | 'declining';
  }
  
  const lowerAnalysis = analysis.toLowerCase();
  if (lowerAnalysis.includes('rising') || lowerAnalysis.includes('improving') || lowerAnalysis.includes('upward')) {
    return 'rising';
  }
  if (lowerAnalysis.includes('declining') || lowerAnalysis.includes('decreasing') || lowerAnalysis.includes('downward')) {
    return 'declining';
  }
  return 'stable';
}

export async function generateTeamInsights(team: any): Promise<TeamInsights> {
  try {
    // Prepare team data for analysis
    const teamData = {
      memberCount: team.members.length,
      totalFocusTime: team.stats.totalFocusTime,
      averageProductivity: team.stats.averageProductivity,
      weeklyStreak: team.stats.weeklyStreak,
      collaborationScore: team.stats.collaborationScore,
      challenges: team.challenges,
      achievements: team.achievements,
      leaderboard: team.leaderboard
    };

    // Generate prompt for team analysis
    const prompt = `Analyze this team's performance data and provide detailed insights:
      ${JSON.stringify(teamData, null, 2)}
      
      Provide insights in the following format:
      1. List 3 key strengths
      2. List 2 areas for improvement
      3. Rate collaboration (0-100)
      4. Determine performance trend (rising/stable/declining)
      5. Provide 3 specific recommendations
      6. Analyze focus patterns (peak hours, break times, productive days)
      7. Rate team dynamics (synergy, communication, challenge participation)`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parse AI response
    const insights = parseAIResponse(text);

    return {
      strengths: insights.strengths,
      improvements: insights.improvements,
      collaborationScore: insights.collaborationScore,
      performanceTrend: insights.performanceTrend,
      recommendations: insights.recommendations,
      focusPatterns: {
        peakHours: insights.focusPatterns.peakHours,
        commonBreakTimes: insights.focusPatterns.commonBreakTimes,
        productiveWeekdays: insights.focusPatterns.productiveWeekdays
      },
      teamDynamics: {
        synergy: insights.teamDynamics.synergy,
        communicationEffectiveness: insights.teamDynamics.communicationEffectiveness,
        challengeParticipation: insights.teamDynamics.challengeParticipation
      }
    };
  } catch (error) {
    console.error('Error generating team insights:', error);
    return {
      strengths: ['Team shows potential for growth'],
      improvements: ['Data collection needs improvement'],
      collaborationScore: 70,
      performanceTrend: 'stable',
      recommendations: ['Start tracking team metrics consistently'],
      focusPatterns: {
        peakHours: ['9 AM - 11 AM'],
        commonBreakTimes: ['12 PM - 1 PM'],
        productiveWeekdays: ['Tuesday', 'Wednesday']
      },
      teamDynamics: {
        synergy: 75,
        communicationEffectiveness: 70,
        challengeParticipation: 65
      }
    };
  }
}

function parseAIResponse(text: string): any {
  try {
    const sections = text.split('\n\n');
    
    return {
      strengths: extractListItems(findSection(sections, 'strengths')),
      improvements: extractListItems(findSection(sections, 'improvement')),
      collaborationScore: extractNumber(findSection(sections, 'collaboration')),
      performanceTrend: extractTrend(findSection(sections, 'trend')),
      recommendations: extractListItems(findSection(sections, 'recommendations')),
      focusPatterns: {
        peakHours: extractListItems(findSection(sections, 'peak hours')),
        commonBreakTimes: extractListItems(findSection(sections, 'break times')),
        productiveWeekdays: extractListItems(findSection(sections, 'productive days'))
      },
      teamDynamics: {
        synergy: extractNumber(findSection(sections, 'synergy')),
        communicationEffectiveness: extractNumber(findSection(sections, 'communication')),
        challengeParticipation: extractNumber(findSection(sections, 'participation'))
      }
    };
  } catch (error) {
    console.error('Error parsing AI response:', error);
    return getDefaultInsights();
  }
}

function parseUserPerformanceResponse(text: string): any {
  try {
    const sections = text.split('\n\n');
    
    return {
      strengths: extractListItems(findSection(sections, 'strengths')),
      improvements: extractListItems(findSection(sections, 'improvement')),
      consistency: extractNumber(findSection(sections, 'consistency')),
      trend: extractTrend(findSection(sections, 'trend'))
    };
  } catch (error) {
    console.error('Error parsing user performance response:', error);
    return {
      strengths: ['Shows potential'],
      improvements: ['Need more data'],
      consistency: 70,
      trend: 'stable'
    };
  }
}

// Helper functions
function findSection(sections: string[], keyword: string): string {
  return sections.find(s => s.toLowerCase().includes(keyword)) || '';
}

function extractListItems(text: string): string[] {
  return text
    .split('\n')
    .filter(line => /^[-\d]/.test(line))
    .map(line => line.replace(/^[-\d.]\s*/, ''));
}

function extractNumber(text: string): number {
  const match = text.match(/\d+/);
  return match ? parseInt(match[0]) : 70;
}

function extractTrend(text: string): 'rising' | 'stable' | 'declining' {
  const lowercaseText = text.toLowerCase();
  if (lowercaseText.includes('rising')) return 'rising';
  if (lowercaseText.includes('declining')) return 'declining';
  return 'stable';
}

function getDefaultInsights(): TeamInsights {
  return {
    strengths: ['Team shows potential'],
    improvements: ['Need more data'],
    collaborationScore: 70,
    performanceTrend: 'stable',
    recommendations: ['Start tracking metrics'],
    focusPatterns: {
      peakHours: ['9 AM - 11 AM'],
      commonBreakTimes: ['12 PM - 1 PM'],
      productiveWeekdays: ['Tuesday', 'Wednesday']
    },
    teamDynamics: {
      synergy: 75,
      communicationEffectiveness: 70,
      challengeParticipation: 65
    }
  };
}

// Default fallback functions
function getDefaultProductivityInsights() {
  return {
    observations: [
      "Regular work patterns detected",
      "Focus sessions average 45 minutes",
    ],
    recommendations: [
      "Try the Pomodoro Technique (25min work, 5min break)",
      "Schedule deep work during your peak energy hours",
      "Take regular breaks to maintain productivity",
    ]
  };
}

function getDefaultFocusSuggestions() {
  return [
    "Find a quiet workspace",
    "Use time-blocking for important tasks",
    "Take regular breaks every 45-60 minutes",
    "Stay hydrated and maintain good posture",
  ];
}

function getDefaultRecommendations() {
  return {
    dailyHabits: [
      "Start your day with a planning session",
      "Take regular breaks every hour",
      "End your day with a review session",
    ],
    improvements: [
      "Increase focus session duration gradually",
      "Minimize context switching between tasks",
      "Create a dedicated workspace",
    ],
    workLifeBalance: [
      "Set clear boundaries between work and personal time",
      "Schedule regular exercise breaks",
      "Practice mindfulness during breaks",
    ]
  };
}

function getDefaultChallenges() {
  return [
    {
      title: "Focus Marathon",
      description: "Complete 4 focused work sessions of 25 minutes each",
      difficulty: "easy",
      rewards: {
        experience: 100,
        badges: ["Focus Novice"],
      }
    },
    {
      title: "Productivity Master",
      description: "Maintain 80% focus score for 5 consecutive sessions",
      difficulty: "medium",
      rewards: {
        experience: 200,
        badges: ["Productivity Expert"],
      }
    },
    {
      title: "Team Sync Champion",
      description: "Participate in 3 team focus sessions",
      difficulty: "medium",
      rewards: {
        experience: 150,
        badges: ["Team Player"],
      }
    }
  ];
}

function getDefaultTeamAnalysis() {
  return {
    summary: "Team shows consistent collaboration patterns",
    insights: [
      {
        type: "strength",
        message: "Regular team focus sessions indicate good coordination"
      },
      {
        type: "improvement",
        message: "Consider increasing cross-team collaboration sessions"
      }
    ],
    recommendations: [
      "Schedule regular team focus sessions",
      "Implement paired productivity sessions",
      "Share best practices across team members",
      "Create team challenges for better engagement"
    ]
  };
}

// Helper function to parse AI-generated challenges
function parseChallenges(aiResponse: string) {
  try {
    // Basic parsing of AI response
    const challenges = aiResponse.split('\n\n')
      .filter(challenge => challenge.trim())
      .map(challenge => {
        const lines = challenge.split('\n');
        return {
          title: lines[0]?.replace(/^[#\-*]\s*/, '') || 'Challenge',
          description: lines[1] || 'Complete this challenge',
          difficulty: 'medium',
          rewards: {
            experience: 100,
            badges: ['Achievement Unlocked']
          }
        };
      });

    return challenges.length > 0 ? challenges : getDefaultChallenges();
  } catch (error) {
    console.error('Challenge parsing error:', error);
    return getDefaultChallenges();
  }
}

export async function generateMeetingSummary(transcript: string) {
  try {
    const prompt = `Summarize this meeting transcript and extract key action items:
    ${transcript}
    
    Format the response as:
    {
      "summary": "Brief meeting summary",
      "actionItems": ["action1", "action2"],
      "decisions": ["decision1", "decision2"],
      "followUps": ["followup1", "followup2"]
    }`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    return JSON.parse(response.text());
  } catch (error) {
    console.error('Meeting summary error:', error);
    return null;
  }
}

export async function predictBurnoutRisk(userData: any) {
  try {
    const prompt = `Analyze this user's work patterns for burnout risk:
    - Average daily focus time: ${userData.averageDailyFocusTime}
    - Break frequency: ${userData.breakFrequency}
    - Work outside hours: ${userData.afterHoursWork}
    - Recent focus scores: ${userData.recentFocusScores}
    
    Return a risk assessment as:
    {
      "riskLevel": "low|medium|high",
      "factors": ["factor1", "factor2"],
      "recommendations": ["rec1", "rec2"]
    }`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    return JSON.parse(response.text());
  } catch (error) {
    console.error('Burnout prediction error:', error);
    return null;
  }
}

export async function suggestTeamSync(teamData: any) {
  try {
    const prompt = `Based on this team's patterns, suggest optimal sync times:
    - Team time zones: ${teamData.timeZones}
    - Focus patterns: ${teamData.focusPatterns}
    - Meeting preferences: ${teamData.preferences}
    
    Return suggestions as:
    {
      "optimalTimes": ["time1", "time2"],
      "format": "async|sync",
      "duration": number,
      "frequency": "daily|weekly",
      "agenda": ["item1", "item2"]
    }`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    return JSON.parse(response.text());
  } catch (error) {
    console.error('Team sync suggestion error:', error);
    return null;
  }
}

export async function generateProductivityReport(userData: any) {
  try {
    const prompt = `Generate a comprehensive productivity report based on:
    - Focus sessions: ${JSON.stringify(userData.sessions)}
    - Goals achieved: ${JSON.stringify(userData.goals)}
    - Team contributions: ${JSON.stringify(userData.teamWork)}
    
    Return the report as:
    {
      "overview": "text",
      "achievements": ["achievement1", "achievement2"],
      "areas_for_improvement": ["area1", "area2"],
      "recommendations": ["rec1", "rec2"],
      "next_goals": ["goal1", "goal2"]
    }`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    return JSON.parse(response.text());
  } catch (error) {
    console.error('Productivity report error:', error);
    return null;
  }
}

export async function suggestBreakActivity(userData: any) {
  try {
    const prompt = `Suggest a break activity based on:
    - Current focus time: ${userData.currentFocusTime}
    - Energy level: ${userData.energyLevel}
    - Previous activities: ${userData.previousActivities}
    - Break duration: ${userData.breakDuration}
    
    Return suggestion as:
    {
      "activity": "description",
      "duration": number,
      "benefits": ["benefit1", "benefit2"],
      "alternatives": ["alt1", "alt2"]
    }`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    return JSON.parse(response.text());
  } catch (error) {
    console.error('Break suggestion error:', error);
    return null;
  }
}

export async function suggestMeetingSchedule(events: any[], preferences: any) {
  try {
    const prompt = `Based on these calendar events and preferences, suggest optimal meeting times:
    Calendar Events: ${JSON.stringify(events)}
    User Preferences: ${JSON.stringify(preferences)}
    
    Return suggestions as:
    {
      "optimalTimes": ["time1", "time2"],
      "reasoning": "explanation",
      "considerations": ["factor1", "factor2"]
    }`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    return JSON.parse(response.text());
  } catch (error) {
    console.error('Meeting schedule suggestion error:', error);
    return null;
  }
}

export async function optimizeFocusBlocks(schedule: any, productivity: any) {
  try {
    const prompt = `Analyze this schedule and productivity data to suggest optimal focus time blocks:
    Schedule: ${JSON.stringify(schedule)}
    Productivity Patterns: ${JSON.stringify(productivity)}
    
    Return suggestions as:
    {
      "focusBlocks": [
        {
          "startTime": "HH:MM",
          "duration": number,
          "priority": "high|medium|low",
          "reason": "explanation"
        }
      ],
      "recommendations": ["rec1", "rec2"]
    }`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    return JSON.parse(response.text());
  } catch (error) {
    console.error('Focus block optimization error:', error);
    return null;
  }
}

export async function analyzeMeetingEffectiveness(meetings: any[]) {
  try {
    const prompt = `Analyze these meetings for effectiveness and suggest improvements:
    Meetings: ${JSON.stringify(meetings)}
    
    Return analysis as:
    {
      "effectiveness": number,
      "patterns": ["pattern1", "pattern2"],
      "improvements": ["improvement1", "improvement2"],
      "scheduling_recommendations": ["rec1", "rec2"]
    }`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    return JSON.parse(response.text());
  } catch (error) {
    console.error('Meeting effectiveness analysis error:', error);
    return null;
  }
}

export async function getSystemHealthMetrics() {
  try {
    const prompt = `Analyze system health metrics and provide insights:
    - Server performance
    - API response times
    - Error rates
    - Resource utilization
    
    Return metrics as:
    {
      "performance": { "score": number, "issues": string[] },
      "reliability": { "score": number, "incidents": string[] },
      "resources": { "usage": number, "warnings": string[] },
      "recommendations": string[]
    }`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return JSON.parse(response.text());
  } catch (error) {
    console.error('System health metrics error:', error);
    return {
      performance: { score: 85, issues: [] },
      reliability: { score: 90, incidents: [] },
      resources: { usage: 65, warnings: [] },
      recommendations: ['Monitor system regularly']
    };
  }
} 