# Estate Agent Portal - Backlog Management

## Overview

This folder contains the product backlog for the Estate Agent Portal. Each feature is documented with detailed technical analysis, implementation plans, and metadata.

## Folder Structure

```
backlog/
├── README.md                           # This file - backlog methodology
├── backlog_features.md                 # Main index of all features (sortable, filterable)
└── features/                           # Individual feature folders
    ├── 001-sensitive-pii-storage/      # Feature ID and name
    │   ├── README.md                   # Feature overview and summary
    │   ├── technical-analysis.md       # Detailed technical findings
    │   ├── implementation-plan.md      # Step-by-step implementation guide
    │   └── (additional files as needed)
    ├── 002-another-feature/
    │   └── ...
    └── ...
```

## Feature Naming Convention

Features are named using the format: `{ID}-{kebab-case-name}`

- **ID**: 3-digit zero-padded number (001, 002, 003...)
- **Name**: Descriptive kebab-case name (e.g., `sensitive-pii-storage`, `bulk-email-notifications`)

## Feature Lifecycle

### 1. Proposed
- Feature idea documented in feature folder
- Added to `backlog_features.md` with status: `Proposed`
- Priority and effort estimated
- Dependencies identified

### 2. Approved
- Status changed to: `Approved`
- Prioritized in backlog
- Ready for development when capacity available

### 3. In Progress
- Status changed to: `In Progress`
- Developer assigned
- Work actively ongoing

### 4. Completed
- Status changed to: `Completed`
- Feature deployed to production
- Documentation updated
- Date completed recorded

### 5. Cancelled
- Status changed to: `Cancelled`
- Reason for cancellation documented
- Kept for historical reference

## Priority Levels

| Priority | Label | Description | SLA |
|----------|-------|-------------|-----|
| **P0** | Critical | Security vulnerabilities, data loss, legal compliance | Immediate |
| **P1** | High | Core functionality, major user impact | 1-2 weeks |
| **P2** | Medium | Important but not urgent, enhancements | 1-3 months |
| **P3** | Low | Nice-to-have, minor improvements | As capacity allows |

## Effort Estimation

| Size | Description | Typical Duration |
|------|-------------|------------------|
| **XS** | Trivial change, single file | 1-2 hours |
| **S** | Small feature, 2-5 files | 1-2 days |
| **M** | Medium feature, multiple components | 3-5 days |
| **L** | Large feature, cross-cutting concerns | 1-2 weeks |
| **XL** | Major feature, significant architecture | 3-4 weeks |

## Feature Categories

Use tags to categorize features:

- `security` - Security enhancements
- `compliance` - Legal/regulatory compliance (GDPR, etc.)
- `ui` - User interface improvements
- `api` - API changes or additions
- `performance` - Performance optimizations
- `integration` - Third-party integrations
- `infrastructure` - DevOps, deployment, infrastructure
- `database` - Database schema or query changes
- `authentication` - Auth and authorization
- `notifications` - Email, SMS, push notifications
- `reporting` - Analytics and reporting
- `documentation` - Documentation updates
- `testing` - Test coverage improvements

## How to Add a New Feature

### For AI Agents (Claude, etc.)

1. **Create feature folder:**
   ```
   backlog/features/{next-id}-{feature-name}/
   ```

2. **Create README.md** in feature folder with:
   - Feature title and ID
   - One-paragraph summary
   - User story (As a... I want... So that...)
   - Acceptance criteria
   - Related features/dependencies

3. **Create technical-analysis.md** (if needed) with:
   - Current state analysis
   - Technical gaps or challenges
   - Recommended approach
   - Security considerations
   - GDPR/compliance implications

4. **Create implementation-plan.md** (if needed) with:
   - Step-by-step implementation tasks
   - Database migrations required
   - API changes required
   - UI changes required
   - Testing requirements
   - Deployment considerations

5. **Update backlog_features.md:**
   - Add new row to the features table
   - Set appropriate priority, effort, status, tags
   - Link to feature folder

6. **Notify user:**
   - Inform user that feature has been added to backlog
   - Provide feature ID for reference
   - Suggest priority if appropriate

### For Developers

Same process as above, or:
- Create GitHub issue and link to backlog feature
- Discuss in team meeting and document decisions
- Use existing feature as template

## Backlog Grooming

### Weekly Review (Recommended)
- Review priorities based on business needs
- Update effort estimates as understanding improves
- Move completed features to `Completed` status
- Archive old cancelled features

### Before Each Sprint/Milestone
- Select features from backlog
- Ensure all selected features have complete documentation
- Assign features to developers
- Update status to `In Progress`

## Integration with Development Workflow

### Git Branches
When starting work on a backlog feature:
```bash
git checkout -b feature/001-sensitive-pii-storage
```

### Commit Messages
Reference feature ID in commits:
```bash
git commit -m "[001] Implement Supabase Vault encryption for PII"
```

### Pull Requests
- Link to backlog feature in PR description
- Include acceptance criteria checklist
- Update feature status when merged

## Querying the Backlog

### By Priority
```bash
# High priority features
grep "P1" backlog_features.md
```

### By Tag
```bash
# Security-related features
grep "security" backlog_features.md
```

### By Status
```bash
# Features in progress
grep "In Progress" backlog_features.md
```

## Tips for AI Agents

1. **Always check backlog before proposing new features** - Avoid duplicates
2. **Be specific in technical analysis** - Include code examples, file paths, SQL
3. **Provide effort estimates** - Help prioritize based on ROI
4. **Identify dependencies** - Highlight features that must be completed first
5. **Consider GDPR/security** - Every feature should have compliance review
6. **Link to existing code** - Reference file paths and line numbers
7. **Update regularly** - Keep status current as work progresses

## Maintenance

- Review and archive completed features older than 6 months
- Merge duplicate or overlapping feature requests
- Update estimates as the codebase evolves
- Keep technical analysis current with architecture changes

---

**Last Updated:** 2026-01-08
**Maintained By:** Claude Code + Development Team
**Questions?** Check `.claude` file for instructions
