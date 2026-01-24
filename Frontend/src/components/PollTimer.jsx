import React, { useEffect, useState, useRef } from 'react';

export default function PollTimer({ initialTimeRemaining, className = '' }) {
  const [displayTime, setDisplayTime] = useState(initialTimeRemaining);
  const endTimeRef = useRef(Date.now() + initialTimeRemaining * 1000);

  useEffect(() => {
    endTimeRef.current = Date.now() + initialTimeRemaining * 1000;
    setDisplayTime(initialTimeRemaining);
  }, [initialTimeRemaining]);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const secondsLeft = Math.ceil((endTimeRef.current - now) / 1000);
      
      if (secondsLeft <= 0) {
        setDisplayTime(0);
        clearInterval(interval);
      } else {
        setDisplayTime(secondsLeft);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [initialTimeRemaining]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (displayTime <= 0) return null;

  return (
    <div className={`inline-flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1 sm:py-2 rounded-full bg-indigo-600 text-white font-semibold shadow-lg ${className}`}>
      <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 20 20">
        <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6z"/>
      </svg>
      <span className="text-xs sm:text-sm">{formatTime(displayTime)}</span>
    </div>
  );
}