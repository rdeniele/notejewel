"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { updateUserStreak } from "@/actions/users";
import { logStudyActivity } from "@/actions/study";
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
}

export default function StudyDashboard({ user, subjects, studyLogs }: StudyDashboardProps) {
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
  const [currentStudyLogs, setCurrentStudyLogs] = useState(studyLogs);

  useEffect(() => {
    // Update user streak on component mount
    updateUserStreak(user.id);
    
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
    const suggestions: Array<{
      type: string;
      message: string;
      action: string;
      subjectId?: string;
    }> = [];
    const today = new Date();
    
    // Check for upcoming exams
    const upcomingExams = getUpcomingExams();
    if (upcomingExams.length > 0) {
      const nextExam = upcomingExams[0];
      const daysUntil = getDaysUntilExam(nextExam.examDate!);
      if (daysUntil <= 3) {
        suggestions.push({
          type: "urgent",
          message: `Your ${nextExam.name} exam is in ${daysUntil} day${daysUntil === 1 ? '' : 's'}!`,
          action: "Generate a study plan",
          subjectId: nextExam.id
        });
      } else if (daysUntil <= 7) {
        suggestions.push({
          type: "warning",
          message: `Your ${nextExam.name} exam is in ${daysUntil} days.`,
          action: "Take a subject quiz",
          subjectId: nextExam.id
        });
      }
    }

    // Check for subjects that haven't been studied recently
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const inactiveSubjects = currentSubjects.filter(subject => {
      const lastActivity = currentStudyLogs
        .filter(log => log.subject?.name === subject.name)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
      
      return !lastActivity || new Date(lastActivity.timestamp) < weekAgo;
    });

    if (inactiveSubjects.length > 0) {
      suggestions.push({
        type: "info",
        message: `You haven't studied ${inactiveSubjects[0].name} this week.`,
        action: "Take a subject quiz",
        subjectId: inactiveSubjects[0].id
      });
    }

    // Suggest subjects with many notes for comprehensive quizzes
    const subjectsWithManyNotes = currentSubjects
      .filter(subject => subject.notes.length >= 3)
      .sort((a, b) => b.notes.length - a.notes.length)
      .slice(0, 2);

    subjectsWithManyNotes.forEach(subject => {
      suggestions.push({
        type: "success",
        message: `${subject.name} has ${subject.notes.length} notes ready for a comprehensive quiz.`,
        action: "Take a subject quiz",
        subjectId: subject.id
      });
    });

    // Suggest study plan for subjects with upcoming exams
    const subjectsNeedingStudyPlans = currentSubjects
      .filter(subject => subject.examDate && getDaysUntilExam(subject.examDate) <= 14)
      .slice(0,1);

    subjectsNeedingStudyPlans.forEach(subject => {
      suggestions.push({
        type: "info",
        message: `Create a study plan for ${subject.name} (exam in ${getDaysUntilExam(subject.examDate!)} days).`,
        action: "Generate study plan",
        subjectId: subject.id
      });
    });

    // Suggest concept mapping for subjects with many interconnected notes
    const subjectsForConceptMaps = currentSubjects
      .filter(subject => subject.notes.length >= 5)
      .slice(0, 1);

    subjectsForConceptMaps.forEach(subject => {
      suggestions.push({
        type: "info",
        message: `${subject.name} has ${subject.notes.length} notes - perfect for creating a concept map.`,
        action: "Generate concept map",
        subjectId: subject.id
      });
    });

    return suggestions;
  };

  const handleStudySuggestion = (suggestion: {
    type: string;
    message: string;
    action: string;
    subjectId?: string;
  }) => {
    if (suggestion.action === "Take a subject quiz" && suggestion.subjectId) {
      const subject = currentSubjects.find(s => s.id === suggestion.subjectId);
      if (subject) {
        setSelectedSubjectForQuiz({
          name: subject.name,
          notes: subject.notes.map(note => ({
            id: note.id,
            title: note.title || "Untitled Note",
            text: note.text
          }))
        });
        setShowSubjectQuiz(true);
      }
    } else if (suggestion.action === "Generate a study plan" && suggestion.subjectId) {
      const subject = currentSubjects.find(s => s.id === suggestion.subjectId);
      if (subject) {
        setSelectedSubjectForAI({
          name: subject.name,
          notes: subject.notes.map(note => ({
            id: note.id,
            title: note.title || "Untitled Note",
            text: note.text
          }))
        });
        setAiAction("studyPlan");
        setShowAIModal(true);
      }
    } else if (suggestion.action === "Generate concept map" && suggestion.subjectId) {
      const subject = currentSubjects.find(s => s.id === suggestion.subjectId);
      if (subject) {
        setSelectedSubjectForAI({
          name: subject.name,
          notes: subject.notes.map(note => ({
            id: note.id,
            title: note.title || "Untitled Note",
            text: note.text
          }))
        });
        setAiAction("conceptMap");
        setShowAIModal(true);
      }
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

  const handleStudyAction = async (actionType: "NOTE_CREATED" | "NOTE_UPDATED" | "QUIZ_TAKEN" | "STUDY_PLAN_COMPLETED" | "SUBJECT_VIEWED", subjectId?: string) => {
    try {
      await logStudyActivity(user.id, actionType, subjectId);
      toast.success("Activity logged!");
    } catch (error) {
      console.error("Error logging activity:", error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Streak and Quote */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Flame className="size-5 text-orange-500" />
            <span className="text-lg font-semibold">
              {user.streakCount} day{user.streakCount !== 1 ? 's' : ''} streak
            </span>
          </div>
          <Badge variant="secondary" className="gap-1">
            <Brain className="size-3" />
            {user.studyStyle}
          </Badge>
        </div>
        <div className="text-sm text-muted-foreground max-w-md text-right">
          "{motivationalQuote}"
        </div>
      </div>

      {/* Study Suggestions */}
      {getStudySuggestions().length > 0 && (
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="size-5" />
              Study Suggestions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {getStudySuggestions().map((suggestion, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2">
                    {suggestion.type === "urgent" ? (
                      <AlertTriangle className="size-4 text-red-500" />
                    ) : suggestion.type === "warning" ? (
                      <AlertTriangle className="size-4 text-yellow-500" />
                    ) : (
                      <CheckCircle className="size-4 text-blue-500" />
                    )}
                    <span className="text-sm">{suggestion.message}</span>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleStudySuggestion(suggestion)}
                  >
                    {suggestion.action}
                  </Button>
                </div>
              ))}
            </div>
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
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Stats Cards */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Subjects</CardTitle>
                <BookOpen className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{currentSubjects.length}</div>
                <p className="text-xs text-muted-foreground">
                  Active study areas
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Notes</CardTitle>
                <FileText className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {currentSubjects.reduce((total, subject) => total + subject.notes.length, 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Study materials created
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Daily Study Time</CardTitle>
                <Clock className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{user.dailyStudyTime}m</div>
                <p className="text-xs text-muted-foreground">
                  Available per day
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Upcoming Exams */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="size-5" />
                Upcoming Exams
              </CardTitle>
            </CardHeader>
            <CardContent>
              {getUpcomingExams().length > 0 ? (
                <div className="space-y-3">
                  {getUpcomingExams().map((subject) => {
                    const daysUntil = getDaysUntilExam(subject.examDate!);
                    return (
                      <div key={subject.id} className="flex items-center justify-between p-3 rounded-lg border">
                        <div>
                          <div className="font-medium">{subject.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {subject.examDate?.toLocaleDateString()}
                          </div>
                        </div>
                        <Badge variant={daysUntil <= 3 ? "destructive" : daysUntil <= 7 ? "secondary" : "outline"}>
                          {daysUntil} day{daysUntil === 1 ? '' : 's'}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-muted-foreground">No upcoming exams scheduled.</p>
              )}
            </CardContent>
          </Card>

                    {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="size-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {getRecentActivity().length > 0 ? (
                <div className="space-y-2">
                  {getRecentActivity().map((log) => (
                    <div key={log.id} className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                      <span className="text-muted-foreground">
                        {log.actionType.replace(/_/g, ' ').toLowerCase()}
                      </span>
                      {log.subject && (
                        <span className="text-muted-foreground">in {log.subject.name}</span>
                      )}
                      <span className="text-muted-foreground">
                        {new Date(log.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No recent activity.</p>
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
          onClose={() => {
            setShowSubjectQuiz(false);
            setSelectedSubjectForQuiz(null);
          }}
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
          onClose={() => {
            setShowAIModal(false);
            setSelectedSubjectForAI(null);
            setAiResult(null);
          }}
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