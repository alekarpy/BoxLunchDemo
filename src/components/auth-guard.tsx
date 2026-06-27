import { useUser } from '@/hooks/use-user';
import { PantallaLogin } from '@/pages/pantalla-login';
import { Loader2, AlertTriangle } from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useState } from 'react';

// ── Authentication loop detection ──────────────────────────────────────
// Occurs in Opera/Firefox with strict privacy: the cookie is set but not
// sent back because the browser treats it as a third-party cookie.
const AUTH_LOOP_KEY = 'vibe_auth_attempts';
const AUTH_LOOP_TS_KEY = 'vibe_auth_last_attempt';
const MAX_AUTH_ATTEMPTS = 3;
const LOOP_RESET_MS = 60_000; // Reset counter after 1 minute without attempts

function getAuthAttempts(): number {
  try {
    const ts = parseInt(sessionStorage.getItem(AUTH_LOOP_TS_KEY) ?? '0', 10);
    if (Date.now() - ts > LOOP_RESET_MS) {
      sessionStorage.removeItem(AUTH_LOOP_KEY);
      sessionStorage.removeItem(AUTH_LOOP_TS_KEY);
      return 0;
    }
    return parseInt(sessionStorage.getItem(AUTH_LOOP_KEY) ?? '0', 10);
  } catch { return 0; }
}

function incrementAuthAttempts(): number {
  try {
    const next = getAuthAttempts() + 1;
    sessionStorage.setItem(AUTH_LOOP_KEY, String(next));
    sessionStorage.setItem(AUTH_LOOP_TS_KEY, String(Date.now()));
    return next;
  } catch { return 0; }
}

function clearAuthAttempts() {
  try {
    sessionStorage.removeItem(AUTH_LOOP_KEY);
    sessionStorage.removeItem(AUTH_LOOP_TS_KEY);
  } catch { /* noop */ }
}
// ────────────────────────────────────────────────────────────────────────────

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { data: user, isLoading, isError } = useUser();
  const [loopDetected, setLoopDetected] = useState(false);

  // If user is successfully authenticated, clear the attempts counter
  useEffect(() => {
    if (user && (user.userPrincipalName || user.mail)) {
      clearAuthAttempts();
    }
  }, [user]);

  // Detect loop: if we are coming from the Microsoft callback and there is still no session
  useEffect(() => {
    if (!isLoading && !user) {
      const params = new URLSearchParams(window.location.search);
      // If the URL does not have callback parameters (?code= or ?message=) we don't count it
      const isPostCallback = params.has('code') || params.has('message') ||
        document.referrer.includes('login.microsoftonline.com');

      if (isPostCallback) {
        const attempts = incrementAuthAttempts();
        if (attempts >= MAX_AUTH_ATTEMPTS) {
          setLoopDetected(true);
        }
      }
    }
  }, [isLoading, user]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background grain-texture p-4">
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl transform -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl transform translate-x-1/2 translate-y-1/2" />
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="relative z-10 flex flex-col items-center gap-5"
        >
          <div className="w-[84px] h-[84px] bg-gradient-to-br from-primary/10 to-accent/5 border border-primary/20 rounded-[20px] flex flex-col items-center justify-center shadow-inner p-2 select-none">
            <span className="text-slate-800 dark:text-slate-200 text-xs font-black tracking-tight">Alekarpy</span>
            <span className="text-orange-500 text-[10px] font-extrabold tracking-wider mt-0.5">Dev.</span>
          </div>

          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-primary/60" />
            <p
              className="text-sm text-muted-foreground animate-pulse"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Verificando sesión...
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── Loop detected: show error screen instead of redirecting infinitely ──
  if (loopDetected) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background grain-texture p-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md rounded-[24px] border border-destructive/20 bg-background/80 p-8 text-center shadow-lg backdrop-blur-xl"
        >
          <AlertTriangle className="mx-auto mb-4 h-10 w-10 text-amber-500" />
          <h2 className="mb-2 text-lg font-semibold text-foreground">
            Problema con las cookies de sesión
          </h2>
          <p className="mb-6 text-sm text-muted-foreground leading-relaxed">
            Tu navegador está bloqueando las cookies necesarias para iniciar sesión.
            Intenta en <strong>Chrome</strong> o <strong>Edge</strong>, o activa las
            cookies de terceros en la configuración de privacidad de tu navegador.
          </p>
          <button
            onClick={() => {
              clearAuthAttempts();
              setLoopDetected(false);
              window.location.reload();
            }}
            className="rounded-xl border border-border/50 bg-white/[0.06] px-5 py-2.5 text-sm font-medium text-foreground transition hover:bg-white/[0.12]"
          >
            Intentar de nuevo
          </button>
        </motion.div>
      </div>
    );
  }

  const hasValidSession =
    !isError && user != null && (!!user.userPrincipalName || !!user.mail);

  if (!hasValidSession) {
    return <PantallaLogin />;
  }

  return <>{children}</>;
}
