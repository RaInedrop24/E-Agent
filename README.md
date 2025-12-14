# The Property Gateway 🏡

> **International Property Transaction Portal**  
> Bridging the language gap in international real estate transactions

## 🌟 Overview

The Property Gateway is a multilingual web platform designed to streamline international property purchases by providing transparency and seamless communication between property buyers and estate agents. Built with modern web technologies, it offers real-time progress tracking and automatic translation to eliminate language barriers.

### 🎯 Core Problem Solved

Buying property internationally (especially in Italy) is anxiety-inducing for non-native speakers due to:
- **Opaque processes** with unclear timelines
- **Language barriers** causing miscommunication  
- **Scattered communication** across emails, calls, and messages
- **Lack of transparency** about transaction progress

### 💡 Solution

A centralized portal providing:
1. **📈 Progress Tracker** - Visual timeline showing exactly where you are in the buying process
2. **🌍 Translation Bridge** - Auto-translating messaging system for native language communication  
3. **📱 Centralized Hub** - All documents, messages, and updates in one secure location
4. **🔒 Transparency** - Real-time status updates for complete peace of mind

---

## 🚀 Tech Stack

### Frontend
- **[Next.js 15](https://nextjs.org/)** - React framework with App Router
- **[TypeScript](https://www.typescriptlang.org/)** - Type safety and developer experience
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first styling
- **[shadcn/ui](https://ui.shadcn.com/)** - Beautiful, reusable components

### Backend
- **[Supabase](https://supabase.com/)** - PostgreSQL + Auth + Real-time subscriptions ✅ **Implemented**
- **[DeepL API](https://www.deepl.com/pro-api)** - Premium translation service ✅ **Implemented**

### Development Tools
- **ESLint** + **TypeScript** for code quality
- **Git** for version control
- **[Playwright](https://playwright.dev/)** - E2E testing framework ✅ **Configured**
- **Vercel** for deployment (recommended)

---

## 🏗️ Project Structure

```
the-property-gateway/
├── 📁 src/
│   ├── 📁 app/                    # Next.js App Router pages
│   │   ├── 📁 (auth)/            # Authentication routes
│   │   ├── 📁 api/                # API routes
│   │   ├── 📁 dashboard/          # Dashboard pages
│   │   └── 📁 transaction/        # Transaction management
│   ├── 📁 components/             # Reusable UI components
│   │   ├── 📁 ui/                # shadcn/ui components
│   │   ├── 📁 layout/            # Layout components (Header, Footer)
│   │   └── 📁 features/          # Feature-specific components
│   ├── 📁 lib/                   # Utilities and configurations
│   │   ├── constants.ts          # App constants (languages, milestones)
│   │   ├── supabase.ts           # Supabase client
│   │   └── utils.ts              # Helper functions
│   └── 📁 types/                 # TypeScript type definitions
├── 📁 supabase/                  # Database migrations and scripts
│   └── 📁 migrations/            # SQL migration files
├── 📁 scripts/                   # Utility scripts
├── 📁 tests/                     # E2E tests (Playwright)
├── 📁 docs/                      # Project documentation
│   ├── ARCHITECTURE.md           # Technical architecture
│   ├── DEVELOPMENT.md            # Development guidelines
│   └── Project_Brief.md          # Project plan and status
├── 📁 public/                    # Static assets
└── 📦 Package files
```

---

## 🛠️ Getting Started

### Prerequisites
- **Node.js 18+**
- **npm** or **yarn**
- **Git**

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/RaInedrop24/E-Agent.git
   cd E-Agent
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
   
   See `.env.local.example` for reference.

4. **Start development server**
   ```bash
   npm run dev:3001
   ```

5. **Open your browser**
   ```
   http://localhost:3001
   ```

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server (port 3000) |
| `npm run dev:3001` | Start development server on port 3001 |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run test:e2e` | Run Playwright E2E tests |
| `npm run test:ui` | Run Playwright tests with UI |
| `npm run test:report` | Show Playwright test report |

---

## 🌍 Multi-Language Support

The Property Gateway features **comprehensive translation support** for English and Italian, with architecture for easy expansion to additional languages.

### For Developers: Adding Translations

**⚠️ CRITICAL: Every UI change MUST include translations!**

When adding new features or UI elements:

1. **Add translation keys** to `src/lib/ui-translations.ts` (both EN & IT)
2. **Use the `useLanguage()` hook** in your components
3. **Replace hardcoded strings** with `t('key')` or `tVar('key', {vars})`
4. **Test in both languages** before committing

**Quick Example:**
```typescript
import { useLanguage } from '@/contexts/LanguageContext';

export default function MyComponent() {
  const { t, tVar } = useLanguage();
  
  return (
    <div>
      <h1>{t('dashboard.title')}</h1>
      <p>{tVar('message.welcome', { name: 'Mario' })}</p>
    </div>
  );
}
```

**📖 Documentation:**
- **Quick Reference:** `TRANSLATION_GUIDE.md` - Cheat sheet for developers
- **Full Details:** `TRANSLATION_IMPLEMENTATION.md` - Complete implementation guide
- **Translation File:** `src/lib/ui-translations.ts` - All UI text strings

### Translation Features

✅ **Site-wide UI Translation**
- 170+ translation keys covering all pages
- User-selected language preference (stored in profile)
- Instant language switching

✅ **Message Translation**
- Auto-translates messages between users
- Side-by-side original + translated display
- Cached translations (no repeated API calls)
- Powered by DeepL API

✅ **Supported Languages**
- 🇬🇧 English (default)
- 🇮🇹 Italian (complete)
- 🇩🇪 German (database ready)
- 🇫🇷 French (database ready)
- 🇪🇸 Spanish (database ready)

---

## 👥 User Personas

### 🇬🇧 International Buyer ("Sarah")
- **Background**: UK-based, buying holiday home in Italy
- **Goals**: Feel in control, understand process, communicate clearly
- **Pain Points**: Language barriers, lack of updates, scattered communication

### 🇮🇹 Local Agent ("Alessandro")  
- **Background**: Italian estate agent managing 10-15 international sales
- **Goals**: Close sales efficiently, appear professional, avoid misunderstandings
- **Pain Points**: Time-consuming translations, repetitive status requests

---

## ✨ MVP Features
### 🔐 User Management
- [x] Role-based authentication (Agent/Buyer) ✅ **Complete**
- [x] Transaction creation and buyer invitation ✅ **Complete**
- [x] User profile management ✅ **Complete**

### 📊 Progress Tracker
- [x] Pre-defined milestone checklist ✅ **Complete**
- [ ] Real-time status updates 🚧 **Planned** (Supabase subscriptions pending)
- [x] Visual progress indicators ✅ **Complete**

### 💬 Translation Bridge
- [ ] Auto-translation of messages 🚧 **Planned** (DeepL integration pending)
- [ ] Language preference settings 🚧 **Planned**
- [ ] "Show Original" functionality 🚧 **Planned**

### 📎 File Management
- [ ] Document upload/download 🚧 **Planned**
- [ ] File organization by transaction 🚧 **Planned**

---

## 🌍 Supported Languages

| Language | Code | Status |
|----------|------|--------|
| 🇬🇧 English | `en` | ✅ Primary |
| 🇮🇹 Italiano | `it` | 🚧 Planned |
| 🇪🇸 Español | `es` | 🚧 Planned |
| 🇫🇷 Français | `fr` | 🚧 Planned |
| 🇩🇪 Deutsch | `de` | 🚧 Planned |

---

## 🚧 Development Status

| Phase | Status | Description |
|-------|--------|-------------|
| **Phase 1** | ✅ Complete | Ideation & Planning |
| **Phase 2** | ✅ Complete | Design & Prototyping |
| **Phase 3** | 🚧 In Progress (~75%) | MVP Development |
| **Phase 4** | ⏳ Planned | Beta Testing |
| **Phase 5** | ⏳ Planned | Launch & Iteration |

### Phase 3 Progress
- ✅ Supabase database setup with RLS policies
- ✅ User authentication system (login, register, profiles)
- ✅ Transaction creation and management
- ✅ Buyer invitation system
- ✅ Milestone tracking with visual indicators
- ✅ Dashboard layouts for Agent and Buyer roles
- ✅ Playwright E2E testing framework
- 🚧 Message system (in progress)
- 🚧 File upload functionality (planned)
- 🚧 Translation Bridge with DeepL API (planned)

---

## 🤝 Contributing

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **Commit** changes: `git commit -m 'feat: add amazing feature'`
4. **Push** to branch: `git push origin feature/amazing-feature`
5. **Open** a Pull Request

### Commit Convention
We use [Conventional Commits](https://www.conventionalcommits.org/):
- `feat:` - New features
- `fix:` - Bug fixes  
- `docs:` - Documentation updates
- `style:` - Code style changes
- `refactor:` - Code refactoring
- `test:` - Adding tests

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 🙋‍♂️ Support

For support, email [support@thepropertygateway.com](mailto:support@thepropertygateway.com) or visit [thepropertygateway.com](https://thepropertygateway.com).

---

<div align="center">

**Built with ❤️ for international property buyers and agents**

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-blue?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)

</div>
