const paths: Record<string, string> = {
  dashboard:
    "M3 13h8V3H3v10Zm10 8h8V11h-8v10ZM3 21h8v-6H3v6Zm10-18v6h8V3h-8Z",
  estudiantes:
    "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm0 2c-4.4 0-8 2.2-8 5v1h16v-1c0-2.8-3.6-5-8-5Z",
  grupos:
    "M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm8 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM2 19c0-2.8 2.7-5 6-5s6 2.2 6 5v1H2v-1Zm12.2-4.8c2.1.6 3.8 2.3 3.8 4.8v1h4v-1c0-2.4-2-4.3-4.4-4.8-1 .3-2.2-.1-3.4 0Z",
  asignaturas:
    "M4 4.5C4 3.7 4.7 3 5.5 3H18a1 1 0 0 1 1 1v15a1 1 0 0 1-1 1H6a2 2 0 0 1-2-2v-13Zm2 .5v12.3c.3-.1.6-.2 1-.2h11V5H6Z",
  vigencia:
    "M7 2v2M17 2v2M3.5 9h17M5 4h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Zm2.5 9.5 2 2 4.5-4.5",
  seguridad:
    "M12 2 4 5v6c0 5 3.4 8.7 8 11 4.6-2.3 8-6 8-11V5l-8-3Zm-1.5 11 4.5-5 1.4 1.3-5.9 6.6-3.4-3.3 1.4-1.3 2 1.7Z",
  evaluaciones:
    "M9 2h6a1 1 0 0 1 1 1v1h1a1 1 0 0 1 1 1v15a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h1V3a1 1 0 0 1 1-1Zm0 6h6M9 11h6M9 14h4",
  asistencia:
    "M5 4h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Zm2-2v3m10-3v3M4 9.5h16M8.5 13l1.8 1.8L15 10.3",
  notificaciones:
    "M12 2a6 6 0 0 0-6 6v3.4c0 .7-.3 1.4-.8 1.9L4 15h16l-1.2-1.7c-.5-.5-.8-1.2-.8-1.9V8a6 6 0 0 0-6-6Zm-2.2 18a2.3 2.3 0 0 0 4.4 0Z",
  eventos:
    "M7 2v2M17 2v2M4 9.5h16M5 4h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Zm3 7h2v2H8v-2Zm4 0h2v2h-2v-2Zm4 0h0v0Z",
  reportes:
    "M4 20V9m6 11V4m6 16v-8",
  listaAlumnos:
    "M6 2h9l3 3v17a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1Zm8 0v3a1 1 0 0 0 1 1h3M8 12h8M8 15.5h8M8 8.5h4",
  default: "M12 3 2 9l10 6 10-6-10-6Zm0 9L2 15l10 6 10-6-10-3Z",
};

export function NavIcon({ name, className = "h-4 w-4" }: { name: string; className?: string }) {
  const d = paths[name] ?? paths.default;
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d={d} />
    </svg>
  );
}
