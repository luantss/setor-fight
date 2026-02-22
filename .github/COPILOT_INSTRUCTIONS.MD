# 🥋 Jiu-Jitsu Competition Platform — Copilot Master Instructions

---

# 1. ROLE

You are acting as a Senior Fullstack Engineer and System Architect.

Your responsibilities:

- Design a production-ready MVP
- Maintain clean architecture principles
- Write strictly typed TypeScript
- Prioritize reliability and clarity
- Avoid overengineering
- Focus on delivering in 2 highly focused days

This system must support 500–1000 competitors in a local Jiu-Jitsu competition.

---

# 2. PROJECT PURPOSE

We are building a web platform that eliminates manual category assignment in Jiu-Jitsu competitions.

The system must:

- Automatically assign categories based on official CBJJO 2026 rules
- Allow competitor self-registration
- Allow admin management of competitions
- Export grouped competitor lists in Excel and PDF
- All UI text must be in PORTUGUES BR

This is an MVP for validation.
No monetization in this phase.

---

# 3. TECH STACK (STRICT REQUIREMENTS)

Framework:
- Next.js 14+ (App Router)
- TypeScript (strict mode)

Backend:
- Supabase (Auth + PostgreSQL)
- Prisma ORM

Validation:
- Zod
- React Hook Form

UI:
- TailwindCSS
- ShadCN UI

Exports:
- ExcelJS (Excel export)
- PDFKit (PDF export)

Do NOT introduce additional heavy dependencies.

---

# 4. ARCHITECTURE PRINCIPLES

- Domain logic must be framework-independent
- No business logic inside UI components
- No direct DB calls inside UI components
- Use service layer
- Use strict TypeScript (no `any`)
- Separate domain from infrastructure
- Category matching must be PURE DOMAIN logic
- Database is persistence only, not rule engine

Folder structure:

/app  
/domain  
/services  
/lib  
/data  
/prisma  

---

# 5. ROLES

## ADMIN
- Create competition
- View registrations grouped by category
- Export Excel
- Export PDF

## COMPETITOR
- Register
- Login
- Complete profile
- View open competitions
- Enroll in competition
- Confirm profile before enrolling

---

# 6. DATABASE DESIGN PRINCIPLES

The database must represent CBJJO structure correctly.

CBJJO categories are defined by:

- Belt
- Gender (MASCULINO | FEMININO | MISTO)
- Age Division
- Weight Class

IMPORTANT RULE:

- For divisions below JUVENIL, categories may be MISTO.
- From JUVENIL and above, categories must be separated by gender (MASCULINO / FEMININO).
- This rule must be enforced at generation time, not manually.

Categories must NOT be manually hardcoded.
They must be generated from structured CBJJO template data.

---

# 7. REQUIRED DATABASE MODELS

Gender enum must include:

- MASCULINO
- FEMININO
- MISTO

---

## CompetitorProfile

- birthDate must be used
- Age must always be calculated using competition date
- Competitor.gender is always MASCULINO or FEMININO (never MISTO)

---

## WeightClass

- May have gender = MISTO for divisions below JUVENIL
- For JUVENIL and above, must be gender-specific

---

## Category

- gender must match WeightClass.gender
- For divisions below JUVENIL:
    - gender = MISTO
- For JUVENIL and above:
    - gender = MASCULINO or FEMININO

Consistency between Category.gender and WeightClass.gender must be guaranteed by the generator service.

---

## Registration

- unique(competitionId, competitorId)
- Must be created transactionally

---

# 8. CORE DOMAIN — CATEGORY MATCHING ENGINE

Location:
`/domain/categoryMatcher.ts`

Pure function:

matchCategory(
  competitor: CompetitorProfile,
  competitionDate: Date,
  categories: CategoryWithRelations[]
): Category

Rules:

1. Calculate age using birthDate and competitionDate
2. Determine AgeDivision
3. Filter categories by:
    - Belt
    - AgeDivision
    - Weight range
4. Gender matching rule:

    A category matches if:
        category.gender === competitor.gender
        OR
        category.gender === MISTO

5. Must return EXACTLY ONE category
6. Throw DomainError if:
    - No match
    - Multiple matches

Must be:

- Pure
- Deterministic
- Unit-testable
- No DB calls
- No framework imports

---

# 9. CBJJO TEMPLATE STRATEGY

File:
/data/cbjjo-2026-template.json

The template must define:

- Age divisions
- Weight classes per age division
- Gender rules per division

IMPORTANT: Categories are seeded automatically at application startup via `prisma/seed.ts`.
There is NO admin UI to generate categories. The seed is the single source of truth.

The seed must:

1. Load template
2. Ensure AgeDivisions exist
3. Ensure WeightClasses exist
4. Generate Categories for all competitions already in DB:
    - All belts
    - Correct gender rule per division
    - All weight classes
5. Be idempotent

---

# 10. AUTHORIZATION

- Use Supabase Auth
- Protect admin routes
- Protect enrollment
- Validate role server-side
- Never trust client role
- Implement role-based middleware

---

# 11. COMPETITOR FLOW

Enrollment system must:

- Prevent duplicate registration
- Prevent enrollment in CLOSED competitions
- Prevent enrollment with incomplete profile
- Use transactional registration
- Use domain matcher

---

# 12. ADMIN FLOW

Admin must be able to:

- Create competition
- View registrations grouped by category
- Export Excel
- Export PDF

Admin does NOT manage category generation. Categories are seeded automatically.

---

# 13. EXPORT REQUIREMENTS

Excel and PDF must:

- Be in PORTUGUES BR
- Group competitors by category
- Display:
    - Nome
    - Faixa
    - Divisão de Idade
    - Categoria de Peso
    - Peso (kg)
    - Sexo
    - Idade

---

# 14. PERFORMANCE REQUIREMENTS

System must support:

- 1000 registrations
- Indexed queries
- No N+1
- Atomic enrollment
- Efficient category filtering

---

# 15. VALIDATION

Use Zod for:

- Form validation
- API validation
- Domain constraints

Never trust request body.

---

# 16. NON-GOALS

Do NOT implement:

- Payments
- Brackets
- Real-time updates
- Multi-tenancy
- QR check-in
- Rankings
- Admin UI for category generation

---

# 17. CODE QUALITY RULES

- Strict TypeScript
- No `any`
- Pure domain logic
- Clear services
- No business logic in UI
- Clear error handling

---

# 18. ROUTES

- `/` → Landing page (public)
- `/competicoes` → List of open competitions (public) — previously `/dashboard`
- `/competicoes/[id]` → Competition detail + enrollment
- `/competidor/perfil` → Competitor profile (auth required)
- `/admin` → Admin panel (ADMIN role required)
- `/admin/competicoes/[id]` → Admin competition detail
- `/login` → Login
- `/cadastro` → Registration

---

# 19. FINAL OBJECTIVE

Deliver a production-viable MVP capable of:

- Supporting 1000 competitors
- Automatically assigning CBJJO 2026 categories
- Supporting mixed categories below Juvenil
- Running on Supabase Free
- Running on Vercel Free
- Being clean and extensible