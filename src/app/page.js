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
import { cleanMarkdown } from "@/lib/text";

const MODES = ["Summarize", "Ask", "Outline", "Citations"];

export default function Home() {
  const router = useRouter();
  const { settings, shouldShowNudge, isLoading } = useSettings();
  const { data: session, status } = useSession();
  const [mode, setMode] = useState("Summarize");
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");
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
  const [showMicroPrompt, setShowMicroPrompt] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [microPromptLoading, setMicroPromptLoading] = useState(false);
  const [showNudge, setShowNudge] = useState(null);
  const [showHelp, setShowHelp] = useState(false);
  const [typingComplete, setTypingComplete] = useState(false);
  const utteranceRef = useRef(null);

  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      setVoiceEnabled(true);
    }
  }, []);

  useEffect(() => {
    const def = settings.defaultReadingLevel;
    if (def === "standard") setLanguageStyle("academic");
    else setLanguageStyle("everyday");
    
    // Only redirect to onboarding if:
    // 1. Settings are loaded
    // 2. User hasn't onboarded
    // 3. User is not authenticated (or session is still loading)
    if (!isLoading && !settings.hasOnboarded && status !== "loading") {
      // If user is authenticated but hasn't onboarded, they should still go through onboarding
      // If user is not authenticated and hasn't onboarded, they should go through onboarding
      router.push("/onboarding");
    }
  }, [settings.defaultReadingLevel, settings.hasOnboarded, router, isLoading, status]);

  useEffect(() => {
    return () => {
      if (utteranceRef.current) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const canSubmit = useMemo(() => {
    const result = mode === "Ask" ? !!question && (!!text || !!url) : !!text || !!url;
    return result;
  }, [mode, question, text, url]);

  // Helper function to get current result for the active mode
  const currentResult = results[mode];

  // Helper function to clean markdown formatting
  const cleanMarkdown = (text) => {
    if (!text) return "";
    return text
      .replace(/^#+\s*/gm, '') // Remove headers (# ## ### etc.)
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold (**text** -> text)
      .replace(/\*(.*?)\*/g, '$1') // Remove italic (*text* -> text)
      .replace(/`(.*?)`/g, '$1') // Remove inline code (`text` -> text)
      .replace(/^\s*[-*+]\s*/gm, '• ') // Convert list markers to bullet points
      .replace(/^\s*\d+\.\s*/gm, '') // Remove numbered list markers
      .trim();
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

      setResults(prev => ({
        ...prev,
        [mode]: cleanMarkdown(out || "")
      }));
      // Show micro-prompt after successful result
      if (settings.microPromptsEnabled) {
        setShowMicroPrompt(true);
      }
      // Check for nudges after successful result
      checkForNudges();
    } catch (err) {
      setResults(prev => ({
        ...prev,
        [mode]: cleanMarkdown(String(err?.message || err) || "Something went wrong.")
      }));
    } finally {
      setLoading(false);
    }
  }

  function handleSpeak() {
    if (!voiceEnabled || !currentResult) return;
    if (utteranceRef.current) {
      window.speechSynthesis.cancel();
      utteranceRef.current = null;
    }
    const u = new SpeechSynthesisUtterance(currentResult);
    u.rate = 0.95;
    u.pitch = 1;
    utteranceRef.current = u;
    window.speechSynthesis.speak(u);
  }

  function handleStop() {
    if (utteranceRef.current) {
      window.speechSynthesis.cancel();
      utteranceRef.current = null;
    }
  }

  // Helper function to show micro-prompts after control updates
  function showMicroPromptAfterUpdate() {
    if (settings.microPromptsEnabled) {
      setShowMicroPrompt(true);
    }
  }

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
    <div className="min-h-screen bg-background text-foreground font-sans">
      <AuthHeader />
      <header className="w-full border-b border-black/10 dark:border-white/15 bg-white">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
                          <h1 className="text-2xl font-semibold tracking-tight">ResearchBridge</h1>
            <p className="text-sm text-slate-600 mt-0.5">Understand research with confidence. Built for students, with students.</p>
          </div>
          <div className="flex items-center gap-4">
          </div>
        </div>
      </header>

      {/* Help Section */}
      {showHelp && (
        <div className="max-w-4xl mx-auto px-4 py-4 bg-slate-50 border border-slate-200">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-slate-900 mb-2">How the AI learns your preferences</h3>
              <div className="text-xs text-slate-700 space-y-2">
                <p>• <strong>Reaction chips</strong> below results let you give quick feedback on what works for you</p>
                <p>• <strong>Preference nudges</strong> appear when the AI notices patterns in your reactions</p>
                <p>• <strong>Active preferences</strong> (shown in the pill) become your default settings</p>
                <p>• <strong>Hover over any chip</strong> to see what each preference does</p>
              </div>
            </div>
            <button
              onClick={() => setShowHelp(false)}
              className="text-slate-600 hover:text-slate-800 ml-4 text-lg font-bold"
            >
              ×
            </button>
          </div>
        </div>
      )}

      <main className="max-w-4xl mx-auto px-4 py-6 sm:py-8 grid gap-6">
        <section className="border border-light bg-white shadow-professional card">
          <div className="flex items-center justify-between gap-3 px-3 sm:px-4 py-2.5 border-b border-light section-header">
            <div>
              <h2 className="text-sm font-semibold tracking-tight">Mode</h2>
              <p className="text-xs text-slate-600">Choose what you want to do.</p>
            </div>
          </div>
          <div className="p-3 sm:p-4">
            <nav aria-label="Modes" className="w-full">
              <div className="flex items-center gap-3">
                <div className="inline-flex bg-slate-100 p-1 shadow-inner">
                  {MODES.map((m, idx) => (
                    <button
                      key={m}
                      onClick={() => {
                        setMode(m);
                        setShowMicroPrompt(false);
                      }}
                                              className={`px-3.5 py-2 text-sm font-medium transition ${
                        mode === m
                          ? "bg-white shadow-sm text-slate-900"
                          : "text-slate-700 hover:text-slate-900"
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

        <form onSubmit={handleSubmit} className="grid gap-6" aria-describedby="helper">
          <section className="border border-light bg-white shadow-professional card">
            <div className="flex items-center gap-2 px-3 sm:px-4 py-2.5 border-b border-light section-header">
              <div>
                <h2 className="text-sm font-semibold tracking-tight">Source</h2>
                <p className="text-xs text-secondary">Paste a link or text. We'll fetch and clean the article content.</p>
              </div>
            </div>
            <div className="p-3 sm:p-4">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <label htmlFor="url" className="text-xs font-medium">URL</label>
                  <input
                    id="url"
                    type="url"
                    placeholder="https://example.com/article"
                    className="w-full px-3 py-2 border border-slate-300 bg-white outline-none focus:ring-2 focus:ring-slate-400/40"
                    value={url}
                    onChange={(e) => {
                      setUrl(e.target.value);
                    }}
                  />
                </div>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-300"></div>
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-white px-2 text-slate-500">or</span>
                  </div>
                </div>
                <div className="grid gap-2">
                  <label htmlFor="text" className="text-xs font-medium">Paste text</label>
                  <textarea
                    id="text"
                    rows={8}
                    placeholder="Paste any text here…"
                    className="w-full px-3 py-2 border border-slate-300 bg-white outline-none focus:ring-2 focus:ring-slate-400/40 leading-relaxed"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                  />
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <p id="helper" className="text-xs text-slate-600">Choose one: URL or paste text directly. For questions, type your question below.</p>
                {mode !== "Ask" && (
                  <button
                    type="submit"
                    disabled={!canSubmit || loading}
                    className="btn-accent disabled:opacity-50"
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
            <section className="border border-light bg-white shadow-professional card">
              <div className="flex items-center gap-2 px-3 sm:px-4 py-2.5 border-b border-light section-header">
                <div>
                  <h2 className="text-sm font-semibold tracking-tight">Your question</h2>
                  <p className="text-xs text-secondary">Ask clearly. Start with what you want to know.</p>
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
                    className="flex-1 px-3 py-2 border border-slate-300 bg-white outline-none focus:ring-2 focus:ring-slate-400/40"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                  />
                  <button
                    type="submit"
                    disabled={!canSubmit || loading}
                    className="btn-accent disabled:opacity-50"
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



                              <section aria-live="polite" className="border border-light bg-white shadow-professional card relative" data-result-section>
          <div className="flex flex-wrap items-center justify-between gap-3 px-3 sm:px-4 py-2.5 border-b border-light section-header">
              <h2 className="text-sm font-semibold tracking-tight">Result</h2>
              <div className="flex flex-wrap items-center gap-3">
                {currentResult && (
                  <div className="flex items-center gap-2 text-sm">
                    {voiceEnabled && (
                      <>
                                          <button type="button" onClick={handleSpeak} className="px-3 py-1.5 border border-slate-300 bg-white text-xs hover:bg-slate-50 transition">Read aloud</button>
                  <button type="button" onClick={handleStop} className="px-3 py-1.5 border border-slate-300 bg-white text-xs hover:bg-slate-50 transition">Stop</button>
                      </>
                    )}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium">Language style</span>
                  <div className="inline-flex bg-slate-100 p-1 shadow-inner">
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
                              [mode]: cleanMarkdown(data.summary || "")
                            }));
                            showMicroPromptAfterUpdate();
                          } catch (err) {
                            setResults(prev => ({
                              ...prev,
                              [mode]: cleanMarkdown(String(err?.message || err) || "Something went wrong.")
                            }));
                          } finally {
                            setUpdating(false);
                          }
                        }
                      }}
                      className={`px-3.5 py-2 text-sm font-medium transition ${languageStyle === "everyday" ? "bg-white shadow-sm text-slate-900" : "text-slate-700 hover:text-slate-900"} ${updating ? "opacity-50" : ""}`}
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
                              [mode]: cleanMarkdown(data.summary || "")
                            }));
                            showMicroPromptAfterUpdate();
                          } catch (err) {
                            setResults(prev => ({
                              ...prev,
                              [mode]: cleanMarkdown(String(err?.message || err) || "Something went wrong.")
                            }));
                          } finally {
                            setUpdating(false);
                          }
                        }
                      }}
                      className={`px-3.5 py-2 text-sm font-medium transition ${languageStyle === "academic" ? "bg-white shadow-sm text-slate-900" : "text-slate-700 hover:text-slate-900"} ${updating ? "opacity-50" : ""}`}
                      aria-pressed={languageStyle === "academic"}
                      disabled={updating}
                    >
                      Academic
                    </button>
                  </div>
                </div>
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
                            [mode]: cleanMarkdown(data.summary || "")
                          }));
                          showMicroPromptAfterUpdate();
                        } catch (err) {
                          setResults(prev => ({
                            ...prev,
                            [mode]: cleanMarkdown(String(err?.message || err) || "Something went wrong.")
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
                            [mode]: cleanMarkdown(data.summary || "")
                          }));
                          showMicroPromptAfterUpdate();
                        } catch (err) {
                          setResults(prev => ({
                            ...prev,
                            [mode]: cleanMarkdown(String(err?.message || err) || "Something went wrong.")
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
            <div className={`p-4 sm:p-5 leading-relaxed ${settings.largeText ? "text-lg" : "text-base"}`}>
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
                  <TypingAnimation 
                    text={currentResult} 
                    speed={20}
                    className="whitespace-pre-wrap"
                    onComplete={() => setTypingComplete(true)}
                  />
                  {typingComplete && <ReactionChips context={mode} />}
                  <div className="flex items-center justify-between mt-4">
                    <button
                      onClick={() => {
                        console.log('How it works clicked, current showHelp:', showHelp);
                        setShowHelp(!showHelp);
                      }}
                      className="text-sm text-slate-600 hover:text-slate-800 flex items-center gap-1"
                    >
                      <span>ⓘ</span>
                      <span>How it works</span>
                    </button>
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-200">
                    <ConfidenceRating context={mode} />
                  </div>
                </>
              )}
              {!updating && !currentResult && (
                <p className="text-slate-700 text-sm">Results will appear here. Choose a mode, add a URL or text, and submit.</p>
              )}
            </div>
            
            <MicroPrompts
            mode={mode}
            isVisible={showMicroPrompt && currentResult && !loading && settings.microPromptsEnabled}
            loading={microPromptLoading}
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
                  [mode]: cleanMarkdown(out || "")
                }));
              } catch (err) {
                setResults(prev => ({
                  ...prev,
                  [mode]: cleanMarkdown(String(err?.message || err) || "Something went wrong.")
                }));
              } finally {
                setMicroPromptLoading(false);
              }
            }}
            onPromptSkip={(promptId) => {
              setShowMicroPrompt(false);
            }}
            />
            
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

      <footer className="max-w-4xl mx-auto px-4 py-10 text-sm text-slate-600">
        <p>
          This tool aims to support students from underrepresented communities in navigating research. Always double-check facts and cite your sources.
        </p>
      </footer>
    </div>
  );
}
