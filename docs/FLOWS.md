# User Flows (Mermaid)

This document describes key user flows for authentication and transaction lifecycle using Mermaid diagrams.

## Authentication Flow

```mermaid
flowchart TD
  A[Visitor lands on site] --> B{Has session?}
  B -- Yes --> C[Redirect to Dashboard]
  B -- No --> D[Login/Register page]

  D -->|Login| E[Submit credentials]
  E --> F{Auth success?}
  F -- Yes --> C
  F -- No --> G[Show error & retry]

  D -->|Register| H[Submit registration]
  H --> I{Signup success?}
  I -- Yes --> J[Create profile row]
  J --> K[Select role: Agent or Buyer]
  K --> C
  I -- No --> G
```

## Transaction Flow

```mermaid
flowchart TD
  A[Agent Dashboard] --> B[Create Transaction]
  B --> C[Invite Buyer by email]
  C --> D{Buyer accepts invite?}
  D -- Yes --> E[Participants linked to Transaction]
  D -- No --> C

  E --> F[Milestone Tracker initialized]
  F --> G{Agent marks milestone complete}
  G -- Yes --> H[Update milestone status]
  H --> I[Realtime update to Buyer view]
  G -- No --> F

  E --> J[Comms Hub messaging]
  J --> K[Auto-translate messages via DeepL]
  K --> J

  E --> L[File Uploads]
  L --> M[Share documents in Transaction]
```

### Notes
- Session handling is managed by Supabase Auth (planned).
- Participants define access scope for milestones, messages, and files.
- Realtime updates use Supabase channels/subscriptions (planned).


