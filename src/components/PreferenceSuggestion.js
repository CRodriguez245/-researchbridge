"use client";
import { useState } from "react";
import { useSettings } from "@/context/SettingsContext";

export default function PreferenceSuggestion({ suggestionType, onApply, onDismiss }) {
  const [isVisible, setIsVisible] = useState(true);
  const { settings } = useSettings();

  if (!isVisible) return null;

  const getSuggestionContent = () => {
    switch (suggestionType) {
      case "languageStyle":
        const languagePref = settings.preferences.languageStyle.everyday > settings.preferences.languageStyle.academic ? "everyday" : "academic";
        return {
          title: "Language Style Preference Detected!",
          message: `Looks like you prefer ${languagePref === "everyday" ? "simple, everyday language" : "more academic language"} in your results. Should I always explain things this way?`,
          applyText: `Always use ${languagePref === "everyday" ? "everyday" : "academic"} language`,
          settingKey: "defaultReadingLevel",
          settingValue: languagePref === "everyday" ? "simple" : "standard"
        };
      case "explainTerms":
        const explainPref = settings.preferences.explainTerms.true > settings.preferences.explainTerms.false;
        return {
          title: "Term Explanation Preference Detected!",
          message: `I notice you prefer results that ${explainPref ? "explain key terms" : "skip term explanations"}. Should I always do this?`,
          applyText: `Always ${explainPref ? "explain" : "skip explaining"} key terms`,
          settingKey: "defaultExplainTerms",
          settingValue: explainPref
        };
      case "keepTechnicalTerms":
        const technicalPref = settings.preferences.keepTechnicalTerms.true > settings.preferences.keepTechnicalTerms.false;
        return {
          title: "Technical Terms Preference Detected!",
          message: `You seem to prefer results that ${technicalPref ? "keep important technical terms" : "use simpler alternatives"}. Should I always do this?`,
          applyText: `Always ${technicalPref ? "keep" : "simplify"} technical terms`,
          settingKey: "defaultKeepTechnicalTerms",
          settingValue: technicalPref
        };
      case "outputStyle":
        const outputPref = settings.preferences.outputStyle.bullets > settings.preferences.outputStyle.paragraphs ? "bullets" : "paragraphs";
        return {
          title: "Output Style Preference Detected!",
          message: `You seem to prefer ${outputPref === "bullets" ? "bullet points" : "paragraphs"} in your results. Should I always format things this way?`,
          applyText: `Always use ${outputPref === "bullets" ? "bullet points" : "paragraphs"}`,
          settingKey: "outputStyle",
          settingValue: outputPref
        };
      default:
        return null;
    }
  };

  const content = getSuggestionContent();
  if (!content) return null;

  const handleApply = () => {
    onApply(content.settingKey, content.settingValue);
    setIsVisible(false);
  };

  const handleDismiss = () => {
    onDismiss(suggestionType);
    setIsVisible(false);
  };

  return (
    <div className="fixed bottom-4 right-4 max-w-sm bg-white  shadow-lg border border-slate-200 p-4 z-50 animate-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <div className="w-8 h-8 bg-blue-100  flex items-center justify-center">
            <span className="text-blue-600 text-sm">⭐</span>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-slate-900 mb-1">
            {content.title}
          </h3>
          <p className="text-sm text-slate-600 mb-3">
            {content.message}
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleApply}
              className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium  hover:bg-blue-700 transition"
            >
              {content.applyText}
            </button>
            <button
              onClick={handleDismiss}
              className="px-3 py-1.5 text-slate-600 text-xs hover:text-slate-800 transition"
            >
              Maybe later
            </button>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 text-slate-400 hover:text-slate-600 transition"
        >
          <span className="sr-only">Close</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
} 