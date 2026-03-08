import Link from "next/link";
import { getUser, getUserRole } from "@/lib/auth";
import { logoutAction } from "@/app/(auth)/actions";

export default async function Navbar() {
  const user = await getUser();
  const role = user ? await getUserRole(user.id) : null;

  return (
    <nav className="bg-black text-white">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="text-lg font-bold tracking-wide hover:text-red-400 transition-colors">
          JJ
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-6 text-sm">
          {/* Campeonatos is always visible */}
          <Link
            href="/competicoes"
            className="hover:text-red-400 transition-colors"
          >
            Campeonatos
          </Link>

          {user ? (
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
