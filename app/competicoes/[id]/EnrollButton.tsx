"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { enrollAction, type EnrollActionResult } from "./actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full sm:w-auto bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium py-2.5 px-6 rounded-md transition-colors"
    >
      {pending ? "Inscrevendo..." : "Confirmar Inscrição"}
    </button>
  );
}

export default function EnrollButton({
  competitionId,
}: {
  competitionId: string;
}) {
  const [state, action] = useActionState<EnrollActionResult | null, FormData>(
    enrollAction,
    null,
  );

  return (
    <div className="space-y-3">
      {state && !state.success && (
        <p
          role="alert"
          className="text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2"
        >
          {state.error}
        </p>
      )}
      <form action={action}>
        <input type="hidden" name="competitionId" value={competitionId} />
        <SubmitButton />
      </form>
    </div>
  );
}
