"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Play, Pause, RotateCcw, Minimize2, Maximize2 } from "lucide-react";
import { usePomodoroTimer } from "@/providers/PomodoroProvider";

export default function FloatingPomodoroTimer() {
  const { 
    pomodoroTime, 
    isBreakTime, 
    isTimerRunning, 
    startTimer, 
    pauseTimer, 
    resetTimer, 
    formatTime 
  } = usePomodoroTimer();
  
  const [isMinimized, setIsMinimized] = useState(false);

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Card className="shadow-lg border-2" style={{ 
          borderColor: isBreakTime ? 'var(--chart-2)' : 'var(--primary)',
          backgroundColor: 'var(--card)'
        }}>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isTimerRunning ? 'animate-pulse' : ''}`} style={{ 
                  backgroundColor: isBreakTime ? 'var(--chart-2)' : 'var(--primary)' 
                }}></div>
                <span className="text-sm font-mono font-bold" style={{ 
                  color: isBreakTime ? 'var(--chart-2)' : 'var(--primary)' 
                }}>
                  {formatTime(pomodoroTime)}
                </span>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsMinimized(false)}
                className="h-6 w-6 p-0"
              >
                <Maximize2 className="h-3 w-3" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Card className="shadow-lg border-2" style={{ 
        borderColor: isBreakTime ? 'var(--chart-2)' : 'var(--primary)',
        backgroundColor: 'var(--card)'
      }}>
        <CardContent className="p-4">
          <div className="space-y-3 min-w-[200px]">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" style={{ color: 'var(--primary)' }} />
                <span className="text-sm font-medium" style={{ color: 'var(--card-foreground)' }}>
                  Pomodoro
                </span>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsMinimized(true)}
                className="h-6 w-6 p-0"
              >
                <Minimize2 className="h-3 w-3" />
              </Button>
            </div>

            {/* Status Badge */}
            <div className="flex justify-center">
              <Badge 
                variant="secondary" 
                className="text-xs"
                style={{ 
                  backgroundColor: isBreakTime ? 'var(--chart-2)' + '20' : 'var(--primary)' + '20',
                  color: isBreakTime ? 'var(--chart-2)' : 'var(--primary)',
                  borderColor: isBreakTime ? 'var(--chart-2)' : 'var(--primary)'
                }}
              >
                {isBreakTime ? "Break Time" : "Focus Time"}
              </Badge>
            </div>
            
            {/* Timer Display */}
            <div className="text-center">
              <div className="text-3xl font-bold font-mono" style={{ 
                color: isBreakTime ? 'var(--chart-2)' : 'var(--primary)' 
              }}>
                {formatTime(pomodoroTime)}
              </div>
              {isTimerRunning && (
                <div className="text-xs text-muted-foreground mt-1">
                  Timer is running...
                </div>
              )}
            </div>
            
            {/* Controls */}
            <div className="flex justify-center gap-2">
              <Button
                size="sm"
                variant={isTimerRunning ? "secondary" : "default"}
                onClick={isTimerRunning ? pauseTimer : startTimer}
                className="flex items-center gap-1"
                style={!isTimerRunning ? {
                  backgroundColor: isBreakTime ? 'var(--chart-2)' : 'var(--primary)',
                  color: 'var(--primary-foreground)'
                } : {}}
              >
                {isTimerRunning ? (
                  <>
                    <Pause className="h-3 w-3" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="h-3 w-3" />
                    Start
                  </>
                )}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={resetTimer}
                className="flex items-center gap-1"
              >
                <RotateCcw className="h-3 w-3" />
                Reset
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
