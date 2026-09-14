"use client";

import { useActionState } from "react";
import Image from "next/image";
import Link from "next/link";
import { registrarEstudiante } from "@/lib/auth/actions";

const campo =
  "rounded-md border border-line bg-bg px-3 py-2 text-sm outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue-light/40";

export default function RegistroPage() {
  const [error, formAction, pending] = useActionState(registrarEstudiante, null);

  return (
    <main className="flex min-h-screen items-center justify-center bg-bg px-4 py-10">
      <div className="w-full max-w-sm rounded-lg border border-line bg-surface p-8 shadow-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <Image src="/brand/logo-laplace.png" alt="Academia Laplace" width={88} height={88} priority />
          <div>
            <h1 className="text-lg font-semibold text-ink">Crea tu cuenta de estudiante</h1>
            <p className="text-sm text-ink-soft">Usa el DNI con el que te matriculaste.</p>
          </div>
        </div>

        <form action={formAction} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-ink">DNI</span>
            <input name="dni" required maxLength={8} className={campo} />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-ink">Correo</span>
            <input type="email" name="email" required autoComplete="username" className={campo} />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-ink">Contraseña</span>
            <input
              type="password"
              name="password"
              required
              minLength={6}
              autoComplete="new-password"
              className={campo}
            />
          </label>

          {error && (
            <p className="rounded-md bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="mt-2 rounded-md bg-brand-navy px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-blue disabled:opacity-60"
          >
            {pending ? "Creando…" : "Crear cuenta"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-ink-soft">
          <Link href="/login" className="text-brand-blue hover:underline">
            Ya tengo cuenta, iniciar sesión
          </Link>
        </p>
      </div>
    </main>
  );
}
