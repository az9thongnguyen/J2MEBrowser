/**
 * J2ME Browser Emulator
 * Main Application Entry Point
 */

import { useState, useCallback } from 'react';
import JarLoader from './components/JarLoader';
import Emulator from './components/Emulator';
import { type JARManifest } from './utils/jarParser';
import './App.css';

interface LoadedGame {
  file: File;
  manifest: JARManifest;
}

function App() {
  const [loadedGame, setLoadedGame] = useState<LoadedGame | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleJarLoaded = useCallback((file: File, manifest: JARManifest) => {
    setIsLoading(true);
    
    // Small delay for UI feedback
    setTimeout(() => {
      setLoadedGame({ file, manifest });
      setIsLoading(false);
    }, 500);
  }, []);

  const handleExit = useCallback(() => {
    setLoadedGame(null);
  }, []);

  return (
    <div className="app">
      {!loadedGame ? (
        <main className="landing">
          <header className="landing-header">
            <div className="logo">
              <div className="logo-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                  <circle cx="12" cy="18" r="1" />
                </svg>
              </div>
              <h1 className="logo-text">
                <span className="text-gradient">J2ME</span> Browser
              </h1>
            </div>
            <p className="tagline">
              Play classic Java mobile games right in your browser
            </p>
          </header>

          <section className="loader-section">
            <JarLoader onJarLoaded={handleJarLoaded} isLoading={isLoading} />
          </section>

          <section className="features">
            <div className="feature-grid">
              <div className="feature-card">
                <div className="feature-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                </div>
                <h3>Load JAR Files</h3>
                <p>Simply drag and drop your .jar game files to start playing</p>
              </div>

              <div className="feature-card">
                <div className="feature-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                    <line x1="8" y1="21" x2="16" y2="21" />
                    <line x1="12" y1="17" x2="12" y2="21" />
                  </svg>
                </div>
                <h3>Virtual Controls</h3>
                <p>On-screen keypad and keyboard support for all devices</p>
              </div>

              <div className="feature-card">
                <div className="feature-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                </div>
                <h3>Instant Play</h3>
                <p>No installation required - games run directly in your browser</p>
              </div>
            </div>
          </section>

          <footer className="landing-footer">
            <p>
              Powered by <a href="https://cheerpj.com" target="_blank" rel="noopener noreferrer">CheerpJ</a> • 
              J2ME emulation in the browser
            </p>
            <p className="copyright">
              © 2026 J2ME Browser. For educational purposes only.
            </p>
          </footer>
        </main>
      ) : (
        <Emulator 
          jarFile={loadedGame.file}
          manifest={loadedGame.manifest}
          onExit={handleExit}
        />
      )}
    </div>
  );
}

export default App;
