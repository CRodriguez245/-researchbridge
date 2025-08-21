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

export default function MicroPrompts({ mode, onPromptAction, onPromptSkip, isVisible, loading = false }) {
  const { settings = {} } = useSettings();
  const [currentPrompt, setCurrentPrompt] = useState(null);
  const [usedPrompts, setUsedPrompts] = useState(new Set());
  const [showResponse, setShowResponse] = useState(false);
  const [responseText, setResponseText] = useState("");
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  const [position, setPosition] = useState({ top: 0 });

  // Reset used prompts when mode changes
  useEffect(() => {
    setUsedPrompts(new Set());
    setShowResponse(false);
    setResponseText("");
    setIsAnimatingOut(false);
  }, [mode]);

  // Track scroll position within the Result section
  useEffect(() => {
    const handleScroll = () => {
      const resultSection = document.querySelector('[data-result-section]');
      if (resultSection) {
        const rect = resultSection.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        
        // Calculate the top position to keep micro-prompt within result section bounds
        const minTop = 16; // Minimum distance from top of result section
        const maxTop = Math.min(rect.height - 120, windowHeight - 200); // Maximum distance from top (leaving space for micro-prompt)
        
        // If result section is visible, position relative to it
        if (rect.top < windowHeight && rect.bottom > 0) {
          const relativeTop = Math.max(rect.top + 16, minTop);
          setPosition({ top: Math.min(relativeTop, maxTop) });
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Call once to set initial position
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
          const randomPrompt = availablePrompts[Math.floor(Math.random() * availablePrompts.length)];
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

  if (!isVisible && !loading) {
    return null;
  }
  if (!currentPrompt && !loading) {
    return null;
  }

  return (
    <div
      className={`fixed z-50 max-w-[280px] transition-all duration-300 ease-in-out ${
        isAnimatingOut ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'
      }`}
      style={{
        top: `${position.top}px`,
        right: '24px'
      }}
    >
      <div className="bg-white  shadow-lg border border-slate-200 p-4">
        {loading ? (
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              <span className="text-sm animate-bounce">.</span>
              <span className="text-sm animate-bounce" style={{ animationDelay: '0.1s' }}>.</span>
              <span className="text-sm animate-bounce" style={{ animationDelay: '0.2s' }}>.</span>
            </div>
            <span className="text-sm text-slate-600">Working on your request...</span>
          </div>
        ) : !showResponse ? (
          <>
            <p className="text-sm text-slate-700 mb-3">
              {currentPrompt.text}
            </p>
            <div className="flex gap-2">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  handleAction();
                }}
                className="px-3 py-1.5 bg-slate-100 text-slate-700 text-xs font-medium hover:bg-slate-200 transition"
              >
                {currentPrompt.action}
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  handleSkip();
                }}
                className="px-3 py-1.5  border border-slate-300 bg-white text-slate-600 text-xs hover:bg-slate-50 transition"
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