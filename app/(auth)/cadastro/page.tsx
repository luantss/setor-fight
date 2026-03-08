"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { cadastroAction } from "../actions";
import DateInput from "@/app/components/DateInput";

export default function CadastroPage() {
  const [state, action, isPending] = useActionState(cadastroAction, null);
  const [password, setPassword] = useState("");

  return (
    <main className="min-h-screen bg-white flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg bg-white rounded-xl shadow border border-gray-200 p-8">
        <h1 className="text-2xl font-bold text-black mb-1">Criar Conta</h1>
        <p className="text-sm text-gray-500 mb-6">
          Preencha todos os dados para se inscrever em Campeonatos.
        </p>

        <form action={action} className="space-y-5">
          {/* ── Acesso ── */}
          <section>
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
              Acesso
            </h2>
            <div className="space-y-4">
              <Field label="E-mail" id="email" type="email" autoComplete="email" placeholder="seu@email.com" />
              <Field
                label="Senha"
                id="password"
                type="password"
                autoComplete="new-password"
                placeholder="Mínimo 6 caracteres"
                onChange={(e) => {
                  setPassword(e.target.value);
                  const cf = document.getElementById("confirmPassword") as HTMLInputElement | null;
                  if (cf?.value) {
                    cf.setCustomValidity(
                      cf.value !== e.target.value ? "As senhas não conferem." : ""
                    );
                  }
                }}
              />
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Confirmar senha
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Repita a senha"
                  required
                  onChange={(e) => {
                    e.target.setCustomValidity(
                      e.target.value !== password ? "As senhas não conferem." : ""
                    );
                  }}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>
          </section>

          {/* ── Perfil ── */}
          <section>
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
              Perfil do atleta
            </h2>
            <div className="space-y-4">
              <Field label="Nome completo" id="name" type="text" autoComplete="name" placeholder="Seu nome completo" />

              <div>
                <label htmlFor="birthDate" className="block text-sm font-medium text-gray-700 mb-1">
                  Data de nascimento
                </label>
                <DateInput
                  id="birthDate"
                  name="birthDate"
                  required
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-1">
                  Sexo
                </label>
                <select
                  id="gender"
                  name="gender"
                  required
                  defaultValue=""
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                >
                  <option value="" disabled>Selecione...</option>
                  <option value="MASCULINO">Masculino</option>
                  <option value="FEMININO">Feminino</option>
                </select>
              </div>

              <div>
                <label htmlFor="belt" className="block text-sm font-medium text-gray-700 mb-1">
                  Faixa
                </label>
                <select
                  id="belt"
                  name="belt"
                  required
                  defaultValue=""
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                >
                  <option value="" disabled>Selecione...</option>
                  <option value="BRANCA">Branca</option>
                  <option value="AZUL">Azul</option>
                  <option value="ROXA">Roxa</option>
                  <option value="MARROM">Marrom</option>
                  <option value="PRETA">Preta</option>
                </select>
              </div>

              <div>
                <label htmlFor="weight" className="block text-sm font-medium text-gray-700 mb-1">
                  Peso atual (kg)
                </label>
                <input
                  id="weight"
                  name="weight"
                  type="number"
                  step="0.1"
                  min="10"
                  max="300"
                  required
                  placeholder="Ex: 72.5"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>
          </section>

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
            {isPending ? "Criando conta..." : "Criar conta"}
          </button>
        </form>

        <p className="mt-6 text-sm text-center text-gray-500">
          Já tem conta?{" "}
          <Link href="/login" className="text-red-600 hover:underline font-medium">
            Entrar
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
  onChange,
}: {
  label: string;
  id: string;
  type: string;
  autoComplete?: string;
  placeholder?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
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
        onChange={onChange}
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500"
      />
    </div>
  );
}
