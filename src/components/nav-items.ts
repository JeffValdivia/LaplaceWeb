export type NavItem = {
  item: string;
  nombre: string;
  href: string;
  fase: 1 | 2 | 3;
  listo: boolean;
};

export const navItems: NavItem[] = [
  { item: "01", nombre: "Dashboard administrativo", href: "/dashboard", fase: 1, listo: true },
  { item: "02", nombre: "Estudiantes y matrículas", href: "/estudiantes", fase: 1, listo: true },
  { item: "03", nombre: "Grupos académicos", href: "/grupos", fase: 1, listo: true },
  { item: "04", nombre: "Sedes y asignaturas", href: "/sedes", fase: 1, listo: true },
  { item: "05", nombre: "Vigencia de matrícula", href: "/vigencia", fase: 1, listo: true },
  { item: "12", nombre: "Seguridad y roles", href: "/roles", fase: 1, listo: true },
  { item: "06", nombre: "Campus virtual y recursos", href: "/campus", fase: 2, listo: true },
  { item: "07", nombre: "Evaluaciones virtuales", href: "/evaluaciones", fase: 2, listo: true },
  { item: "08", nombre: "Asistencia", href: "/asistencia", fase: 2, listo: true },
  { item: "09", nombre: "Notificaciones oficiales", href: "/notificaciones", fase: 2, listo: true },
  { item: "10", nombre: "Portal del estudiante", href: "/portal", fase: 3, listo: true },
  { item: "11", nombre: "Módulo central de reportes", href: "/reportes", fase: 3, listo: true },
];
