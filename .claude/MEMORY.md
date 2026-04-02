# ONE-ID Project Memory

> This document is automatically maintained to provide context about the project.
> Updated: 2026-04-02

## 🎯 Project Overview

**ONE-ID** is a comprehensive event management and attendee check-in platform built with Next.js 16+, featuring facial recognition, QR code scanning, and manual code entry for seamless event check-ins via physical totems (kiosks).

### Core Purpose

- **Event organizers** can manage events, participants, and check-ins
- **Physical totems** serve as self-service check-in stations at event venues
- **Multi-tenant SaaS** architecture supporting multiple organizations
- **AI-powered facial recognition** for fast, contactless check-ins

## 🏗️ Architecture

### Tech Stack

- **Frontend**: Next.js 16.1.6, React 19.2.3, TypeScript 5+
- **Styling**: Tailwind CSS v4, shadcn/ui (Radix UI)
- **Database**: PostgreSQL with Prisma ORM
- **AI/ML**: MediaPipe (face detection), ArcFace (embeddings), pgvector (similarity search)
- **Auth**: Custom JWT-based sessions + OAuth providers

### Folder Structure

```
src/
├── app/
│   ├── (auth)/          # Authentication pages
│   ├── (saas)/          # Main SaaS dashboard
│   ├── (totem)/         # Totem check-in pages ⭐
│   └── api/             # API routes
├── components/
│   ├── ui/              # shadcn/ui base components
│   ├── shared/          # Shared components
│   ├── admin/           # Admin-specific components
│   └── organizations/   # Organization components
├── core/                # Business logic layer
├── generated/           # Prisma client
├── hooks/               # Custom React hooks
├── i18n/                # Internationalization
└── lib/                 # Utilities
```

## 📊 Data Model (Prisma Schema)

### Core Entities

#### Organization (Multi-tenant Root)

- Owns events, members, totems, and people
- Has subscription plan with feature limits
- Contains audit trail of all actions

#### User & Membership

- Users authenticate via multiple providers (email, OAuth)
- Memberships link users to organizations with roles (SUPER_ADMIN, ORG_OWNER, EVENT_MANAGER)
- Role-based access control (RBAC)

#### Event

- Belongs to an organization
- Has check-in methods: `faceEnabled`, `qrEnabled`, `codeEnabled`
- Contains AI configuration (EventAIConfig) for face recognition tuning
- Status flow: DRAFT → PUBLISHED → ACTIVE → COMPLETED/CANCELED

#### Person & PersonFace

- Person: Contact within organization (name, email, document)
- PersonFace: Facial embedding (512D vector via ArcFace)
- Supports multi-template facial recognition
- pgvector for efficient similarity search

#### EventParticipant

- Links Person to Event
- Has QR code and access code for check-in
- Tracks all check-ins

#### Totem (Physical Kiosk)

- Self-service check-in station
- Authenticates with access code
- Linked to organization via TotemOrganizationSubscription
- Linked to event via TotemEventSubscription
- Tracks performance metrics (latency, confidence, success rate)

#### CheckIn

- Records each check-in attempt
- Methods: FACE_RECOGNITION, QR_CODE, MANUAL
- Stores confidence score for face matches

### Key Relationships

```
Organization
├── Memberships → Users
├── Events
│   ├── EventAIConfig
│   ├── EventParticipants → People → PersonFaces
│   └── TotemEventSubscriptions → CheckIns
├── TotemOrganizationSubscriptions → Totems
└── Subscription → Plan → Features
```

## 📱 Totem Application Flow

### Navigation Flow

```
/totem (Login)
  ↓ [validates totem access key]
/totem/method (Method Selector)
  ↓ [auto-redirect if only 1 method enabled]
  ├── /totem/face (Facial Recognition)
  ├── /totem/qr (QR Code Scanner)
  └── /totem/code (Manual Code Entry)

  After success/error → Returns to /totem/method after 3s
```

### Facial Recognition Pipeline

```
Camera → MediaPipe BlazeFace → Face Crop → Quality Check →
ArcFace (112x112) → 512D Embedding → API → pgvector Search →
Match Participant → Check-in Record
```

### Session Management

- Totem authenticates once with access code
- JWT token stored in localStorage
- Session includes: totem info, active event, AI config
- Token expires after configured duration

## 🎨 Design System

### Components (shadcn/ui)

- Button, Card, Input, Badge, Dialog, Sheet, Select, Table, Tabs, etc.
- Custom variants and sizes defined in CVA (Class Variance Authority)

### Color System (oklch)

```css
/* Light */
--primary: oklch(0.558 0.228 300) /* Violet */ --success: oklch(0.63 0.18 155) /* Green */
  --destructive: oklch(0.577 0.245 27) /* Red */ /* Dark (Totem default) */ --background: oklch(0.141 0.048 270)
  /* Slate-950 */ --primary: oklch(0.62 0.228 300) /* Lighter violet */;
```

### Totem-Specific Styling

- Always dark mode
- High contrast for outdoor/bright environments
- Large touch targets (h-20 buttons minimum)
- Clear visual feedback (success green, error red)

## 🔧 AI Configuration

### Per-Event Settings (EventAIConfig)

- `confidenceThreshold`: Minimum match confidence (default: 0.62)
- `detectionIntervalMs`: Capture loop interval (default: 500ms)
- `maxFaces`: Maximum faces per frame (default: 1)
- `minFaceSize`: Minimum face size in pixels (default: 80)
- `livenessDetection`: Enable anti-spoofing (default: true)
- `cooldownSeconds`: Prevent rapid re-scans (default: 8)

### Per-Totem Settings (TotemEventSubscription)

- Adaptive confidence thresholds
- Exponential cooldown strategy
- Performance metrics tracking

## 🔒 Security Considerations

### Multi-tenant Isolation

- All queries filter by organizationId
- Totem sessions scoped to specific events
- Audit logs track all sensitive actions

### Face Data

- Embeddings stored as binary (not images)
- L2 normalized vectors
- No raw biometric storage on client

### Kiosk Mode

- Disable browser navigation
- Block keyboard shortcuts
- Prevent context menus
- Server-side validation of all actions

## 📈 Performance Patterns

### Client-Side

- React Compiler for auto-memoization
- Lazy model loading (ArcFace, MediaPipe)
- WASM optimization (SIMD enabled)
- Abort signals for request timeouts

### Database

- pgvector HNSW index for embedding search
- Composite indexes on frequent queries
- Hourly metrics aggregation

## 🌐 Internationalization

- next-intl for translations
- Currently supports: pt-BR, en-US
- All user-facing text externalized

## 📝 Key Implementation Notes

1. **Face check-in loops every 1.2s** - automatic capture without button press
2. **6 consecutive failures** trigger error state and return to menu
3. **QR scanner uses dual fallback**: BarcodeDetector API → jsQR library
4. **All check-ins return participant info** for personalized greeting
5. **Metrics track latency, confidence, failure reasons** per totem/event
6. **Cooldown system prevents duplicate check-ins** within configured window

## 🎨 Totem UI Design System (Updated 2025-04-02)

### Visual Language

- **Background**: Dark mode only (`slate-950`) for outdoor/bright environments
- **Cards**: Glassmorphism with gradient borders (`from-color-500/40 via-slate-700/30`)
- **Glows**: Ambient colored glows behind key elements (`blur-[60px]`)
- **Colors by method**:
  - Face: `violet-500` theme
  - QR Code: `cyan-500` theme
  - Access Code: `emerald-500` theme

### Animations (Custom in globals.css)

- `animate-totem-scan`: Vertical scan line for camera views (2.5s)
- `animate-totem-shake`: Error shake animation (0.5s)
- `animate-totem-glow`: Pulsing glow effect (2s)
- `animate-totem-success-pulse`: Success celebration (1.5s)
- `animate-totem-error-pulse`: Error attention (1s)
- Viewfinder corner utilities: `.viewfinder-corner-*`

### Feedback States

- **Full-screen overlays** for success/error (not inline cards)
- **3-second countdown** visible to user before auto-redirect
- **Participant name** displayed on success for personalization
- **Large touch targets** (64px+ buttons) for kiosk use

### Components Pattern

```tsx
// Success state pattern
<div className="relative">
  <div className="absolute inset-0 bg-emerald-500/20 blur-[60px]" />
  <div className="animate-in zoom-in-75 relative">
    <div className="rounded-3xl bg-gradient-to-br from-emerald-500/20 p-10 ring-1 ring-emerald-500/30">
      <CheckCircle2 className="h-14 w-14" />
      <h1>{title}</h1>
      <span className="tabular-nums">{countdown}s</span>
    </div>
  </div>
</div>
```
