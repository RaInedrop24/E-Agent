# Project Verity: International Property Portal

## 1. Project Overview

**The Problem:** Buying property internationally (specifically in Italy) is a high-anxiety process for non-native speakers. The process is opaque, and communication with local estate agents is difficult due to language barriers, leading to a lack of transparency and trust.

**The Solution:** A web-based portal that acts as a "single source of truth" for a property transaction. It provides two core functions:
1.  **Transparency Tracker:** A visual timeline of the purchasing process, so the buyer always knows what stage they are at.
2.  **Translation Bridge:** A built-in, auto-translating messaging system, allowing buyers and agents to communicate clearly in their native languages.

**The Goal:** To reduce buyer anxiety, increase trust, and save time for estate agents by streamlining communication.

---

## 2. Current Status

**Phase:** 2 - Design & Prototyping (Early Development)  
**Last Update:** 2025-11-15  
**Current Step:** MVP foundation completed with Next.js, initial components built, basic flows and UI guide documented; Supabase client scaffolded.  
**GitHub Repository:** https://github.com/RaInedrop24/E-Agent.git  
**Local Development:** Running at http://localhost:3001

---

## 3. High-Level Project Plan

* **Phase 1: Ideation & Planning ✅ COMPLETE**
    * [x] Define core idea
    * [x] Define User Personas
    * [x] Define MVP Feature List
    * [x] Tech Stack Exploration
    * [ ] Explore Business Model (How will this make money?)
* **Phase 2: Design & Prototyping (CURRENT)**
    * [x] Project setup with Next.js + TypeScript + Tailwind CSS
    * [x] shadcn/ui component library integration
    * [x] Professional landing page with feature showcase
    * [x] Initial component architecture (Header, ProgressTracker)
    * [x] Type-safe project structure with TypeScript definitions
    * [x] Comprehensive documentation (README, ARCHITECTURE, DEVELOPMENT)
    * [x] GitHub repository setup with proper ALM practices
    * [ ] Wireframes (Low-fidelity sketches of authenticated screens)
    * [x] User Flow Diagrams (Authentication and transaction flows) — see `docs/FLOWS.md`
    * [x] Dashboard layouts documented — see `docs/UI_GUIDE.md`
    * [ ] High-Fidelity Mockups (Dashboard and transaction views)
* **Phase 3: MVP Development**
    * [ ] Supabase setup (Database, Authentication, Real-time)
    * [ ] User authentication system (Login/Register pages wired to Supabase)
    * [ ] Dashboard layouts for Agent and Buyer roles
    * [ ] Transaction creation and management system
    * [ ] Build complete "Tracker" module with real-time updates
    * [ ] Integrate "Translation Bridge" with DeepL API
* **Phase 4: Beta Testing**
    * [ ] Recruit a small number of friendly agents and buyers
    * [ ] Test with a real (or simulated) transaction
    * [ ] Gather feedback and fix critical bugs
* **Phase 5: Launch & Iteration**
    * [ ] Go-to-market strategy
    * [ ] Onboard first paying customers
    * [ ] Plan V2 features (e.g., specialized legal translation, document e-signing)

---

## 4. User Personas

### Persona 1: The International Buyer

* **Name:** "Sarah" (45, UK-based)
* **Background:** Buying a holiday home in Italy with her partner. First international property purchase. She is the "project manager" of the family.
* **Technical Skill:** Confident using websites (e.g., online banking, travel booking) but not a tech expert.
* **Goals:**
    * To feel confident and "in control" of the process.
    * To know exactly what stage the purchase is at, 24/7, without having to ask.
    * To be 100% sure her questions are understood by the agent.
    * To have a single, clear record of all communication.
* **Pain Points / "Anxieties":**
    * "Am I being annoying by asking for another update?"
    * "Did the agent really understand my question about the surveyor's report?"
    * "I got an email in Italian and Google Translate made no sense. Is it important?"
    * "I feel like I'm in the dark. Weeks go by with no news."

### Persona 2: The Local Agent

* **Name:** "Alessandro" (52, Italian Estate Agent)
* **Background:** Runs a small, successful agency in Tuscany. Speaks good, but not perfect, business English. Manages 10-15 international sales at any time.
* **Technical Skill:** Uses email, WhatsApp, and a basic CRM. Hates learning new, complex software.
* **Goals:**
    * To close sales faster and more efficiently.
    * To spend less time answering the same repetitive questions from anxious clients.
    * To appear professional and modern to his international clientele.
    * To avoid misunderstandings caused by language barriers.
* **Pain Points:**
    * "My foreign clients email and text me at all hours asking 'what's new?'. It's disruptive."
    * "It takes me 15 minutes to write a simple update email in English, and I'm still not sure it's correct."
    * "A client misunderstood a contract detail, and it created a big problem."
    * "Communication is scattered across emails, WhatsApp, and phone calls. It's a mess."

---

## 5. MVP (Minimum Viable Product) Feature List

* **User Management**
    1.  Secure login/logout for "Agent" and "Buyer" roles.
    2.  Agent can create a new "Transaction."
    3.  Agent can invite a "Buyer" to a Transaction via email.
* **The Tracker (Transparency Portal)**
    1.  A pre-defined, non-editable list of key milestones (e.g., `Offer Accepted`, `Preliminary Contract`, `Deposit Paid`, `Survey`, `Final Deed (Rogito)`).
    2.  Agent can manually check off a milestone as "Complete."
    3.  The Buyer sees the same checklist in real-time.
* **The Comms Hub (Translation Bridge)**
    1.  A single, chronological message thread for each Transaction.
    2.  User profile has a "Preferred Language" setting (e.g., English, Italian, German).
    3.  Automatic translation shown with "Show Original" toggle.
* **Simple File Upload**
    1.  Ability to upload and share key documents (PDFs, JPEGs) within the Comms Hub.

---

## 6. Tech Stack Exploration

* **Translation API:**
    * DeepL (Quality-focused; glossaries for legal jargon).
    * Google Cloud Translation (Scale-focused; custom glossaries).
* **Frontend (UI):** Next.js (React), Tailwind CSS, shadcn/ui.
* **Backend & Database:** Supabase (PostgreSQL, Auth, Realtime).
* **Recommended MVP Stack:** Next.js + Supabase + DeepL API.

---

## 7. Technical Implementation Status

### ✅ Completed (Phase 2 to-date)
* **Project Foundation**
    * Next.js App Router with TypeScript
    * Tailwind CSS and shadcn/ui components
    * ESLint and type checking configuration
    * Professional folder structure
* **Core Components & Pages**
    * `Header.tsx` updated with auth links
    * `ProgressTracker.tsx` milestone visualization
    * `/(auth)/login` and `/(auth)/register` (UI stubs)
    * `/dashboard` preview
    * `/transactions` list (mock data)
    * `/transaction/[id]` detail wired to mock JSON
    * `/transaction/[id]/comms` static thread (preview)
* **Documentation**
    * `docs/FLOWS.md` (Mermaid auth and transaction flows)
    * `docs/UI_GUIDE.md` (Agent/Buyer dashboard layouts)
    * `docs/DEPLOYMENT_LINODE.md` (prepared, deployment deferred)
    * `docs/DEVELOPMENT.md` updated with `npm run dev:3001`
* **Dev Convenience**
    * `npm run dev:3001` script
    * `.env.local.example` provided
* **Supabase (Scaffold)**
    * `@supabase/supabase-js` installed
    * `src/lib/supabase.ts` client factory
    * `/debug/supabase` page to verify env

### 🚧 Next Steps (Phase 2 wrap-up → Phase 3 start)
* Wireframes for authenticated screens (low-fidelity)
* Connect Supabase Auth to login/register
* Create `profiles` row on signup
* Define RLS policies and initial schema migrations (per `docs/SUPABASE_SCHEMA.md`)
* Replace mock transaction data with Supabase tables

---

## 8. Recent Iterations (Changelog)
* Added Mermaid user flows and UI guide documentation
* Introduced mock transactions list and detail/comms routes
* Added Supabase client and debug page; env example; `dev:3001` script
* Updated README and DEVELOPMENT docs to reflect local port and scripts
* Configured private repo access: SSH deploy key + SSH alias; remote updated to SSH
* Clarified repository visibility best practice (private for monetization) and documented push methods (SSH, PAT, GitHub CLI) in `docs/DEVELOPMENT.md`

# Project Verity: International Property Portal

## 1. Project Overview

**The Problem:** Buying property internationally (specifically in Italy) is a high-anxiety process for non-native speakers. The process is opaque, and communication with local estate agents is difficult due to language barriers, leading to a lack of transparency and trust.

**The Solution:** A web-based portal that acts as a "single source of truth" for a property transaction. It provides two core functions:
1.  **Transparency Tracker:** A visual timeline of the purchasing process, so the buyer always knows what stage they are at.
2.  **Translation Bridge:** A built-in, auto-translating messaging system, allowing buyers and agents to communicate clearly in their native languages.

**The Goal:** To reduce buyer anxiety, increase trust, and save time for estate agents by streamlining communication.

---

## 2. Current Status

**Phase:** 2 - Design & Prototyping (Early Development)
**Last Update:** 2025-11-15
**Current Step:** MVP foundation completed with Next.js, initial components built, and GitHub repository established.
**GitHub Repository:** https://github.com/RaInedrop24/E-Agent.git
**Local Development:** Running at http://localhost:3001

---

## 3. High-Level Project Plan

* **Phase 1: Ideation & Planning ✅ COMPLETE**
    * [x] Define core idea
    * [x] Define User Personas
    * [x] Define MVP Feature List
    * [x] Tech Stack Exploration
    * [ ] Explore Business Model (How will this make money?)
* **Phase 2: Design & Prototyping (CURRENT)**
    * [x] Project setup with Next.js 15 + TypeScript + Tailwind CSS
    * [x] shadcn/ui component library integration
    * [x] Professional landing page with feature showcase
    * [x] Initial component architecture (Header, ProgressTracker)
    * [x] Type-safe project structure with TypeScript definitions
    * [x] Comprehensive documentation (README, ARCHITECTURE, DEVELOPMENT)
    * [x] GitHub repository setup with proper ALM practices
    * [ ] Wireframes (Low-fidelity sketches of authenticated screens)
    * [ ] User Flow Diagrams (Authentication and transaction flows)
    * [ ] High-Fidelity Mockups (Dashboard and transaction views)
* **Phase 3: MVP Development**
    * [ ] Supabase setup (Database, Authentication, Real-time)
    * [ ] User authentication system (Login/Register pages)
    * [ ] Dashboard layouts for Agent and Buyer roles
    * [ ] Transaction creation and management system
    * [ ] Build complete "Tracker" module with real-time updates
    * [ ] Integrate "Translation Bridge" with DeepL API
* **Phase 4: Beta Testing**
    * [ ] Recruit a small number of friendly agents and buyers
    * [ ] Test with a real (or simulated) transaction
    * [ ] Gather feedback and fix critical bugs
* **Phase 5: Launch & Iteration**
    * [ ] Go-to-market strategy
    * [ ] Onboard first paying customers
    * [ ] Plan V2 features (e.g., specialized legal translation, document e-signing)

---

## 4. User Personas

### Persona 1: The International Buyer

* **Name:** "Sarah" (45, UK-based)
* **Background:** Buying a holiday home in Italy with her partner. This is their first international property purchase. She is the "project manager" of the family.
* **Technical Skill:** Confident using websites (e.g., online banking, travel booking) but not a tech expert.
* **Goals:**
    * To feel confident and "in control" of the process.
    * To know *exactly* what stage the purchase is at, 24/7, without having to ask.
    * To be 100% sure her questions are understood by the agent.
    * To have a single, clear record of all communication.
* **Pain Points / "Anxieties":**
    * "Am I being annoying by asking for another update?"
    * "Did the agent *really* understand my question about the surveyor's report?"
    * "I got an email in Italian and Google Translate made no sense. Is it important?"
    * "I feel like I'm in the dark. Weeks go by with no news."

### Persona 2: The Local Agent

* **Name:** "Alessandro" (52, Italian Estate Agent)
* **Background:** Runs a small, successful agency in Tuscany. Speaks good, but not perfect, "business English." He is very busy and manages 10-15 international sales at any time.
* **Technical Skill:** Uses email, WhatsApp, and a basic CRM. Hates learning new, complex software.
* **Goals:**
    * To close sales faster and more efficiently.
    * To spend *less* time answering the same repetitive questions from anxious clients.
    * To appear professional and modern to his international clientele.
    * To avoid misunderstandings caused by language barriers.
* **Pain Points:**
    * "My foreign clients email and text me at all hours asking 'what's new?'. It's disruptive."
    * "It takes me 15 minutes to write a simple update email in English, and I'm still not sure it's correct."
    * "A client misunderstood a contract detail, and it created a big problem."
    * "Communication is scattered across emails, WhatsApp, and phone calls. It's a mess."

---

## 5. MVP (Minimum Viable Product) Feature List

* **User Management**
    1.  Secure login/logout for "Agent" and "Buyer" roles.
    2.  Agent can create a new "Transaction."
    3.  Agent can invite a "Buyer" to a Transaction via email.
* **The Tracker (Transparency Portal)**
    1.  A pre-defined, non-editable list of key milestones (e.g., `Offer Accepted`, `Preliminary Contract`, `Deposit Paid`, `Survey`, `Final Deed (Rogito)`).
    2.  Agent can manually check off a milestone as "Complete."
    3.  The Buyer sees the same checklist in real-time.
* **The Comms Hub (Translation Bridge)**
    1.  A single, chronological message thread for each Transaction.
    2.  User profile has a "Preferred Language" setting (e.g., English, Italian, German).
    3.  When a Buyer (English) posts a note, the system auto-translates and displays it to the Agent (Italian) in Italian.
    4.  When the Agent (Italian) replies, the system auto-translates and displays it to the Buyer (English) in English.
    5.  A "Show Original" button is available to see the pre-translation text, to prevent critical errors.
* **Simple File Upload**
    1.  Ability to upload and share key documents (PDFs, JPEGs) within the Comms Hub.

---

## 6. Tech Stack Exploration

* **Translation API:**
    * **Option 1 (Quality-focused):** DeepL (Excellent for European languages, "Glossary" feature for legal jargon).
    * **Option 2 (Scale-focused):** Google Cloud Translation (Massive language support, "Custom Glossary" feature).
* **Frontend (UI):**
    * **Option 1 (Recommended):** React.js (using Next.js framework). (Huge ecosystem, component-based, high performance).
    * **Option 2:** Vue.js (using Nuxt.js framework). (Also excellent, slightly simpler learning curve).
* **Backend & Database (The "Engine"):**
    * **Option A (Fastest MVP):** Supabase (All-in-one: PostgreSQL database, Auth, Real-time).
    * **Option B (Fastest MVP):** Firebase (All-in-one: NoSQL database, Auth, Real-time).
    * **Option C (Custom Stack):** Node.js + PostgreSQL + Socket.io (Full control, but slower development).
    * **Option D (Hybrid):** Node.js + PostgreSQL + dedicated Chat API (e.g., TalkJS) (Good balance).
* **Recommended MVP Stack:** **React (Next.js) + Supabase + DeepL API.**
* **SELECTED STACK:** ✅ **Next.js 15 + TypeScript + Tailwind CSS + shadcn/ui + Supabase (planned) + DeepL API (planned)**

---

## 7. Technical Implementation Status

### ✅ Completed (Phase 2)
* **Project Foundation**
    * Next.js 15 with App Router and TypeScript
    * Tailwind CSS for styling
    * shadcn/ui component library (8 essential components)
    * ESLint and type checking configuration
    * Professional folder structure

* **Core Components Built**
    * `Header.tsx` - Navigation with user authentication states
    * `ProgressTracker.tsx` - Visual milestone tracking component
    * Landing page with hero section and feature showcase
    * Type definitions for all core entities (User, Transaction, Message, etc.)

* **Development Infrastructure**
    * GitHub repository: https://github.com/RaInedrop24/E-Agent.git
    * Comprehensive README.md with installation instructions
    * Technical documentation (ARCHITECTURE.md, DEVELOPMENT.md)
    * Proper git workflow with conventional commit messages
    * Local development server running on http://localhost:3001

* **Code Quality**
    * TypeScript-first codebase with ESLint configured
    * Builds and lint checks to be validated per iteration
    * Professional naming conventions and code organization

### 🚧 Next Steps (Immediate - Phase 2 Completion)
* Create wireframes for authenticated user interfaces
* Design user flow diagrams for key user journeys
* Plan dashboard layouts for Agent vs Buyer experiences

### ⏳ Planned (Phase 3)
* Supabase database setup and schema design
* Authentication pages (Login/Register)
* Real-time transaction tracking functionality
* DeepL API integration for translation


