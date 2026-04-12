export const APP_ROUTES = [
  "/admin",
  "/teacher",
  "/student",
  "/students",
  "/students/[id]",
  "/teachers",
  "/classes",
  "/sections",
  "/subjects",
  "/offerings",
  "/attendance",
  "/assessments",
  "/grades",
  "/report-cards",
  "/reports",
  "/settings",
] as const;

export type AppRoute = (typeof APP_ROUTES)[number];

export const PUBLIC_ROUTES = ["/login", "/forgot-password"] as const;
