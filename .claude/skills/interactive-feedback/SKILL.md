---
name: interactive-feedback
description: Implements rich, satisfying feedback for user interactions. Covers success states, error handling, progress indication, and celebratory animations.
---

# Interactive Feedback Skill

## Purpose

Provide clear, delightful feedback for every user interaction. Users should always know:

- What's happening
- What will happen next
- If something went wrong

## Feedback Types

### 1. Immediate (Touch/Click)

- Duration: 0-150ms
- Visual: Scale, color shift
- Purpose: Confirm input received

### 2. Progress (Processing)

- Duration: Variable
- Visual: Spinner, progress bar
- Purpose: Show system is working

### 3. Result (Success/Error)

- Duration: 200-500ms
- Visual: Animation, color, icon
- Purpose: Communicate outcome

### 4. Ambient (Status)

- Duration: Continuous
- Visual: Subtle pulsing, glow
- Purpose: Show system state

## Success Patterns

### Basic Success

```tsx
<div className="flex flex-col items-center gap-4">
  <div className="animate-in zoom-in-50 duration-300">
    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/20 ring-4 ring-emerald-500/30">
      <CheckCircle2 className="h-12 w-12 text-emerald-400" />
    </div>
  </div>
  <div className="animate-in fade-in slide-in-from-bottom-4 text-center delay-150 duration-300">
    <h2 className="text-2xl font-bold text-emerald-400">Success!</h2>
    <p className="mt-1 text-slate-400">{message}</p>
  </div>
</div>
```

### Celebratory Success (Check-in)

```tsx
<div className="relative">
  {/* Confetti burst effect */}
  <div className="pointer-events-none absolute inset-0">
    {[...Array(12)].map((_, i) => (
      <div
        key={i}
        className="bg-primary animate-confetti absolute top-1/2 left-1/2 h-2 w-2 rounded-full"
        style={
          {
            '--angle': `${i * 30}deg`,
            '--distance': `${80 + Math.random() * 40}px`,
          } as React.CSSProperties
        }
      />
    ))}
  </div>

  {/* Main success content */}
  <div className="animate-in zoom-in-75 duration-500">
    <div className="rounded-3xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 p-8 text-center">
      <CheckCircle2 className="animate-in zoom-in mx-auto h-20 w-20 text-emerald-400 duration-300" />
      <h2 className="mt-4 text-3xl font-bold text-white">Welcome!</h2>
      <p className="mt-2 text-xl text-emerald-300">{participantName}</p>
      <p className="mt-1 text-slate-400">{company}</p>
    </div>
  </div>
</div>
```

### CSS for Confetti

```css
@keyframes confetti {
  0% {
    transform: translate(-50%, -50%) rotate(0deg);
    opacity: 1;
  }
  100% {
    transform: translate(
        calc(-50% + cos(var(--angle)) * var(--distance)),
        calc(-50% + sin(var(--angle)) * var(--distance))
      )
      rotate(720deg);
    opacity: 0;
  }
}

.animate-confetti {
  animation: confetti 0.8s ease-out forwards;
}
```

## Error Patterns

### Basic Error

```tsx
<div className="flex flex-col items-center gap-4">
  <div className="animate-shake">
    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-rose-500/20 ring-4 ring-rose-500/30">
      <XCircle className="h-12 w-12 text-rose-400" />
    </div>
  </div>
  <div className="text-center">
    <h2 className="text-2xl font-bold text-rose-400">Not Found</h2>
    <p className="mt-1 text-slate-400">{errorMessage}</p>
  </div>
</div>
```

### Recoverable Error

```tsx
<div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-6">
  <div className="flex items-start gap-4">
    <AlertTriangle className="h-6 w-6 shrink-0 text-rose-400" />
    <div>
      <h3 className="font-semibold text-rose-400">{title}</h3>
      <p className="mt-1 text-slate-400">{message}</p>
      <button className="text-primary mt-4 text-sm hover:underline">Try again</button>
    </div>
  </div>
</div>
```

## Progress Patterns

### Simple Spinner

```tsx
<div className="flex items-center justify-center gap-3">
  <Loader2 className="text-primary h-6 w-6 animate-spin" />
  <span className="text-slate-400">Processing...</span>
</div>
```

### Progress Ring

```tsx
function ProgressRing({ progress }: { progress: number }) {
  const circumference = 2 * Math.PI * 45;

  return (
    <div className="relative h-32 w-32">
      <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
        <circle className="stroke-slate-700" cx="50" cy="50" r="45" fill="none" strokeWidth="6" />
        <circle
          className="stroke-primary transition-all duration-300 ease-out"
          cx="50"
          cy="50"
          r="45"
          fill="none"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - progress)}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-2xl font-bold">{Math.round(progress * 100)}%</span>
      </div>
    </div>
  );
}
```

### Pulsing Dots

```tsx
<div className="flex gap-2">
  {[0, 1, 2].map((i) => (
    <div key={i} className="bg-primary h-3 w-3 animate-pulse rounded-full" style={{ animationDelay: `${i * 150}ms` }} />
  ))}
</div>
```

### Step Progress

```tsx
<div className="flex items-center gap-2">
  {steps.map((step, i) => (
    <React.Fragment key={i}>
      <div
        className={cn(
          'flex h-10 w-10 items-center justify-center rounded-full font-semibold transition-all',
          i < currentStep
            ? 'bg-primary text-white'
            : i === currentStep
              ? 'bg-primary/20 text-primary ring-primary ring-2'
              : 'bg-slate-700 text-slate-400',
        )}
      >
        {i < currentStep ? <Check className="h-5 w-5" /> : i + 1}
      </div>
      {i < steps.length - 1 && (
        <div className={cn('h-1 flex-1 rounded transition-colors', i < currentStep ? 'bg-primary' : 'bg-slate-700')} />
      )}
    </React.Fragment>
  ))}
</div>
```

## Camera Feedback

### Scanning Active

```tsx
<div className="pointer-events-none absolute inset-0">
  <div className="via-primary animate-scan absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent to-transparent" />
  <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
    <div className="flex items-center gap-2 rounded-full bg-black/50 px-4 py-2 backdrop-blur">
      <span className="relative flex h-2 w-2">
        <span className="absolute h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
        <span className="relative h-2 w-2 rounded-full bg-emerald-500" />
      </span>
      <span className="text-sm text-white">Scanning for faces...</span>
    </div>
  </div>
</div>
```

### Face Detected

```tsx
<div className="pointer-events-none absolute inset-0">
  <div
    className="border-primary absolute rounded-lg border-2 transition-all duration-200"
    style={{
      left: face.x,
      top: face.y,
      width: face.width,
      height: face.height,
    }}
  >
    <div className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap">
      <span className="bg-primary rounded px-2 py-1 text-xs font-medium">Hold still...</span>
    </div>
  </div>
</div>
```

### Processing Face

```tsx
<div className="absolute inset-0 flex items-center justify-center bg-black/50">
  <div className="text-center">
    <div className="relative mx-auto h-24 w-24">
      <div className="border-primary/20 absolute inset-0 rounded-full border-4" />
      <div className="border-t-primary absolute inset-0 animate-spin rounded-full border-4 border-transparent" />
    </div>
    <p className="mt-4 font-medium text-white">Verifying identity...</p>
  </div>
</div>
```

## Touch Feedback

### Button Press

```tsx
<button className="relative overflow-hidden transition-transform duration-150 active:scale-95">
  <span className="absolute inset-0 bg-white/20 opacity-0 transition-opacity active:opacity-100" />
  {children}
</button>
```

### Ripple Effect

```tsx
function RippleButton({ children, ...props }) {
  const [ripples, setRipples] = useState([]);

  const handleClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setRipples((prev) => [...prev, { x, y, id: Date.now() }]);
    setTimeout(() => {
      setRipples((prev) => prev.slice(1));
    }, 600);
  };

  return (
    <button onClick={handleClick} className="relative overflow-hidden" {...props}>
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="animate-ripple absolute rounded-full bg-white/30"
          style={{
            left: ripple.x,
            top: ripple.y,
            transform: 'translate(-50%, -50%)',
          }}
        />
      ))}
      {children}
    </button>
  );
}
```

## Countdown Feedback

```tsx
function Countdown({ seconds, onComplete }: { seconds: number; onComplete: () => void }) {
  const [remaining, setRemaining] = useState(seconds);

  useEffect(() => {
    if (remaining <= 0) {
      onComplete();
      return;
    }
    const timer = setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => clearTimeout(timer);
  }, [remaining, onComplete]);

  return (
    <div className="text-center">
      <div className="text-primary text-6xl font-bold tabular-nums">{remaining}</div>
      <p className="mt-2 text-slate-400">Returning to menu...</p>
    </div>
  );
}
```

## Anti-Patterns

❌ No feedback on user action
❌ Feedback that disappears too quickly
❌ Confusing or ambiguous states
❌ Feedback that blocks interaction
❌ Inconsistent feedback patterns
❌ Over-the-top celebrations for minor actions

## Best Practices

✅ Immediate acknowledgment of input
✅ Clear visual distinction between states
✅ Graceful transitions between states
✅ Appropriate celebration for achievements
✅ Clear recovery paths from errors
✅ Consistent animation timing
