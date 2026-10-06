export type NavItem = {
  nombre: string;
  href: string;
  fase: 1 | 2 | 3;
  listo: boolean;
  icono: string;
};

export const navItems: NavItem[] = [
  { nombre: "Dashboard administrativo", href: "/dashboard", fase: 1, listo: true, icono: "dashboard" },
  { nombre: "Estudiantes y matrículas", href: "/estudiantes", fase: 1, listo: true, icono: "estudiantes" },
  { nombre: "Grupos académicos", href: "/grupos", fase: 1, listo: true, icono: "grupos" },
  { nombre: "Asignaturas", href: "/sedes", fase: 1, listo: true, icono: "asignaturas" },
  { nombre: "Vigencia de matrícula", href: "/vigencia", fase: 1, listo: true, icono: "vigencia" },
  { nombre: "Seguridad y roles", href: "/roles", fase: 1, listo: true, icono: "seguridad" },
  { nombre: "Evaluaciones virtuales", href: "/evaluaciones", fase: 2, listo: true, icono: "evaluaciones" },
  { nombre: "Evaluación a docente", href: "/evaluacion-docente", fase: 2, listo: true, icono: "evaluaciones" },
  { nombre: "Asistencia", href: "/asistencia", fase: 2, listo: true, icono: "asistencia" },
  { nombre: "Notificaciones oficiales", href: "/notificaciones", fase: 2, listo: true, icono: "notificaciones" },
  { nombre: "Eventos del calendario", href: "/eventos", fase: 2, listo: true, icono: "eventos" },
  { nombre: "Módulo central de reportes", href: "/reportes", fase: 3, listo: true, icono: "reportes" },
  { nombre: "Reporte de alumnos", href: "/reporte-alumnos", fase: 3, listo: true, icono: "listaAlumnos" },
];
