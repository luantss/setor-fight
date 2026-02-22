"use client";

import { useState, useActionState } from "react";
import { createCompetitionAction, type ActionResult } from "./actions";

export default function CreateCompetitionForm() {
  const [open, setOpen] = useState(false);
  const [state, action, isPending] = useActionState(createCompetitionAction, null);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="bg-red-600 hover:bg-red-700 text-white text-sm font-medium py-2 px-5 rounded-md transition-colors"
      >
        + Criar Competição
      </button>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow border border-gray-200 p-6 mt-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold text-black">Nova Competição</h2>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-gray-400 hover:text-black text-lg leading-none"
          aria-label="Fechar"
        >
          ✕
        </button>
      </div>

      <form action={action} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Nome
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            placeholder="Ex: Campeonato Regional 2026"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
              Data
            </label>
            <input
              id="date"
              name="date"
              type="date"
              required
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              id="status"
              name="status"
              defaultValue="OPEN"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
            >
              <option value="OPEN">Inscrições Abertas</option>
              <option value="CLOSED">Inscrições Encerradas</option>
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
            Local <span className="text-gray-400 font-normal">(opcional)</span>
          </label>
          <input
            id="location"
            name="location"
            type="text"
            placeholder="Ex: Ginásio Municipal, São Paulo — SP"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>

        {state && !state.success && (
          <p role="alert" className="text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">
            {state.error}
          </p>
        )}

        <div className="flex gap-3 pt-1">
          <button
            type="submit"
            disabled={isPending}
            className="bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium py-2 px-5 rounded-md transition-colors"
          >
            {isPending ? "Criando..." : "Criar"}
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="text-sm font-medium text-gray-500 hover:text-black transition-colors"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
