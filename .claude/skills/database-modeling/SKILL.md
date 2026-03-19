---
name: database-modeling
description: Designs and validates Prisma/PostgreSQL schemas ensuring relational integrity, constraints, and performance.
---

# Rules

## Always Respect

- Unique constraints
- Soft delete (deletedAt)
- Foreign keys

## Patterns

- Use composite unique keys where needed
- Index frequently queried fields

## Critical Constraints

- Person: unique(email, organizationId)
- EventParticipant: unique(personId, eventId)

## Anti-Patterns

- Ignoring soft delete in queries
- Duplicating entities
