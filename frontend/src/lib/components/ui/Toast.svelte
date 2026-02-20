<script lang="ts">
  import { toasts, removeToast } from "$lib/stores/ui"
  import { CheckCircle2, AlertCircle, Info, X } from "lucide-svelte"
  import { onMount } from "svelte"

  function getIcon(type: string) {
    if (type === "success") return CheckCircle2
    if (type === "error") return AlertCircle
    return Info
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
    background: #1e293b;
    color: #f8fafc;
    padding: 12px 16px;
    border-radius: 8px;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.5);
    min-width: 300px;
    max-width: 400px;
    pointer-events: auto;
    animation: slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    border-left: 4px solid transparent;
  }

  .toast.success {
    border-left-color: #10b981;
  }
  .toast.error {
    border-left-color: #ef4444;
  }
  .toast.info {
    border-left-color: #3b82f6;
  }

  .toast-icon {
    flex-shrink: 0;
  }

  .toast.success :global(.toast-icon) {
    color: #10b981;
  }
  .toast.error :global(.toast-icon) {
    color: #ef4444;
  }
  .toast.info :global(.toast-icon) {
    color: #3b82f6;
  }

  .toast-message {
    flex: 1;
    font-size: 0.95rem;
    line-height: 1.4;
  }

  .toast-close {
    background: transparent;
    border: none;
    color: #94a3b8;
    cursor: pointer;
    padding: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    transition: color 0.2s, background 0.2s;
  }

  .toast-close:hover {
    color: #f8fafc;
    background: #334155;
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
