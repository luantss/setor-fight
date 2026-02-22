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
- Redirect to `/dashboard`

---

# 5. COMPETITOR AREA

> **Authentication rules:**
> - `/dashboard` — **PUBLIC**. Any visitor can browse open competitions.
> - `/competicoes/[id]` — **PUBLIC** to view. Enrollment requires authentication.
> - `/competidor/perfil` — **Requires authentication**.

---

## 5.1 Dashboard — `/dashboard`

### 🔴 IMPORTANT

The dashboard is **public**. No login required to browse competitions.

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

Note: The Navbar must show the "Competições" link even for unauthenticated users.

---

## 5.2 Profile Page — `/perfil`

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

## 5.3 Competition Details — `/competicoes/[id]`

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

- "Editar Perfil" → redirect to `/perfil`
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

# 6. ADMIN AREA

All routes require ADMIN role (validated server-side).

---

## 6.1 Admin Dashboard — `/admin`

Components:

- Page title: "Painel Administrativo"
- List of competitions
- Button: "Criar Competição"

---

## 6.2 Create Competition

Form fields:

- Nome
- Data
- Status (OPEN | CLOSED)

Submit via Server Action.

---

## 6.3 Competition Admin Page — `/admin/competicoes/[id]`

Must contain Tabs:

- Informações
- Categorias
- Inscrições

---

# 7. ADMIN — CATEGORIAS TAB

Components:

- Button: "Gerar Categorias CBJJO 2026"
- Display:
  - Total de categorias geradas
  - Breakdown por divisão

Must handle:

- Loading state
- Success message
- Error message

Generator must be idempotent.

---

# 8. ADMIN — INSCRIÇÕES TAB

Display:

Accordion grouped by Category.

Each category must show:

- Nome da categoria
- Total de inscritos

Inside:

Table with:

- Nome
- Faixa
- Idade
- Peso
- Sexo

Avoid N+1 queries.
Data must be preloaded server-side.

Empty state:
- "Nenhum atleta inscrito."

---

# 9. EXPORT BUTTONS

Inside Admin → Inscrições tab:

Buttons:

- "Exportar Excel"
- "Exportar PDF"

Must:

- Trigger server-side generation
- Download file
- Show loading state

---

# 10. REQUIRED COMPONENTS

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

# 11. STATES THAT MUST EXIST

Every page must handle:

- Loading state
- Error state
- Empty state
- Success feedback

Never render blank UI.

---

# 12. RESPONSIVENESS RULES

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

# 13. FORBIDDEN PRACTICES

Do NOT:

- Call Prisma inside UI
- Implement domain rules in components
- Store calculated age
- Trust client role
- Hardcode categories
- Add unnecessary animations
- Use inline styles

---

# 14. PERFORMANCE REQUIREMENTS

Frontend must:

- Avoid unnecessary re-renders
- Use Server Components when possible
- Use Server Actions for mutations
- Avoid redundant fetches
- Preload relational data

Must handle 1000 registrations without UI degradation.

---

# 15. FINAL RESULT EXPECTATION

The frontend must deliver:

- Clean red/black/white UI
- Simplified athlete onboarding
- Profile collected during registration
- Explicit confirmation before enrollment
- Clear admin flows
- Fully responsive layout
- Production-ready MVP experience