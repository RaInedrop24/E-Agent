# UI Guide — Dashboards

This guide outlines the primary dashboard layouts for Agent and Buyer roles. It focuses on key sections, information density, and responsive behavior.

## Shared Principles
- Clean, minimal UI with clear status indicators
- Mobile-first, responsive layouts
- Real-time updates for milestones and messages
- Consistent terminology across roles

## Agent Dashboard

### Layout
- Header: App name, user menu, role badge
- Main actions:
  - Create Transaction
  - Invite Buyer
- Sections:
  1. Transactions Overview (table/list)
     - Columns: Title, Buyer, Status, Progress, Updated
     - Actions: Open, Archive
  2. Recent Activity
     - Milestone completions, new messages, file uploads
  3. Quick Actions
     - Create transaction, Invite buyer, View templates

### Transaction Detail (Agent)
- Summary Header: Title, Status, Progress bar
- Tabs:
  - Tracker: milestones list with complete/undo controls
  - Comms: message thread with translation toggle ("Show Original")
  - Files: uploaded documents with types and sizes
  - Participants: agent/buyer list and invite control

## Buyer Dashboard

### Layout
- Header: App name, user menu, role badge
- Sections:
  1. My Transactions (card/list)
     - Title, Agent, Status, Progress
  2. Updates Feed
     - New messages, milestone changes

### Transaction Detail (Buyer)
- Summary Header: Title, Status, Progress bar
- Tabs:
  - Tracker: read-only milestones with completion timestamps
  - Comms: message thread with translation toggle ("Show Original")
  - Files: downloadable documents
  - Contacts: agent details and support info

## Components & States
- ProgressTracker
  - Shows ordered milestones with completion state and dates
  - Agent: interactive; Buyer: read-only
- MessageItem
  - Original content + translated content
  - Toggle to view original text
- InviteBuyerModal
  - Email input, role confirmation, send invite

## Accessibility & Localization
- Use semantic headings and ARIA labels
- Color contrast compliant
- Labels localized (EN/IT planned), shared milestone codes map to localized labels

## Open Questions
- Do we show granular timestamps per milestone step in the list?
- Do we need per-transaction custom milestones in later versions?


