/**
 * Hook to determine the role of the current user
 * 
 * Roles:
 * - admin: Administrator with full access (create orders, view metrics, etc.)
 * - operativo: Logistics limited (only views table, filters, details)
 * - desarrollador: Advanced technical access (cache, system settings)
 * 
 * Detection is based on the user's email querying the AsignacionesDeRolDeUsuario table.
 * Roles are resolved from the linked RolesDelSistema table.
 */
import { useMemo } from 'react';
import { useUser } from '@/hooks/use-user';
import { useAsignacionesDeRolDeUsuarioList } from '@/generated/hooks/use-asignaciones-de-rol-de-usuario';

export type UserRole = 'admin' | 'operativo' | 'desarrollador' | 'sin-acceso';

// Map role names to UserRole
const ROL_NAME_TO_USER_ROLE: Record<string, UserRole> = {
  'administrador': 'admin',
  'admin': 'admin',
  'operativo': 'operativo',
  'desarrollador': 'desarrollador',
  'developer': 'desarrollador',
};

/**
 * Normalizes an email for comparison:
 * - Converts to lowercase
 * - Trims starting/ending whitespace
 * - Handles undefined/null safely
 */
function normalizeEmail(email: string | undefined | null): string {
  if (!email) return '';
  return email.toLowerCase().trim();
}

interface UseUserRoleResult {
  /** Role of the current user */
  role: UserRole;
  /** If the user is an administrator */
  isAdmin: boolean;
  /** If the user is operative (limited logistics) */
  isOperativo: boolean;
  /** If the user is a developer (technical access) */
  isDeveloper: boolean;
  /** If the user does not have configured access */
  sinAcceso: boolean;
  /** If the user is the SuperUser (Karla Medina) */
  isSuperUser: boolean;
  /** If the user information is loading */
  isLoading: boolean;
  /** User's email */
  userEmail: string | undefined;
  /** User's name from AsignacionesRolUsuario */
  userName: string | undefined;
  /** Debug info for troubleshooting */
  _debug?: {
    rawUserEmail: string | undefined;
    normalizedUserEmail: string;
    totalAsignaciones: number;
    activeAsignaciones: number;
    matchingAsignacion: unknown | null;
  };
  /** If the user has a mock role override active */
  isMocking: boolean;
  /** The real role from the database */
  realRole: UserRole;
}

export function useUserRole(): UseUserRoleResult {
  const { data: user, isLoading: userLoading } = useUser();
  const { data: asignaciones, isLoading: asignacionesLoading } = useAsignacionesDeRolDeUsuarioList();

  const result = useMemo(() => {
    const rawUserEmail = user?.userPrincipalName;
    const normalizedUserEmail = normalizeEmail(rawUserEmail);
    const isLoading = userLoading || asignacionesLoading;
    
    // Filter only active assignments
    const activeAsignaciones = asignaciones?.filter(
      (a) => a.estadoactivo === true
    ) || [];
    
    // Find assignment for this user by normalized email comparison
    const asignacionEncontrada = activeAsignaciones.find((a) => {
      const assignmentEmail = normalizeEmail(a.correoelectrnico);
      return assignmentEmail === normalizedUserEmail && normalizedUserEmail !== '';
    });

    // Determine real role based on linked role name
    let realRole: UserRole = 'sin-acceso';
    
    // SUPERUSER RULE: Karla is always Developer in the interface
    if (normalizedUserEmail === 'karlamedinadesign@gmail.com') {
      realRole = 'desarrollador';
    } 
    else if (asignacionEncontrada) {
      const rolNombre = asignacionEncontrada.roldelsistema?.nombrederol?.toLowerCase()?.trim();
      if (rolNombre) {
        realRole = ROL_NAME_TO_USER_ROLE[rolNombre] || 'operativo';
      } else {
        // If has assignment but no role defined, default to operativo
        realRole = 'operativo';
      }
    }

    // Attempt to load mock from LocalStorage
    const mockParam = typeof window !== 'undefined' ? localStorage.getItem('VIBE_MOCK_ROLE') : null;
    const isMocking = mockParam !== null && ['admin', 'operativo', 'desarrollador'].includes(mockParam);
    const role = isMocking ? (mockParam as UserRole) : realRole;

    // Debug info for development troubleshooting
    const _debug = {
      rawUserEmail,
      normalizedUserEmail,
      totalAsignaciones: asignaciones?.length ?? 0,
      activeAsignaciones: activeAsignaciones.length,
      matchingAsignacion: asignacionEncontrada ? {
        email: asignacionEncontrada.correoelectrnico,
        estadoactivo: asignacionEncontrada.estadoactivo,
        rol: asignacionEncontrada.roldelsistema?.nombrederol,
      } : null,
      mockOverride: mockParam,
    };

    // Log debug info in development
    if (typeof window !== 'undefined' && !isLoading && normalizedUserEmail) {
      console.log('[useUserRole] Debug:', _debug);
    }

    return {
      role,
      isAdmin: role === 'admin',
      isOperativo: role === 'operativo',
      isDeveloper: role === 'desarrollador',
      sinAcceso: role === 'sin-acceso',
      isSuperUser: normalizedUserEmail === 'karlamedinadesign@gmail.com',
      isMocking,
      realRole,
      isLoading,
      userEmail: rawUserEmail,
      userName: asignacionEncontrada?.asignacionesderoldeusuarionombre,
      _debug,
    };
  }, [user?.userPrincipalName, userLoading, asignaciones, asignacionesLoading]);

  return result;
}

export default useUserRole;