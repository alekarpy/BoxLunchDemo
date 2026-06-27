/**
 * Component that displays user loading progress from Users_List.
 * The diagnostic panel is only visible with ?debug=true in the URL.
 */
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, CheckCircle, AlertCircle, Users, Activity, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useUsersListPhotos } from '@/hooks/use-users-list-photos';
import { toast } from 'sonner';
import { useSearchParams } from 'react-router-dom';

interface UsersLoadProgressProps {
  /** If true, shows a compact indicator instead of the full one */
  compact?: boolean;
  /** Clase CSS adicional */
  className?: string;
  /** Whether to show the clear cache button */
  showClearCacheButton?: boolean;
}

/**
 * Diagnostic panel showing internal charging status.
 * Only visible when ?debug=true is in the URL.
 */
function DiagnosticPanel({
  isLoading,
  totalRecords,
  isError,
  errorMessage,
  statusMessage,
}: {
  isLoading: boolean;
  totalRecords: number;
  isError: boolean;
  errorMessage: string | null;
  statusMessage: string;
}) {
  return (
    <div className="mt-3 p-3 rounded-md bg-muted/50 border border-border/50 font-mono text-xs">
      <div className="flex items-center gap-2 mb-2 text-muted-foreground">
        <Activity className="h-3.5 w-3.5" />
        <span className="font-semibold uppercase tracking-wider">Panel Diagnóstico</span>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
        <div className="flex justify-between">
          <span className="text-muted-foreground">isLoading:</span>
          <span className={cn(
            'font-semibold',
            isLoading ? 'text-amber-500' : 'text-green-500'
          )}>
            {isLoading ? 'true' : 'false'}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">totalRecords:</span>
          <span className="font-semibold text-foreground">{totalRecords.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">isError:</span>
          <span className={cn(
            'font-semibold',
            isError ? 'text-destructive' : 'text-green-500'
          )}>
            {isError ? 'true' : 'false'}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">errorMessage:</span>
          <span className={cn(
            'font-semibold truncate max-w-[140px]',
            errorMessage ? 'text-destructive' : 'text-muted-foreground'
          )} title={errorMessage ?? 'null'}>
            {errorMessage ?? 'null'}
          </span>
        </div>
      </div>
      <div className="mt-2 pt-2 border-t border-border/50">
        <div className="flex gap-2">
          <span className="text-muted-foreground shrink-0">statusMessage:</span>
          <span className="font-semibold text-foreground break-all">{statusMessage}</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Shows the loading progress of the user list.
 * The diagnostic panel is only visible with ?debug=true in the URL.
 */
export function UsersLoadProgress({
  compact = false,
  className,
  showClearCacheButton = false,
}: UsersLoadProgressProps) {
  const [searchParams] = useSearchParams();
  const showDebugPanel = searchParams.get('debug') === 'true';
  const { progress, clearCacheAndReload, totalRecords, isLoading: hookIsLoading } = useUsersListPhotos();
  
  // Extract data for the diagnostic panel
  const isLoading = progress.isLoading || hookIsLoading;
  const isError = progress.isError;
  const errorMessage = isError ? progress.statusMessage : null;
  const statusMessage = progress.statusMessage;

  if (compact) {
    return (
      <div className={cn('space-y-2', className)}>
        <AnimatePresence>
          {(progress.isLoading || progress.isError) && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={cn(
                'flex items-center gap-2 text-sm px-3 py-1.5 rounded-full',
                progress.isError 
                  ? 'bg-destructive/10 text-destructive' 
                  : 'bg-primary/10 text-primary'
              )}
            >
              {progress.isLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : progress.isError ? (
                <AlertCircle className="h-3.5 w-3.5" />
              ) : (
                <CheckCircle className="h-3.5 w-3.5" />
              )}
              <span className="font-medium">
                {progress.isLoading 
                  ? `Cargando: ${progress.recordsLoaded} usuarios...`
                  : progress.statusMessage
                }
              </span>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Diagnostic panel only visible with ?debug=true */}
        {showDebugPanel && (
          <DiagnosticPanel
            isLoading={isLoading}
            totalRecords={totalRecords}
            isError={isError}
            errorMessage={errorMessage}
            statusMessage={statusMessage}
          />
        )}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'rounded-lg border p-4 shadow-sm',
        progress.isError 
          ? 'bg-destructive/5 border-destructive/20' 
          : progress.isComplete
          ? 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800'
          : 'bg-primary/5 border-primary/20',
        className
      )}
    >
      <div className="flex items-start gap-4">
        {/* Icono */}
        <div className={cn(
          'p-2 rounded-lg',
          progress.isError 
            ? 'bg-destructive/10' 
            : progress.isComplete
            ? 'bg-green-100 dark:bg-green-900/30'
            : 'bg-primary/10'
        )}>
          {progress.isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          ) : progress.isError ? (
            <AlertCircle className="h-5 w-5 text-destructive" />
          ) : (
            <Users className="h-5 w-5 text-green-600 dark:text-green-400" />
          )}
        </div>

        {/* Contenido */}
        <div className="flex-1 min-w-0">
          <h4 className={cn(
            'font-semibold text-sm',
            progress.isError 
              ? 'text-destructive' 
              : progress.isComplete
              ? 'text-green-700 dark:text-green-400'
              : 'text-foreground'
          )}>
            {progress.isLoading 
              ? 'Cargando usuarios de Dataverse' 
              : progress.isError 
              ? 'Error al cargar usuarios'
              : 'Usuarios cargados correctamente'
            }
          </h4>
          
          <p className="text-sm text-muted-foreground mt-0.5">
            {progress.statusMessage}
          </p>

          {/* progress bar */}
          {progress.isLoading && (
            <div className="mt-3">
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>Progreso de carga</span>
                <span>
                  {progress.recordsLoaded.toLocaleString()} / ~{progress.expectedTotal.toLocaleString()}
                </span>
              </div>
              <div className="h-2 bg-primary/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-primary rounded-full"
                  initial={{ width: 0 }}
                  animate={{ 
                    width: `${Math.min(progress.progressPercent, 100)}%` 
                  }}
                  transition={{ duration: 0.3 } as const}
                />
              </div>
            </div>
          )}

          {/* Additional information when complete */}
          {progress.isComplete && progress.completedAt && (
            <div className="mt-2 text-xs text-muted-foreground">
              <span>Completado a las {progress.completedAt.toLocaleTimeString()}</span>
              <span className="mx-2">•</span>
              <span>{progress.recordsLoaded.toLocaleString()} usuarios en memoria</span>
            </div>
          )}
          
          {/* Diagnostic panel only visible with ?debug=true */}
          {showDebugPanel && (
            <DiagnosticPanel
              isLoading={isLoading}
              totalRecords={totalRecords}
              isError={isError}
              errorMessage={errorMessage}
              statusMessage={statusMessage}
            />
          )}
        </div>

        {/* Clear cache button - only way to force reload */}
        {showClearCacheButton && (
          <div className="flex items-center shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                clearCacheAndReload();
                toast.success('Caché de usuarios limpiado', {
                  description: 'El caché local ha sido eliminado. Los datos se recargarán automáticamente.'
                });
              }}
              disabled={progress.isLoading}
              className="text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
              title="Limpiar caché y recargar datos de usuarios"
            >
              <Trash2 className="h-4 w-4" />
              <span className="ml-1.5 sr-only sm:not-sr-only">Limpiar Caché</span>
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

/**
 * Hook to get only the progress status (for use in other components).
 */
export function useUsersLoadProgress() {
  const { progress, clearCacheAndReload, totalRecords } = useUsersListPhotos();
  return { progress, clearCacheAndReload, totalRecords };
}
