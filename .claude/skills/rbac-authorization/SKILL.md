---
name: rbac-authorization
description: Enforces role-based access control using Membership roles within organizations.
---

# RBAC Rules

## Roles

- SUPER_ADMIN → global
- ORG_OWNER → full org control
- EVENT_MANAGER → scoped operations

## Enforcement Pattern

- Always resolve user membership first
- Validate role before executing use-case

## Anti-Patterns

- Checking role without organization context
- Hardcoding permissions

## Example

- Only ORG_OWNER can manage plans
- EVENT_MANAGER can manage events but not billing
