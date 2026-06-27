/**
 * Hook to retrieve Microsoft Entra ID users from the C# backend.
 * 
 * ARCHITECTURE:
 * - The C# backend (api/Graph/empleados) is the data source.
 * - Supports real data (Graph) or Mock (waiting for permissions).
 */
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';
import { MicrosoftEntraIDService } from '../generated/services/microsoft-entra-id-service';
import type { MicrosoftEntraID } from '../generated/models/microsoft-entra-id-model';

// Cache configuration
const ENTRA_CACHE_KEY = 'vibe-users-cache-v4'; 
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 1 day for development

// Query key
export const ENTRA_USERS_QUERY_KEY = 'entra-users-v3';

export interface EntraUsersLoadProgress {
  isLoading: boolean;
  isComplete: boolean;
  isError: boolean;
  recordsLoaded: number;
  expectedTotal: number;
  progressPercent: number;
  statusMessage: string;
  completedAt: Date | null;
  fromCache: boolean;
}

function cleanEmail(email: string | undefined | null): string {
  if (!email) return '';
  const normalized = email.toLowerCase().trim();
  const parts = normalized.split('@');
  if (parts.length < 2) return normalized;
  const local = parts[0];
  const domain = parts[1];
  
  // Remove any trailing digits from the local part (e.g., "juan.gutierrez0" -> "juan.gutierrez")
  const cleanedLocal = local.replace(/\d+$/, '');
  return `${cleanedLocal}@${domain}`;
}

export interface UseEntraUsersResult {
  entraUsers: MicrosoftEntraID[];
  photoMap: Record<string, string>;
  isLoading: boolean;
  progress: EntraUsersLoadProgress;
  clearCacheAndReload: () => Promise<void>;
  getUserByEmail: (email: string | undefined | null) => MicrosoftEntraID | undefined;
  getPhotoByEmail: (email: string | undefined | null) => string | undefined;
}

/**
 * Main hook that loads Microsoft Entra ID users.
 */
export function useEntraUsers(): UseEntraUsersResult {
  const queryClient = useQueryClient();
  const [progress, setProgress] = useState<EntraUsersLoadProgress>({
    isLoading: false,
    isComplete: false,
    isError: false,
    recordsLoaded: 0,
    expectedTotal: 0,
    progressPercent: 0,
    statusMessage: 'Conectando con Microsoft Entra ID...',
    completedAt: null,
    fromCache: false,
  });

  const query = useQuery<{ entraUsers: MicrosoftEntraID[]; photoMap: Record<string, string> }, Error>({
    queryKey: [ENTRA_USERS_QUERY_KEY],
    queryFn: async () => {
      setProgress(prev => ({ 
        ...prev, 
        isLoading: true, 
        statusMessage: 'Sincronizando directorio completo... Esto puede tardar unos segundos dependiendo del tamaño de la organización.' 
      }));
      
      try {
        const entraUsers = await MicrosoftEntraIDService.getAll();
        
        // The photoMap is left empty or filled if the backend returns photos
        const photoMap: Record<string, string> = {};
        
        const result = { entraUsers, photoMap };
        
        localStorage.setItem(ENTRA_CACHE_KEY, JSON.stringify({
          timestamp: Date.now(),
          entraUsers
        }));

        setProgress({
          isLoading: false,
          isComplete: true,
          isError: false,
          recordsLoaded: entraUsers.length,
          expectedTotal: entraUsers.length,
          progressPercent: 100,
          statusMessage: `✅ Sincronización exitosa: ${entraUsers.length} empleados disponibles`,
          completedAt: new Date(),
          fromCache: false,
        });

        return result;
      } catch (error) {
        setProgress(prev => ({ ...prev, isLoading: false, isError: true, statusMessage: 'Error al conectar' }));
        throw error;
      }
    },
    staleTime: CACHE_TTL_MS,
  });

  const entraUsers = query.data?.entraUsers ?? [];
  const photoMap = query.data?.photoMap ?? {};

  const getUserByEmail = useCallback((email: string | undefined | null) => {
    const cleaned = cleanEmail(email);
    return entraUsers.find(u => {
      const uCleaned = cleanEmail(u.nombreprincipaldeusuario || u.correo);
      return uCleaned === cleaned;
    });
  }, [entraUsers]);

  const getPhotoByEmail = useCallback((email: string | undefined | null) => {
    const cleaned = cleanEmail(email);
    return photoMap[cleaned];
  }, [photoMap]);

  const clearCacheAndReload = async () => {
    localStorage.removeItem(ENTRA_CACHE_KEY);
    await queryClient.invalidateQueries({ queryKey: [ENTRA_USERS_QUERY_KEY] });
  };

  return {
    entraUsers,
    photoMap,
    isLoading: query.isLoading,
    progress,
    clearCacheAndReload,
    getUserByEmail,
    getPhotoByEmail,
  };
}

// Re-export model for convenience
export type { MicrosoftEntraID };
