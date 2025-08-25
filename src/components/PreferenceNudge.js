"use client";
import { useState, useEffect } from "react";
import { useSettings } from "@/context/SettingsContext";

const TAG_LABELS = {
  "tone:everyday": "everyday language",
  "tone:academic": "academic language",
  "depth:short": "shorter explanations",
  "depth:scaffolded": "step-by-step explanations",
  "lens:community": "community connections",
  "lens:sports": "sports examples",
  "lens:music": "music examples",
  "aids:vocab": "key term explanations",
  "aids:takeaways": "key takeaways"
};

const TAG_EXPLANATIONS = {
  "tone:everyday": "Uses simple, conversational language instead of academic jargon",
  "tone:academic": "Uses more formal, scholarly language and detailed explanations",
  "depth:short": "Provides brief, concise summaries and explanations",
  "depth:scaffolded": "Breaks down complex topics into step-by-step explanations",
  "lens:community": "Connects topics to your local community and real-world impact",
  "lens:sports": "Uses sports analogies and examples to explain concepts",
  "lens:music": "Uses music examples and analogies to make concepts relatable",
  "aids:vocab": "Explains key terms and vocabulary as they come up",
  "aids:takeaways": "Highlights the most important points and key takeaways"
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

export default function PreferenceNudge({ tag, onApply, onDismiss, isStreaming = false }) {
  // Don't show if streaming is still happening - check before hooks
  if (isStreaming) return null;
  
  const [isVisible, setIsVisible] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);
  const { setPreference, dismissNudge } = useSettings();

  // Start animation when component mounts
  useEffect(() => {
    setIsAnimating(true);
  }, []);

  const handleApply = () => {
    setIsVisible(false);
    setPreference(tag, true);
    onApply(tag);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    dismissNudge(tag);
    onDismiss(tag);
  };

  const label = TAG_LABELS[tag] || tag;
  const explanation = TAG_EXPLANATIONS[tag] || "This preference will help customize your experience.";
  const icon = TAG_ICONS[tag] || "⚙️";

  return !isVisible ? null : (
          <div 
        className={`w-full max-w-4xl mx-auto mt-4 p-4 border-t border-light bg-surface transition-all duration-500 ease-out ${
          isAnimating ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
        }`}
    >
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <span className="text-lg">{icon}</span>
          <p className="text-sm text-slate-700">
            Noticed you prefer <strong>{label}</strong>. Make this your default?
          </p>
        </div>
        <div className="bg-white p-3 mb-4 border border-slate-200">
          <p className="text-xs text-slate-600">
            <span className="font-medium">What this does:</span> {explanation}
          </p>
        </div>
        <div className="flex gap-2 justify-center">
          <button
            onClick={handleApply}
            className="px-3 py-1.5 bg-blue-600 text-white text-sm hover:bg-blue-700 transition-colors"
          >
            Yes, remember this
          </button>
          <button
            onClick={handleDismiss}
            className="px-3 py-1.5 bg-slate-200 text-slate-700 text-sm hover:bg-slate-300 transition-colors"
          >
            Not now
          </button>
        </div>
      </div>
    </div>
  );
} 