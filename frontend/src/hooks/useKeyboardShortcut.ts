import { useEffect } from 'react';

interface ShortcutConfig {
  key: string;
  ctrlOrMeta?: boolean;
  shift?: boolean;
  alt?: boolean;
  callback: (e: KeyboardEvent) => void;
  allowInInputs?: boolean;
}

/**
 * Reusable keyboard shortcut hook.
 * Handles system-wide commands (Ctrl+K, Esc, /, etc.).
 */
export function useKeyboardShortcut(shortcuts: ShortcutConfig[]) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInput =
        activeEl?.tagName === 'INPUT' ||
        activeEl?.tagName === 'TEXTAREA' ||
        activeEl?.getAttribute('contenteditable') === 'true';

      for (const sc of shortcuts) {
        if (isInput && !sc.allowInInputs) continue;

        const keyMatches = e.key.toLowerCase() === sc.key.toLowerCase();
        const ctrlMatches = sc.ctrlOrMeta ? e.ctrlKey || e.metaKey : true;
        const shiftMatches = sc.shift !== undefined ? e.shiftKey === sc.shift : true;
        const altMatches = sc.alt !== undefined ? e.altKey === sc.alt : true;

        if (keyMatches && ctrlMatches && shiftMatches && altMatches) {
          e.preventDefault();
          sc.callback(e);
          break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
}
