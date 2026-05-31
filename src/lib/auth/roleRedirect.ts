import type { Role } from '@/types';

/** Returns the correct home path for each role */
export function roleHomePath(role: Role): string {
  switch (role) {
    case 'ADMIN':         return '/admin/dashboard';
    case 'DELIVERY_TEAM': return '/delivery/deliveries';
    case 'MUMINEEN':
    default:              return '/mumineen/dashboard';
  }
}
