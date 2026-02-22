# 🎨 Frontend Development Instructions — Jiu-Jitsu Competition Platform

---

# 1. OBJECTIVE

Implement the complete frontend layer of the MVP using:

- Next.js 14 (App Router)
- TypeScript (strict)
- TailwindCSS
- ShadCN UI
- React Hook Form
- Zod
- Supabase Auth

All UI text must be in PORTUGUES BR.

The interface must be:

- Simple
- Clean
- Professional
- Responsive
- Minimalistic
- Red / Black / White color identity

No visual excess.
No unnecessary animations.
No heavy UI abstractions.

---

# 2. DESIGN SYSTEM

## 🎨 Colors

Primary colors:

- Red → Primary actions
- Black → Structural elements
- White → Background

Rules:

- Primary buttons → red
- Hover → darker red
- Navbar → black background, white text
- Body background → white
- Text → black
- Errors → darker red
- Borders → neutral gray

Do NOT use gradients.
Do NOT use colorful accents.
Do NOT use visual effects.

---

# 3. GLOBAL LAYOUT

## Root Layout

Must include:

- Top navigation bar
- App name/logo on the left
- Authentication actions on the right
- Container max width: `max-w-6xl`
- Horizontal padding: `px-4`
- Vertical padding: `py-6`

---

## Navbar Component

Elements:

- Logo / App Name
- Conditional links:
  - Dashboard
  - Perfil
  - Admin (if role ADMIN)
- Logout button (if authenticated)

Mobile:
- Stack vertically or collapsible menu

---

# 4. AUTH SCREENS

## 4.1 Login Page — `/login`

Components:

- Card container (centered)
- Title: "Entrar"
- Form fields:
  - Email
  - Senha
- Submit button (red)
- Link: "Criar conta"

Validation:
- Zod
- Show inline errors

States:
- Loading state on submit
- Error message if auth fails

---

## 4.2 Register Page — `/register`

### 🔴 IMPORTANT CHANGE

The registration form MUST already collect full competitor profile information.

There will be NO separate “complete profile” step after registration.

---

### Required Fields:

Authentication fields:
- Nome
- Email
- Senha

Profile fields:
- Data de Nascimento
- Sexo (MASCULINO | FEMININO)
- Faixa
- Peso Atual (kg)

Rules:

- All fields required
- Zod validation
- Create Supabase user
- Create CompetitorProfile in same flow
- Use transactional server action
- Default role = COMPETITOR

After successful registration:
- Redirect to `/competicoes`

---


# 5. ROUTES MAP

| Route | Access | Description |
|---|---|---|
| `/` | Public | Landing page |
| `/competicoes` | Public | Open competitions list |
| `/competicoes/[id]` | Public (enrollment requires auth) | Competition detail |
| `/competidor/perfil` | Auth required | Competitor profile |
| `/admin` | ADMIN only | Admin panel |
| `/admin/competicoes/[id]` | ADMIN only | Admin competition detail |

> ⚠️ The old `/dashboard` route must redirect to `/competicoes`.

---

# 6. LANDING PAGE — `/`

## Purpose

Informative page for visitors who are not yet logged in.

## Layout

Full-page layout with sections:

### Section 1 — Hero

- Title: "Competição de Jiu-Jitsu CBJJO 2026"
- Subtitle: short description of the event
- CTA Button (red): "Ver Competições" → `/competicoes`

### Section 2 — Tabela de Categorias

- Section title: "Tabela de Categorias CBJJO 2026"
- Full-width image placeholder: `<img src="/tabela-categorias.png" alt="Tabela de Categorias CBJJO 2026" />`
- Caption below: "Tabela oficial de categorias por idade, peso e faixa."

### Section 3 — Como Funciona

Three simple cards:

1. "Crie sua conta" — "Registre-se com seus dados de atleta."
2. "Inscreva-se" — "Sua categoria será atribuída automaticamente."

### Section 4 — CTA Final

- Text: "Pronto para competir?"
- Button (red): "Ver Competições Abertas" → `/competicoes`

## Rules

- NO heavy animations
- NO gradients
- Clean and professional
- Fully responsive

---

# 7. COMPETITOR AREA

> **Authentication rules:**
> - `/competicoes` — **PUBLIC**. Any visitor can browse open competitions.
> - `/competicoes/[id]` — **PUBLIC** to view. Enrollment requires authentication.
> - `/competidor/perfil` — **Requires authentication**.

---

## 7.1 Competitions List — `/competicoes`

> Replaces the old `/dashboard` route.

### 🔴 IMPORTANT

This page is **public**. No login required to browse competitions.

Components:

- Page title: "Competições Abertas"
- List of competitions in Card format

Each competition card must show:

- Nome
- Data
- Status
- Button: "Ver Detalhes"

Empty state:
- "Nenhuma competição aberta no momento."

Note: The Navbar must show the "Competições" link even for unauthenticated users, pointing to `/competicoes`.

---

## 7.2 Profile Page — `/competidor/perfil`

The profile page is for EDITING information only.

Pre-fill all existing data.

Form fields:

- Nome
- Data de Nascimento
- Sexo
- Faixa
- Peso Atual

Requirements:

- React Hook Form
- Zod validation
- Submit button
- Success feedback after update

This page allows updating weight before a competition.

---

## 7.3 Competition Details — `/competicoes/[id]`

Display:

- Nome da competição
- Data
- Status

If user is **NOT authenticated**:

- Show CTA: "Faça login para se inscrever"
- Button: "Entrar / Criar Conta" → redirect to `/login?redirectTo=/competicoes/[id]`
- Do NOT show enrollment form

If competition is OPEN and user **IS authenticated**:

### Step 1 — Confirm Profile Modal

Before enrollment, show a confirmation section or modal:

Title:
"Confirme seus dados antes de se inscrever"

Display:

- Nome
- Data de Nascimento
- Sexo
- Faixa
- Peso Atual

Buttons:

- "Editar Perfil" → redirect to `/competidor/perfil`
- "Confirmar e Inscrever"

Enrollment only proceeds after explicit confirmation.

---

### Step 2 — Enrollment Result

After successful enrollment:

Display assigned category:

- Faixa
- Divisão
- Peso
- Sexo

Prevent:

- Duplicate registration
- Enrollment in CLOSED competition

---

# 8. ADMIN AREA

All routes require ADMIN role (validated server-side).

---

## 8.1 Admin Dashboard — `/admin`

Components:

- Page title: "Painel Administrativo"
- List of competitions
- Button: "Criar Competição"

---

## 8.2 Create Competition

Form fields:

- Nome
- Data
- Status (OPEN | CLOSED)

Submit via Server Action.

---

## 8.3 Competition Admin Page — `/admin/competicoes/[id]`

Must contain Tabs:

- Informações
- Inscrições

> ⚠️ The "Categorias" tab is REMOVED. Category generation is handled automatically by the seed. No admin UI for this.

---

# 9. ADMIN — INSCRIÇÕES TAB

Display:

Accordion grouped by Category.

Each category must show:

- Nome da categoria
- Total de inscritos

Inside:

Table with:

- Nome
- Faixa
- Divisão de Idade
- Categoria de Peso
- Peso (kg)
- Sexo
- Idade

Avoid N+1 queries.
Data must be preloaded server-side.

Empty state:
- "Nenhum atleta inscrito."

---

# 10. EXPORT BUTTONS

Inside Admin → Inscrições tab:

Buttons:

- "Exportar Excel"
- "Exportar PDF"

Must:

- Trigger server-side generation
- Download file
- Show loading state

## Export columns (Excel and PDF)

| # | Nome | Faixa | Divisão de Idade | Categoria de Peso | Peso (kg) | Sexo | Idade |
|---|---|---|---|---|---|---|---|

All text must be in PORTUGUES BR.

---

# 11. REQUIRED COMPONENTS

Reusable components:

- Button (primary, destructive)
- Card
- Input
- Select
- Tabs
- Accordion
- Table
- Alert
- Badge
- Modal (for profile confirmation)

All based on ShadCN UI.

---

# 12. STATES THAT MUST EXIST

Every page must handle:

- Loading state
- Error state
- Empty state
- Success feedback

Never render blank UI.

---

# 13. RESPONSIVENESS RULES

Mobile-first design.

Breakpoints:

- Default → mobile
- md → tablet
- lg → desktop

Rules:

- Tables scroll horizontally on mobile
- Sidebar collapses on mobile
- Buttons full width on small screens
- Cards stack vertically

---

# 14. FORBIDDEN PRACTICES

Do NOT:

- Call Prisma inside UI
- Implement domain rules in components
- Store calculated age
- Trust client role
- Hardcode categories
- Add unnecessary animations
- Use inline styles
- Do NOT add admin UI for category generation
- Do NOT use `/dashboard` as the competitions route (use `/competicoes`)

---

# 15. PERFORMANCE REQUIREMENTS

Frontend must:

- Avoid unnecessary re-renders
- Use Server Components when possible
- Use Server Actions for mutations
- Avoid redundant fetches
- Preload relational data

Must handle 1000 registrations without UI degradation.

---

# 16. FINAL RESULT EXPECTATION

The frontend must deliver:

- Clean red/black/white UI
- Simplified athlete onboarding
- Profile collected during registration
- Explicit confirmation before enrollment
- Clear admin flows
- Fully responsive layout
- Production-ready MVP experience