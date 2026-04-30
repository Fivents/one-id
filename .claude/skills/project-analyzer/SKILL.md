---
name: project-analyzer
description: Analyzes and understands the ONE-ID project structure, data models, and business logic. Reads the codebase and maintains project memory for consistent AI assistance.
---

# Project Analyzer Skill

## Purpose

Deeply understand the ONE-ID project to provide accurate, context-aware assistance. This skill ensures the AI:

- Understands the project's purpose and architecture
- Knows the data model and entity relationships
- Respects existing patterns and conventions
- Makes improvements without regressions

## Project Context

### What is ONE-ID?

ONE-ID is a multi-tenant SaaS platform for event management and attendee check-in. Key features:

1. **Organizations** create and manage events
2. **Events** have participants who can check-in via:
   - Facial recognition (AI-powered)
   - QR code scanning
   - Manual access code entry
3. **Totems** are physical kiosks at event venues
4. **Plans** control feature access and limits per organization

### Critical Understanding: The Totem Flow

```
Physical Totem (Kiosk) at Event Venue
            ↓
    Authenticates with access code
            ↓
    Shows check-in method selector
            ↓
    ├── Face: Camera captures → AI extracts embedding → Matches participant
    ├── QR: Scanner reads → Validates code → Finds participant
    └── Code: User types → Validates → Finds participant
            ↓
    Success: Shows welcome + participant info
    Error: Shows message + retry option
            ↓
    Auto-returns to method selector (3s)
```

### Database Schema Essentials

Read `.claude/MEMORY.md` for full details. Key entities:

- **Organization**: Multi-tenant root, owns everything
- **Event**: Has AI config, check-in methods enabled
- **Person + PersonFace**: Contact with facial embeddings (512D vectors)
- **EventParticipant**: Person enrolled in specific event
- **Totem**: Physical device with session management
- **CheckIn**: Records each check-in with method and confidence

### Code Conventions

1. **Component Structure**: shadcn/ui components in `src/components/ui/`
2. **Styling**: Tailwind CSS v4 with oklch color system
3. **State**: React hooks + context providers
4. **API**: Server actions and route handlers
5. **Types**: Strict TypeScript, Zod validation
6. **i18n**: next-intl for translations

### Design System

- **Colors**: oklch-based, dark mode default for totem
- **Components**: shadcn/ui (Radix primitives)
- **Icons**: Lucide React
- **Animations**: tw-animate-css + custom keyframes
- **Spacing**: Tailwind utilities (consistent 4px grid)

## Analysis Process

When analyzing code or making changes:

### Step 1: Read Context

```
1. Check .claude/MEMORY.md for project overview
2. Read prisma/schema.prisma for data model
3. Review existing components in target area
4. Understand current styling patterns
```

### Step 2: Understand Intent

```
1. What is the user trying to achieve?
2. How does this fit the existing architecture?
3. Are there similar implementations to follow?
4. What constraints exist (performance, accessibility)?
```

### Step 3: Plan Changes

```
1. List files that need modification
2. Identify potential impacts
3. Consider edge cases
4. Plan testing approach
```

### Step 4: Implement

```
1. Follow existing patterns
2. Maintain consistency
3. Add appropriate comments
4. Handle errors gracefully
```

### Step 5: Verify

```
1. No logic regressions
2. UI matches design system
3. Performance acceptable
4. Accessibility maintained
```

## Quality Gates

Before completing any change, verify:

### Logic Preservation

- [ ] Existing functionality still works
- [ ] Error handling remains intact
- [ ] Edge cases still covered
- [ ] API contracts unchanged

### UI Consistency

- [ ] Uses existing components
- [ ] Follows color system
- [ ] Spacing is consistent
- [ ] Animations are smooth

### Performance

- [ ] No unnecessary re-renders
- [ ] Lazy loading where appropriate
- [ ] Bundle size reasonable
- [ ] No blocking operations

### Accessibility

- [ ] Touch targets ≥48px
- [ ] Color contrast ≥4.5:1
- [ ] Screen reader support
- [ ] Keyboard navigation

## Anti-Patterns to Avoid

❌ Creating new components when existing ones work
❌ Adding inline styles instead of Tailwind
❌ Ignoring existing error handling patterns
❌ Breaking the dark mode theme
❌ Removing accessibility features
❌ Introducing layout shifts
❌ Adding blocking synchronous operations
❌ Hardcoding text (should use i18n)

## Best Practices to Follow

✅ Read existing code before writing new code
✅ Match the style of surrounding code
✅ Use TypeScript strictly
✅ Handle all error cases
✅ Support both touch and keyboard
✅ Test on mobile viewport
✅ Keep components focused and small
✅ Document non-obvious logic

## Memory Updates

After significant changes, update `.claude/MEMORY.md`:

- New patterns introduced
- Architecture decisions made
- Known issues or limitations
- Performance considerations
