"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useSettings } from "@/context/SettingsContext";
import { useSession, signOut } from "next-auth/react";

export default function SettingsPage() {
  const router = useRouter();
  const { settings, updateSettings } = useSettings();
  const { data: session, status } = useSession();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      <div className="max-w-4xl mx-auto px-4 py-6 grid gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight bg-gradient-to-r from-slate-900 via-blue-800 to-indigo-900 bg-clip-text text-transparent">Settings</h1>
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-1 text-sm text-slate-600 hover:text-slate-800 transition-colors duration-200"
            title="Back to app"
          >
            <svg 
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              className="w-4 h-4"
            >
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Back
          </button>
        </div>

        {/* Account Section */}
        <section className="border border-slate-200/60 bg-white/90 backdrop-blur-sm shadow-lg rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200/60 bg-gradient-to-r from-slate-50 to-blue-50/30">
            <h2 className="text-sm font-semibold text-slate-900">Account</h2>
          </div>
          <div className="p-4">
            {session?.user ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Signed in as</p>
                    <p className="text-sm text-slate-600">{session.user.email}</p>
                  </div>
                  <button
                    onClick={() => signOut()}
                    className="px-3 py-1.5 text-sm border border-slate-300 bg-white/80 hover:bg-slate-50 transition-all duration-200 rounded-lg"
                  >
                    Sign out
                  </button>
                </div>
                <div className="text-xs text-slate-500">
                  Your preferences are saved to your account and will sync across devices.
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-slate-600">
                  You're using the app anonymously. Sign up to save your preferences permanently.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => router.push("/auth/signin")}
                    className="px-3 py-1.5 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded-lg"
                  >
                    Sign in
                  </button>
                  <button
                    onClick={() => router.push("/auth/signup")}
                    className="px-3 py-1.5 text-sm border border-slate-300 bg-white/80 hover:bg-slate-50 transition-all duration-200 rounded-lg"
                  >
                    Sign up
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Privacy & Data Section */}
        <section className="border border-slate-200/60 bg-white/90 backdrop-blur-sm shadow-lg rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200/60 bg-gradient-to-r from-slate-50 to-blue-50/30">
            <h2 className="text-sm font-semibold text-slate-900">Privacy & Data</h2>
          </div>
          <div className="p-4 space-y-4">
            <div className="text-sm text-slate-600">
              <p className="mb-2">Your data is used to:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Generate personalized research summaries</li>
                <li>Learn your preferences for better results</li>
                <li>Improve the AI's understanding of your needs</li>
              </ul>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => {
                  // Export user data
                  const data = {
                    settings,
                    timestamp: new Date().toISOString()
                  };
                  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'researchbridge-settings.json';
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="px-3 py-1.5 text-sm border border-slate-300 bg-white/80 hover:bg-slate-50 transition-all duration-200 rounded-lg"
              >
                Export my data
              </button>
              <button
                onClick={() => {
                  if (confirm("This will reset all your preferences and learning data. Are you sure?")) {
                    // Reset all settings
                    updateSettings({
                      language: "English",
                      interests: [],
                      community: "General",
                      outputStyle: "paragraphs",
                      textSize: "medium",
                      defaultReadingLevel: "simple",
                      microPromptsEnabled: true,
                      signals: [],
                      preferences: {},
                      nudges: {},
                      hasOnboarded: true,
                    });
                  }
                }}
                className="px-3 py-1.5 text-sm border border-red-300 text-red-600 bg-white/80 hover:bg-red-50 transition-all duration-200 rounded-lg"
              >
                Reset all data
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
} 