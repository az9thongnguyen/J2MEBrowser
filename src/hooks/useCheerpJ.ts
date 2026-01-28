/**
 * CheerpJ Integration Hook
 * Manages CheerpJ lifecycle and provides J2ME emulation
 */

import { useEffect, useState, useCallback, useRef } from 'react';

// CheerpJ global types
declare global {
  interface Window {
    cheerpjInit: (options?: CheerpJOptions) => Promise<void>;
    cheerpjRunMain: (className: string, classPath: string) => Promise<void>;
    cheerpjCreateDisplay: (width: number, height: number, parent: HTMLElement) => HTMLElement;
    cjCall: (className: string, methodName: string, ...args: unknown[]) => Promise<unknown>;
    cjNew: (className: string, ...args: unknown[]) => Promise<unknown>;
  }
}

interface CheerpJOptions {
  version?: number;
  status?: 'none' | 'splash' | 'default';
  javaProperties?: string[];
  clipboardMode?: 'system' | 'java';
  beepCallback?: () => void;
}

export type EmulatorStatus = 'idle' | 'loading' | 'initializing' | 'running' | 'paused' | 'error';

interface UseCheerpJReturn {
  status: EmulatorStatus;
  error: string | null;
  isReady: boolean;
  displayElement: HTMLElement | null;
  initialize: () => Promise<boolean>;
  loadJAR: (jarBlob: Blob, className: string, screenWidth: number, screenHeight: number) => Promise<void>;
  stop: () => void;
  sendKeyEvent: (keyCode: number, pressed: boolean) => void;
  containerRef: React.RefObject<HTMLElement | null>;
}

// J2ME Key Codes
export const J2ME_KEYS = {
  UP: -1,
  DOWN: -2,
  LEFT: -3,
  RIGHT: -4,
  FIRE: -5,
  SOFT_LEFT: -6,
  SOFT_RIGHT: -7,
  KEY_0: 48,
  KEY_1: 49,
  KEY_2: 50,
  KEY_3: 51,
  KEY_4: 52,
  KEY_5: 53,
  KEY_6: 54,
  KEY_7: 55,
  KEY_8: 56,
  KEY_9: 57,
  KEY_STAR: 42,
  KEY_HASH: 35,
} as const;

// Map keyboard keys to J2ME keys
export const KEYBOARD_MAPPING: Record<string, number> = {
  'ArrowUp': J2ME_KEYS.UP,
  'ArrowDown': J2ME_KEYS.DOWN,
  'ArrowLeft': J2ME_KEYS.LEFT,
  'ArrowRight': J2ME_KEYS.RIGHT,
  'Enter': J2ME_KEYS.FIRE,
  ' ': J2ME_KEYS.FIRE,
  'KeyQ': J2ME_KEYS.SOFT_LEFT,
  'KeyE': J2ME_KEYS.SOFT_RIGHT,
  'Digit0': J2ME_KEYS.KEY_0,
  'Digit1': J2ME_KEYS.KEY_1,
  'Digit2': J2ME_KEYS.KEY_2,
  'Digit3': J2ME_KEYS.KEY_3,
  'Digit4': J2ME_KEYS.KEY_4,
  'Digit5': J2ME_KEYS.KEY_5,
  'Digit6': J2ME_KEYS.KEY_6,
  'Digit7': J2ME_KEYS.KEY_7,
  'Digit8': J2ME_KEYS.KEY_8,
  'Digit9': J2ME_KEYS.KEY_9,
  'Numpad0': J2ME_KEYS.KEY_0,
  'Numpad1': J2ME_KEYS.KEY_1,
  'Numpad2': J2ME_KEYS.KEY_2,
  'Numpad3': J2ME_KEYS.KEY_3,
  'Numpad4': J2ME_KEYS.KEY_4,
  'Numpad5': J2ME_KEYS.KEY_5,
  'Numpad6': J2ME_KEYS.KEY_6,
  'Numpad7': J2ME_KEYS.KEY_7,
  'Numpad8': J2ME_KEYS.KEY_8,
  'Numpad9': J2ME_KEYS.KEY_9,
};

const CHEERPJ_CDN = 'https://cjrtnc.leaningtech.com/3.0/cj3loader.js';

export function useCheerpJ(): UseCheerpJReturn {
  const [status, setStatus] = useState<EmulatorStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [displayElement, setDisplayElement] = useState<HTMLElement | null>(null);
  
  const containerRef = useRef<HTMLElement | null>(null);
  const jarUrlRef = useRef<string | null>(null);

  // Load CheerpJ script
  const loadScript = useCallback((): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (typeof window.cheerpjInit === 'function') {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = CHEERPJ_CDN;
      script.async = true;
      
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load CheerpJ'));
      
      document.head.appendChild(script);
    });
  }, []);

  // Initialize CheerpJ
  const initialize = useCallback(async (): Promise<boolean> => {
    if (isReady) return true;
    
    try {
      setStatus('loading');
      setError(null);
      
      await loadScript();
      
      setStatus('initializing');
      
      await window.cheerpjInit({
        version: 8,
        status: 'none',
        clipboardMode: 'java',
      });
      
      setIsReady(true);
      setStatus('idle');
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to initialize CheerpJ';
      setError(message);
      setStatus('error');
      return false;
    }
  }, [isReady, loadScript]);

  // Load and run a JAR file
  const loadJAR = useCallback(async (
    jarBlob: Blob,
    className: string,
    screenWidth: number,
    screenHeight: number
  ): Promise<void> => {
    if (!isReady) {
      const initialized = await initialize();
      if (!initialized) throw new Error('CheerpJ not initialized');
    }

    try {
      setStatus('loading');
      
      // Revoke previous URL
      if (jarUrlRef.current) {
        URL.revokeObjectURL(jarUrlRef.current);
      }
      
      // Create a blob URL for the JAR
      const jarUrl = URL.createObjectURL(jarBlob);
      jarUrlRef.current = jarUrl;
      
      // Create display container
      if (containerRef.current) {
        const display = window.cheerpjCreateDisplay(
          screenWidth,
          screenHeight,
          containerRef.current
        );
        setDisplayElement(display);
      }
      
      setStatus('running');
      
      // Run the MIDlet
      await window.cheerpjRunMain(className, `/app/${jarUrl}:lib/`);
      
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load JAR';
      setError(message);
      setStatus('error');
      throw err;
    }
  }, [isReady, initialize]);

  // Stop emulation
  const stop = useCallback(() => {
    if (jarUrlRef.current) {
      URL.revokeObjectURL(jarUrlRef.current);
      jarUrlRef.current = null;
    }
    setStatus('idle');
    setDisplayElement(null);
  }, []);

  // Send key event to the emulator
  const sendKeyEvent = useCallback((keyCode: number, pressed: boolean) => {
    if (status !== 'running' || !displayElement) return;
    
    // Dispatch keyboard events to the display element
    const eventType = pressed ? 'keydown' : 'keyup';
    const event = new KeyboardEvent(eventType, {
      keyCode,
      which: keyCode,
      bubbles: true,
    });
    
    displayElement.dispatchEvent(event);
  }, [status, displayElement]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (jarUrlRef.current) {
        URL.revokeObjectURL(jarUrlRef.current);
      }
    };
  }, []);

  return {
    status,
    error,
    isReady,
    displayElement,
    initialize,
    loadJAR,
    stop,
    sendKeyEvent,
    containerRef,
  };
}

export default useCheerpJ;
