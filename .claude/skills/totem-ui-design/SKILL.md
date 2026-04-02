---
name: totem-ui-design
description: Designs beautiful, accessible, and high-performance UIs for physical totem/kiosk check-in experiences. Focuses on touch-friendly interactions, visual feedback, and professional event aesthetics.
---

# Totem UI Design Skill

## Purpose

Create stunning, production-ready check-in interfaces for physical totems used at events. The UI must be:

- **Beautiful**: Professional, modern, event-worthy aesthetics
- **Accessible**: Large touch targets, high contrast, clear feedback
- **Performant**: Smooth animations, fast interactions
- **Intuitive**: Zero learning curve for event attendees

## Design Principles

### 1. Touch-First Design

- Minimum touch target: 48x48px (recommended: 64x64px or larger)
- Generous spacing between interactive elements
- Visual press states (scale down, color change)
- No hover-dependent interactions

### 2. Visual Hierarchy

- Clear focal points for each screen state
- Progress indicators for multi-step flows
- Prominent success/error feedback
- Subtle ambient animations for "alive" feeling

### 3. Event Aesthetics

- Dark mode default (reduces glare in various lighting)
- Gradient accents for visual interest
- Glassmorphism effects for depth
- Smooth transitions between states

### 4. Feedback Loops

- Immediate visual response to touches
- Progress animations during processing
- Celebratory success animations
- Clear error messaging with recovery options

## Component Patterns

### Hero Cards

```tsx
// Full-screen card with gradient border
<div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 p-1">
  <div className="from-primary/20 to-accent/20 absolute inset-0 bg-gradient-to-br via-transparent" />
  <div className="relative rounded-[22px] bg-slate-950/90 p-8 backdrop-blur-xl">{content}</div>
</div>
```

### Touch Buttons

```tsx
// Large, satisfying touch buttons
<button className="group from-primary to-primary/80 shadow-primary/25 relative h-24 w-full rounded-2xl bg-gradient-to-br shadow-lg transition-all duration-200 active:scale-[0.98] active:shadow-md disabled:cursor-not-allowed disabled:opacity-50">
  <span className="absolute inset-0 rounded-2xl bg-white/10 opacity-0 transition-opacity group-active:opacity-100" />
  <span className="relative flex items-center justify-center gap-3">
    <Icon className="h-8 w-8" />
    <span className="text-xl font-semibold">{label}</span>
  </span>
</button>
```

### Status Indicators

```tsx
// Pulsing status dot
<span className="relative flex h-4 w-4">
  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
  <span className="relative inline-flex h-4 w-4 rounded-full bg-emerald-500" />
</span>
```

### Success Animation

```tsx
// Checkmark with scale-in animation
<div className="animate-in zoom-in-50 duration-500">
  <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-emerald-500/20 ring-4 ring-emerald-500/30">
    <CheckCircle2 className="animate-in zoom-in h-16 w-16 text-emerald-400 delay-200 duration-300" />
  </div>
</div>
```

### Error State

```tsx
// Error with shake animation
<div className="animate-shake">
  <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-rose-500/20 ring-4 ring-rose-500/30">
    <XCircle className="h-16 w-16 text-rose-400" />
  </div>
</div>
```

### Camera Frame

```tsx
// Camera viewfinder with scanning effect
<div className="relative aspect-video overflow-hidden rounded-2xl bg-black">
  <video ref={videoRef} className="h-full w-full object-cover" />

  {/* Corner brackets */}
  <div className="pointer-events-none absolute inset-0">
    <div className="border-primary absolute top-4 left-4 h-12 w-12 rounded-tl-xl border-t-4 border-l-4" />
    <div className="border-primary absolute top-4 right-4 h-12 w-12 rounded-tr-xl border-t-4 border-r-4" />
    <div className="border-primary absolute bottom-4 left-4 h-12 w-12 rounded-bl-xl border-b-4 border-l-4" />
    <div className="border-primary absolute right-4 bottom-4 h-12 w-12 rounded-br-xl border-r-4 border-b-4" />
  </div>

  {/* Scanning line animation */}
  <div className="via-primary animate-scan absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent to-transparent" />
</div>
```

### Loading Spinner

```tsx
// Smooth circular progress
<div className="relative h-20 w-20">
  <svg className="animate-spin" viewBox="0 0 100 100">
    <circle className="stroke-slate-700" cx="50" cy="50" r="40" fill="none" strokeWidth="8" />
    <circle
      className="stroke-primary transition-all duration-300"
      cx="50"
      cy="50"
      r="40"
      fill="none"
      strokeWidth="8"
      strokeLinecap="round"
      strokeDasharray="251.2"
      strokeDashoffset={251.2 * (1 - progress)}
      transform="rotate(-90 50 50)"
    />
  </svg>
</div>
```

## Animation Keyframes

Add to globals.css:

```css
@keyframes scan {
  0% {
    top: 0;
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
  100% {
    top: 100%;
    opacity: 1;
  }
}

@keyframes shake {
  0%,
  100% {
    transform: translateX(0);
  }
  10%,
  30%,
  50%,
  70%,
  90% {
    transform: translateX(-4px);
  }
  20%,
  40%,
  60%,
  80% {
    transform: translateX(4px);
  }
}

@keyframes pulse-ring {
  0% {
    transform: scale(0.8);
    opacity: 0.8;
  }
  50% {
    transform: scale(1.2);
    opacity: 0;
  }
  100% {
    transform: scale(0.8);
    opacity: 0;
  }
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

.animate-scan {
  animation: scan 2s ease-in-out infinite;
}

.animate-shake {
  animation: shake 0.5s ease-in-out;
}
```

## Color Palette (Totem Dark Theme)

```css
/* Backgrounds */
--totem-bg: oklch(0.12 0.02 270); /* Near black */
--totem-surface: oklch(0.16 0.03 270); /* Dark slate */
--totem-elevated: oklch(0.2 0.04 270); /* Elevated cards */

/* Accents */
--totem-primary: oklch(0.65 0.25 280); /* Vibrant violet */
--totem-accent: oklch(0.7 0.2 200); /* Cyan accent */

/* Status */
--totem-success: oklch(0.7 0.2 155); /* Bright green */
--totem-error: oklch(0.65 0.25 25); /* Bright red */
--totem-warning: oklch(0.8 0.18 80); /* Amber */

/* Text */
--totem-text: oklch(0.95 0.01 270); /* Near white */
--totem-text-muted: oklch(0.65 0.02 270); /* Gray */
```

## Responsive Breakpoints

Totem screens are typically:

- **Portrait**: 1080x1920 (9:16)
- **Landscape**: 1920x1080 (16:9)

```tsx
// Container sizing
<div className="mx-auto w-full max-w-2xl px-6 py-8">
```

## Accessibility Requirements

1. **Color Contrast**: Minimum 4.5:1 for text, 3:1 for large text
2. **Focus States**: Visible focus rings on all interactive elements
3. **Motion**: Respect `prefers-reduced-motion`
4. **Touch**: No double-tap zoom areas, single-tap only

## Anti-Patterns

❌ Small, hard-to-tap buttons
❌ Hover-only interactions
❌ Low contrast text
❌ Jarring transitions
❌ Confusing iconography
❌ Hidden actions
❌ Complex multi-step flows
❌ Text-heavy screens
❌ Relying on color alone for status

## Best Practices

✅ Large, clear CTAs
✅ Immediate visual feedback
✅ Simple, focused screens
✅ Clear progress indication
✅ Graceful error handling
✅ Celebratory success states
✅ Consistent navigation patterns
✅ Generous whitespace
✅ High contrast in all conditions
