"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSettings } from "@/context/SettingsContext";
import { useSession } from "next-auth/react";
import AuthHeader from "@/components/AuthHeader";
import MicroPrompts from "@/components/MicroPrompts";
import TypingAnimation from "@/components/TypingAnimation";
import ReactionChips from "@/components/ReactionChips";
import PreferenceNudge from "@/components/PreferenceNudge";
import PreferencesPill from "@/components/PreferencesPill";
import ConfidenceRating from "@/components/ConfidenceRating";
import SaveQuery from "@/components/SaveQuery";
import QueryLibraryPanel from "@/components/QueryLibraryPanel";


const MODES = ["Summarize", "Ask", "Outline", "Citations"];

export default function Home() {
  const router = useRouter();
  const { settings, shouldShowNudge, isLoading } = useSettings();
  const { data: session, status } = useSession();
  const [mode, setMode] = useState("Summarize");
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");
  const [activeInputTab, setActiveInputTab] = useState("url"); // "url", "text"
  const [languageStyle, setLanguageStyle] = useState("everyday");
  const [explainTerms, setExplainTerms] = useState(true);
  const [keepTechnicalTerms, setKeepTechnicalTerms] = useState(false);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState({
    Summarize: "",
    Ask: "",
    Outline: "",
    Citations: ""
  });
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showMicroPrompt, setShowMicroPrompt] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [microPromptLoading, setMicroPromptLoading] = useState(false);
  const [showNudge, setShowNudge] = useState(null);
  const [showHelp, setShowHelp] = useState(false);
  const [typingComplete, setTypingComplete] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showQueryLibrary, setShowQueryLibrary] = useState(false);
  const utteranceRef = useRef(null);



  // Helper function to get current result for the active mode
  const currentResult = results[mode];

  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      setVoiceEnabled(true);
    }
  }, []);

  useEffect(() => {
    const def = settings.defaultReadingLevel;
    if (def === "standard") setLanguageStyle("academic");
    else setLanguageStyle("everyday");
    
    console.log('Main page useEffect - settings:', {
      isLoading,
      hasOnboarded: settings.hasOnboarded,
      status,
      settings
    });
    
    // Only redirect to onboarding if:
    // 1. Settings are loaded
    // 2. User is authenticated (not unauthenticated)
    // 3. User hasn't onboarded
    // 4. Session is not loading
    if (!isLoading && status === "authenticated" && !settings.hasOnboarded && status !== "loading") {
      console.log('Redirecting to onboarding...');
      // Only redirect authenticated users who haven't onboarded
      router.push("/onboarding");
    }
  }, [settings?.defaultReadingLevel, settings?.hasOnboarded, router, isLoading, status]);

  useEffect(() => {
    return () => {
      if (utteranceRef.current) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);



  const canSubmit = useMemo(() => {
    let hasContent = false;
    
    if (activeInputTab === "url") {
      hasContent = !!url;
    } else if (activeInputTab === "text") {
      hasContent = !!text;
    }
    
    const result = mode === "Ask" ? !!question && hasContent : hasContent;
    return result;
  }, [mode, question, url, text, activeInputTab]);



  const handleSaveQuery = (savedQuery) => {
    // Show success message or update UI as needed
    console.log('Query saved:', savedQuery);
  };

  const handleLoadQuery = (savedQuery) => {
    setMode(savedQuery.mode);
    if (savedQuery.url) setUrl(savedQuery.url);
    if (savedQuery.query) {
      if (savedQuery.mode === "Ask") {
        setQuestion(savedQuery.query);
      } else {
        setText(savedQuery.query);
      }
    }
  };

  // Helper function to format text with enhanced typography (optimized)
  const formatText = (text) => {
    if (!text) return "";
    
    // First, handle inline formatting (bold, italic, code, links) on the entire text
    let formattedText = text
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-slate-900">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="italic text-slate-700">$1</em>')
      .replace(/`(.*?)`/g, '<code class="bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded text-sm font-mono">$1</code>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-600 hover:text-blue-800 underline" target="_blank" rel="noopener noreferrer">$1</a>');
    
    // Then handle block-level formatting
    const lines = formattedText.split('\n');
    const formattedLines = [];
    let inList = false;
    let listItems = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Headers
      if (line.match(/^### /)) {
        formattedLines.push(line.replace(/^### (.*)/, '<h3 class="text-lg font-semibold text-slate-900 mt-4 mb-2">$1</h3>'));
        continue;
      }
      if (line.match(/^## /)) {
        formattedLines.push(line.replace(/^## (.*)/, '<h2 class="text-xl font-bold text-slate-900 mt-6 mb-3">$1</h2>'));
        continue;
      }
      if (line.match(/^# /)) {
        formattedLines.push(line.replace(/^# (.*)/, '<h1 class="text-2xl font-bold text-slate-900 mt-6 mb-4">$1</h1>'));
        continue;
      }
      
      // Lists
      if (line.match(/^\s*[-*+]\s/)) {
        if (!inList) {
          inList = true;
          listItems = [];
        }
        listItems.push(line.replace(/^\s*[-*+]\s*(.*)/, '<li class="ml-4 mb-1">$1</li>'));
        continue;
      }
      
      // Numbered lists
      if (line.match(/^\s*\d+\.\s/)) {
        if (!inList) {
          inList = true;
          listItems = [];
        }
        listItems.push(line.replace(/^\s*\d+\.\s*(.*)/, '<li class="ml-4 mb-1">$1</li>'));
        continue;
      }
      
      // End list if we were in one
      if (inList && line.trim() === '') {
        if (listItems.length > 0) {
          const listType = listItems[0].includes('list-disc') ? 'ul' : 'ol';
          const listClass = listType === 'ul' ? 'list-disc' : 'list-decimal';
          formattedLines.push(`<${listType} class="${listClass} list-inside space-y-1 my-3">${listItems.join('')}</${listType}>`);
        }
        inList = false;
        listItems = [];
        formattedLines.push('');
        continue;
      }
      
      // Blockquotes
      if (line.match(/^>\s/)) {
        formattedLines.push(line.replace(/^>\s*(.*)/, '<blockquote class="border-l-4 border-slate-300 pl-4 my-3 italic text-slate-700">$1</blockquote>'));
        continue;
      }
      
      // Regular text - just add it as is (inline formatting already done)
      formattedLines.push(line);
    }
    
    // Handle any remaining list
    if (inList && listItems.length > 0) {
      const listType = listItems[0].includes('list-disc') ? 'ul' : 'ol';
      const listClass = listType === 'ul' ? 'list-disc' : 'list-decimal';
      formattedLines.push(`<${listType} class="${listClass} list-inside space-y-1 my-3">${listItems.join('')}</${listType}>`);
    }
    
    // Handle code blocks and paragraphs
    let result = formattedLines.join('\n')
      .replace(/```([\s\S]*?)```/g, '<pre class="bg-slate-50 border border-slate-200 rounded-lg p-4 my-4 overflow-x-auto"><code class="text-sm font-mono text-slate-800">$1</code></pre>')
      .replace(/\n\n/g, '</p><p class="mb-3 leading-relaxed">')
      .trim();
    
    // Wrap in paragraph tags if not already wrapped
    if (!result.startsWith('<')) {
      result = '<p class="mb-3 leading-relaxed">' + result + '</p>';
    }
    
    return result;
  };

  // Check for nudges to show - only after a result is generated
  const checkForNudges = () => {
    const nudgesToCheck = [
      "tone:everyday", "tone:academic", "depth:short", "depth:scaffolded",
      "lens:community", "lens:sports", "lens:music", "aids:vocab", "aids:takeaways"
    ];
    
    for (const tag of nudgesToCheck) {
      if (shouldShowNudge(tag)) {
        setShowNudge(tag);
        break;
      }
    }
  };

  // Handle nudge apply
  const handleNudgeApply = (tag) => {
    setShowNudge(null);
  };

  // Handle nudge dismiss
  const handleNudgeDismiss = (tag) => {
    setShowNudge(null);
  };

  async function handleSubmit(e) {
    if (e) e.preventDefault();
    if (!canSubmit || loading) return;
    setLoading(true);
    setTypingComplete(false);

    try {
      const payload = {
        url: url || undefined,
        text: text || undefined,
        language: settings.language,
        interests: settings.interests,
        community: settings.community,
        outputStyle: settings.outputStyle,
        languageStyle,
        explainTerms,
        keepTechnicalTerms,
      };
      let endpoint = "/api/summarize";
      if (mode === "Ask") endpoint = "/api/qa";
      if (mode === "Outline") endpoint = "/api/outline";
      if (mode === "Citations") endpoint = "/api/citations";
      if (mode === "Ask") payload.question = question;

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Request failed");

      const out =
        mode === "Summarize"
          ? data.summary
          : mode === "Ask"
          ? data.answer
          : mode === "Outline"
          ? data.outline
          : data.formatted || data.suggestions || JSON.stringify(data, null, 2);

      const formattedResult = formatText(out || "");
      setResults(prev => ({
        ...prev,
        [mode]: formattedResult
      }));
      // Show micro-prompt after successful result - will be triggered by typingComplete
      // Reset typingComplete to false so we can detect when the new typing animation completes
      setTypingComplete(false);
      // Hide any existing MicroPrompts when a new result starts
      setShowMicroPrompt(false);
      // Check for nudges after successful result
      checkForNudges();
    } catch (err) {
      setResults(prev => ({
        ...prev,
        [mode]: formatText(String(err?.message || err) || "Something went wrong.")
      }));
    } finally {
      setLoading(false);
    }
  }

  function handleSpeakToggle() {
    if (!voiceEnabled || !currentResult) return;
    
    if (isSpeaking) {
      // Stop speaking
      if (utteranceRef.current) {
        window.speechSynthesis.cancel();
        utteranceRef.current = null;
      }
      setIsSpeaking(false);
    } else {
      // Start speaking
      if (utteranceRef.current) {
        window.speechSynthesis.cancel();
        utteranceRef.current = null;
      }
      const u = new SpeechSynthesisUtterance(currentResult);
      u.rate = 0.95;
      u.pitch = 1;
      u.onend = () => setIsSpeaking(false);
      u.onerror = () => setIsSpeaking(false);
      utteranceRef.current = u;
      window.speechSynthesis.speak(u);
      setIsSpeaking(true);
    }
  }

  // Helper function to show micro-prompts after control updates
  function showMicroPromptAfterUpdate() {
    if (settings.microPromptsEnabled) {
      // Reset typingComplete to false so we can detect when the new typing animation completes
      setTypingComplete(false);
      // Hide any existing MicroPrompts when a new result starts
      setShowMicroPrompt(false);
    }
  }

  // Show MicroPrompts when typing animation completes
  useEffect(() => {
    if (typingComplete && settings.microPromptsEnabled && currentResult) {
      // Small delay to let the user see the complete result first
      setTimeout(() => {
        setShowMicroPrompt(true);
      }, 500); // 0.5 second delay after typing completes
    }
  }, [typingComplete, settings.microPromptsEnabled, currentResult]);

  // Show loading state while settings or session are being loaded
  if (isLoading || status === "loading") {
    return (
      <div className="min-h-screen bg-background text-foreground font-sans flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin  h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 text-foreground font-sans relative">
      <AuthHeader />
      
      <header className="w-full border-b border-slate-200/60 bg-white/80 backdrop-blur-sm shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-900 via-blue-800 to-indigo-900 bg-clip-text text-transparent">
              ResearchBridge
            </h1>
            <p className="text-sm text-slate-600 mt-1 font-medium">Understand research with confidence. Built for students, with students.</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
        <section className="border border-slate-200/60 bg-white/90 backdrop-blur-sm shadow-lg rounded-lg overflow-hidden">
          <div className="flex items-center justify-between gap-3 px-3 sm:px-4 py-3 border-b border-slate-200/60 bg-gradient-to-r from-slate-50 to-blue-50/30">
            <div>
              <h2 className="text-sm font-semibold tracking-tight text-slate-900">Mode</h2>
              <p className="text-xs text-slate-600">Choose what you want to do.</p>
            </div>
          </div>
          <div className="p-3 sm:p-4">
            <nav aria-label="Modes" className="w-full">
              <div className="flex items-center gap-3">
                <div className="inline-flex bg-gradient-to-r from-slate-100 to-blue-100/50 p-1 shadow-inner rounded-lg border border-slate-200/50">
                  {MODES.map((m, idx) => (
                    <button
                      key={m}
                      onClick={() => {
                        setMode(m);
                        setShowMicroPrompt(false);
                      }}
                      className={`px-3.5 py-2 text-sm font-medium transition-all duration-200 ${
                        mode === m
                          ? "bg-white shadow-md text-slate-900 rounded-md border border-slate-200/60"
                          : "text-slate-700 hover:text-slate-900 hover:bg-white/50"
                      } ${idx !== 0 ? "ml-0.5" : ""}`}
                      aria-pressed={mode === m}
                    >
                      {m}
                    </button>
                  ))}
                </div>
                <PreferencesPill />
              </div>
            </nav>
          </div>
        </section>

        <form onSubmit={handleSubmit} className="grid gap-6 mt-6" aria-describedby="helper">
          <section className="border border-slate-200/60 bg-white/90 backdrop-blur-sm shadow-lg rounded-lg overflow-hidden">
            <div className="flex items-center gap-2 px-3 sm:px-4 py-3 border-b border-slate-200/60 bg-gradient-to-r from-slate-50 to-blue-50/30">
              <div>
                <h2 className="text-sm font-semibold tracking-tight text-slate-900">Source</h2>
                <p className="text-xs text-slate-600">Choose how to input your content for analysis.</p>
              </div>
            </div>
            <div className="p-3 sm:p-4">
              {/* Input Method Tabs */}
              <div className="flex border-b border-slate-200/60 mb-6">
                <button
                  type="button"
                  onClick={() => setActiveInputTab("url")}
                  className={`relative px-4 py-2.5 text-sm font-medium transition-all duration-200 ease-out ${
                    activeInputTab === "url"
                      ? "text-blue-600"
                      : "text-slate-500 hover:text-slate-700 hover:bg-slate-50/50"
                  }`}
                >
                  <span className="relative z-10">URL</span>
                  {activeInputTab === "url" && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full animate-in slide-in-from-left-2 duration-300 ease-out"></div>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveInputTab("text")}
                  className={`relative px-4 py-2.5 text-sm font-medium transition-all duration-200 ease-out ${
                    activeInputTab === "text"
                      ? "text-blue-600"
                      : "text-slate-500 hover:text-slate-700 hover:bg-slate-50/50"
                  }`}
                >
                  <span className="relative z-10">Paste Text</span>
                  {activeInputTab === "text" && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full animate-in slide-in-from-left-2 duration-300 ease-out"></div>
                  )}
                </button>
              </div>

              {/* Tab Content Container */}
              <div className="relative min-h-[200px]">
                {/* URL Input Tab */}
                <div className={`transition-all duration-300 ease-in-out ${
                  activeInputTab === "url" 
                    ? "opacity-100 translate-y-0" 
                    : "opacity-0 translate-y-2 absolute inset-0 pointer-events-none"
                }`}>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="url" className="block text-xs font-medium text-slate-700 mb-2">Article URL</label>
                      <input
                        id="url"
                        type="url"
                        placeholder="https://example.com/article"
                        className="w-full px-3 py-2.5 border border-slate-300 bg-white/80 outline-none focus:ring-2 focus:ring-blue-400/40 focus:border-blue-400 rounded-lg transition-all duration-200 hover:border-slate-400 placeholder:text-slate-400"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                      />
                    </div>
                    <p className="text-xs text-slate-500 flex items-center gap-1.5">
                      <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      Paste any article URL and we'll fetch the content
                    </p>
                  </div>
                </div>

                {/* Text Input Tab */}
                <div className={`transition-all duration-300 ease-in-out ${
                  activeInputTab === "text" 
                    ? "opacity-100 translate-y-0" 
                    : "opacity-0 translate-y-2 absolute inset-0 pointer-events-none"
                }`}>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="text" className="block text-xs font-medium text-slate-700 mb-2">Paste Content</label>
                      <textarea
                        id="text"
                        rows={6}
                        placeholder="Paste any text content here…"
                        className="w-full px-3 py-2.5 border border-slate-300 bg-white/80 outline-none focus:ring-2 focus:ring-blue-400/40 focus:border-blue-400 leading-relaxed rounded-lg transition-all duration-200 hover:border-slate-400 placeholder:text-slate-400 resize-none"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                      />
                    </div>
                    <p className="text-xs text-slate-500 flex items-center gap-1.5">
                      <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      Paste any text content directly for analysis
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between pt-4 border-t border-slate-200/60">
                <p id="helper" className="text-xs text-slate-600">Choose one input method above. For questions, type your question below.</p>
                {mode !== "Ask" && (
                  <button
                    type="submit"
                    disabled={!canSubmit || loading}
                    className="px-4 py-2 bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700 font-medium rounded-lg hover:from-slate-200 hover:to-slate-300 focus:ring-2 focus:ring-slate-400/40 transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <span>{mode}</span>
                        <div className="flex gap-1">
                          <span className="animate-bounce">.</span>
                          <span className="animate-bounce" style={{ animationDelay: '0.1s' }}>.</span>
                          <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>.</span>
                        </div>
                      </div>
                    ) : (
                      <span>{mode}</span>
                    )}
                  </button>
                )}
              </div>
            </div>
          </section>

          {mode === "Ask" && (
            <section className="border border-slate-200/60 bg-white/90 backdrop-blur-sm shadow-lg rounded-lg overflow-hidden">
              <div className="flex items-center gap-2 px-3 sm:px-4 py-3 border-b border-slate-200/60 bg-gradient-to-r from-slate-50 to-blue-50/30">
                <div>
                  <h2 className="text-sm font-semibold tracking-tight text-slate-900">Your question</h2>
                  <p className="text-xs text-slate-600">Ask clearly. Start with what you want to know.</p>
                </div>
              </div>
              <div className="p-3 sm:p-4">
                <div className="grid gap-2">
                  <label htmlFor="question" className="text-xs font-medium">Your question</label>
                  <div className="flex gap-2">
                    <input
                      id="question"
                      type="text"
                      placeholder="What does the study conclude about…?"
                      className="flex-1 px-3 py-2 border border-slate-300 bg-white/80 outline-none focus:ring-2 focus:ring-blue-400/40 focus:border-blue-400 rounded-lg transition-all duration-200 hover:border-slate-400"
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                    />
                    <button
                      type="submit"
                      disabled={!canSubmit || loading}
                      className="px-4 py-2 bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700 font-medium rounded-lg hover:from-slate-200 hover:to-slate-300 focus:ring-2 focus:ring-slate-400/40 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <div className="flex items-center gap-2">
                          <span>Ask</span>
                          <div className="flex gap-1">
                            <span className="animate-bounce">.</span>
                            <span className="animate-bounce" style={{ animationDelay: '0.1s' }}>.</span>
                            <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>.</span>
                          </div>
                        </div>
                      ) : (
                        <span>Ask</span>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </section>
          )}

          <section aria-live="polite" className="border border-slate-200/60 bg-white/90 backdrop-blur-sm shadow-lg rounded-lg overflow-hidden" data-result-section>
            
            <div className="flex flex-wrap items-center justify-between gap-3 px-3 sm:px-4 py-3 border-b border-slate-200/60 bg-gradient-to-r from-slate-50 to-blue-50/30">
              <div className="flex flex-wrap items-center gap-6">
                <h2 className="text-sm font-semibold tracking-tight text-slate-900">Result</h2>
                {currentResult && (
                  <div className="flex items-center gap-2 text-sm">
                    {voiceEnabled && (
                      <button 
                        type="button" 
                        onClick={handleSpeakToggle} 
                        className="px-3 py-1.5 border border-slate-300 bg-white/80 text-xs hover:bg-slate-50 transition-all duration-200 rounded-lg shadow-sm hover:shadow-md flex items-center gap-1"
                      >
                        Read aloud
                        {isSpeaking ? (
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                          </svg>
                        ) : (
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        )}
                      </button>
                    )}
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-medium">Language</span>
                  <div className="inline-flex bg-gradient-to-r from-slate-100 to-blue-100/50 p-0.5 shadow-inner rounded-md border border-slate-200/50">
                    <button
                      type="button"
                      onClick={async () => {
                        setLanguageStyle("everyday");
                        if (currentResult) {
                          setUpdating(true);
                          try {
                            const res = await fetch("/api/summarize", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                url: url || undefined,
                                text: text || undefined,
                                language: settings.language,
                                interests: settings.interests,
                                community: settings.community,
                                outputStyle: settings.outputStyle,
                                languageStyle: "everyday",
                                explainTerms,
                                keepTechnicalTerms,
                              }),
                            });
                            const data = await res.json();
                            if (!res.ok) throw new Error(data?.error || "Request failed");
                            setResults(prev => ({
                              ...prev,
                              [mode]: formatText(data.summary || "")
                            }));
                            showMicroPromptAfterUpdate();
                          } catch (err) {
                            setResults(prev => ({
                              ...prev,
                              [mode]: formatText(String(err?.message || err) || "Something went wrong.")
                            }));
                          } finally {
                            setUpdating(false);
                          }
                        }
                      }}
                      className={`px-2 py-1 text-xs font-medium transition-all duration-200 ${languageStyle === "everyday" ? "bg-white shadow-sm text-slate-900 rounded border border-slate-200/60" : "text-slate-700 hover:text-slate-900 hover:bg-white/50"} ${updating ? "opacity-50" : ""}`}
                      aria-pressed={languageStyle === "everyday"}
                      disabled={updating}
                    >
                      Everyday
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        setLanguageStyle("academic");
                        if (currentResult) {
                          setUpdating(true);
                          try {
                            const res = await fetch("/api/summarize", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                url: url || undefined,
                                text: text || undefined,
                                language: settings.language,
                                interests: settings.interests,
                                community: settings.community,
                                outputStyle: settings.outputStyle,
                                languageStyle: "academic",
                                explainTerms,
                                keepTechnicalTerms,
                              }),
                            });
                            const data = await res.json();
                            if (!res.ok) throw new Error(data?.error || "Request failed");
                            setResults(prev => ({
                              ...prev,
                              [mode]: formatText(data.summary || "")
                            }));
                            showMicroPromptAfterUpdate();
                          } catch (err) {
                            setResults(prev => ({
                              ...prev,
                              [mode]: formatText(String(err?.message || err) || "Something went wrong.")
                            }));
                          } finally {
                            setUpdating(false);
                          }
                        }
                      }}
                      className={`px-2 py-1 text-xs font-medium transition-all duration-200 ${languageStyle === "academic" ? "bg-white shadow-sm text-slate-900 rounded border border-slate-200/60" : "text-slate-700 hover:text-slate-900 hover:bg-white/50"} ${updating ? "opacity-50" : ""}`}
                      aria-pressed={languageStyle === "academic"}
                      disabled={updating}
                    >
                      Academic
                    </button>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="inline-flex items-center gap-2 text-xs">
                    <input 
                      type="checkbox" 
                      checked={explainTerms} 
                      disabled={updating}
                      onChange={async (e) => {
                        setExplainTerms(e.target.checked);
                        if (currentResult) {
                          setUpdating(true);
                          try {
                            const res = await fetch("/api/summarize", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                url: url || undefined,
                                text: text || undefined,
                                language: settings.language,
                                interests: settings.interests,
                                community: settings.community,
                                outputStyle: settings.outputStyle,
                                languageStyle,
                                explainTerms: e.target.checked,
                                keepTechnicalTerms,
                              }),
                            });
                            const data = await res.json();
                            if (!res.ok) throw new Error(data?.error || "Request failed");
                            setResults(prev => ({
                              ...prev,
                              [mode]: formatText(data.summary || "")
                            }));
                            showMicroPromptAfterUpdate();
                          } catch (err) {
                            setResults(prev => ({
                              ...prev,
                              [mode]: formatText(String(err?.message || err) || "Something went wrong.")
                            }));
                          } finally {
                            setUpdating(false);
                          }
                        }
                      }} 
                    />
                    Explain key terms
                  </label>
                  <label className="inline-flex items-center gap-2 text-xs">
                    <input 
                      type="checkbox" 
                      checked={keepTechnicalTerms} 
                      disabled={updating}
                      onChange={async (e) => {
                        setKeepTechnicalTerms(e.target.checked);
                        if (currentResult) {
                          setUpdating(true);
                          try {
                            const res = await fetch("/api/summarize", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                url: url || undefined,
                                text: text || undefined,
                                language: settings.language,
                                interests: settings.interests,
                                community: settings.community,
                                outputStyle: settings.outputStyle,
                                languageStyle,
                                explainTerms,
                                keepTechnicalTerms: e.target.checked,
                              }),
                            });
                            const data = await res.json();
                            if (!res.ok) throw new Error(data?.error || "Request failed");
                            setResults(prev => ({
                              ...prev,
                              [mode]: formatText(data.summary || "")
                            }));
                            showMicroPromptAfterUpdate();
                          } catch (err) {
                            setResults(prev => ({
                              ...prev,
                              [mode]: formatText(String(err?.message || err) || "Something went wrong.")
                            }));
                          } finally {
                            setUpdating(false);
                          }
                        }
                      }} 
                    />
                    Keep important technical terms
                  </label>
                </div>
              </div>
              
              {/* Save Query and Query Library buttons - stacked on the right */}
              {currentResult && (
                <div className="flex flex-col gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      if (showQueryLibrary) {
                        setShowQueryLibrary(false);
                        // Small delay to allow the Query Library to animate out
                        setTimeout(() => setShowSaveModal(true), 300);
                      } else {
                        setShowSaveModal(true);
                      }
                    }}
                    className="text-slate-600 hover:text-slate-800 p-1 rounded-lg hover:bg-slate-100 transition-colors duration-200"
                    title="Save Query"
                  >
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (showSaveModal) {
                        setShowSaveModal(false);
                        // Small delay to allow the Save Query panel to animate out
                        setTimeout(() => setShowQueryLibrary(true), 300);
                      } else {
                        setShowQueryLibrary(true);
                      }
                    }}
                    className="text-slate-600 hover:text-slate-800 p-1 rounded-lg hover:bg-slate-100 transition-colors duration-200"
                    title="Query Library"
                  >
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </button>

                </div>
              )}

            </div>
            <div className="p-4 sm:p-5 leading-relaxed bg-gradient-to-br from-white to-slate-50/30">
              {updating && (
                <div className="flex items-center justify-center py-8">
                  <div className="flex items-center gap-2 text-slate-600">
                    <span className="text-sm">Updating</span>
                    <div className="flex gap-1">
                      <span className="text-sm animate-bounce">.</span>
                      <span className="text-sm animate-bounce" style={{ animationDelay: '0.1s' }}>.</span>
                      <span className="text-sm animate-bounce" style={{ animationDelay: '0.2s' }}>.</span>
                    </div>
                  </div>
                </div>
              )}
              {!updating && currentResult && (
                <>
                  <div className="result-content">
                    <TypingAnimation 
                      text={currentResult} 
                      speed={10}
                      className="whitespace-pre-wrap"
                      onComplete={() => setTypingComplete(true)}
                    />
                  </div>
                  {typingComplete && <ReactionChips context={mode} />}
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          console.log('How it works clicked, current showHelp:', showHelp);
                          setShowHelp(!showHelp);
                        }}
                        className="text-sm text-slate-600 hover:text-slate-800 flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-slate-100 transition-colors duration-200"
                      >
                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>How it works</span>
                      </button>
                    </div>

                  </div>
                  
                  {/* Help Section */}
                  <div className={`mt-4 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 border border-blue-200/60 rounded-lg shadow-sm overflow-hidden transition-all duration-300 ease-in-out ${
                    showHelp ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                  }`}>
                    <div className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-sm font-semibold text-slate-900 mb-2 flex items-center">
                            <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            How the AI learns your preferences
                          </h3>
                          <div className="text-xs text-slate-700 space-y-2">
                            <p>• <strong>Reaction chips</strong> below results let you give quick feedback on what works for you</p>
                            <p>• <strong>Preference nudges</strong> appear when the AI notices patterns in your reactions</p>
                            <p>• <strong>Active preferences</strong> (shown in the pill) become your default settings</p>
                            <p>• <strong>Hover over any chip</strong> to see what each preference does</p>
                          </div>
                        </div>
                        <button
                          onClick={() => setShowHelp(false)}
                          className="text-slate-600 hover:text-slate-800 ml-4 text-lg font-bold hover:bg-slate-100 rounded-full w-6 h-6 flex items-center justify-center transition-colors"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-slate-200/60 bg-gradient-to-r from-slate-50/50 to-blue-50/30 rounded-lg p-3">
                    <ConfidenceRating context={mode} />
                  </div>
                </>
              )}
              {!updating && !currentResult && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="text-slate-600 text-sm font-medium">Results will appear here</p>
                  <p className="text-slate-500 text-xs mt-1">Choose a mode, add a URL or text, and submit</p>
                </div>
              )}
            </div>
            
            {/* Preference Nudges */}
            {showNudge && (
              <PreferenceNudge
                tag={showNudge}
                onApply={handleNudgeApply}
                onDismiss={handleNudgeDismiss}
                isStreaming={loading || updating || microPromptLoading}
              />
            )}

          </section>
        </form>
      </main>

              {/* Micro Prompts Sidebar - Outside main content, to the left */}
        <div 
          className={`absolute left-3 top-[1000px] w-72 z-50 bg-white/90 backdrop-blur-sm shadow-lg border border-slate-200/60 rounded-lg transform transition-all duration-500 ease-out ${
            showMicroPrompt 
              ? 'translate-x-0 opacity-100' 
              : '-translate-x-full opacity-0'
          }`}
        >
          <MicroPrompts
            mode={mode}
            isVisible={true}
            loading={microPromptLoading}
            onClose={() => setShowMicroPrompt(false)}
            onPromptAction={async (promptId, action) => {
              setMicroPromptLoading(true);
              
              try {
                let newPayload = {
                  url: url || undefined,
                  text: text || undefined,
                  language: settings.language,
                  interests: settings.interests,
                  community: settings.community,
                  outputStyle: settings.outputStyle,
                  languageStyle,
                  explainTerms,
                  keepTechnicalTerms,
                };
                
                if (mode === "Ask") newPayload.question = question;
                
                let endpoint = "/api/summarize";
                if (mode === "Ask") endpoint = "/api/qa";
                if (mode === "Outline") endpoint = "/api/outline";
                if (mode === "Citations") endpoint = "/api/citations";
                
                // Add prompt-specific modifications
                switch (promptId) {
                  case "summarize-shorter":
                    newPayload.outputStyle = "bullets";
                    newPayload.languageStyle = "everyday";
                    break;
                  case "summarize-connect":
                    newPayload.interests = settings.interests || "general";
                    break;
                  case "summarize-example":
                    newPayload.languageStyle = "everyday";
                    newPayload.includeExamples = true;
                    break;
                  case "ask-example":
                    newPayload.languageStyle = "everyday";
                    newPayload.includeExamples = true;
                    break;
                  case "ask-simplify":
                    newPayload.languageStyle = "everyday";
                    break;
                  case "outline-questions":
                    newPayload.outputStyle = "bullets";
                    break;
                }
                
                const res = await fetch(endpoint, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(newPayload),
                });
                
                const data = await res.json();
                if (!res.ok) throw new Error(data?.error || "Request failed");
                
                const out =
                  mode === "Summarize"
                    ? data.summary
                    : mode === "Ask"
                    ? data.answer
                    : mode === "Outline"
                    ? data.outline
                    : data.formatted || data.suggestions || JSON.stringify(data, null, 2);
                
                setResults(prev => ({
                  ...prev,
                  [mode]: formatText(out || "")
                }));
              } catch (err) {
                setResults(prev => ({
                  ...prev,
                  [mode]: formatText(String(err?.message || err) || "Something went wrong.")
                }));
              } finally {
                setMicroPromptLoading(false);
              }
            }}
            onPromptSkip={(promptId) => {
              setShowMicroPrompt(false);
            }}
          />
        </div>

      {/* Query Library Panel - Outside main content */}
      <QueryLibraryPanel 
        isOpen={showQueryLibrary} 
        onClose={() => setShowQueryLibrary(false)} 
        onLoadQuery={handleLoadQuery} 
      />

      {/* Save Query Modal */}
      <SaveQuery
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        onSave={handleSaveQuery}
        query={mode === "Ask" ? question : text}
        mode={mode}
        url={url}
        result={currentResult}
      />

      <footer className="max-w-4xl mx-auto px-4 py-10 text-sm text-slate-600">
        <p>
          This tool aims to support students from underrepresented communities in navigating research. Always double-check facts and cite your sources.
        </p>
      </footer>
    </div>
  );
}
