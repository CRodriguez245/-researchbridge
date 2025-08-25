"use client";

import { useState, useEffect, useRef } from "react";
import { useSettings } from "@/context/SettingsContext";

const PROMPT_LIBRARY = {
  summarize: [
    {
      id: "summarize-shorter",
      text: "Want this shorter and more to the point?",
      action: "Make it shorter",
      skip: "No thanks",
      response: "Making it more concise..."
    },
    {
      id: "summarize-connect",
      text: "Want me to connect this to your interests?",
      action: "Connect it",
      skip: "No thanks",
      response: "Connecting to your interests..."
    },
    {
      id: "summarize-example",
      text: "Need a real-world example to understand this better?",
      action: "Add example",
      skip: "No thanks",
      response: "Adding a real-world example..."
    }
  ],
  ask: [
    {
      id: "ask-example",
      text: "Want me to give you a concrete example?",
      action: "Show example",
      skip: "No thanks",
      response: "Finding a good example..."
    },
    {
      id: "ask-simplify",
      text: "Need me to break this down into simpler terms?",
      action: "Simplify",
      skip: "No thanks",
      response: "Simplifying the explanation..."
    },
    {
      id: "ask-connect",
      text: "Want me to connect this to your community?",
      action: "Connect it",
      skip: "No thanks",
      response: "Connecting to your community..."
    }
  ],
  outline: [
    {
      id: "outline-questions",
      text: "Want me to turn this into study questions?",
      action: "Make questions",
      skip: "No thanks",
      response: "Creating study questions..."
    },
    {
      id: "outline-steps",
      text: "Need this broken down into step-by-step actions?",
      action: "Break it down",
      skip: "No thanks",
      response: "Breaking it into steps..."
    },
    {
      id: "outline-connect",
      text: "Want me to connect this to your interests?",
      action: "Connect it",
      skip: "No thanks",
      response: "Connecting to your interests..."
    }
  ],
  citations: [
    {
      id: "citations-verify",
      text: "Want me to suggest ways to verify these sources?",
      action: "Verify sources",
      skip: "No thanks",
      response: "Finding verification methods..."
    },
    {
      id: "citations-simplify",
      text: "Need help understanding how to use these citations?",
      action: "Explain usage",
      skip: "No thanks",
      response: "Explaining citation usage..."
    },
    {
      id: "citations-format",
      text: "Want these in a different format?",
      action: "Change format",
      skip: "No thanks",
      response: "Changing citation format..."
    }
  ]
};

export default function MicroPrompts({ mode, onPromptAction, onPromptSkip, isVisible, loading = false, onClose }) {
  const { settings = {} } = useSettings();
  const [currentPrompt, setCurrentPrompt] = useState(null);
  const [usedPrompts, setUsedPrompts] = useState(new Set());
  const [showResponse, setShowResponse] = useState(false);
  const [responseText, setResponseText] = useState("");
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  

  // Reset used prompts when mode changes
  useEffect(() => {
    setUsedPrompts(new Set());
    setShowResponse(false);
    setResponseText("");
    setIsAnimatingOut(false);
  }, [mode]);

      useEffect(() => {
    
    if (isVisible && mode && PROMPT_LIBRARY[mode.toLowerCase()]) {
      const prompts = PROMPT_LIBRARY[mode.toLowerCase()];
      if (prompts.length > 0) {
        const availablePrompts = prompts.filter(p => !usedPrompts.has(p.id));

        if (availablePrompts.length === 0) {
          setUsedPrompts(new Set());
          const randomPrompt = prompts[Math.floor(Math.random() * prompts.length)];
          setCurrentPrompt(randomPrompt);
        } else {
          const randomPrompt = availablePrompts[Math.floor(Math.random() * prompts.length)];
          setCurrentPrompt(randomPrompt);
        }
      }
    } else {
      setCurrentPrompt(null);
      setShowResponse(false);
      setResponseText("");
      setIsAnimatingOut(false);
    }
  }, [isVisible, mode, usedPrompts]);

  const handleAction = () => {
    if (currentPrompt) {
      setResponseText(currentPrompt.response);
      setShowResponse(true);

      setTimeout(() => {
        setIsAnimatingOut(true);
        setTimeout(() => {
          onPromptAction?.(currentPrompt.id, currentPrompt.action);
          setUsedPrompts(prev => new Set([...prev, currentPrompt.id]));
          setCurrentPrompt(null);
          setShowResponse(false);
          setResponseText("");
          setIsAnimatingOut(false);
        }, 300);
      }, 2000);
    }
  };

  const handleSkip = () => {
    if (currentPrompt) {
      onPromptSkip?.(currentPrompt.id);
      setUsedPrompts(prev => new Set([...prev, currentPrompt.id]));
    }
    setCurrentPrompt(null);
    setShowResponse(false);
    setResponseText("");
    setIsAnimatingOut(false);
  };

  // Always render, but conditionally show content
  return (!isVisible && !loading) ? null : (
    <div
      className={`w-full transition-all duration-500 ease-out ${
        isAnimatingOut ? 'translate-x-full opacity-0 scale-95' : 'translate-x-0 opacity-100 scale-100'
      }`}
    >
      <div className="bg-gradient-to-r from-slate-50/50 to-blue-50/30 border border-slate-200/60 px-4 pt-4 rounded-lg overflow-hidden animate-in slide-in-from-left-2 duration-300">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <span className="text-xs font-medium text-slate-600 uppercase tracking-wide">Quick Actions</span>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 transition-colors"
              title="Close"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        {loading ? (
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              <span className="text-sm animate-bounce">.</span>
              <span className="text-sm animate-bounce" style={{ animationDelay: '0.1s' }}>.</span>
              <span className="text-sm animate-bounce" style={{ animationDelay: '0.2s' }}>.</span>
            </div>
            <span className="text-sm text-slate-600">Working on your request...</span>
          </div>
        ) : !currentPrompt ? (
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              <span className="text-sm animate-bounce">.</span>
              <span className="text-sm animate-bounce" style={{ animationDelay: '0.1s' }}>.</span>
              <span className="text-sm animate-bounce" style={{ animationDelay: '0.2s' }}>.</span>
            </div>
            <span className="text-sm text-slate-600">Loading prompt...</span>
          </div>
        ) : !showResponse ? (
          <>
            <p className="text-sm text-slate-700 mb-3 font-medium">
              {currentPrompt.text}
            </p>
            <div className="flex gap-2 pb-4">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  handleAction();
                }}
                className="px-3 py-1.5 bg-slate-100 text-slate-700 text-xs font-medium hover:bg-slate-200 transition-colors duration-200 rounded-lg"
              >
                {currentPrompt.action}
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  handleSkip();
                }}
                className="px-3 py-1.5 border border-slate-300 bg-white/80 text-slate-600 text-xs hover:bg-slate-50 transition-colors duration-200 rounded-lg"
              >
                {currentPrompt.skip}
              </button>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              <span className="text-sm animate-bounce">.</span>
              <span className="text-sm animate-bounce" style={{ animationDelay: '0.1s' }}>.</span>
              <span className="text-sm animate-bounce" style={{ animationDelay: '0.2s' }}>.</span>
            </div>
            <span className="text-sm text-slate-600">{responseText}</span>
          </div>
        )}
      </div>
    </div>
  );
} 