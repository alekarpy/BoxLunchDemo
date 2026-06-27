/**
 * Confetti Animation Component
 * Canvas-based confetti explosion for celebrations
 */
import { useEffect, useRef, useCallback } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
  shape: 'rect' | 'circle';
}

interface ConfettiProps {
  /** Whether confetti is active */
  active: boolean;
  /** Number of particles to spawn */
  particleCount?: number;
  /** Duration of the animation in ms */
  duration?: number;
  /** Custom colors (defaults to festive palette) */
  colors?: string[];
  /** Whether to play celebration sound */
  sound?: boolean;
}

const DEFAULT_COLORS = [
  '#FF6B6B', // coral red
  '#4ECDC4', // teal
  '#FFE66D', // yellow
  '#95E1D3', // mint
  '#F38181', // salmon
  '#AA96DA', // lavender
  '#FCBAD3', // pink
  '#A8E6CF', // light green
  '#FFD93D', // golden
  '#6BCB77', // green
];

// Simple sound generator using Web Audio API
function playConfettiSound() {
  try {
    const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    
    // Create a sequence of celebratory tones
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 - major chord arpeggio
    const noteDuration = 0.08;
    const noteGap = 0.06;
    
    notes.forEach((freq: number, index: number) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(freq, audioContext.currentTime);
      
      const startTime = audioContext.currentTime + index * (noteDuration + noteGap);
      const endTime = startTime + noteDuration;
      
      // Envelope for each note
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.15, startTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, endTime);
      
      oscillator.start(startTime);
      oscillator.stop(endTime + 0.1);
    });
    
    // Add a "pop" burst sound
    const noise = audioContext.createBufferSource();
    const bufferSize = audioContext.sampleRate * 0.1;
    const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.1));
    }
    
    noise.buffer = buffer;
    const noiseGain = audioContext.createGain();
    const noiseFilter = audioContext.createBiquadFilter();
    
    noiseFilter.type = 'highpass';
    noiseFilter.frequency.value = 1000;
    
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(audioContext.destination);
    
    noiseGain.gain.setValueAtTime(0.3, audioContext.currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
    
    noise.start(audioContext.currentTime);
  } catch {
    // Silently fail if audio context is not available
  }
}

export function Confetti({
  active,
  particleCount = 150,
  duration = 3000,
  colors = DEFAULT_COLORS,
  sound = true,
}: ConfettiProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  const createParticles = useCallback(() => {
    const particles: Particle[] = [];
    const canvas = canvasRef.current;
    if (!canvas) return particles;

    const centerX = canvas.width / 2;
    const centerY = canvas.height * 0.4; // Spawn from upper-middle

    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.random() * Math.PI * 2);
      const velocity = 8 + Math.random() * 12;
      
      particles.push({
        x: centerX + (Math.random() - 0.5) * 100,
        y: centerY + (Math.random() - 0.5) * 50,
        vx: Math.cos(angle) * velocity * (0.5 + Math.random()),
        vy: Math.sin(angle) * velocity * (0.5 + Math.random()) - 5,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 6 + Math.random() * 8,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.3,
        opacity: 1,
        shape: Math.random() > 0.5 ? 'rect' : 'circle',
      });
    }

    return particles;
  }, [particleCount, colors]);

  const animate = useCallback((timestamp: number) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const elapsed = timestamp - startTimeRef.current;
    const progress = Math.min(elapsed / duration, 1);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const gravity = 0.3;
    const friction = 0.99;

    particlesRef.current.forEach((particle: Particle) => {
      // Physics
      particle.vy += gravity;
      particle.vx *= friction;
      particle.vy *= friction;
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.rotation += particle.rotationSpeed;
      
      // Fade out in the last 30% of the animation
      if (progress > 0.7) {
        particle.opacity = Math.max(0, 1 - (progress - 0.7) / 0.3);
      }

      // Draw particle
      ctx.save();
      ctx.translate(particle.x, particle.y);
      ctx.rotate(particle.rotation);
      ctx.globalAlpha = particle.opacity;
      ctx.fillStyle = particle.color;

      if (particle.shape === 'rect') {
        ctx.fillRect(
          -particle.size / 2,
          -particle.size / 4,
          particle.size,
          particle.size / 2
        );
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, particle.size / 3, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    });

    if (progress < 1) {
      animationRef.current = requestAnimationFrame(animate);
    }
  }, [duration]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (active) {
      particlesRef.current = createParticles();
      startTimeRef.current = performance.now();
      animationRef.current = requestAnimationFrame(animate);
      
      // Play celebration sound
      if (sound) {
        playConfettiSound();
      }
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      const ctx = canvasRef.current?.getContext('2d');
      if (ctx && canvasRef.current) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [active, createParticles, animate, sound]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-[100] pointer-events-none"
      style={{ width: '100vw', height: '100vh' }}
    />
  );
}

export default Confetti;
