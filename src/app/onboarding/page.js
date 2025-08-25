"use client";
import { useState, useEffect } from "react";
import { useSettings } from "@/context/SettingsContext";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";

const STEPS = [
  {
    id: "welcome",
    title: "Welcome to ResearchBridge",
    description: "Let's personalize your experience in just a few quick questions.",
    fields: []
  },
  {
    id: "language",
    title: "What language do you prefer?",
    description: "We'll use this for our interface and explanations.",
    fields: [
      { name: "language", type: "select", options: ["English", "Spanish", "French"] }
    ]
  },
  {
    id: "interests",
    title: "What interests you most?",
    description: "This helps us provide relevant examples and connections.",
    fields: [
      { name: "interests", type: "multiselect", options: [
        "Science & Technology", "History", "Arts & Culture", 
        "Sports", "Music", "Health & Wellness", "Environment", 
        "Social Issues", "Business & Economics", "Literature"
      ]}
    ]
  },
  {
    id: "community",
    title: "What's your community focus?",
    description: "This helps us connect research to what matters to you.",
    fields: [
      { name: "community", type: "select", options: [
        "General", "My local community", "My school", 
        "My cultural background", "My interests", "Global issues"
      ]}
    ]
  },
  {
    id: "reading",
    title: "How do you prefer to read information?",
    description: "We'll adjust our explanations to match your style.",
    fields: [
      { name: "defaultReadingLevel", type: "select", options: [
        { value: "simple", label: "Simple & Clear" },
        { value: "standard", label: "Standard Academic" }
      ]}
    ]
  },
  {
    id: "output",
    title: "How do you like information organized?",
    description: "Choose your preferred format for summaries and outlines.",
    fields: [
      { name: "outputStyle", type: "select", options: [
        { value: "paragraphs", label: "Paragraphs" },
        { value: "bullets", label: "Bullet Points" }
      ]}
    ]
  },
  {
    id: "complete",
    title: "You're all set!",
    description: "Your preferences are saved and ready to use.",
    fields: []
  }
];

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    language: "English",
    interests: [],
    community: "General",
    defaultReadingLevel: "simple",
    outputStyle: "paragraphs"
  });
  const { settings, updateSettings, isLoading } = useSettings();
  const router = useRouter();
  const { data: session, status } = useSession();

  // Redirect if user has already onboarded
  useEffect(() => {
    if (!isLoading && status !== "loading" && settings.hasOnboarded) {
      router.push("/");
    }
  }, [settings.hasOnboarded, isLoading, status, router]);

  const currentStepData = STEPS[currentStep];

  // Show loading state while checking if user has already onboarded
  if (isLoading || status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin  h-8 w-8 border-b-2 border-slate-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleCompleteOnboarding = () => {
    try {
      console.log('Completing onboarding with data:', formData);
      
      // Save settings and redirect to main app
      updateSettings({
        ...formData,
        hasOnboarded: true
      });
      
      console.log('Settings update initiated');
      
      // Force a page reload to ensure settings are loaded
      window.location.href = "/";
    } catch (error) {
      console.error('Error completing onboarding:', error);
      // Fallback: just redirect
      window.location.href = "/";
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFieldChange = (fieldName, value) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  const handleMultiSelect = (fieldName, value, checked) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: checked 
        ? [...prev[fieldName], value]
        : prev[fieldName].filter(item => item !== value)
    }));
  };

  if (currentStepData.id === "welcome") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white/90 backdrop-blur-sm shadow-lg border border-slate-200/60 p-8 rounded-lg">
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-slate-900 via-blue-800 to-indigo-900 bg-clip-text text-transparent mb-4">
              {currentStepData.title}
            </h1>
            <p className="text-slate-600 mb-8">
              {currentStepData.description}
            </p>
            <button
              onClick={handleNext}
              className="w-full bg-gradient-to-r from-slate-500 to-slate-600 text-white py-3 px-4 hover:from-slate-600 hover:to-slate-700 transition-all duration-200 shadow-md hover:shadow-lg rounded-lg"
            >
              Get Started
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (currentStepData.id === "complete") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white/90 backdrop-blur-sm shadow-lg border border-slate-200/60 p-8 rounded-lg">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center mx-auto mb-4 rounded-full">
              <svg className="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              {currentStepData.title}
            </h1>
            <p className="text-gray-600 mb-6">
              {currentStepData.description}
            </p>
            
            {/* Optional sign-up prompt */}
            <div className="bg-blue-50 border border-blue-200 p-4 mb-6 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">
                Want to save your preferences?
              </h3>
              <p className="text-blue-700 text-sm mb-4">
                Create a free account to save your settings and access them from any device.
              </p>
              <div className="flex gap-2">
                <Link
                  href="/auth/signup"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 text-sm hover:bg-blue-700 transition-colors rounded-lg"
                >
                  Sign Up
                </Link>
                <button
                  onClick={handleCompleteOnboarding}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 text-sm hover:bg-gray-300 transition-colors rounded-lg"
                >
                  Continue Without Account
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white shadow-md p-8 rounded-lg">
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm text-gray-500">
              Step {currentStep + 1} of {STEPS.length}
            </span>
            <div className="flex space-x-1">
              {STEPS.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2  ${
                    index <= currentStep ? "bg-blue-600" : "bg-gray-300"
                  }`}
                />
              ))}
            </div>
          </div>
          
          <h1 className="text-xl font-bold text-gray-900 mb-2">
            {currentStepData.title}
          </h1>
          <p className="text-gray-600 text-sm">
            {currentStepData.description}
          </p>
        </div>

        <div className="space-y-4">
          {currentStepData.fields.map((field) => (
            <div key={field.name}>
              {field.type === "select" && (
                <select
                  value={formData[field.name]}
                  onChange={(e) => handleFieldChange(field.name, e.target.value)}
                  className="w-full p-3 border border-gray-300  focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {field.options.map((option) => (
                    <option key={option.value || option} value={option.value || option}>
                      {option.label || option}
                    </option>
                  ))}
                </select>
              )}

              {field.type === "multiselect" && (
                <div className="space-y-2">
                  {field.options.map((option) => (
                    <label key={option} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData[field.name].includes(option)}
                        onChange={(e) => handleMultiSelect(field.name, option, e.target.checked)}
                        className="mr-3"
                      />
                      <span className="text-sm">{option}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="flex justify-between mt-8">
          <button
            onClick={handleBack}
            disabled={currentStep === 0}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Back
          </button>
                      <button
              onClick={currentStep === STEPS.length - 2 ? handleCompleteOnboarding : handleNext}
              className="px-6 py-2 bg-blue-600 text-white  hover:bg-blue-700 transition-colors"
            >
              {currentStep === STEPS.length - 2 ? "Complete" : "Next"}
            </button>
        </div>
      </div>
    </div>
  );
} 