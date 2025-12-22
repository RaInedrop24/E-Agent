# Component Hierarchy Diagram

## React Component Tree

```mermaid
graph TD
    Root[Root Layout<br/>app/layout.tsx]
    Root --> AuthProvider[AuthProvider<br/>contexts/AuthContext]
    AuthProvider --> LangProvider[LanguageProvider<br/>contexts/LanguageContext]

    LangProvider --> AuthPages[Auth Pages]
    LangProvider --> AppPages[Application Pages]

    subgraph "Authentication Flow"
        AuthPages --> Login[Login Page<br/>app/\(auth\)/login]
        AuthPages --> Register[Register Page<br/>app/\(auth\)/register]
        AuthPages --> Callback[OAuth Callback<br/>app/auth/callback]
    end

    subgraph "Main Application"
        AppPages --> Header[AppHeader<br/>components/layout/AppHeader]
        AppPages --> Dashboard[Dashboard<br/>app/dashboard]
        AppPages --> Transactions[Transactions<br/>app/transactions]
        AppPages --> TransactionDetail[Transaction Detail<br/>app/transaction/[id]]
        AppPages --> Buyers[Buyers<br/>app/buyers]
        AppPages --> Settings[Settings<br/>app/settings]
        AppPages --> Templates[Milestone Templates<br/>app/milestone-templates]
    end

    Header --> LangSelector[LanguageSelector]
    Header --> UserMenu[UserMenu]
    Header --> HamburgerMenu[HamburgerMenu]

    Dashboard --> DashboardCards[Transaction Cards]
    Dashboard --> ActivityFeed[Recent Activity]

    Transactions --> TransList[Transaction List]
    Transactions --> CreateTransModal[Create Transaction Modal]

    TransactionDetail --> DetailHeader[Transaction Header]
    TransactionDetail --> Tabs[Tab Navigation]

    Tabs --> TrackerTab[Tracker Tab]
    Tabs --> CommsTab[Communications Tab]
    Tabs --> FilesTab[Files Tab]

    TrackerTab --> ProgressTracker[ProgressTracker<br/>components/features/transaction]
    CommsTab --> MessagingPanel[MessagingPanel<br/>components/features/transaction]
    FilesTab --> FilesPanel[TransactionFilesPanel<br/>components/features/transaction]

    DetailHeader --> InviteModal[InviteBuyerModal]
    DetailHeader --> EditTitleModal[EditTransactionTitleModal]
    DetailHeader --> DeleteButton[Delete Transaction]
    DetailHeader --> EmailButton[Email Progress]

    ProgressTracker --> MilestoneCard[Milestone Cards]
    MilestoneCard --> ProgressBar[Progress Bar]
    MilestoneCard --> CheckIcon[Completion Icon]

    MessagingPanel --> MessageList[Message List]
    MessagingPanel --> MessageForm[Message Input Form]
    MessagingPanel --> TranslateBtn[Show Original Button]

    FilesPanel --> FileList[File List Items]
    FilesPanel --> UploadBtn[Upload Button]
    FilesPanel --> DownloadBtn[Download Links]

    Templates --> TemplateList[Template List]
    Templates --> CreateTemplModal[Create Template Modal]
    Templates --> SaveTemplModal[Save As Template Modal]
    Templates --> ApplyTemplModal[Apply Template Modal]

    Buyers --> BuyerList[Buyer List Table]
    Buyers --> CreateBuyerBtn[Create Buyer Button]
    Buyers --> ResendInvite[Resend Invite Button]

    style Root fill:#e1f5ff
    style AuthProvider fill:#fff4e6
    style LangProvider fill:#fff4e6
    style Header fill:#e8f5e9
    style Dashboard fill:#f3e5f5
    style TransactionDetail fill:#f3e5f5
```

## Component Categories

### 1. Context Providers (State Management)

#### AuthContext
**Location**: `src/contexts/AuthContext.tsx`
**Purpose**: Global authentication state
**Provides**:
- `user`: Current user object
- `profile`: User profile data
- `session`: Supabase session
- `loading`: Loading state
- `signOut()`: Logout function
- `refreshProfile()`: Refresh user data

**Usage**: Wrapped around entire app, consumed by all protected pages

#### LanguageContext
**Location**: `src/contexts/LanguageContext.tsx`
**Purpose**: Multi-language support
**Provides**:
- `language`: Current language code
- `t(key)`: Translation function for UI strings
- `tVar(obj)`: Extract language-specific value from object
- `setLanguage(lang)`: Change language

**Usage**: Wrapped inside AuthProvider, consumed by all UI components

### 2. Layout Components

#### AppHeader
**Location**: `src/components/layout/AppHeader.tsx`
**Props**: None (uses contexts)
**Features**:
- Logo and navigation
- Language selector dropdown
- User menu with profile options
- Mobile hamburger menu
- Responsive design

**Child Components**:
- LanguageSelector
- UserMenu
- HamburgerMenu

### 3. Feature Components

#### ProgressTracker
**Location**: `src/components/features/transaction/ProgressTracker.tsx`
**Props**:
```typescript
{
  milestones: Milestone[];
  currentMilestone: number;
  isAgent: boolean;
  transactionId: string;
  onMilestoneToggle: (id: string) => void;
}
```
**Features**:
- Visual timeline of milestones
- Progress percentage calculation
- Clickable completion toggles (agent only)
- Responsive card layout
- Icons: CheckCircle (complete), Clock (pending)

**State Management**:
- Local state for UI interactions
- Calls parent callback for data updates

#### MessagingPanel
**Location**: `src/components/features/transaction/MessagingPanel.tsx`
**Props**:
```typescript
{
  transactionId: string;
  messages: Message[];
  onRefresh: () => void;
}
```
**Features**:
- Real-time message display
- Auto-translation using DeepL API
- "Show Original" toggle per message
- Translation caching (JSONB)
- Message input form
- Author identification
- Timestamp display

**Dependencies**:
- AuthContext (current user)
- LanguageContext (user's language)
- Supabase client (send messages)
- Translation API (translate messages)

#### TransactionFilesPanel
**Location**: `src/components/features/transaction/TransactionFilesPanel.tsx`
**Props**:
```typescript
{
  transactionId: string;
  files: Document[];
  milestones: Milestone[];
  onRefresh: () => void;
}
```
**Features**:
- File upload with milestone association
- File list with metadata (name, size, uploader, date)
- Download functionality
- Delete capability (uploader or creator only)
- Drag-and-drop support
- File type icons

**Dependencies**:
- Supabase Storage (upload/download)
- AuthContext (permissions)

#### InviteBuyerModal
**Location**: `src/components/features/transaction/InviteBuyerModal.tsx`
**Props**:
```typescript
{
  transactionId: string;
  onSuccess: () => void;
}
```
**Features**:
- Modal dialog (shadcn/ui Dialog)
- Form: email, full name, language
- Creates buyer account via API
- Adds buyer to transaction
- Sends invitation email
- Validation and error handling

**API Integration**:
- POST /api/buyers/create

### 4. UI Components (shadcn/ui)

Located in `src/components/ui/`:
- **button.tsx**: Button variants (default, outline, ghost, destructive)
- **card.tsx**: Card container with header, content, footer
- **dialog.tsx**: Modal dialog with overlay
- **input.tsx**: Text input field
- **label.tsx**: Form label
- **select.tsx**: Dropdown select (Radix UI)
- **badge.tsx**: Status badges
- **progress.tsx**: Progress bar
- **tabs.tsx**: Tab navigation
- **dropdown-menu.tsx**: Dropdown menu (Radix UI)
- **toast.tsx**: Toast notifications
- **avatar.tsx**: User avatar with fallback

**Usage Pattern**:
```typescript
import { Button } from "@/components/ui/button"

<Button variant="outline" onClick={handleClick}>
  Click Me
</Button>
```

## Component Communication Patterns

### 1. Props Down, Events Up
Parent components pass data down via props, child components emit events via callbacks.

```typescript
// Parent
<ProgressTracker
  milestones={milestones}
  onMilestoneToggle={(id) => handleToggle(id)}
/>

// Child
<button onClick={() => props.onMilestoneToggle(milestone.id)}>
```

### 2. Context Consumption
Components access global state via React Context hooks.

```typescript
const { user, profile } = useAuth();
const { t, language } = useLanguage();
```

### 3. Server Actions
Form submissions and mutations use server actions or API routes.

```typescript
const response = await fetch('/api/buyers/create', {
  method: 'POST',
  body: JSON.stringify(data)
});
```

### 4. Supabase Subscriptions
Real-time updates via WebSocket subscriptions.

```typescript
const subscription = supabase
  .channel('messages')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'messages',
    filter: `transaction_id=eq.${transactionId}`
  }, handleNewMessage)
  .subscribe();
```

## Component Lifecycle

### Authentication Flow
1. User visits protected route
2. AuthContext checks session
3. If no session, redirect to /login
4. After login, fetch profile from database
5. Set global auth state
6. Allow access to protected routes

### Transaction Detail Page
1. User navigates to `/transaction/[id]`
2. Server component fetches initial data
3. Client components hydrate with data
4. Tab navigation switches between views
5. Each tab loads its specific component
6. Components subscribe to real-time updates
7. User interactions trigger API calls
8. UI updates reflect database changes

### Message Sending Flow
1. User types message in MessagingPanel
2. On submit, send to Supabase
3. Message saved with original language
4. Real-time subscription notifies all participants
5. Each client translates to their language
6. Translation cached in JSONB field
7. UI updates with new message

## Styling Architecture

### Tailwind Utility Classes
All components use Tailwind CSS utility classes:
```tsx
<div className="flex items-center gap-4 p-4 bg-white rounded-lg shadow">
```

### shadcn/ui Variants
Components support variant props using class-variance-authority:
```tsx
<Button variant="destructive" size="sm">
  Delete
</Button>
```

### Responsive Design
Mobile-first approach with breakpoints:
- `sm:` - 640px
- `md:` - 768px
- `lg:` - 1024px
- `xl:` - 1280px

```tsx
<div className="flex flex-col md:flex-row gap-4">
```

### Dark Mode Support
Currently not implemented, but Tailwind is configured for dark mode:
```tsx
<div className="bg-white dark:bg-gray-800">
```

## Component Reusability

### Atomic Design Principles
- **Atoms**: UI components (Button, Input)
- **Molecules**: Form fields with labels
- **Organisms**: Feature components (ProgressTracker)
- **Templates**: Page layouts
- **Pages**: Full pages with data fetching

### Shared Components
Frequently reused components:
- Card wrappers
- Form inputs
- Buttons with loading states
- Modal dialogs
- Loading spinners
- Error messages

## Performance Optimizations

### React Server Components
Default to server components where possible:
- Fetch data on server
- Reduce client-side JavaScript
- Faster initial page load

### Client Components
Only mark as "use client" when needed:
- Interactive components
- Using hooks (useState, useEffect)
- Event handlers
- Browser APIs

### Code Splitting
Automatic by Next.js:
- Each page is a separate chunk
- Dynamic imports for modals
- Lazy loading for heavy components

### Memoization
Use React.memo for expensive renders:
```tsx
export const ExpensiveComponent = React.memo(({ data }) => {
  // Heavy computation
});
```
