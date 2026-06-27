/**
 * ConfettiCelebration - Confetti animation for celebrations
 * Custom implementation using Motion
 */
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface ConfettiPiece {
  id: number;
  x: number;
  color: string;
  delay: number;
  rotation: number;
  scale: number;
}

const COLORS = [
  '#10b981', // emerald-500
  '#34d399', // emerald-400
  '#6ee7b7', // emerald-300
  '#f59e0b', // amber-500
  '#fbbf24', // amber-400
  '#fcd34d', // amber-300
  '#3b82f6', // blue-500
  '#60a5fa', // blue-400
  '#ef4444', // red-500
  '#f87171', // red-400
  '#8b5cf6', // violet-500
  '#a78bfa', // violet-400
];

function generateConfettiPieces(count: number): ConfettiPiece[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100, // Horizontal position in percentage
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    delay: Math.random() * 0.3,
    rotation: Math.random() * 360,
    scale: 0.5 + Math.random() * 0.8,
  }));
}

interface ConfettiCelebrationProps {
  /** If animation is active */
  isActive: boolean;
  /** Duration in ms (default: 3000) */
  duration?: number;
  /** Number of confetti pieces (default: 50) */
  pieceCount?: number;
  /** Callback when the animation ends */
  onComplete?: () => void;
}

export function ConfettiCelebration({
  isActive,
  duration = 3000,
  pieceCount = 50,
  onComplete,
}: ConfettiCelebrationProps) {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (isActive) {
      setPieces(generateConfettiPieces(pieceCount));
      setShowConfetti(true);
      
      const timer = setTimeout(() => {
        setShowConfetti(false);
        onComplete?.();
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [isActive, duration, pieceCount, onComplete]);

  return (
    <AnimatePresence>
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
          {pieces.map((piece) => (
            <motion.div
              key={piece.id}
              initial={{
                x: `${piece.x}vw`,
                y: '-10vh',
                rotate: piece.rotation,
                scale: piece.scale,
                opacity: 1,
              }}
              animate={{
                y: '110vh',
                rotate: piece.rotation + (Math.random() > 0.5 ? 720 : -720),
                opacity: [1, 1, 1, 0],
              }}
              exit={{ opacity: 0 }}
              transition={{
                duration: 2 + Math.random() * 1.5,
                delay: piece.delay,
                ease: [0.23, 0.01, 0.32, 1],
              }}
              className="absolute"
              style={{
                width: `${8 + Math.random() * 8}px`,
                height: `${8 + Math.random() * 12}px`,
                backgroundColor: piece.color,
                borderRadius: Math.random() > 0.5 ? '50%' : '2px',
              }}
            />
          ))}
          
          {/* Sparkles adicionales */}
          {Array.from({ length: 15 }, (_, i) => (
            <motion.div
              key={`sparkle-${i}`}
              initial={{
                x: `${20 + Math.random() * 60}vw`,
                y: `${10 + Math.random() * 40}vh`,
                scale: 0,
                opacity: 0,
              }}
              animate={{
                scale: [0, 1.5, 0],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 0.8,
                delay: 0.1 + i * 0.08,
                ease: 'easeOut',
              }}
              className="absolute w-3 h-3"
              style={{
                background: `radial-gradient(circle, ${COLORS[i % COLORS.length]} 0%, transparent 70%)`,
                filter: 'blur(1px)',
              }}
            />
          ))}
        </div>
      )}
    </AnimatePresence>
  );
}

export default ConfettiCelebration;
