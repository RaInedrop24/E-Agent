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
5. **🎓 Guided Onboarding** - Interactive product tours and downloadable user guides so agents and buyers are productive from day one
6. **🛡️ Admin Control** - A dedicated Super Admin panel for platform oversight, agent/buyer management, and support

---

## 🚀 Tech Stack

### Frontend
- **[Next.js 16](https://nextjs.org/)** - React framework with App Router
- **[React 19](https://react.dev/)** + **[TypeScript](https://www.typescriptlang.org/)** - Type safety and developer experience
- **[Tailwind CSS 4](https://tailwindcss.com/)** - Utility-first styling
- **[shadcn/ui](https://ui.shadcn.com/)** + **Radix UI** primitives - Accessible, reusable components
- **[Framer Motion](https://www.framer.com/motion/)** - Animations and transitions
- **[react-joyride](https://react-joyride.com/)** - Interactive onboarding tours

### Backend & Integrations
- **[Supabase](https://supabase.com/)** - PostgreSQL + Auth + Real-time subscriptions + Row Level Security ✅ **Implemented**
- **[DeepL API](https://www.deepl.com/pro-api)** - Real-time message & milestone translation ✅ **Implemented**
- **[Resend](https://resend.com/)** + **[React Email](https://react.email/)** - Transactional email (invites, notifications, progress updates) ✅ **Implemented**
- **[Twilio](https://www.twilio.com/)** - SMS notifications ✅ **Implemented**
- **Next.js API Routes** - Server-side logic (buyers, files, notifications, translation, super admin) ✅ **Implemented**

### Development Tools
- **ESLint** + **TypeScript** for code quality
- **Husky** + **lint-staged** - Pre-commit checks
- **[Playwright](https://playwright.dev/)** - E2E + visual regression testing ✅ **Implemented**
- **Git** for version control
- **Linode / PM2 / Nginx** - Production deployment (see `docs/DEPLOYMENT_LINODE.md`)

---

## 🏗️ Project Structure

```
estate-portal/
├── 📁 src/
│   ├── 📁 app/                    # Next.js App Router pages
│   │   ├── 📁 (auth)/            # Login / register
│   │   ├── 📁 admin/              # Super Admin panel (agents, buyers, metrics, SQL editor, MFA)
│   │   ├── 📁 api/                # API routes (buyers, files, notifications, translate, super-admin)
│   │   ├── 📁 dashboard/          # Agent & buyer dashboards
│   │   ├── 📁 transaction/        # Transaction detail, milestones, comms
│   │   ├── 📁 transactions/       # Transaction list & creation
│   │   ├── 📁 milestone-templates/# Reusable milestone template management
│   │   ├── 📁 buyers/             # Buyer management (agent view)
│   │   ├── 📁 settings/           # Profile & agency branding
│   │   ├── 📁 help/               # In-app help centre
│   │   └── 📁 privacy, terms, cookies/  # Legal & compliance pages
│   ├── 📁 components/             # Reusable UI components
│   │   ├── 📁 ui/                # shadcn/ui components
│   │   ├── 📁 layout/            # Layout components (Header, Footer)
│   │   └── 📁 features/          # Onboarding tours, notifications, system messaging
│   ├── 📁 contexts/               # AuthContext, LanguageContext, BrandingContext
│   ├── 📁 lib/                   # Utilities and configurations
│   │   ├── constants.ts          # App constants (languages, milestones)
│   │   ├── supabase.ts           # Supabase client
│   │   ├── translation.ts        # DeepL translation service
│   │   ├── email-service.ts      # Resend transactional email
│   │   ├── notifications.ts      # In-app + SMS notification helpers
│   │   └── ui-translations.ts    # 7-language UI translation dictionary
│   └── 📁 types/                 # TypeScript type definitions
├── 📁 supabase/                  # Database migrations and scripts
│   └── 📁 migrations/            # 60+ SQL migration files
├── 📁 scripts/                   # Automation scripts (translations, guide PDFs)
├── 📁 tests/                     # E2E + visual regression tests (Playwright)
├── 📁 docs/                      # Project documentation (architecture, deployment, security, guides)
├── 📁 backlog/                   # Feature backlog & proposals
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
   cd E-Agent/estate-portal
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**

   Create a `.env.local` file in the root directory:
   ```env
   # Public (safe to expose in client)
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

   # Server-only
   DEEPL_API_KEY=your_deepl_api_key
   RESEND_API_KEY=your_resend_api_key
   TWILIO_SID=your_twilio_sid
   TWILIO_SECRET=your_twilio_secret
   TWILIO_PHONE_NUMBER=your_twilio_phone_number

   # Optional
   NEXT_PUBLIC_SITE_URL=http://localhost:3001
   ```

   See `.env.local.example` for the full reference.

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

The Property Gateway features **comprehensive translation support** across 7 languages, with easy-to-use tools for adding more.

### For Users

✅ **Site-wide UI Translation**
- ~500 translation keys per language, covering all pages
- User-selected language preference (stored in profile)
- Instant language switching

✅ **Message Translation**
- Auto-translates messages between users
- Side-by-side original + translated display
- Cached translations (no repeated API calls)
- Powered by DeepL API

✅ **Milestone Localization**
- Custom milestone labels in all supported languages
- Auto-translate feature for quick translation
- Template system with multilingual defaults

### For Developers: Adding New Languages

**Adding a new language takes ~20 minutes using our automated tools:**

```bash
# 1. Generate database migration
node scripts/generate-migration.mjs pt Portuguese

# 2. Generate UI translations (requires DeepL API key)
export DEEPL_API_KEY="your-key"
node scripts/generate-translations.mjs pt

# 3. Follow the quick start guide
```

**📖 Documentation:**
- **Quick Start:** `docs/LANGUAGE_QUICK_START.md` - 20-minute guide
- **Full Guide:** `docs/ADDING_NEW_LANGUAGES.md` - Complete reference
- **Scripts:** `scripts/README.md` - Automation tools

### For Developers: Using Translations

**⚠️ CRITICAL: Every UI change MUST include translations!**

When adding new features or UI elements:

1. **Add translation keys** to `src/lib/ui-translations.ts` for all 7 supported languages (EN, IT, PL, ES, FR, DE, NL)
2. **Use the `useLanguage()` hook** in your components
3. **Replace hardcoded strings** with `t('key')` or `tVar('key', {vars})`
4. **Test in multiple languages** before committing

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

**📖 Translation Documentation:**
- **Quick Reference:** `TRANSLATION_GUIDE.md` - Cheat sheet for developers
- **Full Details:** `TRANSLATION_IMPLEMENTATION.md` - Complete implementation guide
- **Translation File:** `src/lib/ui-translations.ts` - All UI text strings

### Automated Translation Tools

- `scripts/generate-migration.mjs` - Creates database schema for new language
- `scripts/generate-translations.mjs` - Auto-translates UI with DeepL API
- Supports 30+ languages including European, Asian, and Middle Eastern languages
- Free DeepL tier: 500K characters/month (enough for ~5 languages)

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

## ✨ Features

### 🔐 User Management
- [x] Role-based authentication (Agent/Buyer) ✅ **Complete**
- [x] Transaction creation and buyer invitation ✅ **Complete**
- [x] User profile management + agency branding (logo, auto-extracted brand colors) ✅ **Complete**

### 📊 Progress Tracker
- [x] Pre-defined & fully customizable milestone templates ✅ **Complete**
- [x] Real-time status updates via Supabase subscriptions ✅ **Complete**
- [x] Visual progress indicators ✅ **Complete**

### 💬 Translation Bridge
- [x] Auto-translation of messages via DeepL ✅ **Complete**
- [x] Language preference settings (7 languages) ✅ **Complete**
- [x] "Show Original" functionality with cached translations ✅ **Complete**

### 📎 File Management
- [x] Document upload/download, organized by transaction ✅ **Complete**
- [x] Server-side file type & size validation ✅ **Complete**

### 🔔 Notifications
- [x] In-app notification bell + notification centre ✅ **Complete**
- [x] System-wide announcements (Super Admin broadcast) ✅ **Complete**
- [x] Transactional email via Resend + React Email ✅ **Complete**
- [x] SMS alerts via Twilio ✅ **Complete**

### 🛡️ Super Admin Panel
- [x] Agent & buyer management dashboards ✅ **Complete**
- [x] Platform metrics dashboard ✅ **Complete**
- [x] SQL query editor for support/debugging ✅ **Complete**
- [x] MFA setup for admin accounts ✅ **Complete**
- [x] Admin audit logging ✅ **Complete**

### 🎓 Onboarding & Help
- [x] Interactive product tours for Agents and Buyers (react-joyride) ✅ **Complete**
- [x] In-app help centre ✅ **Complete**
- [x] Auto-generated, downloadable user guide PDFs (EN/IT) ✅ **Complete**

### ⚖️ Legal & Compliance
- [x] Privacy Policy, Terms of Service, Cookie Policy pages ✅ **Complete**
- [x] Cookie consent banner ✅ **Complete**

### 🧪 Testing & Quality
- [x] Playwright E2E test suite (login, transactions, invitations, sort persistence) ✅ **Complete**
- [x] Visual regression testing for the landing page ✅ **Complete**
- [x] Husky + lint-staged pre-commit checks ✅ **Complete**

---

## 🌍 Supported Languages

| Language | Code | Status | UI | Milestones | Database |
|----------|------|--------|----|-----------| ---------|
| 🇬🇧 English | `en` | ✅ Complete | ✅ | ✅ | ✅ |
| 🇮🇹 Italiano | `it` | ✅ Complete | ✅ | ✅ | ✅ |
| 🇵🇱 Polski | `pl` | ✅ Complete | ✅ | ✅ | ✅ |
| 🇪🇸 Español | `es` | ✅ Complete | ✅ | ✅ | ✅ |
| 🇫🇷 Français | `fr` | ✅ Complete | ✅ | ✅ | ✅ |
| 🇩🇪 Deutsch | `de` | ✅ Complete | ✅ | ✅ | ✅ |
| 🇳🇱 Nederlands | `nl` | ✅ Complete | ✅ | ✅ | ✅ |

**Want to add another language?** See `docs/ADDING_NEW_LANGUAGES.md` for the ~20-minute setup guide.

---

## 🚧 Development Status

| Phase | Status | Description |
|-------|--------|-------------|
| **Phase 1** | ✅ Complete | Ideation & Planning |
| **Phase 2** | ✅ Complete | Design & Prototyping |
| **Phase 3** | ✅ Complete | MVP Development |
| **Phase 4** | 🚧 In Progress | Pilot Launch (see `PILOT_LAUNCH_SUMMARY.md` and `docs/PILOT_LAUNCH_CHECKLIST.md`) |
| **Phase 5** | ⏳ Planned | Public Launch & Iteration |

### Phase 3 — MVP (Complete)
- ✅ Supabase database setup with RLS policies (60+ migrations, hardened against recursion & performance issues)
- ✅ User authentication system (login, register, profiles, MFA for admins)
- ✅ Transaction creation, management, and customizable milestone templates
- ✅ Buyer invitation and management system
- ✅ Real-time dashboards for Agent, Buyer, and Super Admin roles
- ✅ Messaging with DeepL-powered translation
- ✅ File upload/download with validation
- ✅ In-app, email, and SMS notifications
- ✅ Interactive onboarding tours and downloadable user guides
- ✅ Legal & compliance pages (Privacy, Terms, Cookies) with consent banner
- ✅ Playwright E2E + visual regression test suite

### Phase 4 — Pilot Launch (In Progress)
- 🚧 Onboarding first pilot estate agent(s) for real-world feedback
- 🚧 Production deployment hardening (see `docs/DEPLOYMENT_LINODE.md`, `docs/PRODUCTION_DEPLOYMENT.md`)
- ⏳ Feature 001 — Encrypted sensitive PII storage & GDPR data export/erasure (see `backlog/features/001-sensitive-pii-storage/`)

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

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-blue?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)

</div>
