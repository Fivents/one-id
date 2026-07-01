# Plano: Import/Export de Pessoas da Organização

## Schema — Migration
- Person: +jobTitle, department, birthDate, notes
- @@unique([document, organizationId])

## Steps
1. Migration Prisma (schema.prisma)
2. Domain Entity + Contracts (person.entity.ts, person.repository.ts)
3. Repository (prisma-person.repository.ts)
4. Zod Requests (person.request.ts)
5. Import/Export Use Cases
6. API Routes (POST import, GET export, GET template)
7. Controller Factories
8. Client Service Types
9. Excel People Service (excel-people.service.ts - novo)
10. Import Dialog Components (2 novos)
11. i18n
12. People Page (botões toolbar)
13. Lint
