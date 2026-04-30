---
name: multi-tenant-architecture
description: Ensures all queries and business logic correctly enforce organization-based multi-tenancy, preventing data leakage across tenants.
---

# Multi-Tenant Architecture Rules

## Core Rule

Every operation MUST be scoped by organizationId unless explicitly global.

## Enforcement

- Always include organizationId in queries
- Never trust client-provided organizationId blindly
- Validate membership before accessing data

## Prisma Patterns

- Prefer:
  where: { organizationId: ctx.organizationId }

## Anti-Patterns

- Missing organization filter
- Cross-organization joins without validation

## When to Use

- Any query involving:
  - Event
  - Person
  - Membership
  - Totem subscriptions
