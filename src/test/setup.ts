import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// jsdom ships no layout/APIs the app touches on mount.
beforeEach(() => {
  localStorage.clear();
  window.history.replaceState({}, '', '/');
  if (!window.matchMedia) {
    // @ts-expect-error – test shim
    window.matchMedia = () => ({
      matches: false,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    });
  }
  window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;
  Element.prototype.scrollIntoView = vi.fn();
  Element.prototype.scrollTo = vi.fn();
  window.open = vi.fn() as unknown as typeof window.open;
});

afterEach(() => {
  cleanup();
});
