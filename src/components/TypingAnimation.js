"use client";
import { useState, useEffect } from "react";

export default function TypingAnimation({ text, speed = 15, className = "", onComplete }) {
  const [displayedText, setDisplayedText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (!text) {
      setDisplayedText("");
      setCurrentIndex(0);
      return;
    }

    if (currentIndex < text.length) {
      const timer = setTimeout(() => {
        setDisplayedText(text.slice(0, currentIndex + 1));
        setCurrentIndex(currentIndex + 1);
      }, speed);

      return () => clearTimeout(timer);
    } else if (!isComplete && text.length > 0) {
      setIsComplete(true);
      onComplete?.();
    }
  }, [text, currentIndex, speed]);

  // Reset when text changes
  useEffect(() => {
    setDisplayedText("");
    setCurrentIndex(0);
    setIsComplete(false);
  }, [text]);

  return (
    <div 
      className={className}
      dangerouslySetInnerHTML={{ 
        __html: displayedText + (currentIndex < text.length ? '<span class="animate-pulse">|</span>' : '')
      }}
    />
  );
} 