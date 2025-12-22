# Data Flow Diagrams

## 1. User Authentication Flow

```mermaid
sequenceDiagram
    participant User
    participant Browser
    participant AuthPage
    participant AuthContext
    participant Supabase
    participant Database

    User->>Browser: Navigate to /login
    Browser->>AuthPage: Load login page
    User->>AuthPage: Enter credentials
    AuthPage->>Supabase: signInWithPassword()
    Supabase->>Database: Verify credentials
    Database-->>Supabase: User data + JWT
    Supabase-->>AuthPage: Session + User
    AuthPage->>AuthContext: Set user state
    AuthContext->>Database: Fetch profile
    Database-->>AuthContext: Profile data
    AuthContext-->>Browser: Update global state
    Browser->>User: Redirect to /dashboard
```

## 2. Transaction Creation Flow

```mermaid
sequenceDiagram
    participant Agent
    participant CreateModal
    participant API
    participant Database
    participant Email

    Agent->>CreateModal: Click "Create Transaction"
    CreateModal->>Agent: Show form
    Agent->>CreateModal: Fill details + Select buyers
    CreateModal->>API: POST /transactions
    API->>Database: Create transaction record
    Database-->>API: transaction_id
    API->>Database: Add agent as participant
    API->>Database: Add selected buyers as participants
    API->>Email: Send invitation emails to buyers
    Email-->>Buyers: Invitation email
    Database-->>API: Success
    API-->>CreateModal: transaction_id + success
    CreateModal-->>Agent: Redirect to /transaction/[id]
```

## 3. Real-time Messaging Flow

```mermaid
sequenceDiagram
    participant User A
    participant MessagingPanel A
    participant Supabase
    participant Database
    participant DeepL
    participant MessagingPanel B
    participant User B

    User A->>MessagingPanel A: Type message
    MessagingPanel A->>Database: INSERT message (original language)
    Database-->>Supabase: Trigger real-time notification
    Supabase-->>MessagingPanel A: New message event
    Supabase-->>MessagingPanel B: New message event

    MessagingPanel A->>DeepL: Translate to User A's language
    DeepL-->>MessagingPanel A: Translated text
    MessagingPanel A->>Database: Cache translation in JSONB
    MessagingPanel A-->>User A: Display message

    MessagingPanel B->>Database: Check translation cache
    alt Translation exists
        Database-->>MessagingPanel B: Cached translation
    else No translation
        MessagingPanel B->>DeepL: Translate to User B's language
        DeepL-->>MessagingPanel B: Translated text
        MessagingPanel B->>Database: Cache translation
    end
    MessagingPanel B-->>User B: Display message
```

## 4. Milestone Completion Flow

```mermaid
sequenceDiagram
    participant Agent
    participant ProgressTracker
    participant Database
    participant Realtime
    participant Buyer

    Agent->>ProgressTracker: Click milestone checkbox
    ProgressTracker->>Database: UPDATE milestone SET completed=true
    Database->>Database: Record completion timestamp + user
    Database-->>Realtime: Trigger subscription
    Realtime-->>ProgressTracker: Update event
    ProgressTracker->>ProgressTracker: Recalculate progress %
    ProgressTracker-->>Agent: Show visual update
    Realtime-->>Buyer: Update event
    Buyer->>Buyer: Refresh progress tracker

    Note over Agent,Buyer: Both users see updated progress instantly
```

## 5. File Upload Flow

```mermaid
sequenceDiagram
    participant User
    participant FilesPanel
    participant Supabase Storage
    participant Database
    participant S3

    User->>FilesPanel: Select file + milestone
    FilesPanel->>FilesPanel: Validate file (size, type)
    FilesPanel->>Supabase Storage: Upload file
    Supabase Storage->>S3: Store binary data
    S3-->>Supabase Storage: storage_path
    Supabase Storage-->>FilesPanel: public URL
    FilesPanel->>Database: INSERT file metadata
    Database-->>FilesPanel: file_id
    FilesPanel->>FilesPanel: Refresh file list
    FilesPanel-->>User: Show uploaded file
```

## 6. Translation Caching Strategy

```mermaid
flowchart TD
    Start[User views message] --> CheckCache{Translation<br/>in cache?}
    CheckCache -->|Yes| ReturnCached[Return cached translation]
    CheckCache -->|No| CallDeepL[Call DeepL API]
    CallDeepL --> GetTranslation[Receive translation]
    GetTranslation --> SaveCache[Save to JSONB field]
    SaveCache --> ReturnNew[Return new translation]
    ReturnCached --> Display[Display to user]
    ReturnNew --> Display

    style CheckCache fill:#fff4e6
    style CallDeepL fill:#f3e5f5
    style SaveCache fill:#e8f5e9
```

## 7. Row Level Security (RLS) Flow

```mermaid
flowchart TD
    Request[User makes DB query] --> Auth{User<br/>authenticated?}
    Auth -->|No| Reject[Reject: 401 Unauthorized]
    Auth -->|Yes| JWT[Extract user_id from JWT]
    JWT --> RLS{Check RLS policies}

    RLS --> CheckOwnership{Is user<br/>owner/participant?}
    CheckOwnership -->|No| Reject2[Reject: 403 Forbidden]
    CheckOwnership -->|Yes| CheckRole{Has required<br/>role?}

    CheckRole -->|No| Reject3[Reject: 403 Forbidden]
    CheckRole -->|Yes| Execute[Execute query]
    Execute --> Filter[Apply row filters]
    Filter --> Return[Return filtered results]

    style Auth fill:#e1f5ff
    style RLS fill:#fff4e6
    style Execute fill:#e8f5e9
```

## 8. Email Progress Summary Flow

```mermaid
sequenceDiagram
    participant Agent
    participant Button
    participant API
    participant Database
    participant ReactEmail
    participant Resend
    participant Buyer

    Agent->>Button: Click "Email Progress"
    Button->>API: POST /api/transaction/[id]/email-progress
    API->>Database: Fetch transaction details
    API->>Database: Fetch completed milestones
    API->>Database: Fetch recent messages (last 5)
    API->>Database: Fetch file list
    Database-->>API: All data
    API->>ReactEmail: Render HTML template
    ReactEmail-->>API: HTML email content
    API->>Resend: Send email
    Resend->>Buyer: Deliver email
    Resend-->>API: Success confirmation
    API-->>Button: Success response
    Button-->>Agent: Show success toast
```

## 9. Buyer Invitation Flow

```mermaid
sequenceDiagram
    participant Agent
    participant InviteModal
    participant API
    participant Supabase Admin
    participant Database
    participant Email Service
    participant Buyer

    Agent->>InviteModal: Click "Invite Buyer"
    InviteModal->>Agent: Show form (email, name, language)
    Agent->>InviteModal: Submit form
    InviteModal->>API: POST /api/buyers/create

    API->>Database: Check if buyer exists
    alt Buyer exists
        Database-->>API: Buyer profile
        API->>Database: Add to transaction_participants
    else New buyer
        API->>Supabase Admin: inviteUserByEmail()
        Supabase Admin->>Database: Create auth.users record
        Database->>Database: Trigger: create profile
        Supabase Admin->>Email Service: Send invite email
        Email Service->>Buyer: Invitation email with set password link
        Database-->>API: New buyer profile
        API->>Database: Create buyer_agent_association
        API->>Database: Add to transaction_participants
    end

    Database-->>API: Success
    API-->>InviteModal: buyer_id
    InviteModal-->>Agent: Show success message
```

## 10. Transaction Deletion Flow

```mermaid
sequenceDiagram
    participant Agent
    participant DeleteBtn
    participant ConfirmDialog
    participant Database
    participant Storage
    participant Dashboard

    Agent->>DeleteBtn: Click "Delete Transaction"
    DeleteBtn->>ConfirmDialog: Show warning dialog
    Agent->>ConfirmDialog: Confirm deletion
    ConfirmDialog->>Database: Call delete_transaction RPC

    Database->>Database: Check if user is creator
    alt Not creator
        Database-->>ConfirmDialog: Error: Unauthorized
    else Is creator
        Database->>Storage: Delete all files from bucket
        Storage-->>Database: Files deleted
        Database->>Database: DELETE FROM files
        Database->>Database: DELETE FROM messages
        Database->>Database: DELETE FROM milestones
        Database->>Database: DELETE FROM transaction_participants
        Database->>Database: DELETE FROM transactions
        Database-->>ConfirmDialog: Success
    end

    ConfirmDialog-->>Agent: Redirect to /dashboard
    Dashboard->>Agent: Show updated transaction list
```

## 11. Language Switching Flow

```mermaid
flowchart TD
    User[User selects language] --> UpdateContext[Update LanguageContext]
    UpdateContext --> UpdateDB[Update profile.preferred_language]
    UpdateDB --> ReloadUI[Trigger UI re-render]

    ReloadUI --> TranslateUI[Translate UI strings via t function]
    ReloadUI --> TranslateData[Translate data via tVar function]

    TranslateUI --> ShowUI[Display in new language]
    TranslateData --> FetchTranslations{Message translations<br/>cached?}

    FetchTranslations -->|Yes| ShowCached[Show cached translations]
    FetchTranslations -->|No| CallAPI[Call DeepL API]
    CallAPI --> CacheNew[Cache in JSONB]
    CacheNew --> ShowNew[Show new translations]

    style UpdateContext fill:#e1f5ff
    style CallAPI fill:#f3e5f5
    style CacheNew fill:#e8f5e9
```

## 12. Milestone Template Application Flow

```mermaid
sequenceDiagram
    participant Agent
    participant TemplateModal
    participant Database

    Agent->>TemplateModal: Click "Apply Template"
    TemplateModal->>Database: Fetch agent's templates
    Database-->>TemplateModal: Template list
    TemplateModal-->>Agent: Show template options
    Agent->>TemplateModal: Select template
    TemplateModal->>Database: Fetch template_items
    Database-->>TemplateModal: Milestone definitions

    TemplateModal->>Database: BEGIN TRANSACTION
    Database->>Database: DELETE existing milestones

    loop For each template item
        Database->>Database: INSERT new milestone
    end

    Database->>Database: COMMIT TRANSACTION
    Database-->>TemplateModal: Success
    TemplateModal-->>Agent: Show updated milestones
```

## Data Flow Patterns

### 1. Optimistic Updates
Some UI updates happen immediately before server confirmation:
- Milestone toggle (reverted on error)
- Message sending (shows "sending" state)

### 2. Real-time Synchronization
WebSocket subscriptions keep data synchronized:
- New messages appear instantly
- Milestone completions broadcast to all users
- File uploads notify participants

### 3. Caching Strategy
Multiple levels of caching:
- **Translation cache**: JSONB in database
- **Browser cache**: React state
- **HTTP cache**: Next.js server components

### 4. Error Handling
All flows include error handling:
- API errors show toast notifications
- Network failures trigger retries
- Invalid data rejected at multiple levels (client, API, database)

### 5. Security Checkpoints
Every data flow includes security checks:
- JWT authentication
- RLS policies at database level
- API route authorization
- Client-side permission checks (UI only)

## Performance Considerations

### 1. Batching
- Multiple translations batched in single API call
- Database queries use joins to reduce round trips

### 2. Pagination
- Message lists paginated (50 per page)
- Transaction lists paginated (20 per page)
- File lists limited to recent uploads

### 3. Lazy Loading
- Modal components loaded on demand
- Images lazy loaded below the fold
- File previews generated on request

### 4. Debouncing
- Search inputs debounced (300ms)
- Auto-save debounced (500ms)
- Translation requests debounced (200ms)
