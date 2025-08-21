"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useSettings } from "@/context/SettingsContext";
import PreferencesPill from "@/components/PreferencesPill";

export default function PreferencesPage() {
  const router = useRouter();
  const { settings, updateSettings, getActivePreferences } = useSettings();

  const [language, setLanguage] = useState(settings.language);
  const [outputStyle, setOutputStyle] = useState(settings.outputStyle);
  const [interests, setInterests] = useState(settings.interests);
  const [community, setCommunity] = useState(settings.community);
  const [textSize, setTextSize] = useState(settings.textSize);
  const [defaultReadingLevel, setDefaultReadingLevel] = useState(
    settings.defaultReadingLevel
  );
  const [microPromptsEnabled, setMicroPromptsEnabled] = useState(settings.microPromptsEnabled !== false);

  useEffect(() => {
    setLanguage(settings.language);
    setOutputStyle(settings.outputStyle);
    setInterests(settings.interests);
    setCommunity(settings.community);
    setTextSize(settings.textSize);
    setDefaultReadingLevel(settings.defaultReadingLevel);
    setMicroPromptsEnabled(settings.microPromptsEnabled !== false);
  }, [settings]);

  function handleSave(e) {
    e.preventDefault();
    updateSettings({
      language,
      outputStyle,
      interests,
      community,
      textSize,
      defaultReadingLevel,
      microPromptsEnabled,
      hasOnboarded: true,
    });
    router.push("/");
  }

  const activePrefs = getActivePreferences();

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 grid gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">AI Preferences</h1>
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-1 text-sm text-slate-600 hover:text-slate-800 transition-colors"
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



      {/* Active Preferences Section */}
      <section className="border border-light bg-white shadow-professional card">
        <div className="px-4 py-3 border-b border-light section-header">
          <h2 className="text-sm font-semibold">Active AI Preferences</h2>
        </div>
        <div className="p-4">
          {activePrefs.length > 0 ? (
            <div className="space-y-3">
              <p className="text-sm text-slate-600">
                These preferences help the AI understand how you like information presented:
              </p>
              <PreferencesPill />
            </div>
          ) : (
            <div className="text-sm text-slate-600">
              No active preferences yet. Use the reaction chips below results to help the AI learn your preferences.
            </div>
          )}
        </div>
      </section>

      {/* Basic Preferences Section */}
      <section className="border border-light bg-white shadow-professional card">
        <div className="px-4 py-3 border-b border-light section-header">
          <h2 className="text-sm font-semibold">Basic Preferences</h2>
        </div>
        <div className="p-4">
          <form onSubmit={handleSave} className="grid gap-4">
            <div className="grid gap-1">
              <label className="text-sm font-medium" htmlFor="language">
                Preferred language
              </label>
              <input
                id="language"
                type="text"
                className="w-full px-3 py-2 border border-slate-300 bg-white outline-none focus:ring-2 focus:ring-slate-400/40"
                placeholder="English, Spanish, Haitian Creole…"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              />
            </div>

            <div className="grid gap-1">
              <label className="text-sm font-medium" htmlFor="outputStyle">
                Default output style
              </label>
              <select
                id="outputStyle"
                className="w-full px-3 py-2 border border-slate-300 bg-white outline-none focus:ring-2 focus:ring-slate-400/40"
                value={outputStyle}
                onChange={(e) => setOutputStyle(e.target.value)}
              >
                <option value="paragraphs">Short paragraphs</option>
                <option value="bullets">Bulleted lists</option>
              </select>
            </div>

            <div className="grid gap-1">
              <label className="text-sm font-medium" htmlFor="interests">
                Your interests (optional)
              </label>
              <input
                id="interests"
                type="text"
                className="w-full px-3 py-2 border border-slate-300 bg-white outline-none focus:ring-2 focus:ring-slate-400/40"
                placeholder="e.g., sports, music, health, local issues"
                value={interests}
                onChange={(e) => setInterests(e.target.value)}
              />
            </div>

            <div className="grid gap-1">
              <label className="text-sm font-medium" htmlFor="community">
                Your community/culture (optional)
              </label>
              <input
                id="community"
                type="text"
                className="w-full px-3 py-2 border border-slate-300 bg-white outline-none focus:ring-2 focus:ring-slate-400/40"
                placeholder="e.g., first-gen student, Latinx, local neighborhood"
                value={community}
                onChange={(e) => setCommunity(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <span className="text-sm font-medium">Default reading level</span>
              <div className="space-y-2">
                <label className="inline-flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="defaultReadingLevel"
                    checked={defaultReadingLevel === "simple"}
                    onChange={() => setDefaultReadingLevel("simple")}
                  />
                  Simple (everyday language)
                </label>
                <label className="inline-flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="defaultReadingLevel"
                    checked={defaultReadingLevel === "standard"}
                    onChange={() => setDefaultReadingLevel("standard")}
                  />
                  Standard (more detailed)
                </label>
              </div>
            </div>

            <div className="grid gap-2">
              <span className="text-sm font-medium">Text size</span>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="textSize"
                    checked={textSize === "small"}
                    onChange={() => setTextSize("small")}
                  />
                  Small
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="textSize"
                    checked={textSize === "medium"}
                    onChange={() => setTextSize("medium")}
                  />
                  Medium
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="textSize"
                    checked={textSize === "large"}
                    onChange={() => setTextSize("large")}
                  />
                  Large
                </label>
              </div>
            </div>

            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={microPromptsEnabled}
                onChange={(e) => setMicroPromptsEnabled(e.target.checked)}
              />
              Show helpful suggestions after results
            </label>

            <div>
              <button
                type="submit"
                className="px-3 py-1.5 text-sm border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
              >
                Save preferences
              </button>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
} 