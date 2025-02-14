"use client";
import { useRef } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

interface FeatureCardProps {
  title: string;
  description: string;
}

interface GamificationCardProps {
  icon: string;
  title: string;
  features: string[];
}

interface SectionProps {
  children: React.ReactNode;
  index: number;
  totalSections: number;
  scrollToSection: (index: number) => void;
}

const Section = ({
  children,
  index,
  totalSections,
  scrollToSection,
}: {
  children: React.ReactNode;
  index: number;
  totalSections: number;
  scrollToSection: (index: number) => void;
}) => (
  <section
    data-index={index}
    className="relative min-h-screen w-full flex items-center justify-center"
  >
    {children}
    {index < totalSections - 1 && (
      <button
        onClick={() => scrollToSection(index + 1)}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-white/50 hover:text-white/80 transition-colors"
      >
        ↓
      </button>
    )}
  </section>
);

const HomePage = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const totalSections = 5;

  const scrollToSection = (index: number) => {
    if (index < 0 || index >= totalSections) return;
    const container = containerRef.current;
    const section = container?.querySelector(`section[data-index="${index}"]`);
    section?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-x-hidden bg-black"
    >
      {/* Hero Section */}
      <Section
        index={0}
        totalSections={totalSections}
        scrollToSection={scrollToSection}
      >
        <div className="w-full min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-indigo-600 to-purple-700 text-white px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-4xl mx-auto"
          >
            <h1 className="text-4xl md:text-6xl font-extrabold mb-6">
              Focus Flow
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-indigo-100">
              AI-Powered Productivity & Focus Management
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/focus" className="btn btn-primary">
                Get Started
              </Link>
              <button
                onClick={() => scrollToSection(1)}
                className="btn btn-secondary"
              >
                Learn More
              </button>
            </div>
          </motion.div>
        </div>
      </Section>

      {/* Features Section */}
      <Section
        index={1}
        totalSections={totalSections}
        scrollToSection={scrollToSection}
      >
        <div className="w-full min-h-screen py-20 bg-white dark:bg-gray-900">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
              Intelligent Productivity Tools
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <FeatureCard
                title="Smart Focus Sessions"
                description="AI-driven focus sessions with personalized duration and break recommendations."
              />
              <FeatureCard
                title="Advanced Analytics"
                description="Comprehensive productivity tracking with AI insights."
              />
              <FeatureCard
                title="Team Collaboration"
                description="Enhanced team productivity features with real-time insights."
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
  );
};

const FeatureCard = ({ title, description }: FeatureCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-shadow"
  >
    <h3 className="text-lg font-bold mb-2 text-gray-900 dark:text-white">
      {title}
    </h3>
    <p className="text-gray-600 dark:text-gray-300">{description}</p>
  </motion.div>
);

const AIFeatureCard = ({ title, description }: FeatureCardProps) => (
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

const GamificationCard = ({ icon, title, features }: GamificationCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    className="p-6 bg-white/10 backdrop-blur-lg rounded-xl border border-white/20"
  >
    <div className="text-4xl mb-4">{icon}</div>
    <h3 className="text-xl font-bold mb-4">{title}</h3>
    <ul className="space-y-3">
      {features.map((feature, index) => (
        <li key={index} className="flex items-center text-white/90">
          <span className="mr-2">→</span>
          {feature}
        </li>
      ))}
    </ul>
  </motion.div>
);

export default HomePage;
