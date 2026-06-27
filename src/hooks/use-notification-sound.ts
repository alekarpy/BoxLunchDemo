/**
 * Hook to play notification sound
 * Use the native HTML5 Audio class to play an MP3 file
 */
import { useCallback, useRef } from 'react';

// Notification sound URL
const NOTIFICATION_SOUND_URL = 'https://pub-63bc37b7ec834c9887ce6b7a0f5f91f5.r2.dev/sonido.mp3';

export function useNotificationSound() {
  const lastPlayedRef = useRef<number>(0);
  
  const playNotificationSound = useCallback(() => {
    // Avoid playing sounds in close succession (500ms debounce)
    const now = Date.now();
    if (now - lastPlayedRef.current < 500) {
      return;
    }
    lastPlayedRef.current = now;
    
    // Use the native HTML5 Audio class
    const audio = new Audio(NOTIFICATION_SOUND_URL);
    audio.volume = 0.5; // Volumen al 50%
    
    // Play sound with error handling for locked autoplay
    audio.play().catch((error) => {
      // The browser may block autoplay if there is no user interaction
      // In this case, we simply ignore the error to prevent the app from breaking
      console.warn('No se pudo reproducir el sonido de notificación:', error.message);
    });
  }, []);
  
  return { playNotificationSound };
}
