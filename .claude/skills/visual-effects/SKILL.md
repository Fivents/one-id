---
name: visual-effects
description: Creates stunning visual effects for modern UIs including gradients, glassmorphism, glows, and shadows. Optimized for dark themes and physical displays.
---

# Visual Effects Skill

## Purpose

Add visual polish and depth to interfaces using modern CSS effects that work well on physical displays.

## Gradient Patterns

### Hero Gradient Background

```css
.hero-gradient {
  background: linear-gradient(135deg, oklch(0.15 0.05 270) 0%, oklch(0.12 0.03 300) 50%, oklch(0.1 0.02 330) 100%);
}
```

### Accent Gradient

```css
.accent-gradient {
  background: linear-gradient(135deg, oklch(0.55 0.25 280) 0%, oklch(0.5 0.2 320) 100%);
}
```

### Text Gradient

```tsx
<h1 className="
  bg-gradient-to-r from-violet-400 via-purple-400 to-fuchsia-400
  bg-clip-text text-transparent
">
```

### Border Gradient

```tsx
<div className="relative rounded-2xl bg-gradient-to-br from-violet-500/50 via-transparent to-cyan-500/50 p-[1px]">
  <div className="rounded-[15px] bg-slate-900 p-6">{content}</div>
</div>
```

### Mesh Gradient

```css
.mesh-gradient {
  background-color: oklch(0.12 0.03 270);
  background-image:
    radial-gradient(at 40% 20%, oklch(0.3 0.15 280 / 0.4) 0px, transparent 50%),
    radial-gradient(at 80% 0%, oklch(0.25 0.12 200 / 0.3) 0px, transparent 50%),
    radial-gradient(at 0% 50%, oklch(0.28 0.14 320 / 0.3) 0px, transparent 50%),
    radial-gradient(at 80% 50%, oklch(0.22 0.1 260 / 0.2) 0px, transparent 50%),
    radial-gradient(at 0% 100%, oklch(0.25 0.15 300 / 0.3) 0px, transparent 50%);
}
```

## Glassmorphism

### Glass Card

```tsx
<div className="
  rounded-2xl
  bg-white/5 dark:bg-white/5
  backdrop-blur-xl
  border border-white/10
  shadow-xl shadow-black/20
">
```

### Frosted Glass

```css
.frosted-glass {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.1);
}
```

### Glass Button

```tsx
<button className="
  px-6 py-3 rounded-xl
  bg-white/10 hover:bg-white/20
  backdrop-blur-lg
  border border-white/20
  transition-all duration-200
  hover:shadow-lg hover:shadow-primary/20
">
```

## Glow Effects

### Ambient Glow

```tsx
<div className="
  relative
  before:absolute before:inset-0 before:-z-10
  before:bg-primary/20 before:blur-3xl before:rounded-full
">
```

### Button Glow

```tsx
<button className="
  relative group
  bg-primary px-6 py-3 rounded-xl
  shadow-lg shadow-primary/30
  hover:shadow-xl hover:shadow-primary/40
  transition-shadow duration-300
">
```

### Neon Glow

```css
.neon-glow {
  text-shadow:
    0 0 5px currentColor,
    0 0 10px currentColor,
    0 0 20px currentColor,
    0 0 40px currentColor;
}

.neon-box {
  box-shadow:
    0 0 5px oklch(0.7 0.25 280),
    0 0 20px oklch(0.6 0.25 280 / 0.5),
    0 0 40px oklch(0.5 0.25 280 / 0.3);
}
```

### Pulsing Glow

```css
@keyframes pulse-glow {
  0%,
  100% {
    box-shadow: 0 0 20px oklch(0.6 0.2 280 / 0.4);
  }
  50% {
    box-shadow: 0 0 40px oklch(0.7 0.25 280 / 0.6);
  }
}
```

## Shadows

### Elevated Card

```tsx
<div className="
  shadow-xl shadow-black/20
  dark:shadow-2xl dark:shadow-black/40
">
```

### Layered Shadow

```css
.layered-shadow {
  box-shadow:
    0 1px 2px rgba(0, 0, 0, 0.1),
    0 4px 8px rgba(0, 0, 0, 0.1),
    0 16px 32px rgba(0, 0, 0, 0.15),
    0 32px 64px rgba(0, 0, 0, 0.1);
}
```

### Colored Shadow

```tsx
<div className="
  bg-emerald-500
  shadow-lg shadow-emerald-500/30
  hover:shadow-xl hover:shadow-emerald-500/40
">
```

### Inner Shadow (Inset)

```css
.inner-shadow {
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.3);
}
```

## Overlays

### Gradient Overlay

```tsx
<div className="relative">
  <img src={src} />
  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
</div>
```

### Noise Texture

```css
.noise-overlay {
  position: relative;
}
.noise-overlay::after {
  content: '';
  position: absolute;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
  opacity: 0.03;
  pointer-events: none;
}
```

### Vignette

```css
.vignette {
  box-shadow: inset 0 0 100px rgba(0, 0, 0, 0.5);
}
```

## Camera/Video Effects

### Viewfinder Corners

```tsx
<div className="relative">
  <video className="h-full w-full object-cover" />

  {/* Corner brackets */}
  <div className="border-primary absolute top-4 left-4 h-12 w-12 rounded-tl-lg border-t-4 border-l-4" />
  <div className="border-primary absolute top-4 right-4 h-12 w-12 rounded-tr-lg border-t-4 border-r-4" />
  <div className="border-primary absolute bottom-4 left-4 h-12 w-12 rounded-bl-lg border-b-4 border-l-4" />
  <div className="border-primary absolute right-4 bottom-4 h-12 w-12 rounded-br-lg border-r-4 border-b-4" />
</div>
```

### Face Detection Highlight

```tsx
<div
  className="border-primary shadow-primary/30 absolute animate-pulse rounded-lg border-2 shadow-lg"
  style={{
    left: face.x,
    top: face.y,
    width: face.width,
    height: face.height,
  }}
/>
```

### Scan Line

```css
@keyframes scan-line {
  0% {
    transform: translateY(0);
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
  100% {
    transform: translateY(100%);
    opacity: 1;
  }
}

.scan-line {
  position: absolute;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--primary), transparent);
  animation: scan-line 2s ease-in-out infinite;
}
```

## Status Indicators

### Success Ring

```tsx
<div className="rounded-full bg-emerald-500/20 p-6 shadow-lg ring-4 shadow-emerald-500/20 ring-emerald-500/30">
  <CheckCircle2 className="h-16 w-16 text-emerald-400" />
</div>
```

### Error Ring

```tsx
<div className="rounded-full bg-rose-500/20 p-6 shadow-lg ring-4 shadow-rose-500/20 ring-rose-500/30">
  <XCircle className="h-16 w-16 text-rose-400" />
</div>
```

### Processing Ring

```tsx
<div className="bg-primary/20 ring-primary/30 animate-pulse rounded-full p-6 ring-4">
  <Loader2 className="text-primary h-16 w-16 animate-spin" />
</div>
```

## Performance Notes

- `backdrop-filter` is GPU-accelerated but can be expensive on large areas
- Use `will-change: transform` sparingly for animated elements
- Avoid animating `box-shadow` - animate opacity of a pseudo-element instead
- Test on actual totem hardware

## Anti-Patterns

❌ Overusing blur effects (performance)
❌ Low contrast gradients on text
❌ Animating shadows directly
❌ Too many layered effects
❌ Effects that fight for attention

## Best Practices

✅ Subtle effects that enhance, not distract
✅ Consistent visual language
✅ Test in real lighting conditions
✅ Ensure text remains readable
✅ Use effects purposefully
