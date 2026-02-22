"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction } from "../actions";

export default function LoginPage() {
  const [state, action, isPending] = useActionState(loginAction, null);

  return (
    <main className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow border border-gray-200 p-8">
        <h1 className="text-2xl font-bold text-black mb-1">Entrar</h1>
        <p className="text-sm text-gray-500 mb-6">
          Acesse sua conta para se inscrever em competições.
        </p>

        <form action={action} className="space-y-4">
          <Field label="E-mail" id="email" type="email" autoComplete="email" placeholder="seu@email.com" />
          <Field label="Senha" id="password" type="password" autoComplete="current-password" placeholder="••••••••" />

          {state && !state.success && (
            <p role="alert" className="text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">
              {state.error}
            </p>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2 px-4 rounded-md font-medium transition-colors"
          >
            {isPending ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <p className="mt-6 text-sm text-center text-gray-500">
          Não tem conta?{" "}
          <Link href="/cadastro" className="text-red-600 hover:underline font-medium">
            Criar conta
          </Link>
        </p>
      </div>
    </main>
  );
}

function Field({
  label,
  id,
  type,
  autoComplete,
  placeholder,
}: {
  label: string;
  id: string;
  type: string;
  autoComplete?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        autoComplete={autoComplete}
        placeholder={placeholder}
        required
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500"
      />
    </div>
  );
}
