"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";

export default function ConfidenceRating({ context, onRatingSubmit }) {
  const { data: session } = useSession();
  const [rating, setRating] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  const confidenceLevels = [
    { value: 1, label: "Very Low", color: "bg-red-100 text-red-800" },
    { value: 2, label: "Low", color: "bg-orange-100 text-orange-800" },
    { value: 3, label: "Neutral", color: "bg-gray-100 text-gray-800" },
    { value: 4, label: "High", color: "bg-green-100 text-green-800" },
    { value: 5, label: "Very High", color: "bg-blue-100 text-blue-800" }
  ];

  const handleRatingClick = async (value) => {
    if (submitted) return;
    
    setRating(value);
    setSubmitted(true);

    // Log the confidence rating
    if (session?.user?.id) {
      try {
        await fetch("/api/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            event: "confidence_rated",
            properties: {
              rating: value,
              context: context,
              timestamp: new Date().toISOString()
            }
          })
        });
      } catch (error) {
        console.error("Error logging confidence rating:", error);
      }
    }

    // Call the callback if provided
    if (onRatingSubmit) {
      onRatingSubmit(value);
    }
  };

  if (submitted) {
    const selectedLevel = confidenceLevels.find(level => level.value === rating);
    return (
      <div className="mt-4 p-3 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Confidence:</span>
            <span className={`px-2 py-1 text-xs font-medium ${selectedLevel.color}`}>
              {selectedLevel.label}
            </span>
          </div>
          <button
            onClick={() => {
              setRating(null);
              setSubmitted(false);
            }}
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            Change
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4 p-3 bg-gray-50">
      <p className="text-sm font-medium text-gray-700 mb-2">
        How confident do you feel about this result?
      </p>
      <div className="flex gap-2">
        {confidenceLevels.map((level) => (
          <button
            key={level.value}
            onClick={() => handleRatingClick(level.value)}
            className={`flex-1 p-2 border border-gray-200 transition-all hover:scale-105 rounded-lg ${
              rating === level.value
                ? `${level.color} border-gray-300`
                : "bg-white hover:bg-gray-50"
            }`}
            title={level.label}
          >
            <div className="text-center">
              <div className="text-xs font-medium">{level.label}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
} 