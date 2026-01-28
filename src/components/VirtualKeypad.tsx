/**
 * Virtual Keypad Component
 * On-screen phone keypad for J2ME games
 */

import React, { useCallback } from 'react';
import { J2ME_KEYS } from '../hooks/useCheerpJ';
import './VirtualKeypad.css';

interface VirtualKeypadProps {
  onKeyPress: (keyCode: number, pressed: boolean) => void;
  disabled?: boolean;
}

interface KeyConfig {
  label: string;
  subLabel?: string;
  keyCode: number;
  className?: string;
}

const dpadKeys: KeyConfig[] = [
  { label: '▲', keyCode: J2ME_KEYS.UP, className: 'key-up' },
  { label: '◀', keyCode: J2ME_KEYS.LEFT, className: 'key-left' },
  { label: '●', keyCode: J2ME_KEYS.FIRE, className: 'key-fire' },
  { label: '▶', keyCode: J2ME_KEYS.RIGHT, className: 'key-right' },
  { label: '▼', keyCode: J2ME_KEYS.DOWN, className: 'key-down' },
];

const softKeys: KeyConfig[] = [
  { label: 'Options', keyCode: J2ME_KEYS.SOFT_LEFT, className: 'key-soft-left' },
  { label: 'Back', keyCode: J2ME_KEYS.SOFT_RIGHT, className: 'key-soft-right' },
];

const numpadKeys: KeyConfig[] = [
  { label: '1', subLabel: '', keyCode: J2ME_KEYS.KEY_1 },
  { label: '2', subLabel: 'ABC', keyCode: J2ME_KEYS.KEY_2 },
  { label: '3', subLabel: 'DEF', keyCode: J2ME_KEYS.KEY_3 },
  { label: '4', subLabel: 'GHI', keyCode: J2ME_KEYS.KEY_4 },
  { label: '5', subLabel: 'JKL', keyCode: J2ME_KEYS.KEY_5 },
  { label: '6', subLabel: 'MNO', keyCode: J2ME_KEYS.KEY_6 },
  { label: '7', subLabel: 'PQRS', keyCode: J2ME_KEYS.KEY_7 },
  { label: '8', subLabel: 'TUV', keyCode: J2ME_KEYS.KEY_8 },
  { label: '9', subLabel: 'WXYZ', keyCode: J2ME_KEYS.KEY_9 },
  { label: '*', keyCode: J2ME_KEYS.KEY_STAR },
  { label: '0', subLabel: '+', keyCode: J2ME_KEYS.KEY_0 },
  { label: '#', keyCode: J2ME_KEYS.KEY_HASH },
];

const VirtualKeypad: React.FC<VirtualKeypadProps> = ({ onKeyPress, disabled = false }) => {
  const handleTouchStart = useCallback((keyCode: number) => (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    if (!disabled) {
      onKeyPress(keyCode, true);
    }
  }, [onKeyPress, disabled]);

  const handleTouchEnd = useCallback((keyCode: number) => (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    if (!disabled) {
      onKeyPress(keyCode, false);
    }
  }, [onKeyPress, disabled]);

  const renderKey = (key: KeyConfig) => (
    <button
      key={key.keyCode}
      className={`keypad-key ${key.className || ''} ${disabled ? 'disabled' : ''}`}
      onMouseDown={handleTouchStart(key.keyCode)}
      onMouseUp={handleTouchEnd(key.keyCode)}
      onMouseLeave={handleTouchEnd(key.keyCode)}
      onTouchStart={handleTouchStart(key.keyCode)}
      onTouchEnd={handleTouchEnd(key.keyCode)}
      disabled={disabled}
    >
      <span className="key-label">{key.label}</span>
      {key.subLabel && <span className="key-sublabel">{key.subLabel}</span>}
    </button>
  );

  return (
    <div className={`virtual-keypad ${disabled ? 'disabled' : ''}`}>
      {/* Soft Keys */}
      <div className="keypad-soft-keys">
        {softKeys.map(renderKey)}
      </div>

      {/* D-Pad */}
      <div className="keypad-dpad">
        <div className="dpad-row dpad-top">
          {renderKey(dpadKeys[0])}
        </div>
        <div className="dpad-row dpad-middle">
          {renderKey(dpadKeys[1])}
          {renderKey(dpadKeys[2])}
          {renderKey(dpadKeys[3])}
        </div>
        <div className="dpad-row dpad-bottom">
          {renderKey(dpadKeys[4])}
        </div>
      </div>

      {/* Numpad */}
      <div className="keypad-numpad">
        {numpadKeys.map(renderKey)}
      </div>

      {/* Keyboard Hints */}
      <div className="keyboard-hints">
        <span>⌨️ Keyboard: Arrow Keys, Enter, Q/E (Soft Keys), 0-9</span>
      </div>
    </div>
  );
};

export default VirtualKeypad;
