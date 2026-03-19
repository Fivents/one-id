---
name: api-design
description: Designs consistent REST APIs aligned with Next.js App Router and clean architecture principles.
---

# API Rules

## Structure

- Route → Controller → Service → Repository

## Response Pattern

- Success: { data }
- Error: standardized error mapping

## Anti-Patterns

- Business logic inside route.ts
- Direct Prisma calls in controllers

## Must Follow

- Use DTOs
- Validate input with Zod
