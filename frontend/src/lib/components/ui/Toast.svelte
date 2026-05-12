<script lang="ts">
  import { toasts, removeToast } from "$lib/stores/ui";
  import { CheckCircle2, AlertCircle, Info, X } from "lucide-svelte";
  import { onMount } from "svelte";

  function getIcon(type: string) {
    if (type === "success") return CheckCircle2;
    if (type === "error") return AlertCircle;
    return Info;
  }
</script>

<div class="toast-container">
  {#each $toasts as toast (toast.id)}
    <div class="toast {toast.type}" role="alert">
      <svelte:component
        this={getIcon(toast.type)}
        size={18}
        class="toast-icon"
      />
      <span class="toast-message">{toast.message}</span>
      <button class="toast-close" on:click={() => removeToast(toast.id)}>
        <X size={14} />
      </button>
    </div>
  {/each}
</div>

<style>
  .toast-container {
    position: fixed;
    bottom: 24px;
    right: 24px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    z-index: 10000;
    pointer-events: none;
  }

  .toast {
    display: flex;
    align-items: center;
    gap: 12px;
    background: var(--color-bg-elevated);
    color: var(--color-text-primary);
    padding: 12px 16px;
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-lg);
    min-width: 300px;
    max-width: 400px;
    pointer-events: auto;
    animation: slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    border: 1px solid var(--color-border);
    border-left: 4px solid transparent;
  }

  .toast.success {
    border-left-color: var(--color-success);
  }
  .toast.error {
    border-left-color: var(--color-danger);
  }
  .toast.info {
    border-left-color: var(--color-accent-primary);
  }

  .toast-icon {
    flex-shrink: 0;
  }

  .toast.success :global(.toast-icon) {
    color: var(--color-success);
  }
  .toast.error :global(.toast-icon) {
    color: var(--color-danger);
  }
  .toast.info :global(.toast-icon) {
    color: var(--color-accent-primary);
  }

  .toast-message {
    flex: 1;
    font-size: 0.875rem;
    line-height: 1.4;
  }

  .toast-close {
    background: transparent;
    border: none;
    color: var(--color-text-muted);
    cursor: pointer;
    padding: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--radius-sm);
    transition: color 0.2s, background 0.2s;
  }

  .toast-close:hover {
    color: var(--color-text-primary);
    background: var(--color-bg-tertiary);
  }

  @media (max-width: 768px) {
    .toast-container {
      bottom: 72px;
      right: 16px;
      left: 16px;
    }
    .toast {
      min-width: auto;
      max-width: none;
    }
  }

  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
</style>
