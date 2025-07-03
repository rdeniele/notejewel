import { getUser } from "@/auth/server";
import NewNoteButton from "@/components/NewNoteButton";
import NoteTextInput from "@/components/NoteTextInput";
import NotesPage from "@/components/NotesPage";
import UserProfileSetupWrapper from "@/components/UserProfileSetupWrapper";
import StudyDashboard from "@/components/StudyDashboard";
import PricingPlans from "@/components/PricingPlans";
import FloatingPomodoroTimer from "@/components/FloatingPomodoroTimer";
import { PomodoroProvider } from "@/providers/PomodoroProvider";
import { prisma } from "@/db/prisma";
import { updateUserStreak } from "@/actions/users";
import { getUserBillingInfo } from "@/actions/billing";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "NoteJewel - AI-Powered Study Assistant | Smart Note-Taking & Learning Tools",
  description: "Transform your study experience with NoteJewel's AI-powered note-taking, personalized study plans, and intelligent learning tools. Organize notes, create study plans, and excel in your academic journey.",
  keywords: "AI study assistant, note-taking app, study planner, learning tools, academic productivity, smart notes, study analytics, educational technology, student productivity, exam preparation, learning management system",
  authors: [{ name: "NoteJewel Team" }],
  creator: "NoteJewel",
  publisher: "NoteJewel",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://notejewel.vercel.app'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: "NoteJewel - AI-Powered Study Assistant",
    description: "Transform your study experience with AI-powered note-taking, personalized study plans, and intelligent learning tools.",
    url: 'https://notejewel.vercel.app',
    siteName: 'NoteJewel',
    images: [
      {
        url: '/notesjewel.png',
        width: 1200,
        height: 630,
        alt: 'NoteJewel - AI-Powered Study Assistant',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NoteJewel - AI-Powered Study Assistant',
    description: 'Transform your study experience with AI-powered note-taking and learning tools.',
    images: ['/notesjewel.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
  },
  other: {
    'application-name': 'NoteJewel',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'apple-mobile-web-app-title': 'NoteJewel',
    'format-detection': 'telephone=no',
    'mobile-web-app-capable': 'yes',
    'msapplication-config': '/browserconfig.xml',
    'msapplication-TileColor': '#000000',
    'msapplication-tap-highlight': 'no',
  },
};

// Type for the auth user
export type AuthUser = {
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
      <div className="flex h-full flex-col gap-4 sm:gap-6 p-3 sm:p-6">
        {/* Promotional Strip */}
        <div className="w-full bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
          <div className="max-w-7xl mx-auto px-4 py-2 text-center">
            <p className="text-sm font-medium">
              📝 Simple AI Study Tools - Note Taking, Summaries & Quizzes Starting Free! 
              <span className="ml-2 px-2 py-1 bg-white/20 rounded-full text-xs font-semibold">
                Try Now
              </span>
            </p>
          </div>
        </div>
        
        {/* Hero Section */}
        <div className="flex-1 flex items-center justify-center relative">
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-grid-pattern opacity-5 pointer-events-none"></div>
          
          <div className="w-full max-w-6xl mx-auto text-center space-y-12 relative z-10">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium border border-primary/20">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              AI-Powered Learning Platform
            </div>

            {/* Main Heading */}
            <div className="space-y-6">
              <h1 className="text-5xl sm:text-7xl font-bold text-foreground leading-tight">
                Transform Your
                <span className="block bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                  Study Experience
                </span>
              </h1>
              <p className="text-xl sm:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                AI-powered note-taking, study planning, and learning tools designed to help you excel in your academic journey.
              </p>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap justify-center gap-8 text-center">
              <div className="flex flex-col items-center">
                <div className="text-3xl font-bold text-primary">AI-Powered</div>
                <div className="text-sm text-muted-foreground">Note Summaries</div>
              </div>
              <div className="flex flex-col items-center">
                <div className="text-3xl font-bold text-primary">Smart</div>
                <div className="text-sm text-muted-foreground">Quiz Generation</div>
              </div>
              <div className="flex flex-col items-center">
                <div className="text-3xl font-bold text-primary">Easy</div>
                <div className="text-sm text-muted-foreground">Organization</div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <a href="/sign-up" className="group px-8 py-4 bg-primary text-primary-foreground rounded-lg text-lg font-semibold hover:bg-primary/90 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center gap-2">
                Start Learning Today
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </a>
              <a href="/login" className="px-8 py-4 border border-border text-foreground rounded-lg text-lg font-medium hover:bg-muted/50 transition-all duration-200">
                Sign In
              </a>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap justify-center items-center gap-6 text-muted-foreground text-sm">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Start Free
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Simple AI Tools
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                No Credit Card
              </div>
            </div>
          </div>
        </div>

            {/* Feature Highlights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20">
              <div className="group p-8 bg-muted/30 border border-border rounded-2xl hover:bg-muted/50 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                <div className="w-16 h-16 bg-primary rounded-xl flex items-center justify-center mb-6 mx-auto group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-8 h-8 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3 text-center">Smart Notes</h3>
                <p className="text-muted-foreground text-center leading-relaxed">Create and organize your study notes with basic AI assistance. Simple, clean interface for note-taking.</p>
                
                {/* Feature Details */}
                <div className="mt-6 space-y-3 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Note creation & editing</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Subject organization</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>AI summaries</span>
                  </div>
                </div>

                <div className="mt-6 flex justify-center">
                  <a href="/sign-up" className="group/btn flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors duration-200 bg-primary/10 hover:bg-primary/20 px-4 py-2 rounded-lg">
                    <span>Explore Smart Notes</span>
                    <svg className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </a>
                </div>
              </div>

              <div className="group p-8 bg-muted/30 border border-border rounded-2xl hover:bg-muted/50 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                <div className="w-16 h-16 bg-primary rounded-xl flex items-center justify-center mb-6 mx-auto group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-8 h-8 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3 text-center">AI Chat & Quizzes</h3>
                <p className="text-muted-foreground text-center leading-relaxed">Get AI-generated quizzes from your notes and chat with AI about your study topics. Simple tools to test your knowledge.</p>
                
                {/* Feature Details */}
                <div className="mt-6 space-y-3 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>AI chat about notes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Quiz generation</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Study progress tracking</span>
                  </div>
                </div>

                <div className="mt-6 flex justify-center">
                  <a href="/sign-up" className="group/btn flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors duration-200 bg-primary/10 hover:bg-primary/20 px-4 py-2 rounded-lg">
                    <span>Try AI Chat</span>
                    <svg className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </a>
                </div>
              </div>

              <div className="group p-8 bg-muted/30 border border-border rounded-2xl hover:bg-muted/50 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                <div className="w-16 h-16 bg-primary rounded-xl flex items-center justify-center mb-6 mx-auto group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-8 h-8 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3 text-center">Study Dashboard</h3>
                <p className="text-muted-foreground text-center leading-relaxed">Track your study habits and organize your subjects. Simple dashboard to see your progress and manage your learning.</p>
                
                {/* Feature Details */}
                <div className="mt-6 space-y-3 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Subject management</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Study streak tracking</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Basic analytics</span>
                  </div>
                </div>

                <div className="mt-6 flex justify-center">
                  <a href="/sign-up" className="group/btn flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors duration-200 bg-primary/10 hover:bg-primary/20 px-4 py-2 rounded-lg">
                    <span>View Dashboard</span>
                    <svg className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>

            {/* Testimonials Section */}
            <div className="mt-24">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-foreground mb-4">What Students Say</h2>
                <p className="text-muted-foreground text-lg">Join thousands of students who have transformed their learning experience</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-muted/30 border border-border rounded-2xl p-6">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mr-4">
                      <span className="text-primary font-semibold">J</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">J. V.</h4>
                      <p className="text-sm text-muted-foreground">IT Student</p>
                    </div>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">"NoteJewel has completely changed how I study. The AI insights help me understand complex topics better, and the study plans keep me on track."</p>
                  <div className="flex mt-4">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                </div>
                <div className="bg-muted/30 border border-border rounded-2xl p-6">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mr-4">
                      <span className="text-primary font-semibold">J</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">J. T.</h4>
                      <p className="text-sm text-muted-foreground">Psychology Student</p>
                    </div>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">"The smart note organization and AI-powered study plans have made my exam preparation so much more effective. Highly recommended!"</p>
                  <div className="flex mt-4">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                </div>
                <div className="bg-muted/30 border border-border rounded-2xl p-6">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mr-4">
                      <span className="text-primary font-semibold">D</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">D. P.</h4>
                      <p className="text-sm text-muted-foreground">Biology Student</p>
                    </div>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">"I love how NoteJewel adapts to my learning style. The concept maps and quizzes have been invaluable for understanding complex biological concepts."</p>
                  <div className="flex mt-4">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Blog Section */}
            <div className="mt-24">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-foreground mb-4">From Our Blog</h2>
                <p className="text-muted-foreground text-lg">Latest research, study tips, and learning science from the NoteJewel team</p>
              </div>
              <div className="grid md:grid-cols-3 gap-8">
                <div className="bg-muted/30 border border-border rounded-xl overflow-hidden shadow-sm flex flex-col">
                  <a href="/blog/blog1">
                    <Image 
                      src="https://images.unsplash.com/photo-1464983953574-0892a716854b?auto=format&fit=crop&w=800&q=80" 
                      alt="How AI is Revolutionizing Student Learning" 
                      width={800}
                      height={400}
                      className="w-full h-48 object-cover" 
                    />
                  </a>
                  <div className="p-6 flex-1 flex flex-col">
                    <h3 className="text-lg font-semibold mb-2">
                      <a href="/blog/blog1">How AI is Revolutionizing Student Learning</a>
                    </h3>
                    <p className="text-muted-foreground mb-4 flex-1">Discover how artificial intelligence is transforming the way students learn, retain, and apply knowledge. Real-world examples and research included.</p>
                    <a href="/blog/blog1" className="text-primary font-medium hover:underline mt-auto">Read More →</a>
                  </div>
                </div>
                <div className="bg-muted/30 border border-border rounded-xl overflow-hidden shadow-sm flex flex-col">
                  <a href="/blog/blog2">
                    <Image 
                      src="https://images.unsplash.com/photo-1513258496099-48168024aec0?auto=format&fit=crop&w=800&q=80" 
                      alt="5 Proven Study Techniques Backed by Science" 
                      width={800}
                      height={400}
                      className="w-full h-48 object-cover" 
                    />
                  </a>
                  <div className="p-6 flex-1 flex flex-col">
                    <h3 className="text-lg font-semibold mb-2">
                      <a href="/blog/blog2">5 Proven Study Techniques Backed by Science</a>
                    </h3>
                    <p className="text-muted-foreground mb-4 flex-1">Explore evidence-based study methods that boost retention and performance. Learn what works, according to cognitive science.</p>
                    <a href="/blog/blog2" className="text-primary font-medium hover:underline mt-auto">Read More →</a>
                  </div>
                </div>
                <div className="bg-muted/30 border border-border rounded-xl overflow-hidden shadow-sm flex flex-col">
                  <a href="/blog/blog3">
                    <Image 
                      src="https://images.unsplash.com/photo-1503676382389-4809596d5290?auto=format&fit=crop&w=800&q=80" 
                      alt="The Power of Spaced Repetition for Long-Term Memory" 
                      width={800}
                      height={400}
                      className="w-full h-48 object-cover" 
                    />
                  </a>
                  <div className="p-6 flex-1 flex flex-col">
                    <h3 className="text-lg font-semibold mb-2">
                      <a href="/blog/blog3">The Power of Spaced Repetition for Long-Term Memory</a>
                    </h3>
                    <p className="text-muted-foreground mb-4 flex-1">Why do top students use spaced repetition? See the research and practical tips for using it in your own studies.</p>
                    <a href="/blog/blog3" className="text-primary font-medium hover:underline mt-auto">Read More →</a>
                  </div>
                </div>
              </div>
              <div className="flex justify-center mt-8">
                <a href="/blog" className="px-8 py-4 bg-primary text-primary-foreground rounded-lg text-lg font-semibold hover:bg-primary/90 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105">View All Blog Posts</a>
              </div>
            </div>

            {/* Social Proof */}
            <div className="mt-16 text-center">
              <p className="text-muted-foreground text-sm">Trusted by students worldwide</p>
            </div>

            {/* Final CTA Section */}
            <div className="mt-24 bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-3xl p-12 text-center">
              <h2 className="text-3xl font-bold text-foreground mb-4">Ready to Organize Your Notes?</h2>
              <p className="text-muted-foreground text-lg mb-8 max-w-2xl mx-auto">
                Start with simple note-taking and AI summaries. Create quizzes from your notes and track your study progress.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <a href="/sign-up" className="px-8 py-4 bg-primary text-primary-foreground rounded-lg text-lg font-semibold hover:bg-primary/90 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105">
                  Start Taking Notes
                </a>
                <a href="/login" className="px-8 py-4 border border-border text-foreground rounded-lg text-lg font-medium hover:bg-muted/50 transition-all duration-200">
                  Sign In
                </a>
              </div>
              <p className="text-xs text-muted-foreground mt-4">No credit card required • Basic features are free</p>
            </div>

            {/* Footer */}
            <footer className="mt-24 text-center py-8 border-t border-border">
              <p className="text-muted-foreground">
                NoteJewel © {new Date().getFullYear()}
              </p>
            </footer>

            {/* Structured Data for SEO */}
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{
                __html: JSON.stringify({
                  "@context": "https://schema.org",
                  "@type": "SoftwareApplication",
                  "name": "NoteJewel",
                  "description": "AI-powered study assistant with note-taking, study planning, and learning tools",
                  "url": "https://notejewel.vercel.app",
                  "applicationCategory": "EducationalApplication",
                  "operatingSystem": "Web",
                  "offers": {
                    "@type": "Offer",
                    "price": "0",
                    "priceCurrency": "USD"
                  },
                  "aggregateRating": {
                    "@type": "AggregateRating",
                    "ratingValue": "4.8",
                    "ratingCount": "1250"
                  },
                  "author": {
                    "@type": "Organization",
                    "name": "NoteJewel"
                  }
                })
              }}
            />
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
    
    // If user doesn't exist in database, create them with default subjects
    if (!userData) {
      try {
        // Check if user already exists by email
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email || '' },
        });

        if (existingUser) {
          // User exists but with different ID, update the ID to match auth
          await prisma.user.update({
            where: { email: user.email || '' },
            data: { id: user.id },
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
        } else {
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
      } catch (error) {
        console.error("Error creating/finding user:", error);
        throw new Error("Failed to create or find user");
      }
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
    
    // Update user streak after ensuring user exists
    try {
      await updateUserStreak(user.id);
    } catch (error) {
      console.error("Error updating user streak:", error);
      // Continue without breaking the app
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

  // Get billing information
  let billingInfo;
  try {
    billingInfo = await getUserBillingInfo(userData.id);
  } catch (error) {
    console.error("Error fetching billing info:", error);
    billingInfo = {
      planType: "FREE" as const,
      billingStatus: "PENDING" as const,
      dailyGenerationsUsed: 0,
      remaining: 5,
      limit: 5,
      planEndDate: null,
      billingEmail: null,
    };
  }

  return (
    <PomodoroProvider>
      <div className="flex h-full flex-col gap-4 sm:gap-6 p-3 sm:p-6">
        <Tabs defaultValue="notes" className="w-full">
          <div className="flex w-full max-w-7xl mx-auto flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-0">
            <div className="flex items-center gap-4">
              <h2 className="text-xl sm:text-2xl font-semibold text-foreground/80">NoteJewel</h2>
              <div className="hidden sm:block h-6 w-px bg-border" />
              <p className="hidden sm:block text-sm text-muted-foreground">Your AI-Powered Study Assistant</p>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Welcome back,</span>
                <span className="font-medium text-foreground">
                  {userData.displayName || userData.email?.split('@')[0] || 'User'}!
                </span>
              </div>
            </div>
          </div>

        <TabsList className="grid w-full max-w-7xl mx-auto grid-cols-3 mt-6 bg-background/50 backdrop-blur-sm border border-border/50 shadow-sm hover:shadow-md transition-shadow duration-300 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-amber-400/5 via-transparent to-transparent rounded-lg pointer-events-none"></div>
          <TabsTrigger value="study" className="flex items-center gap-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all duration-200">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            Study Dashboard
          </TabsTrigger>
          <TabsTrigger value="notes" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-400/20 data-[state=active]:to-yellow-400/20 data-[state=active]:text-amber-600 data-[state=active]:shadow-lg data-[state=active]:border-amber-300/50 transition-all duration-200 relative group hover:bg-gradient-to-r hover:from-amber-400/10 hover:to-yellow-400/10">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="font-semibold">Notes</span>
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-amber-400 to-yellow-400 rounded-full opacity-90 group-hover:opacity-100 transition-opacity animate-pulse shadow-sm"></span>
          </TabsTrigger>
          <TabsTrigger value="pricing" className="flex items-center gap-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all duration-200">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
            Pricing
          </TabsTrigger>
        </TabsList>

        <TabsContent value="notes" className="mt-6">
          <div className="w-full max-w-7xl mx-auto">
            <div className="mb-6 p-4 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-lg shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-amber-400 to-yellow-400 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-amber-800">Welcome to Your Notes!</h3>
                  <p className="text-sm text-amber-700">Start creating and organizing your study notes here.</p>
                </div>
              </div>
            </div>
          <NotesPage 
            notes={allNotes}
            selectedNoteId=""
            selectedNoteText=""
            user={user}
            subjects={userData.subjects?.map(subject => ({
              id: subject.id,
              name: subject.name
            })) || []}
            billingInfo={billingInfo}
          />
          </div>
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
              billingInfo={billingInfo}
            />
          </div>
        </TabsContent>

        <TabsContent value="pricing" className="mt-6">
          <div className="w-full max-w-7xl mx-auto">
            <PricingPlans
              userId={userData.id}
              currentPlan={billingInfo.planType}
              currentUsage={billingInfo.dailyGenerationsUsed}
              currentLimit={billingInfo.limit}
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

      {/* Floating Pomodoro Timer */}
      <FloatingPomodoroTimer />
      </div>
    </PomodoroProvider>
  )
}

export default HomePage;
