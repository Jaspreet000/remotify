"use client";

import { useSession } from "next-auth/react";
import AnalyticsInsights from "@/components/analytics/AnalyticsInsights";

export default function AnalyticsPage() {
  const { data: session } = useSession();

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
            Please sign in
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            You need to be signed in to access analytics features
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Analytics & Insights
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Track your productivity trends and get AI-powered insights
          </p>
        </div>

        <AnalyticsInsights />
      </div>
    </div>
  );
}
