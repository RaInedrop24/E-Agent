# Estate Agent Portal - Architecture Diagrams

This directory contains comprehensive architectural diagrams for the Estate Agent Portal solution. All diagrams are created using Mermaid syntax and can be viewed directly in GitHub, VS Code, or any Markdown viewer that supports Mermaid.

## Quick Start

To view these diagrams:
1. **GitHub**: Diagrams render automatically when viewing files
2. **VS Code**: Install the "Markdown Preview Mermaid Support" extension
3. **Excalidraw**: Import the JSON files (if available) into [Excalidraw](https://excalidraw.com)
4. **Online Viewers**: Use [Mermaid Live Editor](https://mermaid.live)

## Diagram Index

### 1. System Architecture
**File**: [01-system-architecture.md](./01-system-architecture.md)

**Contents**:
- High-level architecture overview
- Technology stack breakdown
- Client-server interaction
- External service integrations
- Infrastructure setup
- Key architecture patterns
- Security features
- Performance optimizations

**Best For**:
- Understanding the big picture
- Onboarding new developers
- Technical presentations
- Infrastructure planning

---

### 2. Database Schema
**File**: [02-database-schema.md](./02-database-schema.md)

**Contents**:
- Entity Relationship Diagram (ERD)
- All database tables with fields
- Relationships and foreign keys
- RLS (Row Level Security) policies
- Database triggers and functions
- Indexes and constraints
- Data types and JSONB usage
- Migration strategy

**Best For**:
- Database design review
- Understanding data model
- Writing queries
- Planning new features
- Security audits

---

### 3. Component Hierarchy
**File**: [03-component-hierarchy.md](./03-component-hierarchy.md)

**Contents**:
- React component tree
- Context providers (Auth, Language)
- Layout components
- Feature components with props
- UI components (shadcn/ui)
- Component communication patterns
- Styling architecture
- Performance optimizations

**Best For**:
- Frontend development
- Understanding component relationships
- Refactoring decisions
- UI/UX development
- Code reviews

---

### 4. Data Flow Diagrams
**File**: [04-data-flow-diagrams.md](./04-data-flow-diagrams.md)

**Contents**:
- 12 sequence diagrams covering:
  - Authentication flow
  - Transaction creation
  - Real-time messaging
  - Milestone completion
  - File uploads
  - Translation caching
  - RLS security checks
  - Email notifications
  - Buyer invitations
  - Transaction deletion
  - Language switching
  - Template application
- Data flow patterns
- Performance considerations

**Best For**:
- Understanding system behavior
- Debugging issues
- API integration
- Security analysis
- Performance optimization

---

### 5. User Journey Diagrams
**File**: [05-user-journey-diagrams.md](./05-user-journey-diagrams.md)

**Contents**:
- Agent complete workflow
- Buyer participation experience
- Complete user flow diagram
- Milestone management journey
- Communication with translation
- File management journey
- Error handling journey
- Multi-language experience
- User pain points addressed
- User segments and needs
- Accessibility considerations
- Future enhancements

**Best For**:
- UX design
- Feature prioritization
- User testing
- Product management
- Customer support training

---

## Diagram Types Used

### Mermaid Diagram Types

1. **Graph/Flowchart** (`graph TD`, `flowchart TD`)
   - System architecture
   - Component hierarchy
   - User flows
   - Decision trees

2. **Sequence Diagram** (`sequenceDiagram`)
   - Data flows
   - API interactions
   - Real-time communication
   - Multi-system processes

3. **Entity Relationship Diagram** (`erDiagram`)
   - Database schema
   - Table relationships
   - Foreign keys
   - Cardinality

4. **Journey Diagram** (`journey`)
   - User experiences
   - Step-by-step workflows
   - Satisfaction scores
   - Multi-actor processes

5. **State Diagram** (`stateDiagram-v2`)
   - State transitions
   - Lifecycle management
   - Workflow states
   - Process flows

## How to Use These Diagrams

### For Developers

**New to the project?**
1. Start with [System Architecture](./01-system-architecture.md) for overview
2. Read [Database Schema](./02-database-schema.md) to understand data
3. Review [Component Hierarchy](./03-component-hierarchy.md) for frontend structure
4. Reference [Data Flow Diagrams](./04-data-flow-diagrams.md) while coding

**Working on a feature?**
1. Find the relevant data flow diagram
2. Check component hierarchy for UI structure
3. Review database schema for data requirements
4. Verify user journey matches requirements

**Debugging an issue?**
1. Identify the user journey that's failing
2. Find the corresponding data flow diagram
3. Check security policies in database schema
4. Trace component communication in hierarchy

### For Product Managers

**Planning a feature?**
1. Review [User Journey Diagrams](./05-user-journey-diagrams.md) for context
2. Check if existing flows support the feature
3. Identify required changes in architecture
4. Estimate scope using component/data flow diagrams

**Reviewing progress?**
1. Match implemented features to user journeys
2. Verify data flow matches requirements
3. Check if UI matches component hierarchy plans

### For Designers

**Creating mockups?**
1. Start with [User Journey Diagrams](./05-user-journey-diagrams.md)
2. Reference [Component Hierarchy](./03-component-hierarchy.md) for existing UI patterns
3. Ensure flows match [Data Flow Diagrams](./04-data-flow-diagrams.md)

**Conducting user research?**
1. Use journey diagrams as interview guides
2. Identify pain points in current flows
3. Propose improvements to user journeys

### For DevOps/Infrastructure

**Setting up infrastructure?**
1. Review [System Architecture](./01-system-architecture.md) for requirements
2. Check [Database Schema](./02-database-schema.md) for database needs
3. Verify external service integrations
4. Plan scaling based on data flows

**Troubleshooting?**
1. Check [Data Flow Diagrams](./04-data-flow-diagrams.md) for expected behavior
2. Verify RLS policies in [Database Schema](./02-database-schema.md)
3. Review caching strategy in architecture

## Architecture Decision Records (ADRs)

Key architectural decisions documented in these diagrams:

### 1. Next.js App Router
**Decision**: Use Next.js 15 with App Router
**Rationale**: Server-side rendering, SEO, modern React patterns
**See**: [System Architecture](./01-system-architecture.md)

### 2. Supabase Backend
**Decision**: Use Supabase for backend services
**Rationale**: Built-in auth, real-time, RLS, PostgreSQL
**See**: [System Architecture](./01-system-architecture.md), [Database Schema](./02-database-schema.md)

### 3. Row Level Security
**Decision**: Database-level access control via RLS
**Rationale**: Security, performance, simplicity
**See**: [Database Schema](./02-database-schema.md), [Data Flow Diagrams](./04-data-flow-diagrams.md)

### 4. Translation Caching
**Decision**: Cache translations in JSONB field
**Rationale**: Reduce API calls, improve performance, cost savings
**See**: [Database Schema](./02-database-schema.md), [Data Flow Diagrams](./04-data-flow-diagrams.md)

### 5. Multi-language Support
**Decision**: Support 6 languages with DeepL auto-translation
**Rationale**: International users, real estate market needs
**See**: [User Journey Diagrams](./05-user-journey-diagrams.md)

### 6. Real-time Updates
**Decision**: WebSocket subscriptions for live updates
**Rationale**: Better UX, instant notifications, collaborative feel
**See**: [System Architecture](./01-system-architecture.md), [Data Flow Diagrams](./04-data-flow-diagrams.md)

### 7. Component Library (shadcn/ui)
**Decision**: Use shadcn/ui instead of Material-UI or Ant Design
**Rationale**: Customizable, TypeScript-first, modern design, tree-shakeable
**See**: [Component Hierarchy](./03-component-hierarchy.md)

### 8. Milestone Template System
**Decision**: Agent-level milestone templates
**Rationale**: Workflow reusability, agent productivity, flexibility
**See**: [Database Schema](./02-database-schema.md), [User Journey Diagrams](./05-user-journey-diagrams.md)

## Contributing to Documentation

### Adding New Diagrams

1. Create a new `.md` file with numbered prefix (e.g., `06-new-diagram.md`)
2. Use Mermaid syntax for diagrams
3. Add descriptions and context
4. Update this README with a link and description
5. Commit with descriptive message

### Updating Existing Diagrams

1. Edit the corresponding `.md` file
2. Update the Mermaid diagram code
3. Verify rendering in VS Code or GitHub preview
4. Commit changes with explanation

### Mermaid Syntax Resources

- [Mermaid Official Documentation](https://mermaid.js.org/)
- [Mermaid Live Editor](https://mermaid.live) - Test your diagrams
- [Mermaid Cheat Sheet](https://jojozhuang.github.io/tutorial/mermaid-cheat-sheet/)

## Exporting Diagrams

### To PNG/SVG
1. Open in [Mermaid Live Editor](https://mermaid.live)
2. Paste Mermaid code
3. Click "Actions" → "Export SVG" or "Export PNG"

### To Excalidraw
While Excalidraw JSON export wasn't generated in this session due to MCP server setup, you can:
1. Manually recreate diagrams in [Excalidraw](https://excalidraw.com)
2. Export as `.excalidraw` files
3. Save in `excalidraw/` subdirectory

### To PDF
1. Open diagram in GitHub or VS Code
2. Print page to PDF
3. Or use `mermaid-cli`: `mmdc -i input.md -o output.pdf`

## Tools and Viewers

### Online
- [Mermaid Live Editor](https://mermaid.live) - Interactive editor
- [GitHub](https://github.com) - Native Mermaid rendering
- [Excalidraw](https://excalidraw.com) - Hand-drawn style diagrams

### VS Code Extensions
- **Markdown Preview Mermaid Support** - Render Mermaid in preview
- **Mermaid Markdown Syntax Highlighting** - Syntax highlighting
- **Excalidraw** - Excalidraw integration in VS Code

### CLI Tools
- **mermaid-cli** - Convert Mermaid to images: `npm install -g @mermaid-js/mermaid-cli`

## Version History

- **v1.0** (2025-12-22) - Initial comprehensive architecture diagrams
  - System architecture
  - Database schema
  - Component hierarchy
  - Data flow diagrams (12 flows)
  - User journey diagrams (8 journeys)

## Related Documentation

- [Technical Specification](../technical-spec.md)
- [Development Guide](../development-guide.md)
- [API Documentation](../api-docs.md)
- [Database Migrations](../../supabase/migrations/)
- [Component Documentation](../../src/components/README.md)

## Questions or Feedback?

For questions about these diagrams or suggestions for improvements:
1. Open an issue in the project repository
2. Contact the development team
3. Submit a pull request with updates

---

**Last Updated**: 2025-12-22
**Created By**: Claude Code AI Assistant
**Technology**: Mermaid.js for diagramming
