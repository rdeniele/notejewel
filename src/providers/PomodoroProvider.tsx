"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { toast } from "sonner";

interface PomodoroContextType {
  pomodoroTime: number;
  isBreakTime: boolean;
  isTimerRunning: boolean;
  startTimer: () => void;
  pauseTimer: () => void;
  resetTimer: () => void;
  formatTime: (seconds: number) => string;
}

const PomodoroContext = createContext<PomodoroContextType | undefined>(undefined);

export function usePomodoroTimer() {
  const context = useContext(PomodoroContext);
  if (context === undefined) {
    throw new Error("usePomodoroTimer must be used within a PomodoroProvider");
  }
  return context;
}

interface PomodoroProviderProps {
  children: ReactNode;
}

export function PomodoroProvider({ children }: PomodoroProviderProps) {
  const [pomodoroTime, setPomodoroTime] = useState(25 * 60); // 25 minutes in seconds
  const [isBreakTime, setIsBreakTime] = useState(false);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(null);

  const startTimer = () => {
    if (timerInterval) {
      clearInterval(timerInterval);
    }
    
    setIsTimerRunning(true);
    const interval = setInterval(() => {
      setPomodoroTime((prevTime) => {
        if (prevTime <= 1) {
          // Timer finished
          clearInterval(interval);
          setIsTimerRunning(false);
          
          if (isBreakTime) {
            // Break finished, start work session
            setIsBreakTime(false);
            setPomodoroTime(25 * 60);
            toast.success("Break time over! Ready for another focused session?");
          } else {
            // Work session finished, start break
            setIsBreakTime(true);
            setPomodoroTime(5 * 60);
            toast.success("Great work! Time for a 5-minute break.");
          }
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);
    
    setTimerInterval(interval);
  };

  const pauseTimer = () => {
    if (timerInterval) {
      clearInterval(timerInterval);
      setTimerInterval(null);
    }
    setIsTimerRunning(false);
  };

  const resetTimer = () => {
    if (timerInterval) {
      clearInterval(timerInterval);
      setTimerInterval(null);
    }
    setIsTimerRunning(false);
    setIsBreakTime(false);
    setPomodoroTime(25 * 60);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerInterval) {
        clearInterval(timerInterval);
      }
    };
  }, [timerInterval]);

  const value = {
    pomodoroTime,
    isBreakTime,
    isTimerRunning,
    startTimer,
    pauseTimer,
    resetTimer,
    formatTime,
  };

  return (
    <PomodoroContext.Provider value={value}>
      {children}
    </PomodoroContext.Provider>
  );
}
