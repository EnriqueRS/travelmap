<script lang="ts">
  /**
   * AiChat - Chat panel for Ryu the dragon.
   */
  import { fly, fade } from "svelte/transition";
  import { aiStore } from "./ai-store";
  import { Send, X, Sparkles } from "lucide-svelte";

  let inputText = "";
  let messagesContainer: HTMLDivElement;

  const { sendMessage } = aiStore;

  $: state = $aiStore;

  // No auto-scroll: let the user control scroll position manually

  function handleSend() {
    const text = inputText.trim();
    if (!text) return;
    inputText = "";
    sendMessage(text);
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleActionClick(action: string) {
    inputText = "";
    sendMessage(action);
  }

  function handleClose() {
    aiStore.toggle();
  }
</script>

<div
  class="ai-chat"
  transition:fly={{ y: 20, duration: 300 }}
  role="dialog"
  aria-label="Ryu travel companion chat"
>
  <!-- Header -->
  <header class="chat-header">
    <div class="chat-header-info">
      <svg
        class="header-dragon"
        width="32"
        height="36"
        viewBox="0 0 100 110"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <ellipse cx="50" cy="90" rx="28" ry="14" fill="#2d8a4e" />
        <ellipse cx="50" cy="75" rx="24" ry="12" fill="#2d8a4e" />
        <ellipse cx="50" cy="62" rx="20" ry="10" fill="#2d8a4e" />
        <ellipse cx="45" cy="26" rx="16" ry="12" fill="#2d8a4e" />
        <ellipse cx="52" cy="29" rx="10" ry="7" fill="#2d8a4e" />
        <ellipse cx="50" cy="90" rx="18" ry="8" fill="#ffa726" />
        <ellipse cx="50" cy="75" rx="15" ry="7" fill="#ffa726" />
        <ellipse cx="50" cy="62" rx="12" ry="5.5" fill="#ffa726" />
        <ellipse cx="38" cy="23" rx="4" ry="4.5" fill="#ff0000" />
        <ellipse cx="50" cy="23" rx="4" ry="4.5" fill="#ff0000" />
        <circle cx="38" cy="22" r="1.8" fill="#1a0000" />
        <circle cx="50" cy="22" r="1.8" fill="#1a0000" />
        <path d="M35 17 Q28 6 25 2" stroke="#3a9d5c" stroke-width="2.5" fill="none" stroke-linecap="round" />
        <path d="M55 17 Q62 6 65 2" stroke="#3a9d5c" stroke-width="2.5" fill="none" stroke-linecap="round" />
        <path d="M36 32 Q28 38 24 44" stroke="#3a9d5c" stroke-width="1.8" fill="none" stroke-linecap="round" />
        <path d="M58 32 Q66 38 70 44" stroke="#3a9d5c" stroke-width="1.8" fill="none" stroke-linecap="round" />
      </svg>
      <div class="header-text">
        <span class="header-name">Ryu</span>
        <span class="header-status">✦ Dragón guardián</span>
      </div>
    </div>
    <button class="close-btn" on:click={handleClose} aria-label="Close chat">
      <X size={18} />
    </button>
  </header>

  <!-- Messages -->
  <div class="messages" bind:this={messagesContainer}>
    {#if state.messages.length === 0}
      <div class="empty-state" transition:fade>
        <Sparkles size={24} style="color: var(--color-accent-primary, #3b82f6)" />
        <p>Pregúntame lo que desees sobre tus viajes, joven wanderer.</p>
      </div>
    {:else}
      {#each state.messages as msg, i (msg.id)}
        <div
          class="message {msg.role === 'user' ? 'message--user' : 'message--assistant'}"
          transition:fly={{ y: 8, duration: 250 }}
        >
          {#if msg.role === 'assistant'}
            <div class="message-avatar">
              <svg width="22" height="26" viewBox="0 0 100 110" fill="none">
                <ellipse cx="50" cy="62" rx="20" ry="10" fill="#2d8a4e" />
                <ellipse cx="45" cy="26" rx="16" ry="12" fill="#2d8a4e" />
                <ellipse cx="52" cy="29" rx="10" ry="7" fill="#2d8a4e" />
                <ellipse cx="38" cy="23" rx="4" ry="4.5" fill="#ff0000" />
                <ellipse cx="50" cy="23" rx="4" ry="4.5" fill="#ff0000" />
                <circle cx="38" cy="22" r="1.8" fill="#1a0000" />
                <circle cx="50" cy="22" r="1.8" fill="#1a0000" />
                <path d="M35 17 Q28 6 25 2" stroke="#3a9d5c" stroke-width="2.5" fill="none" />
                <path d="M55 17 Q62 6 65 2" stroke="#3a9d5c" stroke-width="2.5" fill="none" />
                <path d="M36 32 Q28 38 24 44" stroke="#3a9d5c" stroke-width="1.8" fill="none" />
                <path d="M58 32 Q66 38 70 44" stroke="#3a9d5c" stroke-width="1.8" fill="none" />
              </svg>
            </div>
          {/if}

          <div class="message-content">
            <p>{msg.content}</p>
            {#if msg.suggestedActions && i === state.messages.length - 1}
              <div class="message-actions">
                {#each [...msg.suggestedActions].sort(() => Math.random() - 0.5).slice(0, 3) as action}
                  <button
                    class="action-chip"
                    on:click={() => handleActionClick(action)}
                  >
                    {action}
                  </button>
                {/each}
              </div>
            {/if}
          </div>
        </div>
      {/each}

      {#if state.mode === 'loading'}
        <div class="message message--assistant" transition:fade>
          <div class="message-avatar">
            <svg width="22" height="26" viewBox="0 0 100 110" fill="none">
              <ellipse cx="45" cy="26" rx="16" ry="12" fill="#2d8a4e" />
              <ellipse cx="38" cy="23" rx="4" ry="4.5" fill="#ff0000" />
              <ellipse cx="50" cy="23" rx="4" ry="4.5" fill="#ff0000" />
              <path d="M35 17 Q28 6 25 2" stroke="#3a9d5c" stroke-width="2.5" fill="none" />
              <path d="M55 17 Q62 6 65 2" stroke="#3a9d5c" stroke-width="2.5" fill="none" />
            </svg>
          </div>
          <div class="message-content">
            <span class="typing-dots">
              <span class="dot" />
              <span class="dot" />
              <span class="dot" />
            </span>
          </div>
        </div>
      {/if}

      {#if state.error}
        <div class="error-message" transition:fade>
          <p>⚠️ {state.error}</p>
          <button class="retry-btn" on:click={() => {
            const lastMsg = state.messages[state.messages.length - 1];
            if (lastMsg) sendMessage(lastMsg.content);
          }}>
            Reintentar
          </button>
        </div>
      {/if}
    {/if}
  </div>

  <!-- Input -->
  <div class="input-area">
    <input
      type="text"
      class="chat-input"
      placeholder="Pregúntame algo sobre tus viajes..."
      bind:value={inputText}
      on:keydown={handleKeydown}
      disabled={state.mode === 'loading'}
    />
    <button
      class="send-btn"
      on:click={handleSend}
      disabled={!inputText.trim() || state.mode === 'loading'}
      aria-label="Send message"
    >
      <Send size={16} />
    </button>
  </div>
</div>

<style>
  .ai-chat {
    display: flex;
    flex-direction: column;
    background: var(--color-bg-primary, #0f172a);
    border: 1px solid var(--color-bg-tertiary, #334155);
    border-radius: 16px;
    width: 360px;
    max-width: calc(100vw - 60px);
    height: 520px;
    overflow: hidden;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  }

  .chat-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem 1rem;
    background: var(--color-bg-secondary, #1e293b);
    border-bottom: 1px solid var(--color-bg-tertiary, #334155);
    flex-shrink: 0;
  }
  .chat-header-info {
    display: flex;
    align-items: center;
    gap: 0.6rem;
  }
  .header-dragon {
    width: 28px;
    height: 32px;
  }
  .header-text {
    display: flex;
    flex-direction: column;
  }
  .header-name {
    font-weight: 600;
    font-size: 0.9rem;
    color: var(--color-text-primary, #e2e8f0);
  }
  .header-status {
    font-size: 0.68rem;
    color: #22c55e;
  }

  .close-btn {
    background: none;
    border: none;
    color: var(--color-text-secondary, #94a3b8);
    cursor: pointer;
    padding: 4px;
    border-radius: 6px;
    transition: background 0.2s;
  }
  .close-btn:hover {
    background: var(--color-bg-tertiary, #334155);
    color: var(--color-text-primary, #e2e8f0);
  }

  .messages {
    flex: 1;
    overflow-y: auto;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    scroll-behavior: smooth;
  }
  .messages::-webkit-scrollbar {
    width: 4px;
  }
  .messages::-webkit-scrollbar-thumb {
    background: var(--color-bg-tertiary, #334155);
    border-radius: 4px;
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    gap: 1rem;
    padding: 2rem 1rem;
    color: var(--color-text-secondary, #94a3b8);
    flex: 1;
  }
  .empty-state p {
    font-size: 0.9rem;
    max-width: 280px;
  }

  .message {
    display: flex;
    gap: 8px;
    max-width: 90%;
    min-width: 0;
  }
  .message--user {
    align-self: flex-end;
    flex-direction: row-reverse;
  }
  .message--assistant {
    align-self: flex-start;
  }
  .message-avatar {
    flex-shrink: 0;
    width: 24px;
    height: 26px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: 4px;
  }
  .message-content {
    background: var(--color-bg-secondary, #1e293b);
    padding: 0.6rem 0.9rem;
    border-radius: 12px;
    font-size: 0.85rem;
    line-height: 1.45;
    color: var(--color-text-primary, #e2e8f0);
    min-width: 0;
    max-width: 100%;
    overflow-wrap: break-word;
    word-break: break-word;
  }
  .message--user .message-content {
    background: var(--color-accent-primary, #3b82f6);
    color: #ffffff;
    border-bottom-right-radius: 4px;
  }
  .message--assistant .message-content {
    border-bottom-left-radius: 4px;
  }
  .message-content p {
    margin: 0;
    white-space: pre-wrap;
    overflow-wrap: break-word;
    word-break: break-word;
  }
  .message-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    margin-top: 8px;
    padding-top: 6px;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
  }
  .action-chip {
    background: transparent;
    color: var(--color-accent-primary, #60a5fa);
    border: 1px solid var(--color-accent-primary, #3b82f6);
    padding: 0.25rem 0.6rem;
    border-radius: 12px;
    font-size: 0.75rem;
    cursor: pointer;
    transition: all 0.2s;
    white-space: normal;
    text-align: left;
    word-break: break-word;
  }
  .action-chip:hover {
    background: var(--color-accent-primary, #3b82f6);
    color: #ffffff;
  }

  .typing-dots {
    display: flex;
    gap: 4px;
    align-items: center;
    padding: 0.5rem 0;
  }
  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #94a3b8;
    animation: bounce 1.4s infinite ease-in-out both;
  }
  .dot:nth-child(1) { animation-delay: -0.32s; }
  .dot:nth-child(2) { animation-delay: -0.16s; }
  .dot:nth-child(3) { animation-delay: 0s; }
  @keyframes bounce {
    0%, 80%, 100% { transform: scale(0); }
    40% { transform: scale(1); }
  }

  .error-message {
    text-align: center;
    padding: 0.5rem;
    color: #ef4444;
    font-size: 0.8rem;
  }
  .retry-btn {
    background: none;
    border: 1px solid #ef4444;
    color: #ef4444;
    padding: 0.25rem 0.75rem;
    border-radius: 8px;
    cursor: pointer;
    font-size: 0.75rem;
    margin-top: 4px;
  }
  .retry-btn:hover {
    background: #ef4444;
    color: #ffffff;
  }

  .input-area {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 0.75rem 1rem;
    background: var(--color-bg-secondary, #1e293b);
    border-top: 1px solid var(--color-bg-tertiary, #334155);
    flex-shrink: 0;
  }
  .chat-input {
    flex: 1;
    background: var(--color-bg-primary, #0f172a);
    border: 1px solid var(--color-bg-tertiary, #334155);
    border-radius: 24px;
    padding: 0.5rem 1rem;
    color: var(--color-text-primary, #e2e8f0);
    font-size: 0.85rem;
    outline: none;
    transition: border-color 0.2s;
  }
  .chat-input:focus {
    border-color: var(--color-accent-primary, #3b82f6);
  }
  .chat-input::placeholder {
    color: var(--color-text-secondary, #64748b);
  }
  .chat-input:disabled {
    opacity: 0.6;
  }
  .send-btn {
    background: var(--color-accent-primary, #3b82f6);
    border: none;
    color: #ffffff;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: background 0.2s;
    flex-shrink: 0;
  }
  .send-btn:hover:not(:disabled) {
    background: var(--color-accent-hover, #2563eb);
  }
  .send-btn:disabled {
    opacity: 0.5;
    cursor: default;
  }

  @media (max-width: 768px) {
    .ai-chat {
      width: 100%;
      max-width: 100%;
      height: 100vh;
      height: 100dvh;
      border-radius: 0;
    }
  }
</style>