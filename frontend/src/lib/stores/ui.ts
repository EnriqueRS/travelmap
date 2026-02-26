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
