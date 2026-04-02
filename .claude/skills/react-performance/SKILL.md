---
name: react-performance
description: Optimizes React components for maximum performance. Focuses on memoization, lazy loading, and render optimization for smooth 60fps experiences.
---

# React Performance Skill

## Purpose

Ensure React components render efficiently, especially for real-time features like camera feeds and animations.

## Core Principles

### 1. Minimize Re-renders

- Only re-render what changed
- Use React Compiler (automatic memoization)
- Split components strategically

### 2. Optimize Heavy Operations

- Defer non-critical updates
- Use Web Workers for CPU-intensive tasks
- Lazy load components and assets

### 3. Memory Management

- Clean up effects properly
- Avoid memory leaks in intervals/subscriptions
- Release resources (camera, canvas) on unmount

## Patterns

### useCallback for Stable References

```tsx
const handleClick = useCallback(() => {
  doSomething(value);
}, [value]);
```

### useMemo for Expensive Calculations

```tsx
const sorted = useMemo(() => items.sort((a, b) => a.score - b.score), [items]);
```

### Lazy Component Loading

```tsx
const HeavyComponent = lazy(() => import('./HeavyComponent'));

<Suspense fallback={<Skeleton />}>
  <HeavyComponent />
</Suspense>;
```

### Debounce Rapid Updates

```tsx
const debouncedSearch = useMemo(() => debounce((term: string) => search(term), 300), []);
```

### Refs for Non-Reactive Values

```tsx
const countRef = useRef(0);

useEffect(() => {
  countRef.current += 1; // No re-render
}, []);
```

### Cleanup Effects

```tsx
useEffect(() => {
  const stream = await navigator.mediaDevices.getUserMedia({ video: true });
  videoRef.current.srcObject = stream;

  return () => {
    stream.getTracks().forEach((track) => track.stop());
  };
}, []);
```

### AbortController for Requests

```tsx
useEffect(() => {
  const controller = new AbortController();

  fetch(url, { signal: controller.signal })
    .then(handleResponse)
    .catch((err) => {
      if (err.name !== 'AbortError') throw err;
    });

  return () => controller.abort();
}, [url]);
```

### Virtual Lists for Large Data

```tsx
// Use @tanstack/react-virtual for long lists
const virtualizer = useVirtualizer({
  count: items.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 50,
});
```

### Image Optimization

```tsx
// Use next/image for automatic optimization
<Image src={url} alt={alt} width={400} height={300} priority={isAboveFold} placeholder="blur" />
```

### State Splitting

```tsx
// ❌ Single state object (re-renders everything)
const [state, setState] = useState({ a: 1, b: 2, c: 3 });

// ✅ Split by update frequency
const [a, setA] = useState(1);
const [b, setB] = useState(2);
const [c, setC] = useState(3);
```

### Transition for Non-Urgent Updates

```tsx
const [isPending, startTransition] = useTransition();

const handleChange = (value: string) => {
  setInput(value); // Urgent
  startTransition(() => {
    setSearchResults(filterItems(value)); // Can wait
  });
};
```

### requestAnimationFrame for Animations

```tsx
useEffect(() => {
  let frameId: number;

  function animate() {
    // Update animation
    frameId = requestAnimationFrame(animate);
  }

  frameId = requestAnimationFrame(animate);
  return () => cancelAnimationFrame(frameId);
}, []);
```

## Camera/Video Specific

### Efficient Frame Capture

```tsx
const captureFrame = useCallback(() => {
  const canvas = canvasRef.current;
  const video = videoRef.current;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  ctx.drawImage(video, 0, 0);

  return canvas.toDataURL('image/jpeg', 0.8);
}, []);
```

### Throttle Detection Loop

```tsx
useEffect(() => {
  let active = true;

  async function detectLoop() {
    while (active) {
      await detect();
      await new Promise((r) => setTimeout(r, 500)); // 2fps
    }
  }

  detectLoop();
  return () => {
    active = false;
  };
}, []);
```

## Anti-Patterns

❌ Creating objects/functions in render
❌ useEffect without cleanup
❌ Fetching in loops without batching
❌ Storing derived state
❌ Anonymous functions as props
❌ Missing keys in lists

## Best Practices

✅ Profile before optimizing
✅ Use React DevTools Profiler
✅ Test on low-end devices
✅ Monitor bundle size
✅ Clean up all subscriptions
✅ Use production builds for testing
