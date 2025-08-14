// This is a separate timer implementation to ensure smooth countdown
import { useEffect, useState, useRef } from 'react';

export function useSmootherTimer(
  initialTime: number,
  isActive: boolean,
  onTimeUp: () => void
) {
  const [timeLeft, setTimeLeft] = useState(initialTime);
  const lastTickRef = useRef<number | null>(null);
  
  useEffect(() => {
    // Reset the timer if initialTime changes
    if (initialTime > 0) {
      setTimeLeft(initialTime);
      lastTickRef.current = null;
    }
  }, [initialTime]);
  
  useEffect(() => {
    if (!isActive || timeLeft <= 0) return;
    
    // Use requestAnimationFrame for smoother updates
    let animationFrameId: number;
    
    const updateTimer = (timestamp: number) => {
      if (lastTickRef.current === null) {
        // First frame, just set the timestamp
        lastTickRef.current = timestamp;
      } else {
        // Calculate elapsed time since last tick in milliseconds
        const elapsed = timestamp - lastTickRef.current;
        
        // Only update if at least 1000ms (1 second) has passed
        if (elapsed >= 1000) {
          // Calculate how many seconds to subtract (usually 1, but could be more if frames were skipped)
          const secondsToSubtract = Math.floor(elapsed / 1000);
          const newTime = Math.max(0, timeLeft - secondsToSubtract);
          
          setTimeLeft(newTime);
          
          // Update the last tick time, accounting for any remainder
          lastTickRef.current = timestamp - (elapsed % 1000);
          
          // Check if time is up
          if (newTime <= 0) {
            onTimeUp();
            return; // Stop the animation loop
          }
        }
      }
      
      // Continue the animation loop
      animationFrameId = requestAnimationFrame(updateTimer);
    };
    
    animationFrameId = requestAnimationFrame(updateTimer);
    
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isActive, timeLeft, onTimeUp]);
  
  // Format time for display
  const formatTimeDisplay = (totalSeconds: number) => {
    if (totalSeconds === undefined || totalSeconds < 0) return "00:00";

    // Calculate hours, minutes, and seconds
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);

    // Format with leading zeros
    if (hours > 0) {
      return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
        2,
        "0"
      )}:${String(seconds).padStart(2, "0")}`;
    } else {
      return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
        2,
        "0"
      )}`;
    }
  };
  
  return {
    timeLeft,
    setTimeLeft,
    formattedTime: formatTimeDisplay(timeLeft)
  };
}