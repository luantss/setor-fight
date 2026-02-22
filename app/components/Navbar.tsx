import Link from "next/link";
import { getSession, getUserRole } from "@/lib/auth";
import { logoutAction } from "@/app/(auth)/actions";

export default async function Navbar() {
  const session = await getSession();
  const role = session ? await getUserRole(session.user.id) : null;

  return (
    <nav className="bg-black text-white">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/dashboard" className="text-lg font-bold tracking-wide hover:text-red-400 transition-colors">
          JJ Platform
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-6 text-sm">
          {/* Competições is always visible */}
          <Link
            href="/dashboard"
            className="hover:text-red-400 transition-colors"
          >
            Competições
          </Link>

          {session ? (
            <>
              <Link
                href="/competidor/perfil"
                className="hover:text-red-400 transition-colors"
              >
                Perfil
              </Link>
              {role === "ADMIN" && (
                <Link
                  href="/admin"
                  className="hover:text-red-400 transition-colors"
                >
                  Admin
                </Link>
              )}
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="hover:text-red-400 transition-colors cursor-pointer"
                >
                  Sair
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="hover:text-red-400 transition-colors">
                Entrar
              </Link>
              <Link
                href="/cadastro"
                className="bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded text-white transition-colors"
              >
                Criar Conta
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
