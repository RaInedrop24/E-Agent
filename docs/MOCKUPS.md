# High-Fidelity Mockups & Specifications

Detailed component specifications, styling, and interaction patterns for Project Verity.

---

## Design System

### Color Palette

```typescript
// Using Tailwind CSS default colors + custom brand colors
const colors = {
  // Brand
  brand: {
    primary: 'blue-600',      // #2563eb
    primaryHover: 'blue-700', // #1d4ed8
    secondary: 'slate-600',   // #475569
  },

  // Status
  status: {
    active: 'green-500',      // #22c55e
    pending: 'yellow-500',    // #eab308
    complete: 'slate-400',    // #94a3b8
    error: 'red-500',         // #ef4444
  },

  // UI
  background: 'white',        // #ffffff
  surface: 'slate-50',        // #f8fafc
  border: 'slate-200',        // #e2e8f0
  text: {
    primary: 'slate-900',     // #0f172a
    secondary: 'slate-600',   // #475569
    muted: 'slate-400',       // #94a3b8
  }
}
```

### Typography

```typescript
// Font Family
font-sans: 'Inter', system-ui, sans-serif

// Font Sizes (Tailwind)
text-xs: 0.75rem      // 12px
text-sm: 0.875rem     // 14px
text-base: 1rem       // 16px
text-lg: 1.125rem     // 18px
text-xl: 1.25rem      // 20px
text-2xl: 1.5rem      // 24px
text-3xl: 1.875rem    // 30px
text-4xl: 2.25rem     // 36px

// Font Weights
font-normal: 400
font-medium: 500
font-semibold: 600
font-bold: 700
```

### Spacing Scale

```typescript
// Tailwind spacing (rem)
1: 0.25rem   // 4px
2: 0.5rem    // 8px
3: 0.75rem   // 12px
4: 1rem      // 16px
5: 1.25rem   // 20px
6: 1.5rem    // 24px
8: 2rem      // 32px
10: 2.5rem   // 40px
12: 3rem     // 48px
16: 4rem     // 64px
```

### Border Radius

```typescript
rounded-sm: 0.125rem   // 2px
rounded: 0.25rem       // 4px
rounded-md: 0.375rem   // 6px
rounded-lg: 0.5rem     // 8px
rounded-xl: 0.75rem    // 12px
rounded-2xl: 1rem      // 16px
```

### Shadows

```typescript
shadow-sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)'
shadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)'
shadow-md: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
shadow-lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
```

---

## Component Specifications

### 1. Header Component

**File:** `src/components/Header.tsx`

```tsx
// Desktop Layout
<header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white">
  <div className="container mx-auto flex h-16 items-center justify-between px-4">

    {/* Logo */}
    <div className="flex items-center gap-8">
      <Link href="/" className="text-xl font-bold text-slate-900">
        The Property Gateway
      </Link>

      {/* Navigation - Desktop only */}
      <nav className="hidden md:flex items-center gap-6">
        <Link className="text-sm font-medium text-slate-600 hover:text-slate-900">
          Dashboard
        </Link>
        <Link className="text-sm font-medium text-slate-600 hover:text-slate-900">
          Transactions
        </Link>
      </nav>
    </div>

    {/* Right Side */}
    <div className="flex items-center gap-4">
      {/* Role Badge */}
      <Badge variant="secondary" className="hidden sm:inline-flex">
        Agent
      </Badge>

      {/* User Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-slate-50">
          <Avatar className="h-8 w-8">
            <AvatarFallback>AR</AvatarFallback>
          </Avatar>
          <span className="hidden sm:inline text-sm font-medium">Alessandro</span>
          <ChevronDown className="h-4 w-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem>Profile</DropdownMenuItem>
          <DropdownMenuItem>Settings</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Logout</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  </div>
</header>
```

**Specifications:**
- Height: 64px (h-16)
- Sticky positioning at top
- Background: white with bottom border
- Container max-width with responsive padding
- Logo: text-xl font-bold
- Nav links: text-sm font-medium with hover state
- Role badge: secondary variant (slate background)
- Avatar: 32px diameter
- Z-index: 50 (above content, below modals)

**States:**
- Default: white background
- Scroll: adds shadow-sm
- Mobile: collapses nav to hamburger menu

---

### 2. Button Component

**File:** `src/components/ui/button.tsx` (shadcn/ui)

```tsx
// Variants
variants: {
  variant: {
    default: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-200',
    outline: 'border border-slate-200 bg-white hover:bg-slate-50',
    ghost: 'hover:bg-slate-100',
    destructive: 'bg-red-600 text-white hover:bg-red-700',
  },
  size: {
    sm: 'h-8 px-3 text-xs',
    default: 'h-10 px-4 py-2 text-sm',
    lg: 'h-11 px-8 text-base',
  }
}
```

**Usage Examples:**
```tsx
// Primary action
<Button>Create Transaction</Button>

// Secondary action
<Button variant="secondary">Cancel</Button>

// Outline button
<Button variant="outline">View Details</Button>

// Destructive action
<Button variant="destructive">Delete</Button>

// With icon
<Button>
  <PlusCircle className="mr-2 h-4 w-4" />
  Create Transaction
</Button>
```

**States:**
- Default: solid background with border-radius
- Hover: darker shade (via hover: prefix)
- Focus: ring-2 ring-blue-500 ring-offset-2
- Disabled: opacity-50 cursor-not-allowed
- Loading: shows spinner, pointer-events-none

---

### 3. Card Component

**File:** `src/components/ui/card.tsx` (shadcn/ui)

```tsx
<Card className="overflow-hidden">
  <CardHeader className="pb-3">
    <CardTitle>Transaction Title</CardTitle>
    <CardDescription>Supporting text</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Main content */}
  </CardContent>
  <CardFooter className="bg-slate-50 border-t">
    {/* Actions */}
  </CardFooter>
</Card>
```

**Specifications:**
- Background: white
- Border: 1px solid slate-200
- Border-radius: rounded-lg (8px)
- Shadow: shadow-sm
- Hover: shadow-md transition
- Padding: p-6 (24px) for header/content/footer

---

### 4. Progress Tracker Component

**File:** `src/components/ProgressTracker.tsx`

```tsx
<div className="space-y-4">
  {milestones.map((milestone, index) => (
    <div key={milestone.id} className="flex items-start gap-4">

      {/* Icon */}
      <div className={cn(
        "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full",
        milestone.completed
          ? "bg-green-100 text-green-600"
          : "bg-slate-100 text-slate-400"
      )}>
        {milestone.completed ? (
          <CheckCircle2 className="h-5 w-5" />
        ) : (
          <Circle className="h-5 w-5" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <h4 className={cn(
            "text-sm font-medium",
            milestone.completed ? "text-slate-900" : "text-slate-500"
          )}>
            {index + 1}. {milestone.title}
          </h4>

          {/* Actions (Agent only) */}
          {isAgent && (
            <Button
              variant={milestone.completed ? "ghost" : "default"}
              size="sm"
            >
              {milestone.completed ? "Undo" : "Mark Complete"}
            </Button>
          )}
        </div>

        {/* Timestamp */}
        {milestone.completedAt && (
          <p className="text-xs text-slate-500 mt-1">
            Completed: {formatDate(milestone.completedAt)}
          </p>
        )}
      </div>

    </div>
  ))}
</div>
```

**Specifications:**
- Gap between items: 16px (gap-4)
- Icon size: 40px circle
- Icon colors: green-100/green-600 (complete), slate-100/slate-400 (pending)
- Title: text-sm font-medium
- Timestamp: text-xs text-slate-500
- Actions: right-aligned, size-sm buttons

**States:**
- Completed: green icon, dark text, "Undo" button
- Pending: gray icon, muted text, "Mark Complete" button
- Read-only (Buyer): no action buttons

---

### 5. Transaction Card (Buyer Dashboard)

```tsx
<Card className="hover:shadow-md transition-shadow">
  <CardHeader>
    <div className="flex items-start justify-between">
      <div className="space-y-1 flex-1">
        <CardTitle className="text-lg">Villa Tuscany</CardTitle>
        <CardDescription className="text-sm">
          Agent: Alessandro Rossi
        </CardDescription>
      </div>
      <Badge className="bg-green-100 text-green-700 border-green-200">
        Active
      </Badge>
    </div>
  </CardHeader>

  <CardContent className="space-y-4">
    {/* Progress Bar */}
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-600">Progress</span>
        <span className="font-medium text-slate-900">40%</span>
      </div>
      <Progress value={40} className="h-2" />
    </div>

    {/* Last Update */}
    <div className="flex items-center text-sm text-slate-500">
      <Clock className="mr-2 h-4 w-4" />
      Last update: 2 days ago
    </div>
  </CardContent>

  <CardFooter className="bg-slate-50">
    <Button variant="outline" className="w-full">
      View Details
    </Button>
  </CardFooter>
</Card>
```

**Specifications:**
- Width: full on mobile, 1/2 on tablet, 1/3 on desktop
- Padding: p-6 (24px)
- Title: text-lg font-semibold
- Status badge: positioned top-right
- Progress bar: h-2, rounded-full
- Footer: bg-slate-50 with border-t
- Hover: shadow-md with transition

---

### 6. Message Component (Comms Thread)

```tsx
<div className={cn(
  "flex gap-3 p-4 rounded-lg",
  isOwnMessage ? "bg-blue-50" : "bg-white border border-slate-200"
)}>

  {/* Avatar */}
  <Avatar className="h-8 w-8 flex-shrink-0">
    <AvatarFallback>{sender.initials}</AvatarFallback>
  </Avatar>

  {/* Content */}
  <div className="flex-1 min-w-0 space-y-2">

    {/* Header */}
    <div className="flex items-center gap-2 text-xs text-slate-500">
      <span className="font-medium text-slate-900">
        {sender.name}
      </span>
      <span>•</span>
      <span>{sender.role}</span>
      <span>•</span>
      <time>{formatTime(message.createdAt)}</time>
    </div>

    {/* Message Text */}
    <div className="text-sm text-slate-900 leading-relaxed">
      {message.translatedText || message.originalText}
    </div>

    {/* Show Original Toggle */}
    {message.translatedText && (
      <Button
        variant="ghost"
        size="sm"
        className="h-auto p-0 text-xs text-blue-600 hover:text-blue-700"
      >
        <Eye className="mr-1 h-3 w-3" />
        Show Original ({message.originalLanguage})
      </Button>
    )}

  </div>
</div>
```

**Specifications:**
- Own messages: light blue background (bg-blue-50)
- Other messages: white background with border
- Avatar: 32px, positioned at top
- Padding: p-4 (16px)
- Border-radius: rounded-lg (8px)
- Gap between avatar and content: 12px (gap-3)
- Header: text-xs with slate-500 color
- Message text: text-sm with leading-relaxed
- Toggle button: ghost variant, extra-small text

---

### 7. File Item Component

```tsx
<Card className="flex items-center gap-4 p-4">

  {/* File Icon */}
  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
    <FileText className="h-6 w-6" />
  </div>

  {/* File Info */}
  <div className="flex-1 min-w-0">
    <h4 className="text-sm font-medium text-slate-900 truncate">
      {file.name}
    </h4>
    <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
      <span>Uploaded by: {file.uploadedBy}</span>
      <span>•</span>
      <span>{formatDate(file.uploadedAt)}</span>
      <span>•</span>
      <span>{formatFileSize(file.size)}</span>
    </div>
  </div>

  {/* Actions */}
  <div className="flex items-center gap-2">
    <Button variant="outline" size="sm">
      <Download className="h-4 w-4" />
    </Button>
    {canDelete && (
      <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
        <Trash2 className="h-4 w-4" />
      </Button>
    )}
  </div>

</Card>
```

**Specifications:**
- Icon container: 48px square, rounded-lg, colored background
- Icon colors by type:
  - PDF: blue-50/blue-600
  - Image: purple-50/purple-600
  - Archive: slate-50/slate-600
- Filename: truncated with ellipsis
- Metadata: text-xs with bullet separators
- Action buttons: icon-only, size-sm

---

### 8. Modal Component

```tsx
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent className="sm:max-w-[500px]">

    {/* Header */}
    <DialogHeader>
      <DialogTitle className="text-xl font-semibold">
        Create New Transaction
      </DialogTitle>
      <DialogDescription>
        Fill in the details below to create a new property transaction.
      </DialogDescription>
    </DialogHeader>

    {/* Content */}
    <div className="space-y-4 py-4">
      {/* Form fields */}
    </div>

    {/* Footer */}
    <DialogFooter className="flex gap-2">
      <Button variant="outline" onClick={() => setIsOpen(false)}>
        Cancel
      </Button>
      <Button onClick={handleSubmit}>
        Create Transaction
      </Button>
    </DialogFooter>

  </DialogContent>
</Dialog>
```

**Specifications:**
- Max-width: 500px on desktop, full-width on mobile
- Padding: p-6 (24px)
- Title: text-xl font-semibold
- Description: text-sm text-slate-500
- Content spacing: gap-4 (16px) between fields
- Footer: right-aligned buttons with gap-2
- Overlay: bg-black/50 backdrop-blur-sm
- Animation: fade-in with scale from 95% to 100%

**Mobile Behavior:**
- Full-screen on screens < 640px
- Slide up from bottom animation
- Close button in top-right corner

---

### 9. Form Inputs

**Text Input:**
```tsx
<div className="space-y-2">
  <Label htmlFor="title" className="text-sm font-medium">
    Property Title
  </Label>
  <Input
    id="title"
    placeholder="e.g., Villa Tuscany - Florence"
    className="w-full"
  />
  <p className="text-xs text-slate-500">
    Enter a descriptive title for the property
  </p>
</div>
```

**Input Specifications:**
- Height: 40px (h-10)
- Padding: px-3 py-2
- Border: 1px solid slate-200
- Border-radius: rounded-md (6px)
- Font-size: text-sm
- Focus: ring-2 ring-blue-500 ring-offset-2

**Select/Dropdown:**
```tsx
<Select defaultValue="pending">
  <SelectTrigger className="w-full">
    <SelectValue />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="pending">Pending</SelectItem>
    <SelectItem value="active">Active</SelectItem>
  </SelectContent>
</Select>
```

**Textarea:**
```tsx
<Textarea
  placeholder="Add notes or description..."
  className="min-h-[100px] resize-none"
/>
```

---

### 10. Badge Component

```tsx
// Status Badges
<Badge variant="default" className="bg-green-100 text-green-700 border-green-200">
  Active
</Badge>

<Badge variant="secondary" className="bg-yellow-100 text-yellow-700 border-yellow-200">
  Pending
</Badge>

<Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-200">
  Complete
</Badge>

// Role Badge
<Badge variant="secondary">
  Agent
</Badge>
```

**Specifications:**
- Height: auto (py-1)
- Padding: px-2.5 py-0.5
- Font-size: text-xs
- Font-weight: font-medium
- Border-radius: rounded-full
- Border: 1px solid (matches background color)

---

## Layout Specifications

### 1. Dashboard Grid (Agent)

```tsx
<div className="container mx-auto px-4 py-8">

  {/* Header Section */}
  <div className="flex items-center justify-between mb-8">
    <div>
      <h1 className="text-3xl font-bold text-slate-900">
        Welcome back, Alessandro
      </h1>
      <p className="text-slate-500 mt-1">
        Manage your property transactions
      </p>
    </div>
    <Button size="lg">
      <PlusCircle className="mr-2 h-5 w-5" />
      Create Transaction
    </Button>
  </div>

  {/* Main Content */}
  <div className="grid gap-6 lg:grid-cols-[1fr_300px]">

    {/* Left Column - Transactions */}
    <div className="space-y-6">
      <Card>
        {/* Transactions table */}
      </Card>
    </div>

    {/* Right Column - Activity + Quick Actions */}
    <div className="space-y-6">
      <Card>
        {/* Recent Activity */}
      </Card>
      <Card>
        {/* Quick Actions */}
      </Card>
    </div>

  </div>

</div>
```

**Layout Specifications:**
- Container: max-w-7xl mx-auto
- Padding: px-4 (mobile), px-6 (tablet), px-8 (desktop)
- Vertical spacing: py-8 (32px)
- Grid: single column (mobile), 2-column with sidebar (desktop)
- Sidebar width: 300px (fixed)
- Gap between cards: gap-6 (24px)

---

### 2. Transaction Detail Layout

```tsx
<div className="container mx-auto px-4 py-6">

  {/* Back Navigation */}
  <Button variant="ghost" className="mb-4">
    <ArrowLeft className="mr-2 h-4 w-4" />
    Back to Dashboard
  </Button>

  {/* Transaction Header */}
  <Card className="mb-6">
    <CardContent className="pt-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-slate-900">
            Villa Tuscany - Florence
          </h1>
          <div className="flex items-center gap-3 text-sm text-slate-500">
            <span>Buyer: Sarah Jones</span>
            <span>•</span>
            <span>sarah@email.com</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Badge>Active</Badge>
          <span className="text-sm font-medium">40% Complete</span>
        </div>

      </div>

      {/* Progress Bar */}
      <Progress value={40} className="mt-4 h-2" />
    </CardContent>
  </Card>

  {/* Tabs */}
  <Tabs defaultValue="tracker" className="space-y-6">
    <TabsList className="w-full justify-start border-b">
      <TabsTrigger value="tracker">Tracker</TabsTrigger>
      <TabsTrigger value="comms">Comms</TabsTrigger>
      <TabsTrigger value="files">Files</TabsTrigger>
      <TabsTrigger value="participants">Participants</TabsTrigger>
    </TabsList>

    <TabsContent value="tracker">
      <Card>
        {/* Tracker content */}
      </Card>
    </TabsContent>

    {/* Other tabs... */}
  </Tabs>

</div>
```

**Layout Specifications:**
- Max-width: container (1280px)
- Header card: full-width, responsive flex layout
- Progress bar: h-2, rounded-full
- Tabs: full-width on mobile, inline on desktop
- Tab content: single Card component per tab

---

## Responsive Breakpoints

```typescript
// Tailwind breakpoints
sm: '640px'   // Small devices (phones)
md: '768px'   // Medium devices (tablets)
lg: '1024px'  // Large devices (desktops)
xl: '1280px'  // Extra large devices
```

### Mobile (< 640px)
- Single column layouts
- Full-width cards
- Stacked form inputs
- Hamburger menu navigation
- Full-screen modals
- Condensed table to cards

### Tablet (640px - 1024px)
- Two-column grids where appropriate
- Condensed navigation
- Smaller sidebar width (240px)
- Modals at max-width-md

### Desktop (> 1024px)
- Multi-column layouts
- Full sidebar (300px)
- Larger typography for hero sections
- More whitespace and padding

---

## Interactive States

### Hover States
```tsx
// Buttons
hover:bg-blue-700 hover:shadow-md

// Cards
hover:shadow-lg hover:border-slate-300

// Links
hover:text-blue-600 hover:underline

// Table rows
hover:bg-slate-50
```

### Focus States
```tsx
// Form inputs
focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none

// Buttons
focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2
```

### Active States
```tsx
// Buttons
active:scale-95 transition-transform

// Tabs
data-[state=active]:border-blue-600 data-[state=active]:text-blue-600
```

### Disabled States
```tsx
disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none
```

### Loading States
```tsx
// Button with spinner
<Button disabled>
  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
  Loading...
</Button>

// Skeleton loader
<Skeleton className="h-20 w-full" />
```

---

## Animation & Transitions

### Default Transitions
```tsx
// All interactive elements
transition-colors duration-200

// Shadows and transforms
transition-all duration-200

// Page transitions
transition-opacity duration-300
```

### Specific Animations
```tsx
// Spinner
animate-spin

// Pulse (loading states)
animate-pulse

// Fade in
animate-fade-in

// Slide in from bottom (modals on mobile)
animate-slide-up
```

---

## Accessibility Specifications

### ARIA Labels
```tsx
// Buttons without text
<Button aria-label="Close modal">
  <X className="h-4 w-4" />
</Button>

// Form inputs
<Label htmlFor="email">Email</Label>
<Input id="email" aria-describedby="email-hint" />
<p id="email-hint">We'll never share your email</p>
```

### Keyboard Navigation
- All interactive elements focusable via Tab
- Modal trap focus when open
- Escape key closes modals and dropdowns
- Arrow keys navigate dropdowns and tabs
- Enter/Space activates buttons

### Screen Reader Support
- Semantic HTML (header, nav, main, section, article)
- Proper heading hierarchy (h1 → h2 → h3)
- Alt text for images
- Role attributes where needed
- Live regions for real-time updates

### Color Contrast
- Text: minimum 4.5:1 ratio
- Large text (18px+): minimum 3:1 ratio
- UI components: minimum 3:1 ratio
- Focus indicators: minimum 3:1 ratio

---

## Sample Component Implementations

### Dashboard Transaction Row

```tsx
<tr className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
  <td className="py-4 px-4">
    <div className="font-medium text-slate-900">Villa Tuscany</div>
    <div className="text-xs text-slate-500 mt-1">ID: TXN-001</div>
  </td>
  <td className="py-4 px-4">
    <div className="flex items-center gap-2">
      <Avatar className="h-6 w-6">
        <AvatarFallback>SJ</AvatarFallback>
      </Avatar>
      <span className="text-sm text-slate-700">Sarah Jones</span>
    </div>
  </td>
  <td className="py-4 px-4">
    <Badge className="bg-green-100 text-green-700 border-green-200">
      Active
    </Badge>
  </td>
  <td className="py-4 px-4">
    <div className="flex items-center gap-3">
      <Progress value={40} className="h-1.5 w-24" />
      <span className="text-xs font-medium text-slate-600">40%</span>
    </div>
  </td>
  <td className="py-4 px-4 text-sm text-slate-500">
    2 days ago
  </td>
  <td className="py-4 px-4 text-right">
    <Button variant="ghost" size="sm">
      Open
    </Button>
  </td>
</tr>
```

### Activity Feed Item

```tsx
<div className="flex gap-3 py-3">

  {/* Icon */}
  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
    <CheckCircle2 className="h-4 w-4" />
  </div>

  {/* Content */}
  <div className="flex-1 min-w-0">
    <p className="text-sm text-slate-900">
      <span className="font-medium">Villa Tuscany</span>
    </p>
    <p className="text-xs text-slate-500 mt-0.5">
      Milestone completed
    </p>
    <time className="text-xs text-slate-400 mt-1 block">
      2 hours ago
    </time>
  </div>

</div>
```

---

## Empty States

### No Transactions
```tsx
<div className="flex flex-col items-center justify-center py-12 text-center">
  <div className="rounded-full bg-slate-100 p-6 mb-4">
    <FileX className="h-12 w-12 text-slate-400" />
  </div>
  <h3 className="text-lg font-semibold text-slate-900 mb-2">
    No transactions yet
  </h3>
  <p className="text-sm text-slate-500 mb-6 max-w-sm">
    Create your first transaction to start tracking property purchases.
  </p>
  <Button>
    <PlusCircle className="mr-2 h-4 w-4" />
    Create Transaction
  </Button>
</div>
```

### No Messages
```tsx
<div className="flex flex-col items-center justify-center py-12 text-center">
  <MessageSquare className="h-12 w-12 text-slate-300 mb-4" />
  <p className="text-sm text-slate-500">
    No messages yet. Start the conversation!
  </p>
</div>
```

---

## Error States

### Form Validation Error
```tsx
<div className="space-y-2">
  <Label htmlFor="email" className="text-sm font-medium">
    Email
  </Label>
  <Input
    id="email"
    type="email"
    className="border-red-300 focus:ring-red-500"
    aria-invalid="true"
    aria-describedby="email-error"
  />
  <p id="email-error" className="text-xs text-red-600 flex items-center gap-1">
    <AlertCircle className="h-3 w-3" />
    Please enter a valid email address
  </p>
</div>
```

### API Error Banner
```tsx
<Alert variant="destructive" className="mb-6">
  <AlertCircle className="h-4 w-4" />
  <AlertTitle>Error</AlertTitle>
  <AlertDescription>
    Failed to load transactions. Please try again.
  </AlertDescription>
</Alert>
```

---

## Success States

### Toast Notification
```tsx
<Toast className="border-green-200 bg-green-50">
  <div className="flex items-center gap-3">
    <CheckCircle2 className="h-5 w-5 text-green-600" />
    <div>
      <ToastTitle className="text-green-900">Success!</ToastTitle>
      <ToastDescription className="text-green-700">
        Transaction created successfully
      </ToastDescription>
    </div>
  </div>
</Toast>
```

---

## Loading States

### Page Loading
```tsx
<div className="space-y-4 p-6">
  <Skeleton className="h-8 w-[250px]" />
  <Skeleton className="h-20 w-full" />
  <Skeleton className="h-20 w-full" />
  <Skeleton className="h-20 w-full" />
</div>
```

### Button Loading
```tsx
<Button disabled>
  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
  Creating...
</Button>
```

---

## Notes

- All components use shadcn/ui as the base component library
- Tailwind CSS v4 for all styling
- TypeScript for type safety
- Responsive-first approach (mobile → desktop)
- Accessibility-first (WCAG 2.1 AA compliance)
- Dark mode support planned for Phase 4
- All animations respect `prefers-reduced-motion`
- Icons from lucide-react library
- Font: Inter (loaded via Next.js font optimization)
