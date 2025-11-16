# Development Guide - Estate Portal

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Git

### Initial Setup
```bash
# Clone and navigate to project
git clone <repository-url>
cd estate-portal

# Install dependencies
npm install

# Run development server
npm run dev
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build production bundle
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript compiler

### Local Ports
- Default dev port: 3000
- Project dev port: 3001 (use `npm run dev -- -p 3001` or set `PORT=3001`)

### Convenience Script
- `npm run dev:3001` — starts the dev server on port 3001

### Production Start
- Build: `npm run build`
- Start on 3001: `PORT=3001 npm run start -- -p 3001`

## Git: Private repo access (Deploy key + SSH alias)

When the repository is private, you can use a deploy key and an SSH alias for automated pushes.

1) Generate an ed25519 key (no passphrase recommended for automation)
```bash
ssh-keygen -t ed25519 -f ~/.ssh/agent_eagent_ed25519 -C "estate-agent-portal-deploy-key" -N ""
```

2) Add SSH alias in `~/.ssh/config`
```
Host github-agent-eagent
    HostName github.com
    User git
    IdentityFile ~/.ssh/agent_eagent_ed25519
    IdentitiesOnly yes
```

3) Add the public key (`~/.ssh/agent_eagent_ed25519.pub`) to GitHub
- Repo → Settings → Deploy keys → Add deploy key
- Title: estate-agent-portal-deploy-key
- Paste the public key
- Enable “Allow write access”

4) Point the repo remote to the alias
```bash
git remote set-url origin git@github-agent-eagent:RaInedrop24/E-Agent.git
```

5) Test
```bash
ssh -T github-agent-eagent   # expect auth success banner
git ls-remote origin         # expect refs output
```

## Pushing to a Private GitHub Repo

### Option 1 — SSH keys (recommended)
1. Generate key (Windows PowerShell):
```powershell
ssh-keygen -t ed25519 -C "you@example.com"
```
2. Copy public key and add to GitHub (Settings → SSH and GPG keys):
```powershell
Get-Content $env:USERPROFILE\.ssh\id_ed25519.pub
```
3. Use SSH remote:
```powershell
cd estate-portal
git remote set-url origin git@github.com:RaInedrop24/E-Agent.git
ssh -T git@github.com
git push
```

### Option 2 — Personal Access Token (HTTPS)
1. Create a PAT (repo scope).
2. Set HTTPS remote:
```powershell
cd estate-portal
git remote set-url origin https://github.com/RaInedrop24/E-Agent.git
git push   # use PAT when prompted
```

### Option 3 — GitHub CLI
```powershell
gh auth login
cd estate-portal
git push
```

Notes:
- Ensure `.env*` files are not committed.
- Rotate any secrets that may have been exposed previously.

## MCP — Playwright Server (preview)
We are preparing to use the Playwright MCP server for automated site reviews from within the editor.

### Install Playwright browsers
```bash
npm run playwright:install
```

### MCP configuration
The MCP server is referenced in `.cursor/mcp.json`. Once the official Playwright MCP package is available from npm, enable it by removing `"disabled": true` and ensure the command resolves:
```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-playwright"],
      "env": { "PLAYWRIGHT_BROWSERS_PATH": "0" }
    }
  }
}
```

If a different package name or run command is provided, update the args accordingly. Until then, you can still run local Playwright tests using `playwright` directly.

## Continuous Integration (CI)
GitHub Actions run Playwright E2E tests on pushes and PRs to `main`.

- Workflow: `.github/workflows/e2e.yml`
- What it does:
  - Checks out repo
  - Uses Node 18
  - `npm ci`
  - `npx playwright install --with-deps`
  - Copies `.env.local.example` → `.env.local` for non-secret defaults
  - Runs `npm run test:e2e`

Local run remains:
```bash
npm run test:e2e
```
## Code Standards

### TypeScript
- All components must be fully typed
- No `any` types allowed in production code
- Use proper interfaces for props and data structures

### Component Structure
```typescript
// ComponentName.tsx
interface ComponentNameProps {
  // Properly typed props
}

export const ComponentName: React.FC<ComponentNameProps> = ({ 
  // destructured props 
}) => {
  // Component logic
  return (
    // JSX
  );
};
```

### File Naming
- Components: `PascalCase.tsx`
- Utilities: `camelCase.ts`
- Types: `types.ts` or `ComponentName.types.ts`

### Git Workflow
1. Create feature branch: `feature/description`
2. Make atomic commits with clear messages
3. Run linting and type checks before committing
4. Use conventional commit messages

### Commit Message Format
```
type(scope): description

Examples:
feat(auth): add user login functionality
fix(ui): resolve button styling issue
docs(readme): update installation instructions
```

## Environment Variables
Create `.env.local` file:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
DEEPL_API_KEY=your_deepl_api_key
```

## Testing Strategy
- Unit tests for utilities and hooks
- Component tests for UI components
- Integration tests for API routes
- E2E tests for critical user flows

## Performance Guidelines
- Use React.memo for expensive components
- Implement proper loading states
- Optimize images and assets
- Leverage Next.js built-in optimizations