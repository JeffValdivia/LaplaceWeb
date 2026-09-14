"use client";

import { useActionState } from "react";
import Image from "next/image";
import Link from "next/link";
import { iniciarSesion } from "@/lib/auth/actions";

export default function LoginPage() {
  const [error, formAction, pending] = useActionState(iniciarSesion, null);

  return (
    <main className="flex min-h-screen items-center justify-center bg-bg px-4">
      <div className="w-full max-w-sm rounded-lg border border-line bg-surface p-8 shadow-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <Image
            src="/brand/logo-laplace.png"
            alt="Academia Laplace"
            width={96}
            height={96}
            priority
          />
          <div>
            <h1 className="text-lg font-semibold text-ink">
              Sistema de gestión académica
            </h1>
            <p className="text-sm text-ink-soft">Academia Laplace</p>
          </div>
        </div>

        <form action={formAction} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-ink">Correo</span>
            <input
              type="email"
              name="email"
              required
              autoComplete="username"
              className="rounded-md border border-line bg-bg px-3 py-2 text-ink outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue-light/40"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-ink">Contraseña</span>
            <input
              type="password"
              name="password"
              required
              autoComplete="current-password"
              className="rounded-md border border-line bg-bg px-3 py-2 text-ink outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue-light/40"
            />
          </label>

          {error && (
            <p className="rounded-md bg-danger-soft px-3 py-2 text-sm text-danger">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="mt-2 rounded-md bg-brand-navy px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-blue disabled:opacity-60"
          >
            {pending ? "Ingresando…" : "Ingresar"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-ink-soft">
          ¿Eres estudiante y no tienes cuenta?{" "}
          <Link href="/registro" className="text-brand-blue hover:underline">
            Regístrate con tu DNI
          </Link>
        </p>
      </div>
    </main>
  );
}
