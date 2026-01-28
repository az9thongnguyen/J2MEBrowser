/**
 * JAR Loader Component
 * Drag-and-drop and file picker for loading J2ME games
 */

import React, { useCallback, useState, useRef } from 'react';
import { parseJAR, type JARManifest } from '../utils/jarParser';
import './JarLoader.css';

interface JarLoaderProps {
  onJarLoaded: (file: File, manifest: JARManifest) => void;
  isLoading?: boolean;
}

const JarLoader: React.FC<JarLoaderProps> = ({ onJarLoaded, isLoading = false }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.jar')) {
      setError('Please select a valid JAR file');
      return;
    }

    try {
      setError(null);
      const manifest = await parseJAR(file);
      onJarLoaded(file, manifest);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse JAR file');
    }
  }, [onJarLoaded]);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  }, [handleFile]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  }, [handleFile]);

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <div className="jar-loader">
      <div
        className={`drop-zone ${isDragging ? 'dragging' : ''} ${isLoading ? 'loading' : ''}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".jar"
          onChange={handleFileSelect}
          className="file-input"
        />

        {isLoading ? (
          <div className="loader-state">
            <div className="spinner"></div>
            <p className="loader-text">Loading game...</p>
          </div>
        ) : (
          <div className="idle-state">
            <div className="icon-container">
              <svg className="upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17,8 12,3 7,8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </div>
            <h3 className="loader-title">Load J2ME Game</h3>
            <p className="loader-subtitle">
              Drag & drop a <strong>.jar</strong> file here
            </p>
            <span className="or-divider">or</span>
            <button className="btn btn-primary browse-btn" type="button">
              Browse Files
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="error-message">
          <svg className="error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export default JarLoader;
