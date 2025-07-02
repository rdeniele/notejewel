# NoteJewel: AI-Powered Study Assistant

NoteJewel is a comprehensive AI-powered study assistant that helps students organize their learning, generate personalized study plans, create quizzes, and track their progress using advanced AI capabilities.

## 🚀 Features

### Phase 1: Core Setup ✅
- **Manual Note Entry**: Students can type or paste notes with rich text support
- **Subject Management**: Organize notes by subjects with exam dates and quiz frequencies
- **Study Style Selection**: Choose from Visual, Reading, Practice, Teaching, or Audio learning styles
- **Daily Study Time Configuration**: Set available study time per day
- **AI-Powered Tools**:
  - **Summarize**: AI-powered note summarization using Gemini Flash 1.5
  - **Quiz Me**: Generate 5-question quizzes based on study material
  - **Study Plan**: Create personalized study plans based on learning style and schedule
  - **Concept Map**: Visualize relationships between study topics

### Phase 2: Light Agent Behavior ✅
- **Study Suggestions**: AI-powered recommendations based on exam dates and study patterns
- **Reminders**: Automatic notifications for upcoming exams and missed study sessions
- **Activity Tracking**: Log all study activities for progress monitoring

### Phase 3: Adaptive Agent ✅
- **Streak Tracking**: Monitor daily study consistency with motivational streak counter
- **Motivational Quotes**: Daily inspirational quotes to boost motivation
- **Study Pattern Analysis**: AI adapts recommendations based on user behavior
- **Adaptive Study Plans**: Adjust plans based on completion rates and performance

## 🛠️ Tech Stack

- **Frontend**: Next.js 15 with React 19
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Supabase Auth
- **AI**: Google Gemini Flash 1.5 API
- **UI**: shadcn/ui components with Tailwind CSS
- **Styling**: Tailwind CSS with custom design system

## 📊 Database Schema

The application uses a comprehensive database schema with the following main entities:

- **Users**: Profile information, study preferences, and streak tracking
- **Subjects**: Course organization with exam dates and quiz frequencies
- **Notes**: Study materials with source tracking (manual, PDF, handwritten)
- **Study Logs**: Activity tracking for analytics and recommendations
- **Study Plans**: AI-generated personalized study schedules
- **Motivations**: Inspirational quotes for daily motivation

## 🎯 Key Components

### Study Dashboard
- **Overview Tab**: Statistics, upcoming exams, and recent activity
- **Subjects Tab**: Manage courses and exam schedules
- **Study Tools Tab**: Access to AI-powered study tools
- **Profile Tab**: Configure study preferences and learning style

### AI Tools
1. **Study Plan Generator**: Creates personalized study schedules
2. **Quiz Generator**: Generates multiple-choice questions with explanations
3. **Concept Map Generator**: Visualizes topic relationships
4. **Note Summarizer**: Condenses study materials for quick review

### Smart Features
- **Exam Countdown**: Visual indicators for upcoming exams
- **Study Suggestions**: AI-powered recommendations
- **Streak Tracking**: Motivational daily consistency tracking
- **Activity Analytics**: Progress monitoring and insights

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- Google Gemini API key
- Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd notejewel
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Configure the following variables:
   - `DATABASE_URL`: PostgreSQL connection string
   - `GEMINI_API_KEY`: Google Gemini API key
   - `SUPABASE_URL`: Supabase project URL
   - `SUPABASE_ANON_KEY`: Supabase anonymous key

4. **Set up the database**
   ```bash
   npm run migrate
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

## 📱 Usage

### For Students

1. **Sign up/Login**: Create an account or sign in
2. **Set up Profile**: Choose your study style and daily study time
3. **Add Subjects**: Create subjects for your courses with exam dates
4. **Take Notes**: Add study materials for each subject
5. **Use AI Tools**: Generate study plans, quizzes, and concept maps
6. **Track Progress**: Monitor your study streak and upcoming exams

### Study Workflow

1. **Daily Check-in**: View study suggestions and motivational quotes
2. **Note Taking**: Add or review study materials
3. **AI Assistance**: Use AI tools to enhance learning
4. **Progress Review**: Check your streak and upcoming deadlines
5. **Adaptive Learning**: Let AI suggest study activities based on your patterns

## 🎨 UI/UX Features

- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **Dark/Light Mode**: Toggle between themes for comfortable studying
- **Accessibility**: WCAG compliant with keyboard navigation support
- **Modern Interface**: Clean, intuitive design with smooth animations
- **Real-time Updates**: Instant feedback and live progress tracking

## 🔧 Development

### Project Structure
```
src/
├── actions/          # Server actions for data operations
├── app/             # Next.js app router pages
├── components/      # React components
│   ├── ui/         # shadcn/ui components
│   └── ...         # Custom components
├── db/             # Database schema and migrations
├── gemini/         # AI integration
├── hooks/          # Custom React hooks
├── lib/            # Utility functions
└── providers/      # Context providers
```

### Key Development Commands
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run migrate      # Run database migrations
npm run lint         # Run ESLint
```

## 🚀 Deployment

The application is designed to be deployed on Vercel with the following considerations:

- **Environment Variables**: Configure all required environment variables
- **Database**: Use a production PostgreSQL database (Supabase recommended)
- **API Limits**: Monitor Gemini API usage and implement rate limiting
- **Performance**: Optimize for fast loading and smooth interactions

## 📈 Future Enhancements

### Phase 4: Handwriting Recognition
- **OCR Integration**: Extract text from handwritten notes
- **Image Upload**: Support for photo uploads of handwritten materials
- **Text Processing**: AI-powered text extraction and organization

### Additional Features
- **Collaborative Study**: Group study sessions and shared notes
- **Advanced Analytics**: Detailed study pattern analysis
- **Mobile App**: Native mobile application
- **Offline Support**: Study without internet connection
- **Export Features**: Export notes and study plans

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **Google Gemini**: For powerful AI capabilities
- **Supabase**: For authentication and database services
- **shadcn/ui**: For beautiful, accessible UI components
- **Next.js Team**: For the amazing React framework
- **Prisma**: For excellent database tooling

---

**NoteJewel** - Empowering students with AI-powered study assistance for better learning outcomes! 🎓✨
