/**
 * Server-side auth utilities.
 *
 * All role checks must happen server-side.
 * Never trust role data sent from the client.
 */

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getPrismaClient } from "@/lib/prisma";
import type { Role } from "@/app/generated/prisma/client";

// ---------------------------------------------------------------------------
// Session
// ---------------------------------------------------------------------------

/**
 * Returns the current Supabase session or null.
 * Use in Server Components and Server Actions.
 */
export async function getSession() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return session;
}

/**
 * Returns the authenticated user from Supabase Auth.
 * Throws if not authenticated.
 */
export async function requireAuth() {
  const session = await getSession();

  if (!session) {
    throw new AuthError("Não autenticado. Faça login para continuar.");
  }

  return session.user;
}

// ---------------------------------------------------------------------------
// Role
// ---------------------------------------------------------------------------

/**
 * Fetches the user's role from the database (source of truth).
 * Never reads role from JWT claims or client-sent data.
 */
export async function getUserRole(userId: string): Promise<Role | null> {
  const prisma = getPrismaClient();

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  return user?.role ?? null;
}

/**
 * Requires the current user to have ADMIN role.
 * Throws AuthError otherwise.
 */
export async function requireAdmin(): Promise<void> {
  const user = await requireAuth();
  const role = await getUserRole(user.id);

  if (role !== "ADMIN") {
    throw new AuthError("Acesso negado. Apenas administradores podem acessar esta área.");
  }
}

/**
 * Requires the current user to have COMPETITOR role.
 * Throws AuthError otherwise.
 */
export async function requireCompetitor(): Promise<void> {
  const user = await requireAuth();
  const role = await getUserRole(user.id);

  if (role !== "COMPETITOR") {
    throw new AuthError("Acesso negado. Área restrita a competidores.");
  }
}

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}
