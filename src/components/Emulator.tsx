import React, { useCallback, useEffect } from 'react';
import VirtualKeypad from './VirtualKeypad';
import useCheerpJ, { KEYBOARD_MAPPING } from '../hooks/useCheerpJ';
import { type JARManifest } from '../utils/jarParser';
import './Emulator.css';

interface EmulatorProps {
  jarFile: File | null;
  manifest: JARManifest | null;
  onExit: () => void;
}

const Emulator: React.FC<EmulatorProps> = ({ jarFile, manifest, onExit }) => {
  const { 
    status, 
    error: cheerpjError, 
    containerRef, 
    loadJAR, 
    stop, 
    sendKeyEvent 
  } = useCheerpJ();
  
  const screenWidth = manifest?.screenWidth || 240;
  const screenHeight = manifest?.screenHeight || 320;

  // Load the JAR when the component mounts or jarFile changes
  useEffect(() => {
    if (jarFile && manifest) {
      loadJAR(jarFile, manifest.className, screenWidth, screenHeight).catch(console.error);
    }
    
    return () => {
      stop();
    };
  }, [jarFile, manifest, loadJAR, stop, screenWidth, screenHeight]);

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const keyCode = KEYBOARD_MAPPING[e.code];
      if (keyCode !== undefined) {
        e.preventDefault();
        sendKeyEvent(keyCode, true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const keyCode = KEYBOARD_MAPPING[e.code];
      if (keyCode !== undefined) {
        e.preventDefault();
        sendKeyEvent(keyCode, false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [sendKeyEvent]);

  // Handle key press from virtual keypad
  const handleKeyPress = useCallback((keyCode: number, pressed: boolean) => {
    sendKeyEvent(keyCode, pressed);
  }, [sendKeyEvent]);

  return (
    <div className="emulator">
      <div className="emulator-header">
        <div className="game-info">
          <h2 className="game-title">{manifest?.midletName || 'Unknown Game'}</h2>
          <span className="game-meta">
            {manifest?.midletVendor} • v{manifest?.midletVersion}
          </span>
        </div>
        <div className="emulator-actions">
          <button className="btn btn-secondary" onClick={onExit}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Exit
          </button>
        </div>
      </div>

      <div className="emulator-content">
        <div className="phone-frame">
          <div className="phone-speaker"></div>
          <div 
            className="screen-container"
            ref={containerRef as React.RefObject<HTMLDivElement>}
            style={{
              width: screenWidth * 1.5,
              height: screenHeight * 1.5,
            }}
          >
            {/* CheerpJ will render canvas here */}
            
            {(status === 'loading' || status === 'initializing') && (
              <div className="screen-overlay">
                <div className="spinner"></div>
              </div>
            )}
            {status === 'error' && (
              <div className="screen-overlay error">
                <span>{cheerpjError || 'An error occurred'}</span>
              </div>
            )}
          </div>
          <div className="phone-brand">J2ME Browser</div>
        </div>

        <VirtualKeypad 
          onKeyPress={handleKeyPress}
          disabled={status !== 'running'}
        />
      </div>

      <div className="emulator-footer">
        <div className="status-indicator">
          <span className={`status-dot ${status}`}></span>
          <span className="status-text">
            {status === 'loading' && 'Loading game...'}
            {status === 'initializing' && 'Initializing Emulator...'}
            {status === 'running' && 'Game running'}
            {status === 'paused' && 'Paused'}
            {status === 'error' && 'Error'}
            {status === 'idle' && 'Ready'}
          </span>
        </div>
        <div className="screen-size">
          {screenWidth} × {screenHeight}
        </div>
      </div>
    </div>
  );
};

export default Emulator;
