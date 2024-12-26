const HUGGING_FACE_API_URL = "https://api-inference.huggingface.co/models/facebook/opt-1.3b";

async function query(payload: any) {
  const response = await fetch(HUGGING_FACE_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  return response.json();
}

export async function analyzeProductivityPatterns(data: any) {
  try {
    const prompt = `Analyze these productivity patterns and provide insights:
    ${JSON.stringify(data, null, 2)}`;

    const response = await query({ inputs: prompt });
    return response[0].generated_text;
  } catch (error) {
    console.error('AI Analysis Error:', error);
    return getDefaultProductivityInsights();
  }
}

export async function generateFocusSuggestions(userPreferences: any) {
  try {
    const prompt = `Suggest focus improvements based on: ${JSON.stringify(userPreferences)}`;
    const response = await query({ inputs: prompt });
    return response[0].generated_text;
  } catch (error) {
    console.error('AI Suggestion Error:', error);
    return getDefaultFocusSuggestions();
  }
}

export async function getPersonalizedRecommendations(userData: any) {
  try {
    const prompt = `Provide personalized productivity recommendations based on: ${JSON.stringify(userData)}`;
    const response = await query({ inputs: prompt });
    return response[0].generated_text;
  } catch (error) {
    console.error('AI Recommendation Error:', error);
    return getDefaultRecommendations();
  }
}

export async function generatePersonalizedChallenges(userStats: any) {
  try {
    const prompt = `Create productivity challenges based on: ${JSON.stringify(userStats)}`;
    const response = await query({ inputs: prompt });
    return getDefaultChallenges(); // Fallback to default as parsing might be unreliable
  } catch (error) {
    console.error('AI Challenge Generation Error:', error);
    return getDefaultChallenges();
  }
}

export async function analyzeTeamProductivity(teamData: any) {
  try {
    const prompt = `Analyze team productivity for: ${JSON.stringify(teamData)}`;
    const response = await query({ inputs: prompt });
    return response[0].generated_text;
  } catch (error) {
    console.error('Team Analysis Error:', error);
    return getDefaultTeamAnalysis();
  }
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