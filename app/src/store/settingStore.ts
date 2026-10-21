import { useState, useEffect } from 'react';

const STORAGE_FONT_KEY = 'family_trip_font_mode_v1';

// 四段字級：標準 → 大 → 特大 → 超大（實際放大倍率在 index.css）
export type FontMode = 'normal' | 'large' | 'xlarge' | 'xxlarge';

const FONT_MODES: FontMode[] = ['normal', 'large', 'xlarge', 'xxlarge'];

export function getFontLevel(mode: FontMode): number {
  return FONT_MODES.indexOf(mode) + 1;
}

export function getFontMode(): FontMode {
  try {
    const val = localStorage.getItem(STORAGE_FONT_KEY) as FontMode | null;
    return val && FONT_MODES.includes(val) ? val : 'normal';
  } catch {
    return 'normal';
  }
}

export function setFontMode(mode: FontMode): void {
  try {
    localStorage.setItem(STORAGE_FONT_KEY, mode);
    document.documentElement.dataset.fontMode = mode;
    window.dispatchEvent(new Event('font_mode_changed'));
  } catch (e) {
    console.error('Failed to save font mode', e);
  }
}

// 初始化時立即套用到 html 標籤
if (typeof document !== 'undefined') {
  document.documentElement.dataset.fontMode = getFontMode();
}

export function useFontMode(): [FontMode, (mode?: FontMode) => void] {
  const [mode, setMode] = useState<FontMode>(() => getFontMode());

  useEffect(() => {
    const update = () => {
      const current = getFontMode();
      setMode(current);
      document.documentElement.dataset.fontMode = current;
    };

    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_FONT_KEY) update();
    };

    window.addEventListener('font_mode_changed', update);
    window.addEventListener('storage', onStorage);

    return () => {
      window.removeEventListener('font_mode_changed', update);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  // 沒指定字級時：依序切換到下一段，超大之後回到標準
  const toggle = (nextMode?: FontMode) => {
    const target =
      nextMode !== undefined
        ? nextMode
        : FONT_MODES[(FONT_MODES.indexOf(mode) + 1) % FONT_MODES.length];
    setFontMode(target);
    setMode(target);
  };

  return [mode, toggle];
}
