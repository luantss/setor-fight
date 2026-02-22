"use client";

import { useState } from "react";

export default function CategoryTableImage() {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className="w-full min-h-80 flex flex-col items-center justify-center text-gray-400 gap-2">
        <span className="text-4xl">📊</span>
        <p className="text-sm">Tabela de categorias em breve.</p>
        <p className="text-xs text-gray-300">
          Adicione <code className="text-gray-400">/public/tabela-categorias.jpg</code>
        </p>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/tabela-categorias.jpg"
      alt="Tabela de Categorias CBJJO 2026"
      className="w-full h-auto object-contain"
      onError={() => setFailed(true)}
    />
  );
}
