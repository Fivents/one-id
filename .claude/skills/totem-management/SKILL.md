---
name: totem-management
description: Manages totem lifecycle, sessions, and linking to organizations and events with temporal constraints.
---

# Rules

## Linking

- Totem → Organization (time-based)
- Totem → Event (via organization subscription)

## Must Validate

- Active subscription
- Not revoked
- Within time window

## Anti-Patterns

- Direct linking without subscription
- Ignoring revokedAt
