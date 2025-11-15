# Estate Portal 🏡

> **International Property Transaction Portal**  
> Bridging the language gap in international real estate transactions

## 🌟 Overview

Estate Portal is a multilingual web platform designed to streamline international property purchases by providing transparency and seamless communication between property buyers and estate agents. Built with modern web technologies, it offers real-time progress tracking and automatic translation to eliminate language barriers.

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

### Backend (Planned)
- **[Supabase](https://supabase.com/)** - PostgreSQL + Auth + Real-time subscriptions
- **[DeepL API](https://www.deepl.com/pro-api)** - Premium translation service

### Development Tools
- **ESLint** + **TypeScript** for code quality
- **Git** for version control
- **Vercel** for deployment (recommended)

---

## 🏗️ Project Structure

```
estate-portal/
├── 📁 src/
│   ├── 📁 app/                    # Next.js App Router pages
│   ├── 📁 components/             # Reusable UI components
│   │   ├── 📁 ui/                # shadcn/ui components
│   │   ├── 📁 layout/            # Layout components (Header, Footer)
│   │   └── 📁 features/          # Feature-specific components
│   ├── 📁 lib/                   # Utilities and configurations
│   │   ├── constants.ts          # App constants (languages, milestones)
│   │   └── utils.ts              # Helper functions
│   └── 📁 types/                 # TypeScript type definitions
├── 📁 docs/                      # Project documentation
│   ├── ARCHITECTURE.md           # Technical architecture
│   └── DEVELOPMENT.md            # Development guidelines
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

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   ```
http://localhost:3001
   ```

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

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
- [ ] Role-based authentication (Agent/Buyer)
- [ ] Transaction creation and buyer invitation
- [ ] User profile management

### 📊 Progress Tracker
- [x] Pre-defined milestone checklist
- [ ] Real-time status updates
- [ ] Visual progress indicators

### 💬 Translation Bridge
- [ ] Auto-translation of messages
- [ ] Language preference settings
- [ ] "Show Original" functionality

### 📎 File Management
- [ ] Document upload/download
- [ ] File organization by transaction

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
| **Phase 2** | 🚧 In Progress | Design & Prototyping |
| **Phase 3** | ⏳ Planned | MVP Development |
| **Phase 4** | ⏳ Planned | Beta Testing |
| **Phase 5** | ⏳ Planned | Launch & Iteration |

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

For support, email [support@example.com](mailto:support@example.com) or open an issue on GitHub.

---

<div align="center">

**Built with ❤️ for international property buyers and agents**

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-blue?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)

</div>
