# ResearchBridge

A privacy-first AI research assistant that helps students and instructors collaborate on research projects with personalized AI preferences and instructor oversight.

## Features

### For Students
- **AI-Powered Research Assistance**: Summarize articles, answer questions, and get explanations
- **Personalized Preferences**: Customize AI responses with tone, depth, and learning style preferences
- **Confidence Tracking**: Rate your confidence in AI responses to help improve future interactions
- **Citation Support**: Get help with proper citations and source checking

### For Instructors
- **Privacy-First Dashboard**: Monitor student progress without surveillance
- **Class Overview**: Track active students, mode usage, and common confusion points
- **Student Journey**: View individual student timelines and progress
- **Quality Signals**: Monitor source mix, citations, and AI reliance
- **Interventions**: Send targeted nudges and suggestions

## Tech Stack

- **Frontend**: Next.js 14, React, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: SQLite (development), PostgreSQL (production ready)
- **Authentication**: NextAuth.js
- **Styling**: Tailwind CSS with custom design system

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd AIResearchWorkbook0
```

2. Install dependencies:
```bash
cd web
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Set up the database:
```bash
npx prisma generate
npx prisma db push
```

5. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Project Structure

```
web/
├── src/
│   ├── app/                 # Next.js App Router pages
│   │   ├── api/            # API routes
│   │   ├── instructor/     # Instructor dashboard
│   │   ├── preferences/    # AI preferences page
│   │   └── settings/       # User settings
│   ├── components/         # React components
│   └── lib/               # Utility functions
├── prisma/                # Database schema and migrations
└── public/               # Static assets
```

## Key Components

- **ReactionChips**: Interactive preference feedback system
- **ConfidenceRating**: Student confidence tracking
- **TypingAnimation**: Smooth text display animations
- **AuthHeader**: Navigation and authentication
- **InstructorDashboard**: Privacy-first instructor view

## Privacy & Ethics

This application is built with privacy-first principles:

- **No Keystroke Logging**: We don't track individual keystrokes or prompts
- **Student Consent**: All data collection requires explicit consent
- **Data Minimization**: Only collect essential data for functionality
- **Anonymized Analytics**: Cohort-level insights without individual identification
- **Private Mode**: Students can toggle private mode for sensitive work

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, email support@researchbridge.com or create an issue in this repository. 