# Estate Portal - Technical Architecture

## Project Overview
**Estate Portal** is a multilingual property transaction tracking platform that bridges communication between international property buyers and local estate agents.

## Tech Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type safety and development experience
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Reusable component library

### Backend (Planned)
- **Supabase** - PostgreSQL database + Auth + Real-time
- **DeepL API** - Premium translation service
- **Next.js API Routes** - Server-side logic

### Development Tools
- **ESLint** - Code linting
- **TypeScript** - Type checking
- **Git** - Version control

## Project Structure

```
estate-portal/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # Auth-related routes
│   │   ├── dashboard/         # Main app dashboard
│   │   └── transaction/       # Transaction management
│   ├── components/            # Reusable components
│   │   ├── ui/               # shadcn/ui components
│   │   ├── layout/           # Layout components
│   │   └── features/         # Feature-specific components
│   ├── lib/                  # Utilities and configurations
│   │   ├── supabase.ts       # Database client
│   │   ├── translation.ts    # DeepL integration
│   │   └── utils.ts          # Helper functions
│   └── types/                # TypeScript type definitions
├── public/                   # Static assets
├── docs/                     # Documentation
└── tests/                    # Test files
```

## Key Features (MVP)

1. **User Management**
   - Agent and Buyer role-based authentication
   - Transaction creation and invitation system

2. **Progress Tracker**
   - Predefined milestone checklist
   - Real-time status updates
   - Visual progress indicators

3. **Translation Bridge**
   - Auto-translation of messages
   - Language preference settings
   - "Show Original" functionality

4. **File Sharing**
   - Document upload/download
   - File organization by transaction

## Development Principles

- **Type Safety First** - All code must be fully typed
- **Component-Driven** - Reusable, testable components
- **Real-time Updates** - Leverage Supabase subscriptions
- **Mobile-First** - Responsive design from start
- **Security-First** - Proper authentication and authorization