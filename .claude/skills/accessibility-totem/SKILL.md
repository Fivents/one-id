---
name: accessibility-totem
description: Ensures totem interfaces are accessible to all users, including those with disabilities. Focuses on touch accessibility, color contrast, and clear visual feedback.
---

# Accessibility for Totem Interfaces

## Purpose

Make check-in totems usable by everyone, including users with:

- Visual impairments
- Motor difficulties
- Cognitive disabilities
- Color blindness

## Core Requirements

### 1. Touch Targets

```tsx
// Minimum 48x48px, recommended 64x64px+
<button className="min-h-[64px] min-w-[64px] p-4">
```

### 2. Color Contrast

- Normal text: 4.5:1 minimum
- Large text (18px+): 3:1 minimum
- UI components: 3:1 minimum

### 3. Focus Indicators

```tsx
<button className="
  focus-visible:outline-none
  focus-visible:ring-4
  focus-visible:ring-primary/50
  focus-visible:ring-offset-2
">
```

### 4. Semantic HTML

```tsx
// ✅ Semantic
<button onClick={handleSubmit}>Submit</button>
<nav aria-label="Check-in methods">
<main aria-live="polite">

// ❌ Non-semantic
<div onClick={handleSubmit}>Submit</div>
```

## ARIA Patterns

### Live Regions (Feedback)

```tsx
<div role="status" aria-live="polite" aria-atomic="true">
  {feedbackMessage}
</div>
```

### Loading States

```tsx
<button aria-busy={isLoading} aria-disabled={isLoading}>
  {isLoading ? 'Processing...' : 'Submit'}
</button>
```

### Error Messages

```tsx
<input aria-invalid={!!error} aria-describedby={error ? 'error-msg' : undefined} />;
{
  error && (
    <p id="error-msg" role="alert">
      {error}
    </p>
  );
}
```

### Progress

```tsx
<div
  role="progressbar"
  aria-valuenow={progress}
  aria-valuemin={0}
  aria-valuemax={100}
  aria-label="Check-in progress"
>
```

### Camera Status

```tsx
<div role="status" aria-live="polite">
  {isCameraReady ? 'Camera ready. Position your face in frame.' : 'Starting camera...'}
</div>
```

## Visual Design

### High Contrast Mode

```css
@media (prefers-contrast: high) {
  :root {
    --border: white;
    --foreground: white;
    --background: black;
  }
}
```

### Color Blindness Safe

```tsx
// Always combine color with icons/text
<div className="flex items-center gap-2 text-emerald-500">
  <CheckCircle2 aria-hidden="true" />
  <span>Check-in successful</span>
</div>
```

### Text Size

```tsx
// Minimum 16px for body text
// 24px+ for important information
<p className="text-lg">Instructions</p>
<h1 className="text-3xl font-bold">Welcome!</h1>
```

## Motion

### Reduced Motion

```tsx
<div className="
  motion-safe:animate-bounce
  motion-reduce:animate-none
">
```

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

## Forms

### Input Labels

```tsx
<label htmlFor="access-code" className="sr-only">
  Access Code
</label>
<input
  id="access-code"
  type="text"
  placeholder="Enter your access code"
  aria-required="true"
/>
```

### Clear Instructions

```tsx
<div className="space-y-2">
  <p className="text-lg">Position your face within the frame</p>
  <p className="text-muted text-sm">Look directly at the camera</p>
</div>
```

## Screen Reader Support

### Visually Hidden Text

```tsx
<span className="sr-only">Face recognition in progress</span>
```

### Skip Links (if navigation exists)

```tsx
<a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4">
  Skip to main content
</a>
```

### Icon Buttons

```tsx
<button aria-label="Go back to method selection">
  <ArrowLeft aria-hidden="true" />
</button>
```

## Timeout Accessibility

### Extend Time Warning

```tsx
// If auto-redirect after success/error
<div role="timer" aria-live="polite">
  Returning to menu in {countdown} seconds
</div>
```

### Allow Time Extension

```tsx
{
  feedback && (
    <button onClick={() => setExtendTime(true)} className="mt-4">
      Need more time?
    </button>
  );
}
```

## Testing Checklist

- [ ] Tab navigation works in logical order
- [ ] All interactive elements have focus styles
- [ ] Color contrast passes WCAG AA
- [ ] Screen reader announces status changes
- [ ] Touch targets are 48px+ minimum
- [ ] Text scales without breaking layout
- [ ] Works with reduced motion preference
- [ ] Error messages are associated with inputs

## Anti-Patterns

❌ Color-only status indication
❌ Tiny touch targets
❌ Missing focus indicators
❌ Non-semantic interactive elements
❌ Hidden content that's still focusable
❌ Timeout without warning
❌ Auto-playing audio/video
❌ Placeholder-only labels

## Best Practices

✅ Test with keyboard only
✅ Test with screen reader
✅ Test with high contrast mode
✅ Use semantic HTML first
✅ Provide text alternatives for icons
✅ Clear, simple language
✅ Consistent navigation patterns
✅ Generous timeout for actions
