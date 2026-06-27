/**
 * Wrapper that integrates the initial loading screen with the Entra ID user hook.
 * Wraps the entire app and shows loading only for new users without cache.
 * 
 * Users source: Microsoft Entra ID (read only)
 */
import { useEntraUsers } from '@/hooks/use-entra-users';
import { InitialLoadingScreen } from './initial-loading-screen';

interface AppLoadingWrapperProps {
  children: React.ReactNode;
}

export function AppLoadingWrapper({ children }: AppLoadingWrapperProps) {
  const { progress } = useEntraUsers();

  return (
    <InitialLoadingScreen
      isComplete={progress.isComplete}
      recordsLoaded={progress.recordsLoaded}
      expectedTotal={progress.expectedTotal}
      progressPercent={progress.progressPercent}
      statusMessage={progress.statusMessage}
    >
      {children}
    </InitialLoadingScreen>
  );
}
