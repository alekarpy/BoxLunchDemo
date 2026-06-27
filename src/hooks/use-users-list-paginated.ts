/**
 * Hook to get Users_List records ONLY for registered employees.
 * 
 * Features:
 * - Load employees from cr00d_employee1 first
 * - Filters Users_List by emails that match employees' userprincipalname
 * - Stale-While-Revalidate (SWR) pattern: show cache immediately and refresh in background
 * - Cache in localStorage with 30 day TTL
 * - Detailed console logging
 */
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useRef, useState, useEffect } from 'react';
import { clearAllUsersListCache } from './use-photo-cache';
import { UsersListService } from '../generated/services/users-list-service';
import { EmpleadoService } from '../generated/services/empleado-service';
import type { UsersList } from '../generated/models/users-list-model';
import type { Empleado } from '../generated/models/empleado-model';

// localStorage cache configuration
const USERS_LIST_CACHE_KEY = 'users-list-cache-v2'; // New cache version
const CACHE_TTL_MS = 365 * 24 * 60 * 60 * 1000; // 1 year - full expiration
const CACHE_STALE_MS = 365 * 24 * 60 * 60 * 1000; // 1 year - DO NOT revalidate automatically, only manual

interface UsersListCache {
  timestamp: number;
  data: UsersList[];
}

// Query key to load all users
export const USERS_LIST_QUERY_KEY = 'usersList-paginated-v6';

// Expected registration time (based on employees registered in cr00d_employee1)
// This value is just a visual estimate - the actual load depends on the employees
const EXPECTED_TOTAL_RECORDS = 1430;

// Re-export UsersList type for compatibility
export type { UsersList };

export interface UsersListLoadProgress {
  /** Indicates if it is charging */
  isLoading: boolean;
  /** Indicates if charging is complete */
  isComplete: boolean;
  /** Indica si hubo error */
  isError: boolean;
  /** Number of records uploaded */
  recordsLoaded: number;
  /** Expected total registrations */
  expectedTotal: number;
  /** Progress percentage (0-100) */
  progressPercent: number;
  /** Status message */
  statusMessage: string;
  /** Timestamp of when the upload was completed */
  completedAt: Date | null;
  /** Indicates if the data comes from the cache */
  fromCache: boolean;
}

/**
 * Gets data from the localStorage cache.
 * @returns Object with data and metadata from the cache, or null if there is no valid cache
 */
function getCachedUsers(): { data: UsersList[]; isStale: boolean; ageMs: number } | null {
  try {
    const cached = localStorage.getItem(USERS_LIST_CACHE_KEY);
    if (!cached) {
      console.log('[UsersListCache] No hay caché en localStorage');
      return null;
    }

    const parsedCache = JSON.parse(cached) as UsersListCache;
    const now = Date.now();
    const ageMs = now - parsedCache.timestamp;
    const ageHours = ageMs / (1000 * 60 * 60);

    // If completely expired (>30 days), discard
    if (ageMs >= CACHE_TTL_MS) {
      console.log(`[UsersListCache] Caché expirado (${ageHours.toFixed(1)} horas)`);
      localStorage.removeItem(USERS_LIST_CACHE_KEY);
      return null;
    }

    // Determine if it is "stale" (> 7 days) - it must be revalidated in the background
    const isStale = ageMs >= CACHE_STALE_MS;
    const staleStatus = isStale ? '⏳ stale (revalidando)' : '✅ fresh';

    console.log(`[UsersListCache] Caché encontrado: ${staleStatus}`);
    console.log(`[UsersListCache]   - Edad: ${ageHours.toFixed(2)} horas (${(ageMs / 1000).toFixed(0)}s)`);
    console.log(`[UsersListCache]   - Registros: ${parsedCache.data.length}`);
    
    return { data: parsedCache.data, isStale, ageMs };
  } catch (error) {
    console.error('[UsersListCache] Error leyendo caché:', error);
    return null;
  }
}

/**
 * Save data to localStorage cache.
 */
function setCachedUsers(data: UsersList[]): void {
  try {
    const cache: UsersListCache = {
      timestamp: Date.now(),
      data,
    };
    localStorage.setItem(USERS_LIST_CACHE_KEY, JSON.stringify(cache));
    const sizeKB = (JSON.stringify(cache).length / 1024).toFixed(1);
    console.log(`[UsersListCache] ✅ Caché guardado: ${data.length} registros (${sizeKB} KB)`);
  } catch (error) {
    console.error('[UsersListCache] Error guardando caché:', error);
  }
}

/**
 * Clear the localStorage user cache.
 */
export function clearUsersListCache(): void {
  try {
    localStorage.removeItem(USERS_LIST_CACHE_KEY);
    // Also clear previous cache if it exists
    localStorage.removeItem('users-list-cache');
    console.log('[UsersListCache] 🗑️ Caché limpiado');
  } catch (error) {
    console.error('[UsersListCache] Error limpiando caché:', error);
  }
}

// Global flag to avoid multiple simultaneous revalidations
let isRevalidating = false;

/**
 * Load all employees with pagination.
 */
async function fetchAllEmpleados(
  onProgress?: (message: string) => void
): Promise<Empleado[]> {
  onProgress?.('Cargando lista de empleados...');
  console.log('[fetchAllEmpleados] Iniciando carga de empleados...');

  const allEmpleados: Empleado[] = [];
  let hasMore = true;
  let pageToken: string | undefined;
  let pageCount = 0;

  while (hasMore) {
    const results = await EmpleadoService.getAll({
      top: 5000,
      skiptoken: pageToken,
    } as Parameters<typeof EmpleadoService.getAll>[0]);

    allEmpleados.push(...results);
    pageCount++;
    
    console.log(`[fetchAllEmpleados] Página ${pageCount}: ${results.length} registros (total: ${allEmpleados.length})`);
    onProgress?.(`Cargando empleados... (${allEmpleados.length} encontrados)`);

    // If we receive less than 5000, there are no more pages
    if (results.length < 5000) {
      hasMore = false;
    } else {
      // Dataverse does not return skiptoken directly, we check if there are more
      hasMore = false; // We assume that a single call with top=5000 is enough
    }
  }

  console.log(`[fetchAllEmpleados] ✅ Total empleados: ${allEmpleados.length}`);
  return allEmpleados;
}

/**
 * Function that loads users from Users_List filtered by employees.
 * Only load records whose title (email) matches the employees' userprincipalname.
 */
async function fetchAllUsers(
  onProgress?: (loaded: number, message: string) => void
): Promise<UsersList[]> {
  // Check if cache is available
  const cachedData = getCachedUsers();
  if (cachedData) {
    console.log('[fetchAllUsers] ✅ Caché disponible en localStorage:', {
      registros: cachedData.data.length,
      isStale: cachedData.isStale,
      edadMinutos: (cachedData.ageMs / (1000 * 60)).toFixed(1)
    });
  } else {
    console.log('[fetchAllUsers] ⚠️ NO hay caché disponible en localStorage');
  }

  onProgress?.(0, 'Iniciando carga de usuarios...');

  // PASO 1: Cargar todos los empleados primero
  console.log('[fetchAllUsers] ========================================');
  console.log('[fetchAllUsers] PASO 1: Cargando empleados de cr00d_empleado1');
  console.log('[fetchAllUsers] ========================================');
  
  const empleados = await fetchAllEmpleados((msg: string) => onProgress?.(0, msg));
  
  // Get employees' unique emails (userprincipalname)
  const empleadoEmails = new Set<string>();
  for (const empleado of empleados) {
    if (empleado.userprincipalname) {
      // Normalize to lower case for comparison
      empleadoEmails.add(empleado.userprincipalname.toLowerCase().trim());
    }
  }

  console.log(`[fetchAllUsers] Empleados con email: ${empleadoEmails.size} de ${empleados.length}`);
  onProgress?.(0, `${empleados.length} empleados encontrados, cargando fotos...`);

  // STEP 2: Load Users_List records in batches by letter
  // We use the first letters of the emails to filter
  console.log('[fetchAllUsers] ========================================');
  console.log('[fetchAllUsers] PASO 2: Cargando fotos de Users_List');
  console.log('[fetchAllUsers] ========================================');

  const letters = 'abcdefghijklmnopqrstuvwxyz'.split('');
  let accumulatedRecords: UsersList[] = [];
  let matchedRecords: UsersList[] = [];

  // Create all promises for parallel loading
  const allPromises = letters.map((letter: string) =>
    UsersListService.getAll({
      filter: `startswith(ttulo, '${letter}')`,
    } as Parameters<typeof UsersListService.getAll>[0])
      .then((results: UsersList[]) => {
        // Filter only those that match employee emails
        const filtered = results.filter((user: UsersList) => {
          if (!user.ttulo) return false;
          const normalizedTitle = user.ttulo.toLowerCase().trim();
          return empleadoEmails.has(normalizedTitle);
        });

        console.log(`[fetchAllUsers] Letra '${letter}': ${results.length} total → ${filtered.length} coinciden`);
        
        accumulatedRecords = [...accumulatedRecords, ...filtered];
        matchedRecords = [...matchedRecords, ...filtered];
        
        const progressMsg = `Cargando usuarios... (${accumulatedRecords.length} de ~${empleadoEmails.size})`;
        onProgress?.(accumulatedRecords.length, progressMsg);
        
        return filtered;
      })
      .catch((error: Error) => {
        console.error(`[fetchAllUsers] Error en letra '${letter}':`, error);
        return [] as UsersList[];
      })
  );

  console.log(`[fetchAllUsers] Lanzando ${allPromises.length} consultas en paralelo...`);

  // Run all queries in parallel
  const allResults = await Promise.all(allPromises);
  const allRecords = allResults.flat();

  // Deduplicate by ID
  const uniqueRecords = Array.from(
    new Map(allRecords.map((record: UsersList) => [record.id, record])).values()
  );

  console.log(`[fetchAllUsers] ========================================`);
  console.log(`[fetchAllUsers] RESUMEN:`);
  console.log(`[fetchAllUsers]   - Empleados totales: ${empleados.length}`);
  console.log(`[fetchAllUsers]   - Empleados con email: ${empleadoEmails.size}`);
  console.log(`[fetchAllUsers]   - Fotos encontradas: ${uniqueRecords.length}`);
  console.log(`[fetchAllUsers] ========================================`);

  onProgress?.(uniqueRecords.length, `✅ ${uniqueRecords.length} usuarios cargados`);
  return uniqueRecords;
}

/**
 * Revalidates data in the background without blocking the UI.
 * Updates cache and query cache when finished.
 */
async function revalidateInBackground(
  queryClient: ReturnType<typeof useQueryClient>,
  setProgress: React.Dispatch<React.SetStateAction<UsersListLoadProgress>>
): Promise<void> {
  if (isRevalidating) {
    console.log('[Revalidate] Ya hay una revalidación en curso, saltando...');
    return;
  }

  isRevalidating = true;
  console.log('[Revalidate] 🔄 Iniciando revalidación en background...');

  try {
    const startTime = Date.now();
    const freshData = await fetchAllUsers();
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    // Save to localStorage
    setCachedUsers(freshData);
    
    // Actualizar query cache silenciosamente
    queryClient.setQueryData([USERS_LIST_QUERY_KEY], freshData);

    console.log(`[Revalidate] ✅ Revalidación completada: ${freshData.length} registros en ${duration}s`);
    
    // Update status to reflect fresh data
    setProgress((prev: UsersListLoadProgress) => ({
      ...prev,
      recordsLoaded: freshData.length,
      statusMessage: `✅ ${freshData.length} usuarios (actualizado)`,
      fromCache: false,
    }));
  } catch (error) {
    console.error('[Revalidate] ❌ Error en revalidación:', error);
    // We do not update the error status - cache data is still valid
  } finally {
    isRevalidating = false;
  }
}

/**
 * Main hook that loads Users_List records filtered by employees.
 * 
 * Implements the Stale-While-Revalidate (SWR) pattern:
 * 1. If there is valid cache, it shows it immediately
 * 2. If cache is > 7 days old, revalidate in background (without blocking UI)
 *3. If no cache, load from Dataverse showing progress
 */
export function useUsersListPaginated() {
  const queryClient = useQueryClient();
  const startTimeRef = useRef<number | null>(null);
  const hasTriggeredRevalidation = useRef(false);
  const [progress, setProgress] = useState<UsersListLoadProgress>({
    isLoading: false,
    isComplete: false,
    isError: false,
    recordsLoaded: 0,
    expectedTotal: EXPECTED_TOTAL_RECORDS,
    progressPercent: 0,
    statusMessage: 'Esperando inicio de carga...',
    completedAt: null,
    fromCache: false,
  });

  // Initialization: check cache and pre-populate query cache + trigger revalidation if stale
  useEffect(() => {
    const cached = getCachedUsers();
    if (cached && cached.data.length > 0) {
      // Pre-populate the query cache with localStorage data
      queryClient.setQueryData([USERS_LIST_QUERY_KEY], cached.data);
      
      setProgress({
        isLoading: false,
        isComplete: true,
        isError: false,
        recordsLoaded: cached.data.length,
        expectedTotal: EXPECTED_TOTAL_RECORDS,
        progressPercent: 100,
        statusMessage: cached.isStale 
          ? `📦 ${cached.data.length} usuarios (caché, actualizando...)`
          : `📦 ${cached.data.length} usuarios (desde caché)`,
        completedAt: new Date(),
        fromCache: true,
      });

      console.log('[UsersListPaginated] ✅ Datos pre-cargados desde localStorage caché');

      // If stale, revalidate in background
      if (cached.isStale && !hasTriggeredRevalidation.current) {
        hasTriggeredRevalidation.current = true;
        // Use setTimeout to not block the initial render
        setTimeout(() => {
          revalidateInBackground(queryClient, setProgress);
        }, 100);
      }
    }
  }, [queryClient]);

  const query = useQuery<UsersList[], Error, UsersList[], [string]>({
    queryKey: [USERS_LIST_QUERY_KEY],
    queryFn: async () => {
      // Check if we already have data in query cache (pre-populated from localStorage)
      const existingData = queryClient.getQueryData<UsersList[]>([USERS_LIST_QUERY_KEY]);
      if (existingData && existingData.length > 0) {
        console.log('[UsersListPaginated] 📦 Usando datos ya pre-cargados en query cache');
        return existingData;
      }

      // Check localStorage directly (case: empty query cache but localStorage has data)
      const cached = getCachedUsers();
      if (cached && cached.data.length > 0) {
        console.log('[UsersListPaginated] 📦 Usando datos del localStorage');
        
        // If stale, trigger background revalidation
        if (cached.isStale && !hasTriggeredRevalidation.current) {
          hasTriggeredRevalidation.current = true;
          setTimeout(() => {
            revalidateInBackground(queryClient, setProgress);
          }, 100);
        }
        
        setProgress({
          isLoading: false,
          isComplete: true,
          isError: false,
          recordsLoaded: cached.data.length,
          expectedTotal: EXPECTED_TOTAL_RECORDS,
          progressPercent: 100,
          statusMessage: cached.isStale
            ? `📦 ${cached.data.length} usuarios (caché, actualizando...)`
            : `📦 ${cached.data.length} usuarios (desde caché)`,
          completedAt: new Date(),
          fromCache: true,
        });
        
        return cached.data;
      }

      // No cache, load from Dataverse with visible progress
      console.log('🚀 QUERY EJECUTÁNDOSE - Cargando desde Dataverse');
      console.log('[UsersListPaginated] ========================================');
      console.log('[UsersListPaginated] Iniciando carga de registros Users_List');
      console.log('[UsersListPaginated] Total esperado: ~', EXPECTED_TOTAL_RECORDS, 'registros');
      console.log('[UsersListPaginated] ========================================');
      
      startTimeRef.current = Date.now();
      
      setProgress((prev: UsersListLoadProgress) => ({
        ...prev,
        isLoading: true,
        isComplete: false,
        isError: false,
        recordsLoaded: 0,
        progressPercent: 0,
        statusMessage: 'Conectando con Dataverse...',
        completedAt: null,
        fromCache: false,
      }));

      try {
        // Callback function to update progress
        const onProgress = (loaded: number, message: string) => {
          const percent = Math.min((loaded / EXPECTED_TOTAL_RECORDS) * 100, 99);
          setProgress((prev: UsersListLoadProgress) => ({
            ...prev,
            recordsLoaded: loaded,
            progressPercent: percent,
            statusMessage: message,
          }));
        };

        const allRecords = await fetchAllUsers(onProgress);
        
        const endTime = Date.now();
        const duration = startTimeRef.current ? (endTime - startTimeRef.current) / 1000 : 0;
        
        console.log('[UsersListPaginated] ========================================');
        console.log('[UsersListPaginated] ✅ CARGA COMPLETA');
        console.log('[UsersListPaginated] Total registros cargados:', allRecords.length);
        console.log('[UsersListPaginated] Tiempo de carga:', duration.toFixed(2), 'segundos');
        console.log('[UsersListPaginated] Registros por segundo:', (allRecords.length / duration).toFixed(0));
        console.log('[UsersListPaginated] ========================================');
        
        // Save to localStorage for future uploads
        setCachedUsers(allRecords);
        
        const finalMessage = `✅ ${allRecords.length} usuarios en ${duration.toFixed(1)}s`;
        console.log('[UsersListPaginated] CONFIRMACIÓN:', finalMessage);
        
        setProgress({
          isLoading: false,
          isComplete: true,
          isError: false,
          recordsLoaded: allRecords.length,
          expectedTotal: EXPECTED_TOTAL_RECORDS,
          progressPercent: 100,
          statusMessage: finalMessage,
          completedAt: new Date(),
          fromCache: false,
        });
        
        return allRecords;
      } catch (error) {
        console.error('[UsersListPaginated] ❌ ERROR en la carga:', error);
        
        setProgress((prev: UsersListLoadProgress) => ({
          ...prev,
          isLoading: false,
          isComplete: false,
          isError: true,
          statusMessage: `❌ Error: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        }));
        
        throw error;
      }
    },
    // high staleTime because we handle revalidation manually
    staleTime: CACHE_STALE_MS,
    // Keep in memory for 1 hour
    gcTime: 1000 * 60 * 60,
    // Do not retry automatically
    retry: 0,
    retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Actualizar progreso cuando query cambia
  useEffect(() => {
    if (query.isLoading && !progress.isLoading && !progress.fromCache) {
      setProgress((prev: UsersListLoadProgress) => ({
        ...prev,
        isLoading: true,
        statusMessage: 'Cargando usuarios de Dataverse...',
      }));
    }
    
    if (query.data && !query.isLoading && !progress.isComplete) {
      setProgress((prev: UsersListLoadProgress) => ({
        ...prev,
        isLoading: false,
        isComplete: true,
        recordsLoaded: query.data.length,
        progressPercent: 100,
      }));
    }
  }, [query.isLoading, query.data, progress.isLoading, progress.fromCache, progress.isComplete]);

  /**
   * Completely clear the cache and force a fresh reload.
   */
  const clearCacheAndReload = useCallback(async () => {
    console.log('[UsersListPaginated] ========================================');
    console.log('[UsersListPaginated] 🗑️ Limpiando caché y forzando recarga...');
    console.log('[UsersListPaginated] ========================================');
    
    // 1. Reset flags globales
    isRevalidating = false;
    hasTriggeredRevalidation.current = false;
    
    // 2. Clean localStorage from users
    clearUsersListCache();
    clearAllUsersListCache();
    
    // 3. Limpiar query cache
    queryClient.removeQueries({ queryKey: [USERS_LIST_QUERY_KEY] });
    
    // 4. Reset progress state
    setProgress({
      isLoading: true,
      isComplete: false,
      isError: false,
      recordsLoaded: 0,
      expectedTotal: EXPECTED_TOTAL_RECORDS,
      progressPercent: 0,
      statusMessage: 'Limpiando caché y recargando...',
      completedAt: null,
      fromCache: false,
    });
    
    // 5. Refetch forzando nueva carga desde Dataverse
    await queryClient.refetchQueries({ queryKey: [USERS_LIST_QUERY_KEY] });
    
    console.log('[UsersListPaginated] ✅ Recarga iniciada');
  }, [queryClient]);

  return {
    ...query,
    progress,
    clearCacheAndReload,
  };
}

/**
 * Simplified version that only returns the data.
 */
export function useUsersListPaginatedSimple() {
  const { data, isLoading, isError, error } = useUsersListPaginated();
  return { data, isLoading, isError, error };
}
