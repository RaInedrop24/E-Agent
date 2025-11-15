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