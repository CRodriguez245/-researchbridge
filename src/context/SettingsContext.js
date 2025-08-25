"use client";
import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { useSession } from "next-auth/react";

const STORAGE_KEY = "ai-research-workbook-settings";

const defaultSettings = {
  language: "English",
  interests: [],
  community: "General",
  outputStyle: "paragraphs",
  textSize: "medium",
  defaultReadingLevel: "simple",
  microPromptsEnabled: true,
  curiosity: "",
  hasOnboarded: false,
  signals: [],
  preferences: {},
  nudges: {},
  lastSession: null
};

const SettingsContext = createContext({
  settings: defaultSettings,
  updateSettings: (partial) => {},
  resetSettings: () => {},
  addSignal: (tag, context) => {},
  setPreference: (tag, isDefault) => {},
  dismissNudge: (tag) => {},
  getActivePreferences: () => {},
  shouldShowNudge: (tag) => {},
  isAuthenticated: false,
  isLoading: true
});

export function SettingsProvider({ children }) {
  const { data: session, status } = useSession();
  const [settings, setSettings] = useState(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  // Load settings from localStorage or database
  const loadSettings = useCallback(async () => {
    try {
      if (session?.user?.id) {
        // Load from database for authenticated users
        const response = await fetch(`/api/user/preferences`);
        if (response.ok) {
          const dbSettings = await response.json();
          setSettings(dbSettings);
        } else {
          // Fallback to localStorage if database fails
          const stored = localStorage.getItem(STORAGE_KEY);
          if (stored) {
            setSettings(JSON.parse(stored));
          }
        }
      } else {
        // Load from localStorage for anonymous users
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          setSettings(JSON.parse(stored));
        }
      }
    } catch (error) {
      console.error("Error loading settings:", error);
    } finally {
      setIsLoading(false);
    }
  }, [session?.user?.id]);

  // Save settings to localStorage or database
  const saveSettings = useCallback(async (newSettings) => {
    try {
      if (session?.user?.id) {
        // Save to database for authenticated users
        await fetch(`/api/user/preferences`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newSettings)
        });
      } else {
        // Save to localStorage for anonymous users
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
      }
    } catch (error) {
      console.error("Error saving settings:", error);
    }
  }, [session?.user?.id]);

  // Load settings when session changes
  useEffect(() => {
    if (status !== "loading") {
      loadSettings();
    }
  }, [loadSettings, status]);

  const updateSettings = useCallback((partial) => {
    setSettings(prev => {
      const newSettings = typeof partial === 'function' ? partial(prev) : { ...prev, ...partial };
      // Save settings asynchronously but don't wait for it
      saveSettings(newSettings);
      return newSettings;
    });
  }, [saveSettings]);

  const resetSettings = useCallback(() => {
    setSettings(defaultSettings);
    saveSettings(defaultSettings);
  }, [saveSettings]);

  // Add a preference signal (reaction)
  const addSignal = useCallback((tag, context) => {
    updateSettings((prev) => {
      const newSignal = {
        tag,
        context,
        timestamp: new Date().toISOString()
      };
      
      const newSignals = [...prev.signals, newSignal];
      
      return {
        ...prev,
        signals: newSignals,
        lastSession: new Date().toISOString()
      };
    });
  }, [updateSettings]);

  // Set a preference as default
  const setPreference = useCallback((tag, isDefault) => {
    updateSettings((prev) => {
      const newPreferences = { ...prev.preferences };
      
      if (isDefault) {
        newPreferences[tag] = {
          default: true,
          since: new Date().toISOString()
        };
      } else {
        delete newPreferences[tag];
      }
      
      return {
        ...prev,
        preferences: newPreferences
      };
    });
  }, [updateSettings]);

  // Dismiss a nudge
  const dismissNudge = useCallback((tag) => {
    updateSettings((prev) => {
      const newNudges = { ...prev.nudges };
      newNudges[tag] = (newNudges[tag] || 0) + 1;
      
      return {
        ...prev,
        nudges: newNudges
      };
    });
  }, [updateSettings]);

  // Get active preferences for display
  const getActivePreferences = useCallback(() => {
    return Object.entries(settings.preferences)
      .filter(([tag, pref]) => pref.default === true)
      .map(([tag]) => tag);
  }, [settings.preferences]);

  // Check if we should show a nudge for a tag
  const shouldShowNudge = useCallback((tag) => {
    const recentSignals = settings.signals.filter(s => s.tag === tag);
    const hasPreference = settings.preferences[tag]?.default;
    const nudgeCount = settings.nudges[tag] || 0;
    
    // Don't show if already have preference or too many dismissals
    if (hasPreference || nudgeCount >= 2) return false;
    
    // Don't show if not enough signals
    if (recentSignals.length < 2) return false;
    
    // Check for contradictions with current settings
    const contradictions = {
      'tone:everyday': settings.defaultReadingLevel === 'simple',
      'tone:academic': settings.defaultReadingLevel === 'standard',
      'depth:short': settings.outputStyle === 'bullets',
      'depth:scaffolded': settings.outputStyle === 'paragraphs'
    };
    
    // Don't show nudge if it would contradict current settings
    if (contradictions[tag]) return false;
    
    return true;
  }, [settings.signals, settings.preferences, settings.nudges, settings.defaultReadingLevel, settings.outputStyle]);

  // Always render, but conditionally show content
  const contextValue = useMemo(() => {
    const baseContext = {
      updateSettings, 
      resetSettings, 
      addSignal, 
      setPreference, 
      dismissNudge, 
      getActivePreferences, 
      shouldShowNudge,
      isAuthenticated: !!session?.user?.id,
      isLoading: status === "loading"
    };

    if (status === "loading") {
      return { 
        settings: defaultSettings,
        ...baseContext,
        isLoading: true 
      };
    }
    if (status === "unauthenticated") {
      return { 
        settings: defaultSettings,
        ...baseContext,
        isLoading: false, 
        isAuthenticated: false 
      };
    }
    return { 
      settings, 
      ...baseContext
    };
  }, [status, settings, updateSettings, resetSettings, addSignal, setPreference, dismissNudge, getActivePreferences, shouldShowNudge, session?.user?.id, isLoading]);

  return (
    <SettingsContext.Provider value={contextValue}>
      {children}
    </SettingsContext.Provider>
  );


}

export function useSettings() {
  return useContext(SettingsContext);
} 