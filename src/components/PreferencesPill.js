"use client";
import { useState } from "react";
import { useSettings } from "@/context/SettingsContext";

const TAG_LABELS = {
  "tone:everyday": "Everyday tone",
  "tone:academic": "Academic tone",
  "depth:short": "Short notes",
  "depth:scaffolded": "Step-by-step",
  "lens:community": "Community focus",
  "lens:sports": "Sports examples",
  "lens:music": "Music examples",
  "aids:vocab": "Key terms",
  "aids:takeaways": "Takeaways",
};

const TAG_EXPLANATIONS = {
  "tone:everyday": "Uses simple, conversational language instead of academic jargon",
  "tone:academic": "Uses more formal, scholarly language and detailed explanations",
  "depth:short": "Provides concise, to-the-point summaries and answers",
  "depth:scaffolded": "Breaks down complex topics into step-by-step explanations",
  "lens:community": "Connects topics to your local community and real-world impact",
  "lens:sports": "Uses sports analogies and examples to explain concepts",
  "lens:music": "Uses music examples and metaphors to make topics relatable",
  "aids:vocab": "Automatically explains important terms and definitions",
  "aids:takeaways": "Highlights the most important points and key insights",
};

const TAG_ICONS = {
  "tone:everyday": "🗣️",
  "tone:academic": "🧪",
  "depth:short": "⭐",
  "depth:scaffolded": "🧩",
  "lens:community": "🎯",
  "lens:sports": "⚽",
  "lens:music": "🎵",
  "aids:vocab": "📚",
  "aids:takeaways": "💡"
};

export default function PreferencesPill() {
  const [isOpen, setIsOpen] = useState(false);
  const { getActivePreferences, setPreference } = useSettings();

  const activePrefs = getActivePreferences();

  if (activePrefs.length === 0) return null;

  const handleToggle = (tag) => {
    setPreference(tag, false); // Turn off the preference
  };

  const handleClearAll = () => {
    activePrefs.forEach(tag => setPreference(tag, false));
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 text-slate-700 text-xs hover:bg-slate-200 transition-colors"
      >
        <span>Prefs:</span>
        <span className="font-medium">
          {activePrefs.slice(0, 2).map(tag => TAG_LABELS[tag] || tag).join(" • ")}
          {activePrefs.length > 2 && "..."}
        </span>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-white shadow-lg border border-slate-200 p-3 z-50">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-900">Active Preferences</h3>
            <div className="flex items-center gap-2">
              <a
                href="/preferences"
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                Manage all
              </a>
              <button
                onClick={handleClearAll}
                className="text-xs text-slate-500 hover:text-slate-700"
              >
                Clear all
              </button>
            </div>
          </div>
          <div className="space-y-3">
            {activePrefs.map(tag => (
              <div key={tag} className="flex items-start justify-between gap-3 p-2 bg-surface">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{TAG_ICONS[tag] || "⚙️"}</span>
                      <span className="text-xs font-medium text-slate-700">
                        {TAG_LABELS[tag] || tag}
                      </span>
                    </div>
                    <button
                      onClick={() => handleToggle(tag)}
                      className="text-xs text-slate-400 hover:text-slate-600 ml-2 px-1 py-0.5 hover:bg-slate-200"
                    >
                      ×
                    </button>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {TAG_EXPLANATIONS[tag] || "This preference helps customize your experience."}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 