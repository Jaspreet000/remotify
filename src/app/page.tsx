"use client";
import { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";

const HomePage = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeSection, setActiveSection] = useState(0);
  const totalSections = 5;

  useEffect(() => {
    document.title = `Section ${activeSection + 1}`;
  }, [activeSection]);

  const scrollToSection = (index: number) => {
    if (index < 0 || index >= totalSections) return;
    const container = containerRef.current;
    const section = container?.querySelector(`section[data-index="${index}"]`);
    section?.scrollIntoView({ behavior: "smooth" });
    setActiveSection(index);
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100"
    >
      <div className="flex flex-col overflow-auto">
        {/* Hero Section */}
        <Section
          index={0}
          totalSections={totalSections}
          scrollToSection={scrollToSection}
        >
          <div className="w-full h-screen flex flex-col justify-center items-center bg-gradient-to-br from-indigo-600 to-purple-700 text-white">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <h1 className="text-6xl font-extrabold mb-6">Focus Flow</h1>
              <p className="text-2xl mb-8 text-indigo-100">
                AI-Powered Productivity & Focus Management
              </p>
              <div className="flex gap-4 justify-center">
                <button className="px-8 py-3 bg-white text-indigo-600 rounded-lg font-semibold shadow-lg hover:scale-105 transition-transform">
                  Get Started
                </button>
                <button className="px-8 py-3 border-2 border-white text-white rounded-lg font-semibold hover:bg-white/10 transition-colors">
                  Learn More
                </button>
              </div>
            </motion.div>
          </div>
        </Section>

        {/* Core Features */}
        <Section
          index={1}
          totalSections={totalSections}
          scrollToSection={scrollToSection}
        >
          <div className="w-full min-h-screen flex items-center justify-center bg-white py-20">
            <div className="container mx-auto px-6">
              <h2 className="text-4xl font-bold text-center mb-16 text-gray-900">
                Intelligent Productivity Tools
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                <FeatureCard
                  icon="🎯"
                  title="Smart Focus Sessions"
                  description="AI-driven focus sessions with personalized duration and break recommendations."
                  features={[
                    "Pomodoro Technique",
                    "Distraction Blocking",
                    "Break Management",
                    "Environment Analysis",
                  ]}
                />
                <FeatureCard
                  icon="📊"
                  title="Advanced Analytics"
                  description="Comprehensive productivity tracking with AI insights."
                  features={[
                    "Focus Score Tracking",
                    "Productivity Patterns",
                    "Peak Hours Analysis",
                    "Progress Visualization",
                  ]}
                />
                <FeatureCard
                  icon="🤝"
                  title="Team Collaboration"
                  description="Enhanced team productivity features with real-time insights."
                  features={[
                    "Team Analytics",
                    "Shared Sessions",
                    "Progress Tracking",
                    "Performance Metrics",
                  ]}
                />
              </div>
            </div>
          </div>
        </Section>

        {/* AI Features */}
        <Section
          index={2}
          totalSections={totalSections}
          scrollToSection={scrollToSection}
        >
          <div className="w-full min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50 py-20">
            <div className="container mx-auto px-6">
              <h2 className="text-4xl font-bold text-center mb-16 text-gray-900">
                AI-Powered Experience
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <AIFeatureCard
                  title="Smart Recommendations"
                  description="Personalized productivity suggestions based on your work patterns"
                />
                <AIFeatureCard
                  title="Habit Analysis"
                  description="Deep insights into your productivity habits and improvement areas"
                />
                <AIFeatureCard
                  title="Dynamic Challenges"
                  description="AI-generated challenges to boost your productivity and focus"
                />
                <AIFeatureCard
                  title="Performance Insights"
                  description="Advanced metrics and predictions for better productivity"
                />
              </div>
            </div>
          </div>
        </Section>

        {/* Gamification */}
        <Section
          index={3}
          totalSections={totalSections}
          scrollToSection={scrollToSection}
        >
          <div className="w-full min-h-screen bg-gradient-to-br from-green-600 to-blue-600 text-white py-20">
            <div className="container mx-auto px-6">
              <h2 className="text-4xl font-bold text-center mb-16">
                Level Up Your Productivity
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <GamificationCard
                  icon="🏆"
                  title="Achievements"
                  features={[
                    "Daily Challenges",
                    "Focus Streaks",
                    "Performance Badges",
                    "Level Progression",
                  ]}
                />
                <GamificationCard
                  icon="📈"
                  title="Progress System"
                  features={[
                    "Experience Points",
                    "Skill Trees",
                    "Milestone Rewards",
                    "Performance Ranks",
                  ]}
                />
                <GamificationCard
                  icon="🎮"
                  title="Team Competition"
                  features={[
                    "Leaderboards",
                    "Team Challenges",
                    "Collaborative Goals",
                    "Achievement Sharing",
                  ]}
                />
              </div>
            </div>
          </div>
        </Section>

        {/* Call-to-Action */}
        <Section
          index={4}
          totalSections={totalSections}
          scrollToSection={scrollToSection}
        >
          <div className="w-full min-h-screen flex items-center justify-center bg-gray-900 text-white">
            <div className="text-center px-6 max-w-4xl">
              <h2 className="text-5xl font-bold mb-6">
                Start Your Focus Journey
              </h2>
              <p className="text-xl mb-8 text-gray-300">
                Join thousands of professionals who have transformed their
                productivity with Focus Flow
              </p>
              <div className="flex flex-col md:flex-row gap-4 justify-center">
                <button className="px-8 py-4 bg-indigo-600 text-white font-semibold rounded-lg shadow-lg hover:bg-indigo-700 transition">
                  Sign Up Now
                </button>
                <button className="px-8 py-4 border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-gray-900 transition">
                  Watch Demo
                </button>
              </div>
            </div>
          </div>
        </Section>
      </div>
    </div>
  );
};

// Enhanced Components
const FeatureCard = ({ icon, title, description, features }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    className="p-6 bg-white rounded-xl shadow-xl hover:shadow-2xl transition-shadow"
  >
    <div className="text-5xl mb-4">{icon}</div>
    <h3 className="text-xl font-bold mb-2">{title}</h3>
    <p className="text-gray-600 mb-4">{description}</p>
    <ul className="space-y-2">
      {features.map((feature: string, index: number) => (
        <li key={index} className="flex items-center text-gray-700">
          <span className="mr-2">•</span>
          {feature}
        </li>
      ))}
    </ul>
  </motion.div>
);

const AIFeatureCard = ({ title, description }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    className="p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow"
  >
    <h3 className="text-lg font-bold mb-2 text-indigo-600">{title}</h3>
    <p className="text-gray-600">{description}</p>
  </motion.div>
);

const GamificationCard = ({ icon, title, features }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    className="p-6 bg-white/10 backdrop-blur-lg rounded-xl border border-white/20"
  >
    <div className="text-4xl mb-4">{icon}</div>
    <h3 className="text-xl font-bold mb-4">{title}</h3>
    <ul className="space-y-3">
      {features.map((feature: string, index: number) => (
        <li key={index} className="flex items-center text-white/90">
          <span className="mr-2">→</span>
          {feature}
        </li>
      ))}
    </ul>
  </motion.div>
);

const Section = ({ children, index, totalSections, scrollToSection }: any) => (
  <section className="relative w-full min-h-screen" data-index={index}>
    {children}
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-4">
      {index > 0 && (
        <button
          onClick={() => scrollToSection(index - 1)}
          className="w-12 h-12 bg-black/30 hover:bg-black/40 backdrop-blur-lg text-white rounded-full flex items-center justify-center"
        >
          ↑
        </button>
      )}
      {index < totalSections - 1 && (
        <button
          onClick={() => scrollToSection(index + 1)}
          className="w-12 h-12 bg-black/30 hover:bg-black/40 backdrop-blur-lg text-white rounded-full flex items-center justify-center"
        >
          ↓
        </button>
      )}
    </div>
  </section>
);

export default HomePage;
