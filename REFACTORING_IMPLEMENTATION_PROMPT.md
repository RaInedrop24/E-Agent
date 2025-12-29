# Implementation Prompt for Senior Refactoring Engineer

**Context:** You are a Senior Refactoring Engineer tasked with implementing the improvements identified in the SaaS Audit Report for The Property Gateway application. This prompt provides specific, actionable instructions for each file that requires modification.

**Important:** PRESERVE ALL EXISTING BUSINESS LOGIC. These refactorings are non-breaking improvements focused on code quality, performance, accessibility, and user experience.

---

## Phase 1: Critical Fixes (Priority: IMMEDIATE)

### 1.1 Performance: Implement Code Splitting

**Objective:** Reduce initial bundle size by lazy-loading heavy components.

**File:** `src/app/transaction/[id]/page.tsx`
**Lines:** 15-19
**Current:**
```typescript
import { ProgressTracker } from '@/components/features/transaction/ProgressTracker';
import { InviteBuyerModal } from '@/components/features/transaction/InviteBuyerModal';
import { MessagingPanel } from '@/components/features/transaction/MessagingPanel';
import { EditTransactionTitleModal } from '@/components/features/transaction/EditTransactionTitleModal';
import { TransactionFilesPanel } from '@/components/features/transaction/TransactionFilesPanel';
```

**Replace with:**
```typescript
import dynamic from 'next/dynamic';

// Lazy load components that are only visible in specific tabs
const ProgressTracker = dynamic(() => import('@/components/features/transaction/ProgressTracker').then(mod => ({ default: mod.ProgressTracker })));
const InviteBuyerModal = dynamic(() => import('@/components/features/transaction/InviteBuyerModal').then(mod => ({ default: mod.InviteBuyerModal })));
const MessagingPanel = dynamic(() => import('@/components/features/transaction/MessagingPanel').then(mod => ({ default: mod.MessagingPanel })));
const EditTransactionTitleModal = dynamic(() => import('@/components/features/transaction/EditTransactionTitleModal').then(mod => ({ default: mod.EditTransactionTitleModal })));
const TransactionFilesPanel = dynamic(() => import('@/components/features/transaction/TransactionFilesPanel').then(mod => ({ default: mod.TransactionFilesPanel })));
```

---

### 1.2 Performance: Optimize Image Loading

**File:** `src/components/layout/Header.tsx`
**Lines:** 29-45
**Current:**
```typescript
{logoUrl && (
  <img
    src={logoUrl}
    alt="Agency Logo"
    className="h-8 md:h-10 w-auto object-contain"
  />
)}
```

**Replace with:**
```typescript
import Image from 'next/image';

{logoUrl && (
  <Image
    src={logoUrl}
    alt="Agency Logo"
    width={120}
    height={40}
    className="h-8 md:h-10 w-auto object-contain"
    priority
  />
)}
```

**Note:** Apply same change to both instances (lines 29-35 and 39-45)

---

### 1.3 Performance: Add Memoization

**File:** `src/app/dashboard/page.tsx`
**Lines:** 189-195
**Add import at top:**
```typescript
import { useEffect, useState, useMemo } from "react";
```

**Replace function:**
```typescript
// OLD
function calculateProgress(transaction: Transaction): number {
  if (!transaction.milestones || transaction.milestones.length === 0) {
    return 0;
  }
  const completed = transaction.milestones.filter(m => m.completed).length;
  return Math.round((completed / transaction.milestones.length) * 100);
}
```

**With memoized version in component:**
```typescript
const calculateProgress = useMemo(() => {
  return (transaction: Transaction): number => {
    if (!transaction.milestones || transaction.milestones.length === 0) {
      return 0;
    }
    const completed = transaction.milestones.filter(m => m.completed).length;
    return Math.round((completed / transaction.milestones.length) * 100);
  };
}, []);
```

---

### 1.4 Accessibility: Add Skip Navigation Link

**File:** `src/app/layout.tsx`
**Lines:** 29-45
**Current:**
```typescript
<html lang="en" suppressHydrationWarning>
  <body
    className={`${geistSans.variable} ${geistMono.variable} antialiased`}
  >
    <AuthProvider>
      <BrandingProvider>
        <LanguageProvider>
          <ConditionalHeader />
          {children}
        </LanguageProvider>
      </BrandingProvider>
    </AuthProvider>
  </body>
</html>
```

**Replace with:**
```typescript
<html lang="en" suppressHydrationWarning>
  <body
    className={`${geistSans.variable} ${geistMono.variable} antialiased`}
  >
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md"
    >
      Skip to main content
    </a>
    <AuthProvider>
      <BrandingProvider>
        <LanguageProvider>
          <ConditionalHeader />
          <main id="main-content">
            {children}
          </main>
        </LanguageProvider>
      </BrandingProvider>
    </AuthProvider>
  </body>
</html>
```

---

### 1.5 Accessibility: Add ARIA Labels to Navigation

**File:** `src/components/layout/Header.tsx`
**Lines:** 28-46
**Current:**
```typescript
<Link href={user ? "/dashboard" : "/"} className="flex items-center gap-3">
```

**Replace with:**
```typescript
<Link
  href={user ? "/dashboard" : "/"}
  className="flex items-center gap-3"
  aria-label="The Property Gateway - Go to home page"
>
```

---

### 1.6 SEO: Enhance Metadata

**File:** `src/app/layout.tsx`
**Lines:** 19-22
**Current:**
```typescript
export const metadata: Metadata = {
  title: "The Property Gateway",
  description: "The Property Gateway - Multilingual property transaction tracking platform",
};
```

**Replace with:**
```typescript
export const metadata: Metadata = {
  title: {
    default: "The Property Gateway | Property Transaction Tracking Software",
    template: "%s | The Property Gateway"
  },
  description: "Streamline property transactions with multilingual communication, automated progress tracking, and real-time notifications for estate agents and buyers across Europe.",
  keywords: ["property transaction management", "estate agent software", "multilingual property portal", "buyer communication platform", "property purchase tracking"],
  authors: [{ name: "The Property Gateway" }],
  creator: "The Property Gateway",
  publisher: "The Property Gateway",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_GB",
    url: "https://mail.thepropertygateway.com",
    title: "The Property Gateway | Property Transaction Tracking",
    description: "Streamline property transactions with multilingual communication and automated tracking",
    siteName: "The Property Gateway",
    images: [{
      url: "https://mail.thepropertygateway.com/og-image.png",
      width: 1200,
      height: 630,
      alt: "The Property Gateway - Property Transaction Tracking Platform",
    }],
  },
  twitter: {
    card: "summary_large_image",
    title: "The Property Gateway | Property Transaction Tracking",
    description: "Streamline property transactions with multilingual communication",
    images: ["https://mail.thepropertygateway.com/twitter-image.png"],
  },
  alternates: {
    canonical: "https://mail.thepropertygateway.com",
  },
  verification: {
    google: "your-google-verification-code",
  },
};
```

**Action Required:** Update verification codes and create OG/Twitter images at specified paths.

---

### 1.7 SEO: Create Sitemap

**File:** `src/app/sitemap.ts` (NEW FILE)
**Create this file:**
```typescript
import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://mail.thepropertygateway.com';

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/register`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/dashboard`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
  ];
}
```

---

### 1.8 SEO: Create robots.txt

**File:** `public/robots.txt` (NEW FILE)
**Create this file:**
```
# Allow all crawlers
User-agent: *
Allow: /

# Disallow admin and debug routes
Disallow: /admin/
Disallow: /debug/
Disallow: /api/
Disallow: /auth/callback

# Sitemap location
Sitemap: https://mail.thepropertygateway.com/sitemap.xml
```

---

### 1.9 Code Quality: Extract Shared Utilities

**File:** `src/lib/date-utils.ts` (NEW FILE)
**Create this file:**
```typescript
/**
 * Format a date string as relative time
 * @param dateString - ISO date string
 * @returns Human-readable relative time (e.g., "5m ago", "2h ago")
 */
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}
```

**File:** `src/app/dashboard/page.tsx`
**Lines:** 210-227
**Replace:**
```typescript
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) {
    return `${diffMins}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else if (diffDays < 7) {
    return `${diffDays}d ago`;
  } else {
    return date.toLocaleDateString();
  }
}
```

**With:**
```typescript
import { formatRelativeTime } from '@/lib/date-utils';

// Remove formatDate function, use formatRelativeTime instead at line 322
{formatRelativeTime(activity.created_at)}
```

**File:** `src/components/features/transaction/MessagingPanel.tsx`
**Lines:** 260-273
**Replace:**
```typescript
const formatTime = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
};
```

**With:**
```typescript
import { formatRelativeTime } from '@/lib/date-utils';

// Use formatRelativeTime at line 307 instead of formatTime
{formatRelativeTime(message.created_at)}
```

---

### 1.10 Code Quality: Replace alert() with Toast Notifications

**Install dependency:**
```bash
npm install sonner
```

**File:** `src/app/layout.tsx`
**Add at top of file:**
```typescript
import { Toaster } from 'sonner';
```

**Update body (after line 38):**
```typescript
<LanguageProvider>
  <ConditionalHeader />
  <main id="main-content">
    {children}
  </main>
  <Toaster position="top-right" richColors />
</LanguageProvider>
```

**File:** `src/app/transaction/[id]/page.tsx`
**Add import:**
```typescript
import { toast } from 'sonner';
```

**Lines:** 342
**Replace:**
```typescript
alert('Failed to update milestone: ' + err.message);
```

**With:**
```typescript
toast.error('Failed to update milestone', {
  description: err.message
});
```

**Lines:** 371
**Replace:**
```typescript
alert('Transaction progress email sent successfully to ' + user.email);
```

**With:**
```typescript
toast.success('Email sent successfully', {
  description: `Progress update sent to ${user.email}`
});
```

**Lines:** 373
**Replace:**
```typescript
alert('Failed to send email: ' + err.message);
```

**With:**
```typescript
toast.error('Failed to send email', {
  description: err.message
});
```

**Lines:** 428
**Replace:**
```typescript
alert(t('transaction.deleteFailed') + ': ' + (err.message || 'Unknown error'));
```

**With:**
```typescript
toast.error(t('transaction.deleteFailed'), {
  description: err.message || 'Unknown error'
});
```

**File:** `src/components/features/transaction/MessagingPanel.tsx`
**Add import:**
```typescript
import { toast } from 'sonner';
```

**Lines:** 195
**Replace:**
```typescript
alert('Failed to send message. Please try again.');
```

**With:**
```typescript
toast.error('Failed to send message', {
  description: 'Please try again'
});
```

**Lines:** 247
**Replace:**
```typescript
alert('Failed to translate message');
```

**With:**
```typescript
toast.error('Translation failed', {
  description: 'Please try again later'
});
```

---

## Phase 2: UX Improvements

### 2.1 Create Empty State Component

**File:** `src/components/ui/empty-state.tsx` (NEW FILE)
**Create this file:**
```typescript
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className
}: EmptyStateProps) {
  return (
    <div className={cn("text-center py-12", className)}>
      <Icon className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
      <h3 className="text-lg font-medium text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm mx-auto">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="mt-6 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
```

**File:** `src/app/dashboard/page.tsx`
**Add import:**
```typescript
import { EmptyState } from '@/components/ui/empty-state';
import { Plus } from 'lucide-react';
```

**Lines:** 248-253
**Replace:**
```typescript
<div className="text-sm text-muted-foreground py-4 text-center">
  {profile?.role === 'agent'
    ? t('dashboard.createFirst')
    : "You haven't been invited to any transactions yet."}
</div>
```

**With:**
```typescript
<EmptyState
  icon={Receipt}
  title={profile?.role === 'agent' ? 'No transactions yet' : 'No invitations yet'}
  description={profile?.role === 'agent'
    ? t('dashboard.createFirst')
    : "You haven't been invited to any transactions yet. Your agent will send you an invitation when they create a transaction."}
  action={profile?.role === 'agent' ? {
    label: 'Create your first transaction',
    onClick: () => router.push('/transactions/create')
  } : undefined}
/>
```

**File:** `src/components/features/transaction/MessagingPanel.tsx`
**Add import:**
```typescript
import { EmptyState } from '@/components/ui/empty-state';
```

**Lines:** 280-284
**Replace:**
```typescript
<div className="text-center py-12 text-muted-foreground">
  <MessageCircle className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
  <p className="text-lg font-medium">No messages yet</p>
  <p className="text-sm mt-2">Start the conversation!</p>
</div>
```

**With:**
```typescript
<EmptyState
  icon={MessageCircle}
  title="No messages yet"
  description="Start the conversation! Send a message to begin collaborating on this transaction."
/>
```

---

### 2.2 Add Loading Skeleton Screens

**Install dependency:**
```bash
npm install react-loading-skeleton
```

**File:** `src/app/dashboard/page.tsx`
**Add import:**
```typescript
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
```

**Lines:** 229-236
**Replace:**
```typescript
if (loading) {
  return (
    <div className="max-w-5xl mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-semibold">{t('dashboard.title')}</h1>
      <div className="text-muted-foreground">Loading your transactions...</div>
    </div>
  );
}
```

**With:**
```typescript
if (loading) {
  return (
    <div className="max-w-5xl mx-auto p-4 space-y-6">
      <Skeleton height={32} width={200} />
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <Skeleton height={24} width={150} />
          </CardHeader>
          <CardContent className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border rounded p-3">
                <Skeleton height={20} width="80%" />
                <Skeleton height={8} width="100%" className="mt-2" />
                <Skeleton height={12} width="40%" className="mt-1" />
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton height={24} width={150} />
          </CardHeader>
          <CardContent className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex gap-3">
                <Skeleton circle width={16} height={16} />
                <div className="flex-1">
                  <Skeleton height={16} width="90%" />
                  <Skeleton height={12} width="60%" className="mt-1" />
                </div>
                <Skeleton height={12} width={50} />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

---

### 2.3 Add Visual Hierarchy to CTAs

**File:** `src/app/page.tsx`
**Lines:** 58-65
**Current:**
```typescript
<div className="mt-8 flex justify-center gap-4">
  <Button size="lg" asChild>
    <a href="/register">{t('landing.getStarted')}</a>
  </Button>
  <Button variant="outline" size="lg" asChild>
    <a href="/login">{t('landing.signIn')}</a>
  </Button>
</div>
```

**Replace with (add visual prominence to primary CTA):**
```typescript
<div className="mt-8 flex justify-center gap-4 flex-wrap">
  <Button
    size="lg"
    asChild
    className="shadow-lg hover:shadow-xl transition-shadow"
  >
    <a href="/register" className="flex items-center gap-2">
      {t('landing.getStarted')}
      <ArrowRight className="h-4 w-4" />
    </a>
  </Button>
  <Button variant="outline" size="lg" asChild>
    <a href="/login">{t('landing.signIn')}</a>
  </Button>
</div>
```

**Add import at top:**
```typescript
import { ArrowRight } from 'lucide-react';
```

---

## Phase 3: Mobile Optimizations

### 3.1 Fix Messaging Panel Height for Mobile

**File:** `src/components/features/transaction/MessagingPanel.tsx`
**Line:** 276
**Current:**
```typescript
<div className="flex flex-col h-[600px]">
```

**Replace with:**
```typescript
<div className="flex flex-col h-[600px] md:h-[600px] sm:h-[calc(100vh-200px)]">
```

---

### 3.2 Make Transaction Tab Labels Mobile-Friendly

**File:** `src/app/transaction/[id]/page.tsx`
**Lines:** 598-615
**Current:**
```typescript
<TabsList className="grid w-full grid-cols-4">
  <TabsTrigger value="tracker" className="flex items-center gap-2">
    <Check className="h-4 w-4" />
    {t('transaction.tracker')}
  </TabsTrigger>
  <TabsTrigger value="messages" className="flex items-center gap-2">
    <MessageCircle className="h-4 w-4" />
    {t('transaction.messages')} ({messages.length})
  </TabsTrigger>
  <TabsTrigger value="files" className="flex items-center gap-2">
    <FileText className="h-4 w-4" />
    {t('transaction.files')} ({fileCount})
  </TabsTrigger>
  <TabsTrigger value="participants" className="flex items-center gap-2">
    <Users className="h-4 w-4" />
    {t('transaction.participants')} ({participants.length})
  </TabsTrigger>
</TabsList>
```

**Replace with:**
```typescript
<TabsList className="grid w-full grid-cols-4">
  <TabsTrigger value="tracker" className="flex items-center gap-2">
    <Check className="h-4 w-4" />
    <span className="hidden sm:inline">{t('transaction.tracker')}</span>
    <span className="sm:hidden" aria-label={t('transaction.tracker')}>Tracker</span>
  </TabsTrigger>
  <TabsTrigger value="messages" className="flex items-center gap-2">
    <MessageCircle className="h-4 w-4" />
    <span className="hidden sm:inline">{t('transaction.messages')} ({messages.length})</span>
    <span className="sm:hidden">({messages.length})</span>
  </TabsTrigger>
  <TabsTrigger value="files" className="flex items-center gap-2">
    <FileText className="h-4 w-4" />
    <span className="hidden sm:inline">{t('transaction.files')} ({fileCount})</span>
    <span className="sm:hidden">({fileCount})</span>
  </TabsTrigger>
  <TabsTrigger value="participants" className="flex items-center gap-2">
    <Users className="h-4 w-4" />
    <span className="hidden sm:inline">{t('transaction.participants')} ({participants.length})</span>
    <span className="sm:hidden">({participants.length})</span>
  </TabsTrigger>
</TabsList>
```

---

### 3.3 Responsive Transaction Header

**File:** `src/app/transaction/[id]/page.tsx`
**Lines:** 493-594
**Current:**
```typescript
<div className="flex items-start gap-4">
  <Link href="/dashboard">
    <Button variant="ghost" size="icon">
      <ArrowLeft className="h-5 w-5" />
    </Button>
  </Link>
  <div className="flex-1">
    {/* ... */}
  </div>
  <div className="flex gap-2">
    {/* buttons */}
  </div>
</div>
```

**Replace with:**
```typescript
<div className="flex flex-col sm:flex-row items-start gap-4">
  <Link href="/dashboard" className="sm:self-start">
    <Button variant="ghost" size="icon">
      <ArrowLeft className="h-5 w-5" />
      <span className="sr-only">Back to dashboard</span>
    </Button>
  </Link>
  <div className="flex-1 w-full sm:w-auto min-w-0">
    {/* ... existing content ... */}
  </div>
  <div className="flex gap-2 flex-wrap sm:flex-nowrap w-full sm:w-auto">
    {/* existing buttons */}
  </div>
</div>
```

---

## Phase 4: Branding Consistency

### 4.1 Create Semantic Color Tokens

**File:** `src/app/globals.css`
**Add after line 79 (inside :root):**
```css
:root {
  /* ... existing colors ... */

  /* Semantic status colors */
  --color-success: oklch(0.646 0.222 142.5);
  --color-warning: oklch(0.828 0.189 84.429);
  --color-error: var(--destructive);
  --color-info: oklch(0.6 0.118 184.704);
}

.dark {
  /* ... existing dark colors ... */

  /* Semantic status colors - dark mode */
  --color-success: oklch(0.696 0.17 162.48);
  --color-warning: oklch(0.769 0.188 70.08);
  --color-error: var(--destructive);
  --color-info: oklch(0.488 0.243 264.376);
}
```

**Add to @theme inline (after line 43):**
```css
@theme inline {
  /* ... existing theme ... */
  --color-success: var(--color-success);
  --color-warning: var(--color-warning);
  --color-error: var(--color-error);
  --color-info: var(--color-info);
}
```

**File:** `tailwind.config.ts` (if exists, or create)
**Add color extensions:**
```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        success: 'var(--color-success)',
        warning: 'var(--color-warning)',
        error: 'var(--color-error)',
        info: 'var(--color-info)',
      },
    },
  },
  plugins: [],
};

export default config;
```

---

### 4.2 Replace Hardcoded Colors with Semantic Tokens

**File:** `src/components/features/transaction/ProgressTracker.tsx`
**Lines:** 30, 32, 34
**Current:**
```typescript
if (milestone.isCompleted) {
  return <CheckCircle className="h-6 w-6 text-green-600" />;
} else if (index === currentMilestone) {
  return <Clock className="h-6 w-6 text-blue-600" />;
} else {
  return <Circle className="h-6 w-6 text-gray-400" />;
}
```

**Replace with:**
```typescript
if (milestone.isCompleted) {
  return <CheckCircle className="h-6 w-6 text-success" />;
} else if (index === currentMilestone) {
  return <Clock className="h-6 w-6 text-info" />;
} else {
  return <Circle className="h-6 w-6 text-muted-foreground" />;
}
```

**Lines:** 70-73
**Current:**
```typescript
className={`flex items-start space-x-3 p-3 rounded-lg border ${
  status === 'completed'
    ? 'bg-green-50 border-green-200'
    : status === 'current'
    ? 'bg-blue-50 border-blue-200'
    : 'bg-gray-50 border-gray-200'
}`}
```

**Replace with:**
```typescript
className={`flex items-start space-x-3 p-3 rounded-lg border ${
  status === 'completed'
    ? 'bg-success/10 border-success/30'
    : status === 'current'
    ? 'bg-info/10 border-info/30'
    : 'bg-muted border-border'
}`}
```

**Apply similar changes throughout the file for text colors (lines 84-89, 125-130).**

---

## Phase 5: Code Quality Refactoring

### 5.1 Refactor Large Transaction Detail Component

**File:** `src/hooks/useTransactionData.ts` (NEW FILE)
**Create this custom hook:**
```typescript
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSuperAdmin } from '@/hooks/useSuperAdmin';
import { supabase } from '@/lib/supabase';

export interface Transaction {
  id: string;
  title: string;
  title_en?: string | null;
  title_it?: string | null;
  title_de?: string | null;
  title_fr?: string | null;
  title_es?: string | null;
  property_address: string | null;
  property_url: string | null;
  status: string;
  created_at: string;
  created_by: string;
  creator_name: string;
  agent_branding?: {
    logo?: string | null;
    colors?: any;
  };
}

export interface Participant {
  id: string;
  profile_id: string;
  participant_role: string;
  full_name: string;
  email: string;
  invited_at: string;
}

export interface TransactionMilestone {
  id: string;
  order_index: number;
  code: string;
  label_en: string;
  label_it: string | null;
  completed: boolean;
  completed_at: string | null;
  completed_by: string | null;
}

export interface Message {
  id: string;
  author_profile_id: string;
  author_name: string;
  content_original: string;
  content_translated: string | null;
  original_language: string;
  translated_language: string | null;
  created_at: string;
}

export function useTransactionData(transactionId: string) {
  const { user } = useAuth();
  const { isSuperAdmin, loading: superAdminLoading } = useSuperAdmin();
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [milestones, setMilestones] = useState<TransactionMilestone[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [fileCount, setFileCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTransaction = async () => {
    // Move the entire fetchTransaction logic here
    // Lines 138-326 from transaction/[id]/page.tsx
    // ... (implementation moved from original file)
  };

  useEffect(() => {
    if (!user || superAdminLoading) return;
    fetchTransaction();
  }, [user, transactionId, isSuperAdmin, superAdminLoading]);

  return {
    transaction,
    milestones,
    participants,
    messages,
    fileCount,
    loading,
    error,
    refetch: fetchTransaction,
  };
}
```

**File:** `src/app/transaction/[id]/page.tsx`
**Replace data fetching logic (lines 85-326) with:**
```typescript
const {
  transaction,
  milestones,
  participants,
  messages,
  fileCount,
  loading,
  error,
  refetch: fetchTransaction,
} = useTransactionData(transactionId);
```

---

### 5.2 Remove Console.log Statements

**Create a utility for conditional logging:**
**File:** `src/lib/logger.ts` (NEW FILE)
```typescript
const isDevelopment = process.env.NODE_ENV === 'development';

export const logger = {
  log: (...args: any[]) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },
  error: (...args: any[]) => {
    if (isDevelopment) {
      console.error(...args);
    }
  },
  warn: (...args: any[]) => {
    if (isDevelopment) {
      console.warn(...args);
    }
  },
};
```

**File:** `src/contexts/AuthContext.tsx`
**Replace all console.log with logger:**
```typescript
import { logger } from '@/lib/logger';

// Line 62
logger.log('[AuthContext] Initial cookie set');

// Apply to all other console.log statements in this file
```

**Apply same pattern to:**
- `src/app/transaction/[id]/page.tsx`
- Any other files with console.log statements

---

### 5.3 Implement Proper Error Typing

**File:** `src/lib/error-utils.ts` (NEW FILE)
```typescript
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unknown error occurred';
}

export function isSupabaseError(error: unknown): error is { message: string; code?: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as any).message === 'string'
  );
}
```

**File:** `src/app/transaction/[id]/page.tsx`
**Replace error handling (example from line 321):**
```typescript
// OLD
} catch (err: any) {
  console.error('[TransactionDetail] Error:', err);
  setError(err.message || 'Failed to load transaction');
  setLoading(false);
}
```

**With:**
```typescript
import { getErrorMessage } from '@/lib/error-utils';
import { logger } from '@/lib/logger';

// NEW
} catch (err) {
  logger.error('[TransactionDetail] Error:', err);
  setError(getErrorMessage(err) || 'Failed to load transaction');
  setLoading(false);
}
```

---

## Phase 6: Add Micro-Animations

### 6.1 Install Framer Motion

```bash
npm install framer-motion
```

---

### 6.2 Add Milestone Completion Animation

**File:** `src/components/features/transaction/ProgressTracker.tsx`
**Add import:**
```typescript
import { motion } from 'framer-motion';
```

**Lines:** 66-77 (milestone container div)
**Replace:**
```typescript
<div
  key={milestone.id}
  className={`flex items-start space-x-3 p-3 rounded-lg border ${
    status === 'completed'
      ? 'bg-success/10 border-success/30'
      : status === 'current'
      ? 'bg-info/10 border-info/30'
      : 'bg-muted border-border'
  }`}
>
```

**With:**
```typescript
<motion.div
  key={milestone.id}
  initial={{ opacity: 0, y: 10 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3, delay: index * 0.1 }}
  className={`flex items-start space-x-3 p-3 rounded-lg border ${
    status === 'completed'
      ? 'bg-success/10 border-success/30'
      : status === 'current'
      ? 'bg-info/10 border-info/30'
      : 'bg-muted border-border'
  }`}
>
  {/* ... existing content ... */}
</motion.div>
```

---

### 6.3 Add Button Hover Animations

**File:** `src/components/ui/button.tsx`
**Update button variants (line 12):**
```typescript
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive hover:scale-[1.02] active:scale-[0.98]",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm hover:shadow-md",
        // ... rest of variants with added shadow effects
      }
    }
  }
)
```

---

## Phase 7: Additional Improvements

### 7.1 Add Bundle Analyzer

```bash
npm install @next/bundle-analyzer
```

**File:** `next.config.ts`
**Replace with:**
```typescript
import type { NextConfig } from "next";
import bundleAnalyzer from '@next/bundle-analyzer';

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig: NextConfig = {
  /* config options here */
  turbopack: {
    // Enable turbopack for faster builds
  },
};

export default withBundleAnalyzer(nextConfig);
```

**Add script to package.json:**
```json
{
  "scripts": {
    "analyze": "ANALYZE=true npm run build"
  }
}
```

---

### 7.2 Add Constants File

**File:** `src/lib/constants.ts` (NEW FILE)
```typescript
// UI Constants
export const MESSAGING_PANEL_HEIGHT = 600;
export const MESSAGE_MAX_WIDTH_PERCENT = 70;
export const MAX_FILE_SIZE_MB = 10;
export const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

// Pagination
export const ITEMS_PER_PAGE = 20;
export const MESSAGES_PER_PAGE = 50;

// API Timeouts
export const DEFAULT_API_TIMEOUT = 10000;
export const UPLOAD_TIMEOUT = 60000;

// Languages
export const SUPPORTED_LANGUAGES = ['en', 'it', 'es', 'fr', 'de', 'pl'] as const;
export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number];
```

**Replace hardcoded values:**
- `src/components/features/transaction/MessagingPanel.tsx:276` - use `MESSAGING_PANEL_HEIGHT`
- `src/components/features/transaction/MessagingPanel.tsx:299` - use `MESSAGE_MAX_WIDTH_PERCENT`

---

## Testing Checklist

After implementing all changes, verify:

- [ ] Run `npm run build` - ensure no TypeScript errors
- [ ] Run `npm run lint` - ensure no linting errors
- [ ] Test landing page on mobile (320px, 375px, 414px widths)
- [ ] Test transaction detail page on all tabs
- [ ] Verify toast notifications work (replace all alert() calls)
- [ ] Check bundle size with `npm run analyze`
- [ ] Test keyboard navigation (Tab, Enter, Escape)
- [ ] Test with screen reader (NVDA or VoiceOver)
- [ ] Verify skip link works
- [ ] Check color contrast with browser tools
- [ ] Test lazy loading (Network tab, disable cache)
- [ ] Verify all images use Next.js Image component
- [ ] Confirm sitemap.xml is accessible at /sitemap.xml
- [ ] Confirm robots.txt is accessible at /robots.txt
- [ ] Test empty states for transactions, messages, files
- [ ] Verify loading skeletons appear before data loads
- [ ] Test milestone completion animation
- [ ] Verify button hover animations work smoothly

---

## Critical Reminders

1. **DO NOT** modify database schema or Supabase RPC functions
2. **PRESERVE** all existing translation keys in ui-translations.ts
3. **MAINTAIN** all existing API endpoints and their signatures
4. **TEST** each change incrementally - don't implement everything at once
5. **COMMIT** frequently with descriptive messages
6. **CREATE** backup branch before starting: `git checkout -b refactoring-backup`

---

## Estimated Effort

- Phase 1 (Critical): 8-12 hours
- Phase 2 (UX): 6-8 hours
- Phase 3 (Mobile): 4-6 hours
- Phase 4 (Branding): 4-6 hours
- Phase 5 (Code Quality): 10-14 hours
- Phase 6 (Animations): 4-6 hours
- Phase 7 (Additional): 4-6 hours

**Total: 40-58 hours**

---

## Success Criteria

- [ ] Lighthouse Performance score > 90
- [ ] Lighthouse Accessibility score > 95
- [ ] Lighthouse SEO score > 95
- [ ] Bundle size reduced by at least 20%
- [ ] Zero console.log statements in production build
- [ ] All alert() calls replaced with toasts
- [ ] All images use Next.js Image component
- [ ] Comprehensive meta tags on all pages
- [ ] Skip navigation link functional
- [ ] Loading states for all async operations
- [ ] Empty states for all lists
- [ ] Micro-animations on key interactions

---

**IMPORTANT:** Start with Phase 1 (Critical Fixes) and validate each change before proceeding. Use feature flags or separate branches for risky refactorings.
