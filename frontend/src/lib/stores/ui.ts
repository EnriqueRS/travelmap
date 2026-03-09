import { writable } from "svelte/store";

export type ToastType = "success" | "error" | "info";

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

export const toasts = writable<Toast[]>([]);

export function addToast(
  message: string,
  type: ToastType = "info",
  duration = 3000
) {
  const id = crypto.randomUUID();
  toasts.update((current) => [...current, { id, message, type }]);

  if (duration > 0) {
    setTimeout(() => {
      removeToast(id);
    }, duration);
  }
}

export function removeToast(id: string) {
  toasts.update((current) => current.filter((t) => t.id !== id));
}

export const toast = {
  success: (msg: string) => addToast(msg, "success"),
  error: (msg: string) => addToast(msg, "error"),
  info: (msg: string) => addToast(msg, "info"),
};

export type ThemeType = "theme-sea-blue" | "theme-light" | "theme-neon-obsidian";

function createThemeStore() {
  const isBrowser = typeof window !== "undefined";
  const storedTheme = isBrowser ? localStorage.getItem("travelmapTheme") as ThemeType : "theme-sea-blue";
  
  const { subscribe, set, update } = writable<ThemeType>(storedTheme || "theme-sea-blue");

  return {
    subscribe,
    set: (value: ThemeType) => {
      if (isBrowser) {
        localStorage.setItem("travelmapTheme", value);
      }
      set(value);
    },
    update
  };
}

export const themeStore = createThemeStore();

export type LangType = "es" | "en";

function createLanguageStore() {
  const isBrowser = typeof window !== "undefined";
  // Default to Spanish to match the original application behavior, 
  // but allow restoring from saved preference.
  const storedLang = isBrowser ? localStorage.getItem("travelmapLang") as LangType : "es";
  
  const { subscribe, set, update } = writable<LangType>(storedLang || "es");

  return {
    subscribe,
    set: (value: LangType) => {
      if (isBrowser) {
        localStorage.setItem("travelmapLang", value);
      }
      set(value);
    },
    update
  };
}

export const languageStore = createLanguageStore();
