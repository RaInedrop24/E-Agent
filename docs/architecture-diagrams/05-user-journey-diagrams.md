# User Journey Diagrams

## 1. Agent Journey: Creating and Managing a Transaction

```mermaid
journey
    title Agent: Complete Transaction Management Workflow
    section Registration & Setup
      Create agent account: 5: Agent
      Verify email: 5: Agent
      Set language preference: 5: Agent
      Complete profile: 5: Agent
    section Buyer Management
      Navigate to Buyers page: 4: Agent
      Create buyer accounts: 5: Agent
      Buyers receive invites: 3: Buyer
    section Transaction Creation
      Click "New Transaction": 5: Agent
      Enter property details: 4: Agent
      Set transaction title (6 languages): 4: Agent
      Select buyers to invite: 5: Agent
      Create transaction: 5: Agent
    section Milestone Setup
      Review default milestones: 4: Agent
      Customize milestone list: 5: Agent
      Reorder milestones: 4: Agent
      Add custom milestones: 5: Agent
      Save as template: 3: Agent
    section Transaction Progress
      Mark milestone complete: 5: Agent
      Upload documents: 5: Agent
      Associate files with milestones: 4: Agent
      Send messages to buyer: 5: Agent
      View buyer responses: 5: Agent
    section Communication
      Email progress summary: 4: Agent
      Buyer receives email: 4: Buyer
      Buyer reviews on mobile: 5: Buyer
    section Completion
      Mark final milestone: 5: Agent
      Archive transaction: 3: Agent
      Review analytics: 3: Agent
```

## 2. Buyer Journey: Participating in a Transaction

```mermaid
journey
    title Buyer: Transaction Participation Experience
    section Onboarding
      Receive invitation email: 5: Buyer
      Click invitation link: 5: Buyer
      Set password: 4: Buyer
      Log in: 5: Buyer
      Set language preference: 5: Buyer
    section Dashboard
      View dashboard: 5: Buyer
      See active transactions: 5: Buyer
      Click transaction card: 5: Buyer
    section Transaction View
      View progress tracker: 5: Buyer
      See completed milestones: 5: Buyer
      Understand next steps: 4: Buyer
    section Communication
      Navigate to Communications tab: 5: Buyer
      Read agent's messages: 5: Buyer
      View translated messages: 5: Buyer
      Reply to agent: 5: Buyer
      Toggle "Show Original": 4: Buyer
    section Document Access
      Navigate to Files tab: 5: Buyer
      Download documents: 5: Buyer
      Upload signed documents: 4: Buyer
    section Email Updates
      Receive progress email: 5: Buyer
      Review milestone summary: 5: Buyer
      Click link to portal: 5: Buyer
    section Mobile Access
      Access on phone: 4: Buyer
      Responsive interface: 5: Buyer
      Quick message reply: 5: Buyer
```

## 3. Complete User Flow Diagram

```mermaid
flowchart TD
    Start([User Visits Portal]) --> CheckAuth{Authenticated?}

    CheckAuth -->|No| LoginReg[Login/Register Page]
    CheckAuth -->|Yes| CheckRole{User Role?}

    LoginReg --> Login[Login with Email/Password]
    LoginReg --> Register[Register New Account]

    Register --> SelectRole{Select Role}
    SelectRole -->|Agent| CreateAgent[Create Agent Account]
    SelectRole -->|Buyer| CreateBuyer[Create Buyer Account<br/>via Agent Invitation]

    Login --> CheckRole
    CreateAgent --> Dashboard
    CreateBuyer --> Dashboard

    CheckRole -->|Agent| Dashboard[Agent Dashboard]
    CheckRole -->|Buyer| BuyerDash[Buyer Dashboard]

    Dashboard --> AgentActions{Choose Action}
    AgentActions -->|Manage Buyers| BuyerPage[Buyers Page]
    AgentActions -->|Create Transaction| CreateTrans[New Transaction Form]
    AgentActions -->|View Transaction| TransList[Transaction List]
    AgentActions -->|Manage Templates| Templates[Milestone Templates]

    BuyerPage --> InviteBuyer[Invite New Buyer]
    BuyerPage --> ResendInvite[Resend Invitation]
    InviteBuyer --> BuyerPage

    CreateTrans --> FillForm[Enter Property Details]
    FillForm --> SelectBuyers[Select Buyers to Invite]
    SelectBuyers --> SubmitTrans[Create Transaction]
    SubmitTrans --> TransDetail[Transaction Detail Page]

    TransList --> SelectTrans[Click Transaction]
    SelectTrans --> TransDetail

    BuyerDash --> BuyerTrans[View My Transactions]
    BuyerTrans --> SelectTrans

    TransDetail --> TabChoice{Select Tab}

    TabChoice -->|Tracker| ProgressView[Progress Tracker]
    TabChoice -->|Communications| MessagesView[Messaging Panel]
    TabChoice -->|Files| FilesView[Files Panel]

    ProgressView --> AgentActions2{Agent Actions}
    AgentActions2 -->|Complete Milestone| ToggleMilestone[Mark Complete/Incomplete]
    AgentActions2 -->|Edit Milestones| MilestoneEdit[Milestone Management Page]
    AgentActions2 -->|Email Progress| SendEmail[Send Progress Email]

    ToggleMilestone --> ProgressView
    MilestoneEdit --> DragDrop[Drag & Drop Reorder]
    MilestoneEdit --> AddMilestone[Add Custom Milestone]
    MilestoneEdit --> EditLabels[Edit Multi-language Labels]
    MilestoneEdit --> DeleteMilestone[Delete Milestone]
    MilestoneEdit --> SaveTemplate[Save as Template]
    MilestoneEdit --> ApplyTemplate[Apply Template]

    MessagesView --> TypeMessage[Type Message]
    TypeMessage --> SendMessage[Send Message]
    SendMessage --> AutoTranslate[Auto-translate to Recipients]
    AutoTranslate --> MessagesView
    MessagesView --> ShowOriginal[Toggle Show Original]

    FilesView --> UploadFile[Upload Document]
    FilesView --> DownloadFile[Download Document]
    FilesView --> DeleteFile[Delete Document]
    UploadFile --> SelectMilestone[Associate with Milestone]
    SelectMilestone --> FilesView

    Templates --> TemplateActions{Template Actions}
    TemplateActions -->|Create| CreateTemplate[New Template]
    TemplateActions -->|Apply| ApplyTemplateFlow[Apply to Transaction]
    TemplateActions -->|Edit| EditTemplate[Edit Template]
    TemplateActions -->|Delete| DeleteTemplate[Delete Template]

    style Start fill:#e1f5ff
    style Dashboard fill:#e8f5e9
    style BuyerDash fill:#e8f5e9
    style TransDetail fill:#fff4e6
    style ProgressView fill:#f3e5f5
    style MessagesView fill:#f3e5f5
    style FilesView fill:#f3e5f5
```

## 4. Milestone Management Journey

```mermaid
stateDiagram-v2
    [*] --> ViewDefaults: Transaction Created
    ViewDefaults --> CustomizeOrder: Agent decides to reorder
    ViewDefaults --> AddCustom: Agent needs custom milestone
    ViewDefaults --> ApplyTemplate: Agent has saved template
    ViewDefaults --> UseDefaults: Agent satisfied with defaults

    CustomizeOrder --> DragDrop: Open milestone editor
    DragDrop --> SaveChanges: New order
    SaveChanges --> [*]

    AddCustom --> EnterLabels: Create new milestone
    EnterLabels --> TranslateLabels: Enter 6 language versions
    TranslateLabels --> InsertPosition: Choose position
    InsertPosition --> SaveChanges

    ApplyTemplate --> SelectTemplate: Browse templates
    SelectTemplate --> ConfirmApply: Choose template
    ConfirmApply --> ReplaceAll: Replace existing milestones
    ReplaceAll --> [*]

    UseDefaults --> MarkProgress: Begin transaction
    MarkProgress --> CompleteOne: Mark milestone complete
    CompleteOne --> CheckProgress: Calculate %
    CheckProgress --> MarkProgress: Continue
    CheckProgress --> AllComplete: 100% done
    AllComplete --> [*]

    SaveChanges --> SaveAsTemplate: Optionally save
    SaveAsTemplate --> NameTemplate: Enter template name
    NameTemplate --> [*]
```

## 5. Communication Journey with Translation

```mermaid
sequenceDiagram
    participant Italian Agent
    participant System
    participant DeepL
    participant English Buyer

    Italian Agent->>System: Type message in Italian
    System->>System: Store original Italian text
    System->>DeepL: Translate IT → EN
    DeepL-->>System: English translation
    System->>System: Cache translation in JSONB
    System-->>English Buyer: Show English version
    System-->>Italian Agent: Show Italian original

    English Buyer->>English Buyer: Click "Show Original"
    System-->>English Buyer: Display Italian original

    English Buyer->>System: Type reply in English
    System->>System: Store original English text
    System->>DeepL: Translate EN → IT
    DeepL-->>System: Italian translation
    System->>System: Cache translation in JSONB
    System-->>Italian Agent: Show Italian version
    System-->>English Buyer: Show English original

    Note over Italian Agent,English Buyer: Both users see messages in their preferred language
    Note over System: All translations cached for future views
```

## 6. File Management Journey

```mermaid
stateDiagram-v2
    [*] --> NoFiles: Transaction Created
    NoFiles --> Uploading: User clicks Upload
    Uploading --> SelectFile: Choose file
    SelectFile --> SelectMilestone: Associate with milestone (optional)
    SelectMilestone --> Validating: Check file size/type
    Validating --> Rejected: Invalid file
    Validating --> Uploading2: Valid file

    Rejected --> Uploading: Try again

    Uploading2 --> StorageAPI: Upload to Supabase Storage
    StorageAPI --> DatabaseEntry: Save metadata to DB
    DatabaseEntry --> FileList: Display in list
    FileList --> [*]

    FileList --> Downloading: User clicks download
    Downloading --> OpenFile: Open in browser/app
    OpenFile --> FileList

    FileList --> Deleting: User clicks delete (if owner)
    Deleting --> ConfirmDelete: Confirmation dialog
    ConfirmDelete --> RemoveStorage: Delete from Storage
    RemoveStorage --> RemoveDB: Delete from database
    RemoveDB --> FileList
```

## 7. Error Handling Journey

```mermaid
flowchart TD
    Action[User Performs Action] --> Validate{Valid Input?}

    Validate -->|No| ClientError[Show Client-side Error]
    ClientError --> Retry[User Corrects Input]
    Retry --> Action

    Validate -->|Yes| SendRequest[Send to Server]
    SendRequest --> ServerCheck{Server Validation}

    ServerCheck -->|Fail| ServerError[Show Error Toast]
    ServerError --> Retry

    ServerCheck -->|Pass| DBCheck{Database Operation}

    DBCheck -->|Error| DBError[Database Error]
    DBError --> RLSCheck{RLS Policy?}
    RLSCheck -->|Yes| Unauthorized[Show 403 Error]
    RLSCheck -->|No| GenericError[Show Generic Error]

    Unauthorized --> ContactSupport[Contact Admin]
    GenericError --> Retry

    DBCheck -->|Success| Success[Show Success Message]
    Success --> UpdateUI[Update UI]
    UpdateUI --> [*]

    style ClientError fill:#ffebee
    style ServerError fill:#ffebee
    style DBError fill:#ffebee
    style Success fill:#e8f5e9
```

## 8. Multi-language Experience Journey

```mermaid
journey
    title International User: Multi-language Experience
    section Initial Setup
      Receive invitation (Italian): 5: Buyer
      Open portal: 5: Buyer
      Portal detects browser language: 5: System
      UI displays in Italian: 5: Buyer
    section Language Switch
      Open language selector: 4: Buyer
      Choose English: 5: Buyer
      UI instantly switches: 5: Buyer
      Navigation in English: 5: Buyer
    section Content Translation
      View transaction title: 5: Buyer
      See title in English: 5: Buyer
      View milestones: 5: Buyer
      See milestone labels in English: 5: Buyer
    section Messages
      Read agent's Italian message: 3: Buyer
      See English translation: 5: Buyer
      Click "Show Original": 4: Buyer
      See Italian original: 4: Buyer
      Reply in English: 5: Buyer
    section Email
      Receive progress email in English: 5: Buyer
      Content matches portal language: 5: Buyer
    section Seamless Experience
      Switch back to Italian: 5: Buyer
      All content updates: 5: Buyer
      Consistent experience: 5: Buyer
```

## User Pain Points Addressed

### 1. Language Barriers
**Problem**: International property transactions involve parties speaking different languages
**Solution**:
- 6 language support (EN, IT, PL, ES, FR, DE)
- Auto-translation of messages via DeepL
- Multi-language milestone labels
- User-specific language preferences
- "Show Original" option to verify translations

### 2. Progress Tracking
**Problem**: Buyers don't know transaction status
**Solution**:
- Visual progress tracker with completion percentage
- Real-time milestone updates
- Email progress summaries
- Mobile-responsive design for on-the-go checking

### 3. Document Management
**Problem**: Files scattered across email, WhatsApp, etc.
**Solution**:
- Centralized file storage
- Milestone-based organization
- Easy upload/download
- Access control per transaction

### 4. Communication Silos
**Problem**: Messages lost in email threads
**Solution**:
- Dedicated messaging panel per transaction
- Chronological message history
- Real-time updates
- Searchable message archive

### 5. Template Reusability
**Problem**: Agents recreate milestones for every transaction
**Solution**:
- Milestone template system
- Save custom workflows
- Apply templates to new transactions
- Share templates (future feature)

## User Segments and Their Needs

### Real Estate Agents
**Primary Goals**:
- Manage multiple transactions simultaneously
- Track progress efficiently
- Communicate with international buyers
- Maintain professional image

**Key Features Used**:
- Dashboard overview
- Transaction creation
- Milestone management
- Buyer invitation
- Progress emails

### International Buyers
**Primary Goals**:
- Understand transaction status
- Communicate in native language
- Access documents anytime
- Know next steps

**Key Features Used**:
- Progress tracker
- Message translation
- File downloads
- Email notifications

### Bilingual Coordinators
**Primary Goals**:
- Bridge language gaps
- Ensure clarity
- Maintain audit trail
- Coordinate multiple parties

**Key Features Used**:
- "Show Original" toggle
- Translation cache
- Message history
- Multi-language UI

## Accessibility Considerations

1. **Keyboard Navigation**: All interactive elements accessible via keyboard
2. **Screen Readers**: Semantic HTML with ARIA labels
3. **Color Contrast**: WCAG AA compliance
4. **Font Sizes**: Responsive typography
5. **Mobile Touch Targets**: 44x44px minimum

## Future Journey Enhancements

### Phase 2 Features
- **Push Notifications**: Real-time mobile alerts
- **Document Signing**: E-signature integration
- **Calendar Integration**: Appointment scheduling
- **Activity Feed**: Detailed audit log
- **Analytics Dashboard**: Transaction insights

### Phase 3 Features
- **Video Calls**: In-app video conferencing
- **AI Assistance**: Smart milestone suggestions
- **Automated Reminders**: Email reminders for pending actions
- **Mobile Apps**: Native iOS/Android apps
- **Advanced Search**: Full-text search across all transactions
