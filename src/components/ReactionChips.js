"use client";
import { useSettings } from "@/context/SettingsContext";

const REACTION_CHIPS = [
  { tag: "tone:everyday", icon: "🗣️", label: "Use everyday language", explanation: "Uses simple, conversational language instead of academic jargon" },
  { tag: "tone:academic", icon: "🧪", label: "Go deeper / academic", explanation: "Uses more formal, scholarly language and detailed explanations" },
  { tag: "depth:short", icon: "⭐", label: "That helped", explanation: "Marks this type of explanation as helpful for future reference" },
  { tag: "depth:scaffolded", icon: "🧩", label: "More like this", explanation: "Requests more step-by-step explanations in the future" },
  { tag: "lens:community", icon: "🎯", label: "Connect to my community", explanation: "Connects topics to your local community and real-world impact" },
  { tag: "lens:sports", icon: "⚽", label: "Sports examples", explanation: "Uses sports analogies and examples to explain concepts" },
  { tag: "lens:music", icon: "🎵", label: "Music examples", explanation: "Uses music examples and metaphors to make topics relatable" },
  { tag: "aids:vocab", icon: "📚", label: "Explain key terms", explanation: "Automatically explains important terms and definitions" },
  { tag: "aids:takeaways", icon: "💡", label: "Key takeaways", explanation: "Highlights the most important points and key insights" },
];

export default function ReactionChips({ context, className = "" }) {
  const { addSignal } = useSettings();

  const handleReaction = (tag) => {
    addSignal(tag, context);
  };

  return (
    <div className={`mt-6 ${className}`}>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs text-slate-500">Was this helpful? Tell the AI what you prefer:</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {REACTION_CHIPS.map((chip) => (
          <button
            key={chip.tag}
            onClick={() => handleReaction(chip.tag)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors relative group"
            title={chip.explanation}
          >
            <span>{chip.icon}</span>
            <span className="hidden sm:inline">{chip.label}</span>
            
            {/* Enhanced Tooltip */}
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-white border border-gray-200 text-gray-800 text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10 shadow-lg rounded-lg overflow-hidden">
              <div className="font-medium mb-1">{chip.label}</div>
              <div className="text-gray-600">{chip.explanation}</div>
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-200"></div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
} 