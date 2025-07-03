"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { updateUserStreak } from "@/actions/users";
import { logStudyActivity } from "@/actions/study";
import { grantBonusGenerations } from "@/actions/billing";
import { toast } from "sonner";
import { 
  Calendar, 
  Clock, 
  Target, 
  BookOpen, 
  TrendingUp, 
  Flame,
  AlertTriangle,
  CheckCircle,
  Brain,
  FileText,
  Sparkles,
  Network
} from "lucide-react";
import UserProfileSetup from "./UserProfileSetup";
import SubjectManager from "./SubjectManager";
import StudyPlanGenerator from "./StudyPlanGenerator";
import QuizGenerator from "./QuizGenerator";
import ConceptMapGenerator from "./ConceptMapGenerator";
import SubjectQuizModal from "./SubjectQuizModal";
import AIModal from "./AIModal";

interface StudyDashboardProps {
  user: {
    id: string;
    email: string;
    displayName?: string;
    studyStyle: "VISUAL" | "READING" | "PRACTICE" | "TEACHING" | "AUDIO";
    dailyStudyTime: number;
    streakCount: number;
    lastActive: Date;
  };
  subjects: Array<{
    id: string;
    name: string;
    examDate: Date | null;
    quizFrequency: number;
    createAt: Date;
    updatedAt: Date;
    notes: Array<{
      id: string;
      title: string;
      text: string;
      createAt: Date;
    }>;
  }>;
  studyLogs: Array<{
    id: string;
    actionType: string;
    timestamp: Date;
    subject?: {
      name: string;
    };
  }>;
  billingInfo?: {
    planType: "FREE" | "BASIC" | "PREMIUM";
    dailyGenerationsUsed: number;
    remaining: number;
    limit: number;
  };
}

export default function StudyDashboard({ user, subjects, studyLogs, billingInfo }: StudyDashboardProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [motivationalQuote, setMotivationalQuote] = useState("");
  const [selectedSubjectForQuiz, setSelectedSubjectForQuiz] = useState<{
    name: string;
    notes: Array<{ id: string; title: string; text: string; }>;
  } | null>(null);
  const [showSubjectQuiz, setShowSubjectQuiz] = useState(false);
  const [selectedSubjectForAI, setSelectedSubjectForAI] = useState<{
    name: string;
    notes: Array<{ id: string; title: string; text: string; }>;
  } | null>(null);
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiAction, setAiAction] = useState<"summarize" | "quiz" | "studyPlan" | "conceptMap">("summarize");
  const [aiResult, setAiResult] = useState<string | null>(null);
  const [isAILoading, setIsAILoading] = useState(false);
  const [currentSubjects, setCurrentSubjects] = useState(subjects);
  
  // Pomodoro Timer State
  const [pomodoroTime, setPomodoroTime] = useState(25 * 60); // 25 minutes in seconds
  const [isBreakTime, setIsBreakTime] = useState(false);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(null);
  const [currentStudyLogs, setCurrentStudyLogs] = useState(studyLogs);

  useEffect(() => {
    // Update user streak on component mount (handle errors gracefully)
    const updateStreak = async () => {
      try {
        await updateUserStreak(user.id);
      } catch (error) {
        console.error("Error updating user streak:", error);
        // Continue without breaking the app
      }
    };
    updateStreak();
    
    // Set motivational quote
    const quotes = [
      "The only way to do great work is to love what you do. - Steve Jobs",
      "Success is not final, failure is not fatal: it is the courage to continue that counts. - Winston Churchill",
      "The future belongs to those who believe in the beauty of their dreams. - Eleanor Roosevelt",
      "Education is the most powerful weapon which you can use to change the world. - Nelson Mandela",
      "The expert in anything was once a beginner. - Helen Hayes"
    ];
    setMotivationalQuote(quotes[Math.floor(Math.random() * quotes.length)]);
  }, [user.id]);

  // Update local state when props change (for real-time updates)
  useEffect(() => {
    setCurrentSubjects(subjects);
  }, [subjects]);

  useEffect(() => {
    setCurrentStudyLogs(studyLogs);
  }, [studyLogs]);

  // Auto-refresh data every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      // This will trigger a re-render when the parent component updates the props
      // The actual data fetching happens in the parent component (page.tsx)
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const getUpcomingExams = () => {
    const today = new Date();
    return currentSubjects
      .filter(subject => subject.examDate && subject.examDate > today)
      .sort((a, b) => (a.examDate?.getTime() || 0) - (b.examDate?.getTime() || 0))
      .slice(0, 3);
  };

  const getDaysUntilExam = (examDate: Date) => {
    const today = new Date();
    const diffTime = examDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getRecentActivity = () => {
    return currentStudyLogs.slice(0, 5);
  };

  const getStudySuggestions = () => {
    // Simple basic suggestion - no complex logic
    if (currentSubjects.length === 0) {
      return [];
    }
    
    return [{
      type: "info",
      message: "Create notes and take quizzes to improve your learning. Stay consistent with daily study sessions.",
      action: "Get started",
      priority: 1,
      icon: "💡"
    }];
  };

  const handleStudySuggestion = (suggestion: {
    type: string;
    message: string;
    action: string;
    subjectId?: string;
    priority: number;
    icon?: string;
  }) => {
    // Simple basic action - just show a toast message
    if (suggestion.action === "Get started") {
      toast.success("Start by creating subjects and notes to begin your study journey!");
    }
  };

  const handleSubjectAIAction = (action: "summarize" | "quiz" | "studyPlan" | "conceptMap", subject: {
    id: string;
    name: string;
    examDate: Date | null;
    quizFrequency: number;
    createAt: Date;
    updatedAt: Date;
    notes: Array<{
      id: string;
      title: string;
      text: string;
      createAt: Date;
    }>;
  }) => {
    setSelectedSubjectForAI({
      name: subject.name,
      notes: subject.notes.map((note: { id: string; title: string; text: string; createAt: Date }) => ({
        id: note.id,
        title: note.title || "Untitled Note",
        text: note.text
      }))
    });
    setAiAction(action);
    setShowAIModal(true);
  };

  const handleAIModalClose = () => {
    setShowAIModal(false);
    setSelectedSubjectForAI(null);
    setAiResult(null);
    // Refresh the page to update AI generations count
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  const handleSubjectQuizClose = () => {
    setShowSubjectQuiz(false);
    setSelectedSubjectForQuiz(null);
    // Refresh the page to update AI generations count
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  const handleStudyAction = async (actionType: "NOTE_CREATED" | "NOTE_UPDATED" | "QUIZ_TAKEN" | "STUDY_PLAN_COMPLETED" | "SUBJECT_VIEWED", subjectId?: string) => {
    try {
      await logStudyActivity(user.id, actionType, subjectId);
      toast.success("Activity logged!");
    } catch (error) {
      console.error("Error logging activity:", error);
    }
  };

  // State for streak reward system
  const [lastClaimDate, setLastClaimDate] = useState<Date | null>(null);
  const [canClaimReward, setCanClaimReward] = useState(true);

  // Check if user can claim daily reward (24 hour cooldown)
  useEffect(() => {
    const checkClaimEligibility = () => {
      const lastClaim = localStorage.getItem(`lastClaim_${user.id}`);
      if (lastClaim) {
        const lastClaimTime = new Date(lastClaim);
        const now = new Date();
        const hoursSinceLastClaim = (now.getTime() - lastClaimTime.getTime()) / (1000 * 60 * 60);
        
        if (hoursSinceLastClaim < 24) {
          setCanClaimReward(false);
          setLastClaimDate(lastClaimTime);
        } else {
          setCanClaimReward(true);
          setLastClaimDate(null);
        }
      }
    };

    checkClaimEligibility();
    // Check every minute for real-time updates
    const interval = setInterval(checkClaimEligibility, 60000);
    return () => clearInterval(interval);
  }, [user.id]);

  const handleClaimReward = async () => {
    if (!canClaimReward) return;

    try {
      const now = new Date();
      localStorage.setItem(`lastClaim_${user.id}`, now.toISOString());
      setCanClaimReward(false);
      setLastClaimDate(now);
      
      // Update streak count
      await updateUserStreak(user.id);
      
      // Grant bonus AI generations
      await grantBonusGenerations(user.id, 2);
      
      toast.success("🔥 Daily streak reward claimed! +2 AI generations!");
      
      // Trigger a refresh of the parent component data
      window.location.reload();
    } catch (error) {
      console.error("Error claiming reward:", error);
      toast.error("Failed to claim reward. Please try again.");
    }
  };

  const getTimeUntilNextClaim = () => {
    if (!lastClaimDate) return null;
    
    const now = new Date();
    const nextClaimTime = new Date(lastClaimDate.getTime() + 24 * 60 * 60 * 1000);
    const timeUntil = nextClaimTime.getTime() - now.getTime();
    
    if (timeUntil <= 0) return null;
    
    const hours = Math.floor(timeUntil / (1000 * 60 * 60));
    const minutes = Math.floor((timeUntil % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  };

  // Pomodoro Timer Functions
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

  return (
    <div className="space-y-6">
      {/* Enhanced Header with Streak Visualization and Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Enhanced Streak Card with Reward System */}
        <Card className="border-2" style={{ borderColor: 'var(--primary)', backgroundColor: 'var(--card)' }}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Flame className="size-5" style={{ color: 'var(--primary)' }} />
                  <span className="text-sm font-medium" style={{ color: 'var(--primary)' }}>Study Streak</span>
                </div>
                <div className="text-3xl font-bold" style={{ color: 'var(--primary)' }}>
                  {user.streakCount}
                </div>
                <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                  day{user.streakCount !== 1 ? 's' : ''} in a row
                </p>
              </div>
              <div className="flex flex-col items-center">
                {user.streakCount >= 7 && (
                  <Badge variant="secondary" className="mb-2" style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)' }}>
                    🔥 On Fire!
                  </Badge>
                )}
                <div className="flex gap-1 mb-3">
                  {Array.from({length: Math.min(user.streakCount, 7)}, (_, i) => (
                    <div key={i} className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--primary)' }}></div>
                  ))}
                  {user.streakCount > 7 && (
                    <span className="text-xs ml-1" style={{ color: 'var(--primary)' }}>+{user.streakCount - 7}</span>
                  )}
                </div>
                
                {/* Daily Reward Button */}
                <Button
                  size="sm"
                  variant={canClaimReward ? "default" : "outline"}
                  onClick={handleClaimReward}
                  disabled={!canClaimReward}
                  className="text-xs px-2 py-1 h-auto"
                  style={canClaimReward ? { backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)' } : {}}
                >
                  {canClaimReward ? (
                    <>
                      <Sparkles className="size-3 mr-1" />
                      Claim +2 AI
                    </>
                  ) : (
                    <>
                      <Clock className="size-3 mr-1" />
                      {getTimeUntilNextClaim()}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Enhanced AI Generations Card */}
        {billingInfo && (
          <Card className={`border-2 ${billingInfo.remaining <= 2 ? '' : ''}`} style={{ 
            borderColor: billingInfo.remaining <= 2 ? 'var(--destructive)' : 'var(--secondary)', 
            backgroundColor: 'var(--card)' 
          }}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="size-5" style={{ color: 'var(--primary)' }} />
                    <span className="text-sm font-medium" style={{ color: 'var(--card-foreground)' }}>AI Generations</span>
                  </div>
                  <div className="text-3xl font-bold" style={{ color: 'var(--primary)' }}>
                    {billingInfo.remaining === Infinity ? "∞" : billingInfo.remaining}
                  </div>
                  <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                    remaining today
                  </p>
                </div>
                <div className="text-right">
                  <Badge variant="secondary" className="mb-2" style={{ backgroundColor: 'var(--secondary)', color: 'var(--secondary-foreground)' }}>
                    {billingInfo.planType}
                  </Badge>
                  <div className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                    {billingInfo.dailyGenerationsUsed} used
                  </div>
                  {billingInfo.remaining <= 2 && billingInfo.planType !== "PREMIUM" && (
                    <div className="text-xs mt-1 font-medium" style={{ color: 'var(--destructive)' }}>
                      Upgrade for unlimited
                    </div>
                  )}
                  {billingInfo.limit !== Infinity && (
                    <div className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>
                      of {billingInfo.limit} daily
                    </div>
                  )}
                </div>
              </div>
              {billingInfo.limit !== Infinity && (
                <div className="mt-3">
                  <div className="w-full rounded-full h-2" style={{ backgroundColor: 'var(--muted)' }}>
                    <div 
                      className="h-2 rounded-full transition-all duration-300" 
                      style={{
                        backgroundColor: billingInfo.remaining <= 2 ? 'var(--destructive)' : 'var(--primary)',
                        width: `${Math.min((billingInfo.dailyGenerationsUsed / billingInfo.limit) * 100, 100)}%`
                      }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>
                    <span>0</span>
                    <span>{billingInfo.limit}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Study Style & Time Card */}
        <Card className="border-2" style={{ borderColor: 'var(--secondary)', backgroundColor: 'var(--card)' }}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Brain className="size-5" style={{ color: 'var(--primary)' }} />
                  <span className="text-sm font-medium" style={{ color: 'var(--card-foreground)' }}>Study Style</span>
                </div>
                <div className="text-2xl font-bold" style={{ color: 'var(--primary)' }}>
                  {user.studyStyle}
                </div>
                <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                  {user.dailyStudyTime}m daily goal
                </p>
              </div>
              <div className="text-right">
                <Badge variant="secondary" style={{ backgroundColor: 'var(--secondary)', color: 'var(--secondary-foreground)' }}>
                  Optimized
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Progress Summary Card */}
        <Card className="border-2" style={{ borderColor: 'var(--secondary)', backgroundColor: 'var(--card)' }}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="size-5" style={{ color: 'var(--primary)' }} />
                  <span className="text-sm font-medium" style={{ color: 'var(--card-foreground)' }}>Progress</span>
                </div>
                <div className="text-2xl font-bold" style={{ color: 'var(--primary)' }}>
                  {currentSubjects.reduce((total, subject) => total + subject.notes.length, 0)}
                </div>
                <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                  notes across {currentSubjects.length} subjects
                </p>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>
                  {getRecentActivity().length} recent activities
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Motivational Quote and Pomodoro Timer Row */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Motivational Quote */}
        <Card style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="italic font-medium" style={{ color: 'var(--muted-foreground)' }}>"{motivationalQuote}"</p>
            </div>
          </CardContent>
        </Card>

        {/* Pomodoro Timer */}
        <Card style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
          <CardContent className="p-4">
            <div className="text-center space-y-3">
              <div className="flex items-center justify-center gap-2">
                <Clock className="size-4" style={{ color: 'var(--primary)' }} />
                <span className="text-sm font-medium" style={{ color: 'var(--card-foreground)' }}>
                  {isBreakTime ? "Break Time" : "Focus Time"}
                </span>
              </div>
              
              <div className="text-3xl font-bold" style={{ 
                color: isBreakTime ? 'var(--chart-2)' : 'var(--primary)' 
              }}>
                {formatTime(pomodoroTime)}
              </div>
              
              <div className="flex justify-center gap-2">
                <Button
                  size="sm"
                  variant={isTimerRunning ? "secondary" : "default"}
                  onClick={isTimerRunning ? pauseTimer : startTimer}
                  style={!isTimerRunning ? {
                    backgroundColor: 'var(--primary)',
                    color: 'var(--primary-foreground)'
                  } : {}}
                >
                  {isTimerRunning ? "Pause" : "Start"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={resetTimer}
                  style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}
                >
                  Reset
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Simple Study Tip */}
      {getStudySuggestions().length > 0 && (
        <Card style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="size-5" style={{ color: 'var(--primary)' }} />
              Study Tip
            </CardTitle>
          </CardHeader>
          <CardContent>
            {getStudySuggestions().map((suggestion, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: 'var(--muted)' + '30' }}>
                <div className="flex items-center gap-3">
                  <div className="text-lg">{suggestion.icon}</div>
                  <span className="text-sm" style={{ color: 'var(--card-foreground)' }}>
                    {suggestion.message}
                  </span>
                </div>
                <Button 
                  size="sm" 
                  variant="outline"
                  style={{ borderColor: 'var(--primary)', color: 'var(--primary)' }}
                  onClick={() => handleStudySuggestion(suggestion)}
                >
                  {suggestion.action}
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="subjects">Subjects</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Upcoming Exams */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="size-5" style={{ color: 'var(--primary)' }} />
                Upcoming Exams
              </CardTitle>
              <CardDescription>
                Keep track of your exam schedule and preparation deadlines
              </CardDescription>
            </CardHeader>
            <CardContent>
              {getUpcomingExams().length > 0 ? (
                <div className="space-y-3">
                  {getUpcomingExams().map((subject) => {
                    const daysUntil = getDaysUntilExam(subject.examDate!);
                    return (
                      <div key={subject.id} className="flex items-center justify-between p-4 rounded-lg border" style={{ backgroundColor: 'var(--muted)' + '20' }}>
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full`} style={{ 
                            backgroundColor: daysUntil <= 3 ? 'var(--destructive)' : 
                                           daysUntil <= 7 ? 'var(--chart-2)' : 
                                           'var(--primary)'
                          }}></div>
                          <div>
                            <div className="font-medium" style={{ color: 'var(--card-foreground)' }}>{subject.name}</div>
                            <div className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                              {subject.examDate?.toLocaleDateString('en-US', { 
                                weekday: 'long', 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                              })}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant={daysUntil <= 3 ? "destructive" : daysUntil <= 7 ? "secondary" : "outline"}>
                            {daysUntil} day{daysUntil === 1 ? '' : 's'}
                          </Badge>
                          <div className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>
                            {subject.notes.length} notes
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="size-12 mx-auto mb-4" style={{ color: 'var(--muted-foreground)' + '50' }} />
                  <p style={{ color: 'var(--muted-foreground)' }}>No upcoming exams scheduled.</p>
                  <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>Add exam dates in the Subjects tab to get reminders and study suggestions.</p>
                </div>
              )}
            </CardContent>
          </Card>

                    {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="size-5" style={{ color: 'var(--primary)' }} />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {getRecentActivity().length > 0 ? (
                <div className="space-y-2">
                  {getRecentActivity().map((log) => (
                    <div key={log.id} className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--primary)' }} />
                      <span style={{ color: 'var(--muted-foreground)' }}>
                        {log.actionType.replace(/_/g, ' ').toLowerCase()}
                      </span>
                      {log.subject && (
                        <span style={{ color: 'var(--muted-foreground)' }}>in {log.subject.name}</span>
                      )}
                      <span style={{ color: 'var(--muted-foreground)' }}>
                        {new Date(log.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: 'var(--muted-foreground)' }}>No recent activity.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subjects" className="space-y-4">
          <div className="space-y-6">
            <SubjectManager userId={user.id} subjects={currentSubjects} />
            
            {/* Subject Quiz Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="size-5" />
                  Subject Quizzes
                </CardTitle>
                <CardDescription>
                  Test your knowledge across all notes in each subject
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {currentSubjects.map((subject) => (
                    <div key={subject.id} className="p-4 border rounded-lg space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{subject.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {subject.notes.length} note{subject.notes.length !== 1 ? 's' : ''}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedSubjectForQuiz({
                              name: subject.name,
                              notes: subject.notes.map(note => ({
                                id: note.id,
                                title: note.title || "Untitled Note",
                                text: note.text
                              }))
                            });
                            setShowSubjectQuiz(true);
                          }}
                          disabled={subject.notes.length === 0}
                        >
                          <BookOpen className="size-4 mr-2" />
                          Take Quiz
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>



        <TabsContent value="profile" className="space-y-4">
          <UserProfileSetup
            userId={user.id}
            currentStudyStyle={user.studyStyle}
            currentDailyStudyTime={user.dailyStudyTime}
          />
        </TabsContent>
      </Tabs>

      {/* Subject Quiz Modal */}
      {selectedSubjectForQuiz && (
        <SubjectQuizModal
          isOpen={showSubjectQuiz}
          onClose={handleSubjectQuizClose}
          userId={user.id}
          subjectId={currentSubjects.find(s => s.name === selectedSubjectForQuiz.name)?.id || ""}
          subjectName={selectedSubjectForQuiz.name}
          subjectNotes={selectedSubjectForQuiz.notes}
        />
      )}

      {/* AI Modal for Subject Actions */}
      {selectedSubjectForAI && (
        <AIModal
          isOpen={showAIModal}
          onClose={handleAIModalClose}
          action={aiAction}
          noteContent={selectedSubjectForAI.notes.map(note => 
            `Note: ${note.title}\n${note.text}`
          ).join('\n\n')}
          noteTitle={`${selectedSubjectForAI.name} - Subject ${aiAction.charAt(0).toUpperCase() + aiAction.slice(1).replace('-', ' ')}`}
          aiResult={aiResult}
          isLoading={isAILoading}
        />
      )}
    </div>
  );
} 