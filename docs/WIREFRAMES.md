# Wireframes - Project Verity

Low-fidelity wireframes for all authenticated screens and key user journeys.

---

## 1. Login Page

```
┌─────────────────────────────────────────────────────┐
│                The Property Gateway                   │
│                    [Logo/Brand]                      │
└─────────────────────────────────────────────────────┘

        ┌──────────────────────────────────┐
        │                                  │
        │      Welcome Back                │
        │                                  │
        │  Email                           │
        │  [____________________]          │
        │                                  │
        │  Password                        │
        │  [____________________]          │
        │                                  │
        │  [ ] Remember me                 │
        │                                  │
        │  [    Login Button    ]          │
        │                                  │
        │  Forgot password?                │
        │                                  │
        │  ─────────── or ────────────     │
        │                                  │
        │  Don't have an account?          │
        │  [   Sign up here   ]            │
        │                                  │
        └──────────────────────────────────┘
```

**Components:**
- Header (minimal, no auth menu)
- Login form card
- Email input
- Password input
- Remember me checkbox
- Primary button (Login)
- Link to register
- Link to password reset

---

## 2. Register Page

```
┌─────────────────────────────────────────────────────┐
│                The Property Gateway                   │
│                    [Logo/Brand]                      │
└─────────────────────────────────────────────────────┘

        ┌──────────────────────────────────┐
        │                                  │
        │      Create Account              │
        │                                  │
        │  Full Name                       │
        │  [____________________]          │
        │                                  │
        │  Email                           │
        │  [____________________]          │
        │                                  │
        │  Password                        │
        │  [____________________]          │
        │  • At least 8 characters         │
        │                                  │
        │  Confirm Password                │
        │  [____________________]          │
        │                                  │
        │  I am a:                         │
        │  ( ) Estate Agent                │
        │  ( ) Property Buyer              │
        │                                  │
        │  [ ] I agree to Terms of Service │
        │                                  │
        │  [   Create Account   ]          │
        │                                  │
        │  Already have an account?        │
        │  [    Sign in here    ]          │
        │                                  │
        └──────────────────────────────────┘
```

**Components:**
- Header (minimal)
- Registration form card
- Text inputs (name, email, password, confirm password)
- Radio group (role selection: Agent/Buyer)
- Password strength indicator
- Checkbox (terms acceptance)
- Primary button (Create Account)
- Link to login

---

## 3. Agent Dashboard

```
┌──────────────────────────────────────────────────────────────────────┐
│  The Property Gateway    [Dashboard] [Transactions]    [👤 Alessandro] [⚙] │
│                                                  Agent Badge          │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│                                                                       │
│  Welcome back, Alessandro                      [+ Create Transaction]│
│                                                                       │
└──────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  My Transactions                                         [View All] │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Title          Buyer        Status      Progress    Updated        │
│  ─────────────────────────────────────────────────────────────────  │
│  Villa Tuscany  Sarah Jones  Active      ████░░░░░░  2 days ago     │
│  Rome Apt       John Smith   Pending     ██░░░░░░░░  1 week ago     │
│  Florence Flat  Anna Brown   Complete    ██████████  3 weeks ago    │
│                                                                      │
│  [Load More...]                                                     │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────┐  ┌──────────────────────────────┐
│  Recent Activity                │  │  Quick Actions               │
├─────────────────────────────────┤  ├──────────────────────────────┤
│                                 │  │                              │
│  🔵 Villa Tuscany               │  │  [+ Create Transaction]      │
│     Milestone completed         │  │                              │
│     2 hours ago                 │  │  [📧 Invite Buyer]           │
│                                 │  │                              │
│  💬 Rome Apt                    │  │  [📄 View Templates]         │
│     New message from John       │  │                              │
│     5 hours ago                 │  │                              │
│                                 │  └──────────────────────────────┘
│  📎 Florence Flat               │
│     Document uploaded           │
│     1 day ago                   │
│                                 │
└─────────────────────────────────┘
```

**Components:**
- Header with navigation and user menu
- Role badge (Agent)
- Welcome banner with CTA
- Transactions table/list with:
  - Columns: Title, Buyer, Status, Progress bar, Updated timestamp
  - Sortable columns
  - Row actions (open)
- Recent Activity feed with icons
- Quick Actions panel with primary actions

---

## 4. Buyer Dashboard

```
┌──────────────────────────────────────────────────────────────────────┐
│  The Property Gateway    [Dashboard] [Transactions]      [👤 Sarah] [⚙]     │
│                                                    Buyer Badge        │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│                                                                       │
│  Welcome back, Sarah                                                 │
│                                                                       │
└──────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  My Transactions                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  Villa Tuscany                              [View Details] │    │
│  │  Agent: Alessandro Rossi                                   │    │
│  │  Status: Active                                            │    │
│  │  Progress: ████░░░░░░ 40%                                  │    │
│  │  Last Update: 2 days ago                                   │    │
│  └────────────────────────────────────────────────────────────┘    │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  Rome Apartment                             [View Details] │    │
│  │  Agent: Marco Bianchi                                      │    │
│  │  Status: Pending                                           │    │
│  │  Progress: ██░░░░░░░░ 20%                                  │    │
│  │  Last Update: 1 week ago                                   │    │
│  └────────────────────────────────────────────────────────────┘    │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  Recent Updates                                                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  🔵 Villa Tuscany                                                    │
│     Milestone "Survey Completed" marked as done                     │
│     2 hours ago                                                      │
│                                                                      │
│  💬 Villa Tuscany                                                    │
│     New message from Alessandro                                     │
│     5 hours ago                                                      │
│                                                                      │
│  📎 Rome Apartment                                                   │
│     New document shared: "Preliminary_Contract.pdf"                 │
│     1 day ago                                                        │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

**Components:**
- Header with navigation and user menu
- Role badge (Buyer)
- Welcome banner (simpler, no CTA)
- Transaction cards with:
  - Title and agent name
  - Status badge
  - Progress bar with percentage
  - Last update timestamp
  - "View Details" button
- Recent Updates feed with icons and timestamps

---

## 5. Transaction Detail - Agent View

```
┌──────────────────────────────────────────────────────────────────────┐
│  The Property Gateway    [Dashboard] [Transactions]    [👤 Alessandro] [⚙] │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│  ← Back to Dashboard                                                 │
│                                                                       │
│  Villa Tuscany - Florence                           Status: Active   │
│  Buyer: Sarah Jones (sarah@email.com)                               │
│  Progress: ████░░░░░░ 40% Complete                                   │
│                                                                       │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│  [Tracker] [Comms] [Files] [Participants]                           │
├──────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  TRACKER TAB                                                         │
│                                                                       │
│  Transaction Milestones                                              │
│                                                                       │
│  ✅ 1. Offer Accepted                                                │
│     Completed: Nov 1, 2025                     [Undo]               │
│                                                                       │
│  ✅ 2. Preliminary Contract Signed                                   │
│     Completed: Nov 5, 2025                     [Undo]               │
│                                                                       │
│  ✅ 3. Deposit Paid                                                  │
│     Completed: Nov 8, 2025                     [Undo]               │
│                                                                       │
│  ✅ 4. Survey Completed                                              │
│     Completed: Nov 14, 2025                    [Undo]               │
│                                                                       │
│  ⬜ 5. Final Deed (Rogito)                                           │
│     Not yet completed                          [Mark Complete]      │
│                                                                       │
│  ⬜ 6. Keys Handed Over                                              │
│     Not yet completed                          [Mark Complete]      │
│                                                                       │
│  ⬜ 7. Registration Complete                                         │
│     Not yet completed                          [Mark Complete]      │
│                                                                       │
└──────────────────────────────────────────────────────────────────────┘
```

**Tracker Tab Components:**
- Back navigation
- Transaction header with title, buyer info, status badge
- Progress bar showing completion percentage
- Tab navigation
- Milestone list with:
  - Checkbox icons (completed/pending)
  - Milestone title and number
  - Completion date (if complete)
  - Action buttons (Mark Complete / Undo)

---

## 6. Transaction Detail - Comms Tab (Agent View)

```
┌──────────────────────────────────────────────────────────────────────┐
│  [Tracker] [Comms] [Files] [Participants]                           │
├──────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  COMMS TAB - Messages (Auto-translated)                             │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  Sarah Jones (Buyer) • Nov 14, 3:42 PM                         │ │
│  │                                                                 │ │
│  │  Ciao Alessandro! Ho ricevuto il rapporto di perizia.          │ │
│  │  Sembra tutto a posto. Quando possiamo procedere al rogito?    │ │
│  │                                                                 │ │
│  │  [👁 Show Original (English)]                                  │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  You (Agent) • Nov 14, 4:15 PM                                 │ │
│  │                                                                 │ │
│  │  Hi Sarah! I received the survey report.                       │ │
│  │  Everything looks good. When can we proceed with the deed?     │ │
│  │                                                                 │ │
│  │  [👁 Show Original (Italian)]                                  │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  Write your message...                                         │ │
│  │  [_____________________________________________]  [📎] [Send]  │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                       │
└──────────────────────────────────────────────────────────────────────┘
```

**Comms Tab Components:**
- Tab navigation (Comms active)
- Message thread (chronological, newest at bottom)
- Message cards with:
  - Sender name and role
  - Timestamp
  - Translated message text
  - "Show Original" toggle button
  - Language indicator
- Message composer with:
  - Text area
  - Attachment button
  - Send button

---

## 7. Transaction Detail - Files Tab (Agent View)

```
┌──────────────────────────────────────────────────────────────────────┐
│  [Tracker] [Comms] [Files] [Participants]                           │
├──────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  FILES TAB - Shared Documents                                        │
│                                                                       │
│  [+ Upload File]                                                     │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  📄 Preliminary_Contract.pdf                                   │ │
│  │     Uploaded by: Alessandro (Agent)                            │ │
│  │     Date: Nov 5, 2025                                          │ │
│  │     Size: 2.3 MB                                               │ │
│  │     [Download] [Delete]                                        │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  📄 Survey_Report.pdf                                          │ │
│  │     Uploaded by: Sarah (Buyer)                                 │ │
│  │     Date: Nov 14, 2025                                         │ │
│  │     Size: 5.8 MB                                               │ │
│  │     [Download] [Delete]                                        │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  🖼 Property_Photos.zip                                         │ │
│  │     Uploaded by: Alessandro (Agent)                            │ │
│  │     Date: Oct 28, 2025                                         │ │
│  │     Size: 18.4 MB                                              │ │
│  │     [Download] [Delete]                                        │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                       │
└──────────────────────────────────────────────────────────────────────┘
```

**Files Tab Components:**
- Tab navigation (Files active)
- Upload button (primary action)
- File list with cards showing:
  - File icon (based on type)
  - Filename
  - Uploader name and role
  - Upload date
  - File size
  - Action buttons (Download, Delete)

---

## 8. Transaction Detail - Participants Tab (Agent View)

```
┌──────────────────────────────────────────────────────────────────────┐
│  [Tracker] [Comms] [Files] [Participants]                           │
├──────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  PARTICIPANTS TAB                                                    │
│                                                                       │
│  [+ Invite Buyer]                                                    │
│                                                                       │
│  Current Participants                                                │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  👤 Alessandro Rossi                                           │ │
│  │     Role: Agent (Owner)                                        │ │
│  │     Email: alessandro@estate-agency.it                         │ │
│  │     Status: Active                                             │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  👤 Sarah Jones                                                │ │
│  │     Role: Buyer                                                │ │
│  │     Email: sarah@email.com                                     │ │
│  │     Status: Active                                             │ │
│  │     Joined: Oct 25, 2025                                       │ │
│  │     [Remove Access]                                            │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                       │
│  Pending Invitations                                                 │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  📧 john.partner@email.com                                     │ │
│  │     Invited as: Buyer (Secondary)                              │ │
│  │     Sent: Nov 10, 2025                                         │ │
│  │     [Resend Invite] [Cancel]                                   │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                       │
└──────────────────────────────────────────────────────────────────────┘
```

**Participants Tab Components:**
- Tab navigation (Participants active)
- Invite button (primary action)
- Active participants list with cards showing:
  - Avatar/icon
  - Name
  - Role and permissions
  - Email
  - Status
  - Join date
  - Action buttons (Remove Access - except owner)
- Pending invitations list with:
  - Email address
  - Invited role
  - Sent date
  - Actions (Resend, Cancel)

---

## 9. Transaction Detail - Buyer View

```
┌──────────────────────────────────────────────────────────────────────┐
│  The Property Gateway    [Dashboard] [Transactions]      [👤 Sarah] [⚙]    │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│  ← Back to Dashboard                                                 │
│                                                                       │
│  Villa Tuscany - Florence                           Status: Active   │
│  Agent: Alessandro Rossi (alessandro@estate-agency.it)              │
│  Progress: ████░░░░░░ 40% Complete                                   │
│                                                                       │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│  [Tracker] [Comms] [Files] [Contacts]                               │
├──────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  TRACKER TAB (Read-Only)                                             │
│                                                                       │
│  Transaction Progress                                                │
│                                                                       │
│  ✅ 1. Offer Accepted                                                │
│     Completed: Nov 1, 2025, 10:30 AM                                │
│                                                                       │
│  ✅ 2. Preliminary Contract Signed                                   │
│     Completed: Nov 5, 2025, 2:15 PM                                 │
│                                                                       │
│  ✅ 3. Deposit Paid                                                  │
│     Completed: Nov 8, 2025, 9:00 AM                                 │
│                                                                       │
│  ✅ 4. Survey Completed                                              │
│     Completed: Nov 14, 2025, 3:45 PM                                │
│                                                                       │
│  ⏳ 5. Final Deed (Rogito)                                           │
│     In progress...                                                   │
│                                                                       │
│  ⏳ 6. Keys Handed Over                                              │
│     Pending...                                                       │
│                                                                       │
│  ⏳ 7. Registration Complete                                         │
│     Pending...                                                       │
│                                                                       │
└──────────────────────────────────────────────────────────────────────┘
```

**Buyer View Differences:**
- Read-only tracker (no Mark Complete/Undo buttons)
- Shows completion timestamps for completed milestones
- "In progress" vs "Pending" indicators
- "Contacts" tab instead of "Participants"
- No admin actions available

---

## 10. Create Transaction Modal (Agent)

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                   │
│  Create New Transaction                                    [✕]   │
│  ─────────────────────────────────────────────────────────────   │
│                                                                   │
│  Property Title *                                                │
│  [_______________________________]                               │
│  e.g., "Villa Tuscany - Florence"                               │
│                                                                   │
│  Property Address                                                │
│  [_______________________________]                               │
│                                                                   │
│  Initial Status                                                  │
│  [▼ Pending       ]                                              │
│                                                                   │
│  Notes (Optional)                                                │
│  [_______________________________]                               │
│  [_______________________________]                               │
│  [_______________________________]                               │
│                                                                   │
│  Would you like to invite a buyer now?                           │
│  ( ) Yes, invite now                                             │
│  ( ) No, I'll invite later                                       │
│                                                                   │
│  ─────────────────────────────────────────────────────────────   │
│                                                                   │
│              [Cancel]  [Create Transaction]                      │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

**Components:**
- Modal overlay
- Modal header with title and close button
- Form inputs:
  - Text input (property title) - required
  - Text input (address)
  - Select dropdown (status)
  - Textarea (notes)
  - Radio group (invite buyer decision)
- Modal footer with action buttons

---

## 11. Invite Buyer Modal (Agent)

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                   │
│  Invite Buyer to Transaction                               [✕]   │
│  ─────────────────────────────────────────────────────────────   │
│                                                                   │
│  Transaction: Villa Tuscany - Florence                           │
│                                                                   │
│  Buyer Email Address *                                           │
│  [_______________________________]                               │
│                                                                   │
│  Buyer Name (Optional)                                           │
│  [_______________________________]                               │
│                                                                   │
│  Personal Message (Optional)                                     │
│  [_______________________________]                               │
│  [_______________________________]                               │
│  [_______________________________]                               │
│  This will be included in the invitation email                   │
│                                                                   │
│  ─────────────────────────────────────────────────────────────   │
│                                                                   │
│  ℹ The buyer will receive an email invitation with a link       │
│    to create an account and access this transaction.            │
│                                                                   │
│              [Cancel]  [Send Invitation]                         │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

**Components:**
- Modal overlay
- Modal header with title and close button
- Transaction context display
- Form inputs:
  - Email input (buyer email) - required
  - Text input (buyer name)
  - Textarea (personal message)
- Info message explaining what happens
- Modal footer with action buttons

---

## 12. Responsive Behavior

### Mobile (< 768px)
- Header collapses to hamburger menu
- Tables become stacked cards
- Tab navigation becomes horizontal scrollable
- Side-by-side panels stack vertically
- Modals become full-screen on mobile

### Tablet (768px - 1024px)
- Header shows condensed navigation
- Tables remain tables but with fewer columns
- Tabs remain horizontal
- Two-column layouts maintained

### Desktop (> 1024px)
- Full layout as shown in wireframes
- All navigation items visible
- Multi-column layouts
- Larger modals centered

---

## Notes

- All timestamps show relative time (e.g., "2 hours ago") with full date on hover
- Status badges use color coding: Green (Active), Yellow (Pending), Gray (Complete)
- Progress bars show visual percentage and numeric percentage
- All action buttons follow primary/secondary/destructive hierarchy
- Icons used consistently: 🔵 milestones, 💬 messages, 📎 files, 👤 users, 📧 email
- Empty states needed for: no transactions, no messages, no files, no participants
- Loading states needed for all async operations
- Error states needed for failed operations
