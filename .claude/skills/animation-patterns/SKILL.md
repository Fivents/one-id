---
name: animation-patterns
description: Implements smooth, purposeful animations for UI interactions. Focuses on micro-interactions, state transitions, and feedback animations using Tailwind and CSS.
---

# Animation Patterns Skill

## Purpose

Create polished, performant animations that enhance user experience without compromising performance.

## Core Principles

### 1. Performance First

```css
/* ✅ GPU-accelerated (cheap) */
transform:
  translateX(),
  translateY(),
  scale(),
  rotate() opacity /* ❌ Triggers layout/paint (expensive) */ width,
  height,
  top,
  left,
  margin,
  padding;
```

### 2. Duration Guidelines

- Micro-interactions: 150ms
- State changes: 200-300ms
- Complex transitions: 300-500ms
- Ambient: 1000-3000ms

### 3. Easing

- Enter: ease-out
- Exit: ease-in
- Symmetric: ease-in-out

## Common Patterns

### Button Press

```tsx
<button className="transition-transform duration-150 active:scale-95">
```

### Fade In

```tsx
<div className="animate-in fade-in duration-300">
```

### Slide Up

```tsx
<div className="animate-in slide-in-from-bottom-4 fade-in duration-300">
```

### Scale In (Modal)

```tsx
<div className="animate-in zoom-in-95 fade-in duration-200">
```

### Stagger Children

```tsx
{items.map((item, i) => (
  <div
    style={{ animationDelay: `${i * 50}ms` }}
    className="animate-in fade-in"
  >
```

### Pulsing Dot

```tsx
<span className="relative flex h-3 w-3">
  <span className="absolute h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
  <span className="relative h-3 w-3 rounded-full bg-emerald-500" />
</span>
```

### Spinner

```tsx
<svg className="animate-spin h-6 w-6" viewBox="0 0 24 24">
```

### Error Shake

```css
@keyframes shake {
  0%,
  100% {
    transform: translateX(0);
  }
  25%,
  75% {
    transform: translateX(-4px);
  }
  50% {
    transform: translateX(4px);
  }
}
.animate-shake {
  animation: shake 0.4s ease-in-out;
}
```

### Scanning Line

```css
@keyframes scan {
  0% {
    top: 0;
  }
  100% {
    top: 100%;
  }
}
.animate-scan {
  animation: scan 2s ease-in-out infinite;
}
```

### Floating

```css
@keyframes float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}
.animate-float {
  animation: float 3s ease-in-out infinite;
}
```

### Glow

```css
@keyframes glow {
  0%,
  100% {
    box-shadow: 0 0 20px rgba(139, 92, 246, 0.3);
  }
  50% {
    box-shadow: 0 0 40px rgba(139, 92, 246, 0.6);
  }
}
```

## Reduced Motion

```tsx
<div className="motion-safe:animate-bounce motion-reduce:animate-none">
```

## Anti-Patterns

❌ Animating layout properties
❌ Animations > 500ms for interactions
❌ Ignoring prefers-reduced-motion
❌ Too many simultaneous animations

## Best Practices

✅ Use transform and opacity only
✅ Keep interactions under 300ms
✅ Respect reduced motion preferences
✅ Test on low-end devices
