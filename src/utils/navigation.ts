// Navigation configuration for consistent routing
export const MAIN_ROUTES = {
  HOME: '/',
  EVENTS: '/eventos',
  FIGHTERS: '/fighters',
  PREDICTIONS: '/predicciones',
  SOCIAL: '/social',
  PROFILE: '/perfil',
  AUTH: '/auth',
  ADMIN: '/admin'
} as const;

export const ADMIN_ROUTES = {
  DASHBOARD: '/admin/dashboard',
  FIGHTERS: '/admin/peleadores',
  EVENTS: '/admin/eventos-pelea',
  BETTING: '/admin/apuestas',
  RANKING: '/admin/ranking',
  ANALYTICS: '/admin/analytics',
  CONFIG: '/admin/configuracion'
} as const;

export const LICENSE_ROUTES = {
  ONBOARDING: '/license/onboarding',
  DASHBOARD: '/license/dashboard',
  VERIFY: '/verify-license'
} as const;

// Breadcrumb configurations for pages
export const BREADCRUMB_CONFIG = {
  '/eventos': [{ label: 'Eventos', isActive: true }],
  '/fighters': [{ label: 'Peleadores', isActive: true }],
  '/predicciones': [{ label: 'Predicciones', isActive: true }],
  '/social': [{ label: 'Red Social', isActive: true }],
  '/perfil': [{ label: 'Mi Perfil', isActive: true }],
  '/admin/dashboard': [
    { label: 'Admin', href: '/admin' },
    { label: 'Dashboard', isActive: true }
  ],
  '/admin/peleadores': [
    { label: 'Admin', href: '/admin' },
    { label: 'Peleadores', isActive: true }
  ]
};

export type MainRoute = typeof MAIN_ROUTES[keyof typeof MAIN_ROUTES];
export type AdminRoute = typeof ADMIN_ROUTES[keyof typeof ADMIN_ROUTES];
export type LicenseRoute = typeof LICENSE_ROUTES[keyof typeof LICENSE_ROUTES];