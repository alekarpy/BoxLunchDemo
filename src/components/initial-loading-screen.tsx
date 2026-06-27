/**
 * Initial loading screen that locks the app while loading users from Dataverse.
 * Only shown when there is no valid cache (new user).
 * When there is a cache, it allows instant entry.
 */
import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Database, Users, Sparkles, Check, Cloud, Server } from 'lucide-react';
import { cn } from '@/lib/utils';

// localStorage key for user cache
// IMPORTANT: it must match the one written by useEntraUsers (use-entra-users.ts)
const USERS_LIST_CACHE_KEY = 'vibe-users-cache-v4';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 1 day (same as useEntraUsers)

interface InitialLoadingScreenProps {
  /** User hook loading status */
  /**If charging is complete */
  isComplete: boolean;
  /** Number of records uploaded */
  recordsLoaded: number;
  /** Expected total registrations */
  expectedTotal: number;
  /**Percentage of progress */
  progressPercent: number;
  /** Status message */
  statusMessage: string;
  /** Children to render when loading finishes */
  children: React.ReactNode;
}

/**
 * Check if there is valid cache in localStorage.
 * Only checks existence and expiration, does not load data.
 */
function hasValidCache(): boolean {
  try {
    const cached = localStorage.getItem(USERS_LIST_CACHE_KEY);
    if (!cached) return false;

    // useEntraUsers guarda { timestamp, entraUsers: [] }
    const parsedCache = JSON.parse(cached) as { timestamp: number; entraUsers: unknown[] };
    const ageMs = Date.now() - parsedCache.timestamp;

    // If it has completely expired, there is no valid cache
    if (ageMs >= CACHE_TTL_MS) return false;

    // If you have employee data, it is valid
    return Array.isArray(parsedCache.entraUsers) && parsedCache.entraUsers.length > 0;
  } catch {
    return false;
  }
}

/**
 * Animated floating orb component.
 */
function FloatingOrb({
  delay,
  size,
  color,
  x,
  y
}: {
  delay: number;
  size: number;
  color: string;
  x: string;
  y: string;
}) {
  return (
    <motion.div
      className={cn(
        'absolute rounded-full blur-3xl',
        color
      )}
      style={{
        width: size,
        height: size,
        left: x,
        top: y,
      }}
      animate={{
        scale: [1, 1.2, 1],
        opacity: [0.3, 0.5, 0.3],
        x: [-20, 20, -20],
        y: [-15, 15, -15],
      }}
      transition={{
        duration: 8,
        delay,
        repeat: Infinity,
        ease: "easeInOut" as const,
      }}
    />
  );
}

/**
 * Animated orbiting data icon.
 */
function OrbitingIcon({
  icon: Icon,
  delay,
  radius,
  duration
}: {
  icon: typeof Database;
  delay: number;
  radius: number;
  duration: number;
}) {
  return (
    <motion.div
      className="absolute"
      style={{
        width: 40,
        height: 40,
      }}
      animate={{
        rotate: 360,
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: "linear" as const,
      }}
    >
      <motion.div
        className="absolute flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 backdrop-blur-sm"
        style={{
          left: radius,
        }}
        animate={{
          rotate: -360,
          scale: [1, 1.1, 1],
        }}
        transition={{
          rotate: {
            duration,
            delay,
            repeat: Infinity,
            ease: "linear" as const,
          },
          scale: {
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut" as const,
          },
        }}
      >
        <Icon className="w-5 h-5 text-primary" />
      </motion.div>
    </motion.div>
  );
}

/**
 * Animated data particle.
 */
function DataParticle({ delay, index }: { delay: number; index: number }) {
  const angle = (index * 45) * (Math.PI / 180);
  const radius = 80 + Math.random() * 40;

  return (
    <motion.div
      className="absolute w-2 h-2 rounded-full bg-primary/40"
      initial={{
        x: Math.cos(angle) * 30,
        y: Math.sin(angle) * 30,
        opacity: 0,
        scale: 0,
      }}
      animate={{
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
        opacity: [0, 1, 0],
        scale: [0, 1.5, 0],
      }}
      transition={{
        duration: 2,
        delay: delay + index * 0.15,
        repeat: Infinity,
        ease: "easeOut" as const,
      }}
    />
  );
}

/**
 * Progress bar with animations.
 */
function AnimatedProgressBar({ percent }: { percent: number }) {
  return (
    <div className="w-full max-w-md mx-auto">
      <div className="relative h-2 bg-primary/10 rounded-full overflow-hidden">
        {/* background with shimmer */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent"
          animate={{ x: ['-100%', '100%'] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" as const }}
        />

        {/* Main progress bar */}
        <motion.div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary via-primary/90 to-accent rounded-full"
          initial={{ width: '0%' }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.5, ease: "easeOut" as const }}
        >
          {/* edge shine */}
          <motion.div
            className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-r from-transparent to-white/30 rounded-full"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1, repeat: Infinity }}
          />
        </motion.div>
      </div>
    </div>
  );
}

export function InitialLoadingScreen({
  isComplete,
  recordsLoaded,
  expectedTotal,
  progressPercent,
  statusMessage,
  children,
}: InitialLoadingScreenProps) {
  const [hasCacheOnMount, setHasCacheOnMount] = useState<boolean | null>(null);
  const [showScreen, setShowScreen] = useState(true);
  const [exitComplete, setExitComplete] = useState(false);

  // Check cache only on mount
  useEffect(() => {
    const cacheValid = hasValidCache();
    console.log('[InitialLoadingScreen] Verificando caché:', cacheValid ? '✅ Válido' : '❌ No válido');
    setHasCacheOnMount(cacheValid);

    // If there is valid cache, do not show loading screen
    if (cacheValid) {
      setShowScreen(false);
      setExitComplete(true);
    }
  }, []);

  // When loading is complete, start exit animation
  useEffect(() => {
    if (isComplete && showScreen && hasCacheOnMount === false) {
      // Delay before hiding to show completed status
      const timer = setTimeout(() => {
        setShowScreen(false);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isComplete, showScreen, hasCacheOnMount]);

  // Generate data particles
  const particles = useMemo(() =>
    Array.from({ length: 8 }, (_, i: number) => i),
    []
  );

  // If we have not yet determined the cache state, do not render anything
  if (hasCacheOnMount === null) {
    return null;
  }

  // If the loading screen has already finished its exit animation, show children
  if (exitComplete) {
    return <>{children}</>;
  }

  return (
    <>
      <AnimatePresence
        onExitComplete={() => setExitComplete(true)}
      >
        {showScreen && (
          <motion.div
            key="loading-screen"
            className="fixed inset-0 z-[9999] bg-background flex flex-col items-center justify-center overflow-hidden"
            initial={{ opacity: 1 }}
            exit={{
              opacity: 0,
              scale: 1.05,
            }}
            transition={{
              duration: 0.6,
              ease: [0.4, 0, 0.2, 1] as const,
            }}
          >
            {/* Animated background orbs */}
            <div className="absolute inset-0 overflow-hidden">
              <FloatingOrb delay={0} size={400} color="bg-primary/10" x="-10%" y="-10%" />
              <FloatingOrb delay={2} size={300} color="bg-accent/10" x="80%" y="20%" />
              <FloatingOrb delay={4} size={350} color="bg-primary/8" x="20%" y="70%" />
              <FloatingOrb delay={1} size={250} color="bg-accent/8" x="70%" y="80%" />
            </div>

            {/* Subtle grid pattern */}
            <div
              className="absolute inset-0 opacity-[0.02]"
              style={{
                backgroundImage: `
                  linear-gradient(var(--primary) 1px, transparent 1px),
                  linear-gradient(90deg, var(--primary) 1px, transparent 1px)
                `,
                backgroundSize: '60px 60px',
              }}
            />

            {/* Contenido principal */}
            <div className="relative z-10 flex flex-col items-center px-6 max-w-lg w-full">
              {/* Central animation */}
              <div className="relative w-40 h-40 mb-8 flex items-center justify-center">
                {/* Iconos orbitando */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <OrbitingIcon icon={Database} delay={0} radius={50} duration={8} />
                  <OrbitingIcon icon={Users} delay={2.66} radius={50} duration={8} />
                  <OrbitingIcon icon={Cloud} delay={5.33} radius={50} duration={8} />
                </div>

                {/* Data Particles */}
                <div className="absolute inset-0 flex items-center justify-center">
                  {particles.map((i: number) => (
                    <DataParticle key={i} delay={0.5} index={i} />
                  ))}
                </div>

                {/* Pulsating center circle */}
                <motion.div
                  className="relative z-10 w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/25"
                  animate={{
                    scale: [1, 1.08, 1],
                    boxShadow: [
                      '0 10px 30px -5px color-mix(in oklch, var(--primary) 25%, transparent)',
                      '0 15px 40px -5px color-mix(in oklch, var(--primary) 40%, transparent)',
                      '0 10px 30px -5px color-mix(in oklch, var(--primary) 25%, transparent)',
                    ],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut" as const,
                  }}
                >
                  <AnimatePresence mode="wait">
                    {isComplete ? (
                      <motion.div
                        key="check"
                        initial={{ scale: 0, rotate: -45 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      >
                        <Check className="w-10 h-10 text-primary-foreground" strokeWidth={3} />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="server"
                        animate={{
                          rotate: [0, 10, -10, 0],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut" as const,
                        }}
                      >
                        <Server className="w-10 h-10 text-primary-foreground" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>

                {/* Animated concentric rings */}
                {[0, 1, 2].map((i: number) => (
                  <motion.div
                    key={i}
                    className="absolute inset-0 rounded-full border border-primary/20"
                    style={{ scale: 1 + i * 0.3 }}
                    animate={{
                      opacity: [0.3, 0.6, 0.3],
                      scale: [1 + i * 0.3, 1 + i * 0.35, 1 + i * 0.3],
                    }}
                    transition={{
                      duration: 3,
                      delay: i * 0.5,
                      repeat: Infinity,
                      ease: "easeInOut" as const,
                    }}
                  />
                ))}
              </div>

              {/* Title with sparkles */}
              <motion.div
                className="flex items-center gap-2 mb-3"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Sparkles className="w-5 h-5 text-primary" />
                <h1
                  className="text-2xl sm:text-3xl font-bold text-foreground"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  {isComplete ? '¡Listo!' : 'Cargando Usuarios'}
                </h1>
                <Sparkles className="w-5 h-5 text-primary" />
              </motion.div>

              {/* Caption */}
              <motion.p
                className="text-muted-foreground text-center mb-8 text-sm sm:text-base"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                {isComplete
                  ? 'Todos los usuarios están listos'
                  : 'Sincronizando directorio de Demo App...'
                }
              </motion.p>

              {/* progress bar */}
              <motion.div
                className="w-full mb-6"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
              >
                <AnimatedProgressBar percent={progressPercent} />
              </motion.div>

              {/* Record Counter */}
              <motion.div
                className="flex flex-col items-center gap-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <div className="flex items-center gap-3">
                  <motion.span
                    className="text-3xl sm:text-4xl font-bold text-primary"
                    key={recordsLoaded}
                    initial={{ scale: 1.2, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    {(recordsLoaded || 0).toLocaleString()}
                  </motion.span>
                  <span className="text-muted-foreground text-lg">/</span>
                  <span className="text-xl text-muted-foreground">
                    ~{(expectedTotal || 0).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  {statusMessage}
                </p>
              </motion.div>

              {/* First time indicator */}
              <motion.div
                className="mt-8 px-4 py-2 rounded-full bg-primary/5 border border-primary/10 text-xs text-muted-foreground"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                Primera carga — las próximas serán instantáneas
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Renderizar children siempre pero ocultos mientras carga */}
      <div style={{ display: showScreen ? 'none' : 'contents' }}>
        {children}
      </div>
    </>
  );
}
