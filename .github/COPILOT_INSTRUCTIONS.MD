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

CBJJO categories are defined by:

- Belt
- Gender (MASCULINO | FEMININO | MISTO)
- Age Division
- Weight Class

`AgeDivision` and `WeightClass` are shared lookup tables seeded once from the CBJJO 2026 rules.
They are NOT per-competition — they represent the global official table.

There is NO `Category` table.

At enrollment time, the domain matcher resolves which `AgeDivision` and `WeightClass` apply
to the competitor, and those IDs are stored directly on `Registration` alongside `belt`.

IMPORTANT RULE:

- For divisions below JUVENIL, WeightClass.gender = MISTO.
- From JUVENIL and above, WeightClass.gender = MASCULINO or FEMININO.
- This is enforced by the seeded data and the matcher, not by a generation step.

Age calculation rule:

- Always use exact birthday (UTC): full years elapsed, minus 1 if birthday has not yet occurred.
- Apply this rule in BOTH the domain matcher and all display helpers (`lib/labels.ts`).

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

## AgeDivision

- Seeded from official CBJJO 2026 table (11 divisions)
- Shared across all competitions — NOT per-competition
- Fields: code (AgeDivisionCode), minAge, maxAge

---

## WeightClass

- Seeded from official CBJJO 2026 table
- Shared across all competitions — NOT per-competition
- gender = MISTO for divisions below JUVENIL
- gender = MASCULINO or FEMININO for JUVENIL and above
- FK to AgeDivision

---

## Registration

- unique(competitionId, competitorId)
- Must be created transactionally
- Stores the resolved category assignment directly:
  - `belt` Belt (from competitor profile)
  - `ageDivisionId` FK → AgeDivision
  - `weightClassId` FK → WeightClass

NOTE: There is NO `Category` table. The "category" is fully described
by the combination of `belt` + `ageDivision` + `weightClass` on the Registration itself.

---

# 8. CORE DOMAIN — CATEGORY MATCHING ENGINE

Location:
`/domain/categoryMatcher.ts`

Pure function:

matchCategory(
  competitor: CompetitorInput,
  competitionDate: Date,
  weightClasses: WeightClassWithDivisionInput[]  // loaded from DB by enrollmentService
): WeightClassWithDivisionInput

The caller (enrollmentService) loads all WeightClass rows with their AgeDivision
and maps them to the domain input type before calling matchCategory.
matchCategory itself has NO DB access.

Rules:

1. Calculate age using exact birthday (UTC):
   - years = competitionDate.getUTCFullYear() - birthDate.getUTCFullYear()
   - subtract 1 if birthday has not yet occurred in competitionDate's year
2. Filter weight classes by:
    - Competitor belt === weightClass belt parameter (passed separately; WeightClass has no belt)
    - Age falls within ageDivision.minAge and ageDivision.maxAge
    - Gender: weightClass.gender === competitor.gender OR weightClass.gender === MISTO
    - Weight: competitor.weight within [minWeight, maxWeight] (9999 = open-ended)
3. Exclude weight classes named "Absoluto" from automatic matching
4. Must return EXACTLY ONE match
5. Throw DomainError if:
    - No match
    - Multiple matches

Note: Belt is NOT a property of WeightClass — it comes from CompetitorProfile.
The enrollmentService stores belt + ageDivisionId + weightClassId on Registration.

Must be:

- Pure
- Deterministic
- Unit-testable
- No DB calls
- No framework imports

---

# 9. CBJJO TEMPLATE STRATEGY

File: `prisma/seed.ts`

The seed is the single source of truth for CBJJO 2026 data.
CBJJO data is embedded directly in `seed.ts` as TypeScript constants (no external JSON file).

The seed must:

1. Upsert all 11 AgeDivisions (code, minAge, maxAge)
2. Upsert all WeightClasses per division per gender (name, minWeight, maxWeight, gender, ageDivisionId)
3. Be idempotent

The seed does NOT generate `Category` rows — there is no such table.
There is NO admin UI for category generation.
There is NO `data/cbjjo-2026-template.json` file.

After running the seed, the DB contains the global lookup tables.
The domain matcher reads these at enrollment time via `enrollmentService`.

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

Admin does NOT manage categories. There is no category generation step.

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
- A `Category` database table (categories are derived at enrollment time, not pre-generated)
- A category generator service (`services/categoryGenerator.ts` must not exist)
- An external JSON file for CBJJO data (`data/cbjjo-2026-template.json` must not exist)

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