import { getUser } from "@/auth/server";
import NewNoteButton from "@/components/NewNoteButton";
import NoteTextInput from "@/components/NoteTextInput";
import NotesPage from "@/components/NotesPage";
import UserProfileSetupWrapper from "@/components/UserProfileSetupWrapper";
import StudyDashboard from "@/components/StudyDashboard";
import { prisma } from "@/db/prisma";
import { updateUserStreak } from "@/actions/users";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Type for the auth user
type AuthUser = {
  id: string;
  email?: string;
};

// Type for note display
type DisplayNote = {
  id: string;
  title: string;
  content: string;
  subject: { name: string };
  createdAt: Date;
  updatedAt: Date;
};

// Type for user data with included relations (matching Prisma return type)
type UserWithRelations = {
  id: string;
  email: string;
  displayName: string | null;
  studyStyle: "VISUAL" | "READING" | "PRACTICE" | "TEACHING" | "AUDIO";
  dailyStudyTime: number;
  streakCount: number;
  lastActive: Date;
  createAt: Date;
  updatedAt: Date;
  subjects: Array<{
    id: string;
    name: string;
    examDate: Date | null;
    quizFrequency: number;
    createAt: Date;
    updatedAt: Date;
    notes: Array<{
      id: string;
      title?: string; // Make title optional to match Prisma schema
      text: string;
      sourceType: "MANUAL" | "PDF" | "HANDWRITTEN";
      authorId: string;
      subjectId: string | null;
      createAt: Date;
      updatedAt: Date;
    }>;
  }>;
  studyLogs: Array<{
    id: string;
    userId: string;
    subjectId: string | null;
    noteId: string | null;
    actionType: string;
    timestamp: Date;
    subject: {
      name: string;
    } | null;
  }>;
};

type Props = {
  searchParams:Promise<{[key:string]:string | string[] | undefined}>
}

async function HomePage({searchParams}:Props){
  const noteIdParam = (await searchParams).noteId || ""
  let user: AuthUser | null = null;
  let userData: UserWithRelations | null = null;
  let needsProfileSetup = false;

  try {
    user = await getUser();
  } catch (error) {
    // Handle auth session missing or other auth errors gracefully
    if (error instanceof Error && error.message.includes('Missing Supabase environment variables')) {
      return (
        <div className="flex h-full flex-col items-center justify-center gap-4">
          <h1 className="text-2xl font-bold">Configuration Error</h1>
          <p className="text-muted-foreground">Supabase configuration is missing. Please check your environment variables.</p>
        </div>
      );
    }
    // Continue without user - will show login prompt
  }

  if (!user) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold">Welcome to NoteJewel</h1>
        <p className="text-muted-foreground">Please sign in to access your study assistant</p>
      </div>
    );
  }

  try {
    // First, try to get user data with the new schema
    const userDataResult = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        subjects: {
          include: {
            notes: {
              orderBy: { updatedAt: "desc" },
            },
          },
          orderBy: { createAt: "desc" },
        },
        studyLogs: {
          include: {
            subject: {
              select: { name: true },
            },
          },
          orderBy: { timestamp: "desc" },
          take: 10,
        },
      },
    });
    
    userData = userDataResult as UserWithRelations;
    
    // Update user streak on login
    await updateUserStreak(user.id);
    
    // Refetch user data to get updated streak count
    const updatedUserDataResult = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        subjects: {
          include: {
            notes: {
              orderBy: { updatedAt: "desc" },
            },
          },
          orderBy: { createAt: "desc" },
        },
        studyLogs: {
          include: {
            subject: {
              select: { name: true },
            },
          },
          orderBy: { timestamp: "desc" },
          take: 10,
        },
      },
    });
    
    userData = updatedUserDataResult as UserWithRelations;
    
    // If user doesn't exist in database, create them with default subjects
    if (!userData) {
      // Create default subjects for new users
      const defaultSubjects = [
        { name: "General Notes", examDate: null, quizFrequency: 7 },
        { name: "Mathematics", examDate: null, quizFrequency: 7 },
        { name: "Science", examDate: null, quizFrequency: 7 },
        { name: "Literature", examDate: null, quizFrequency: 7 },
      ];

      const newUserData = await prisma.user.create({
        data: {
          id: user.id,
          email: user.email || '',
          studyStyle: "READING",
          dailyStudyTime: 60,
          streakCount: 0,
          lastActive: new Date(),
          subjects: {
            create: defaultSubjects
          }
        },
        include: {
          subjects: {
            include: {
              notes: {
                orderBy: { updatedAt: "desc" },
              },
            },
            orderBy: { createAt: "desc" },
          },
          studyLogs: {
            include: {
              subject: {
                select: { name: true },
              },
            },
            orderBy: { timestamp: "desc" },
            take: 10,
          },
        },
      });
      userData = newUserData as UserWithRelations;
      needsProfileSetup = true;
    }
    // If user exists but doesn't have new schema fields, migrate them
    else if (!userData.studyStyle) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          studyStyle: "READING",
          dailyStudyTime: 60,
          streakCount: 0,
          lastActive: new Date(),
        },
      });
      
      // Fetch the updated user data
      const updatedUserData = await prisma.user.findUnique({
        where: { id: user.id },
        include: {
          subjects: {
            include: {
              notes: {
                orderBy: { updatedAt: "desc" },
              },
            },
            orderBy: { createAt: "desc" },
          },
          studyLogs: {
            include: {
              subject: {
                select: { name: true },
              },
            },
            orderBy: { timestamp: "desc" },
            take: 10,
          },
        },
      });
      userData = updatedUserData as UserWithRelations;
      needsProfileSetup = true;
    }
  } catch (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold">Database Error</h1>
        <p className="text-muted-foreground">Unable to load your data. Please try again.</p>
        <p className="text-xs text-muted-foreground">
          Error: {error instanceof Error ? error.message : 'Unknown error'}
        </p>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold">Error</h1>
        <p className="text-muted-foreground">User data not found</p>
      </div>
    );
  }

  // Get all notes from all subjects
  const allNotes: DisplayNote[] = userData.subjects?.flatMap((subject: UserWithRelations['subjects'][0]) => 
    subject.notes.map((note: UserWithRelations['subjects'][0]['notes'][0]) => ({
      id: note.id,
      title: note.title || "Untitled Note",
      content: note.text,
      subject: { name: subject.name },
      createdAt: note.createAt,
      updatedAt: note.updatedAt
    }))
  ) || [];

  return (
    <div className="flex h-full flex-col gap-4 sm:gap-6 p-3 sm:p-6">
      <Tabs defaultValue="study" className="w-full">
        <div className="flex w-full max-w-7xl mx-auto flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-0">
          <div className="flex items-center gap-4">
            <h2 className="text-xl sm:text-2xl font-semibold text-foreground/80">NoteJewel</h2>
            <div className="hidden sm:block h-6 w-px bg-border" />
            <p className="hidden sm:block text-sm text-muted-foreground">Your AI-Powered Study Assistant</p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            {/* New Note button removed from header */}
          </div>
        </div>

        <TabsList className="grid w-full max-w-7xl mx-auto grid-cols-2 mt-6">
          <TabsTrigger value="study">Study Dashboard</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>

        <TabsContent value="notes" className="mt-6">
          <NotesPage 
            notes={allNotes}
            selectedNoteId=""
            selectedNoteText=""
            user={user}
            subjects={userData.subjects?.map(subject => ({
              id: subject.id,
              name: subject.name
            })) || []}
          />
        </TabsContent>

        <TabsContent value="study" className="mt-6">
          <div className="w-full max-w-7xl mx-auto">
            <StudyDashboard
              user={{
                id: userData.id,
                email: userData.email,
                displayName: userData.displayName || undefined,
                studyStyle: userData.studyStyle || "READING",
                dailyStudyTime: userData.dailyStudyTime || 60,
                streakCount: userData.streakCount || 0,
                lastActive: userData.lastActive || new Date(),
              }}
              subjects={userData.subjects?.map(subject => ({
                id: subject.id,
                name: subject.name,
                examDate: subject.examDate,
                quizFrequency: subject.quizFrequency,
                createAt: subject.createAt,
                updatedAt: subject.updatedAt,
                notes: subject.notes.map(note => ({
                  id: note.id,
                  title: note.title || "Untitled Note",
                  text: note.text,
                  createAt: note.createAt,
                }))
              })) || []}
              studyLogs={userData.studyLogs?.map(log => ({
                id: log.id,
                actionType: log.actionType,
                timestamp: log.timestamp,
                subject: log.subject || undefined,
              })) || []}
            />
          </div>
        </TabsContent>
      </Tabs>

      {/* User Profile Setup Modal for old users */}
      <UserProfileSetupWrapper
        userId={userData.id}
        currentStudyStyle={userData.studyStyle as "VISUAL" | "READING" | "PRACTICE" | "TEACHING" | "AUDIO"}
        currentDailyStudyTime={userData.dailyStudyTime}
        needsSetup={needsProfileSetup}
      />
    </div>
  )
}

export default HomePage;
