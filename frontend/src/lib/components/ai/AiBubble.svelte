<script lang="ts">
  /**
   * AiBubble - Comic-style speech bubble component.
   * Shows text with a tail pointing in the specified direction.
   */
  import { fly } from "svelte/transition";
  import { onDestroy } from "svelte";

  export let text: string = "";
  export let tail: "left" | "right" | "bottom" = "left";
  export let color: "white" | "accent" = "white";
  export let typing: boolean = false;
  export let onDismiss: (() => void) | null = null;

  $: displayedText = typing ? text.slice(0, Math.floor(animatedPos)) : text;

  let animatedPos = 0;
  let typingInterval: ReturnType<typeof setInterval> | undefined;

  $: if (typing && text) {
    animatedPos = 0;
    typingInterval = setInterval(() => {
      animatedPos += 1;
      if (animatedPos >= text.length) {
        clearInterval(typingInterval);
      }
    }, 20);
  }

  onDestroy(() => {
    if (typingInterval) clearInterval(typingInterval);
  });
</script>

<div
  class="ai-bubble ai-bubble--{color} ai-bubble--tail-{tail}"
  transition:fly={{ y: 10, duration: 300 }}
  role="status"
  aria-live="polite"
>
  {#if typing && !text}
    <span class="typing-dots">
      <span class="dot" />
      <span class="dot" />
      <span class="dot" />
    </span>
  {:else}
    <p class="bubble-text">{displayedText}</p>
  {/if}

  {#if onDismiss && !typing}
    <button class="dismiss-btn" on:click={onDismiss} aria-label="Close">
      &times;
    </button>
  {/if}

  {#if typing && text && animatedPos < text.length}
    <span class="cursor-blink">|</span>
  {/if}
</div>

<style>
  .ai-bubble {
    position: relative;
    padding: 1rem 1.25rem;
    border-radius: 16px;
    font-size: 0.9rem;
    line-height: 1.5;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    max-width: 320px;
    word-wrap: break-word;
    min-height: 44px;
  }

  .ai-bubble--white {
    background: #ffffff;
    color: #1e293b;
    border: 2px solid #cbd5e1;
  }
  .ai-bubble--accent {
    background: var(--color-accent-primary, #3b82f6);
    color: #ffffff;
    border: none;
  }

  .ai-bubble--tail-left::after {
    content: "";
    position: absolute;
    left: -12px;
    top: 20px;
    width: 0;
    height: 0;
    border-top: 10px solid transparent;
    border-bottom: 10px solid transparent;
    border-right: 12px solid #ffffff;
    filter: drop-shadow(-2px 2px 4px rgba(0, 0, 0, 0.1));
  }
  .ai-bubble--white.ai-bubble--tail-left::after {
    border-right-color: #ffffff;
  }
  .ai-bubble--accent.ai-bubble--tail-left::after {
    border-right-color: var(--color-accent-primary, #3b82f6);
  }

  .ai-bubble--tail-right::after {
    content: "";
    position: absolute;
    right: -12px;
    top: 20px;
    width: 0;
    height: 0;
    border-top: 10px solid transparent;
    border-bottom: 10px solid transparent;
    border-left: 12px solid #ffffff;
    filter: drop-shadow(2px 2px 4px rgba(0, 0, 0, 0.1));
  }

  .ai-bubble--tail-bottom::after {
    content: "";
    position: absolute;
    bottom: -10px;
    left: 30px;
    width: 0;
    height: 0;
    border-left: 10px solid transparent;
    border-right: 10px solid transparent;
    border-top: 10px solid #ffffff;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
  }

  .bubble-text {
    margin: 0;
    white-space: pre-wrap;
  }

  .dismiss-btn {
    position: absolute;
    top: 4px;
    right: 8px;
    background: none;
    border: none;
    font-size: 1.2rem;
    cursor: pointer;
    color: #94a3b8;
    line-height: 1;
    padding: 2px;
  }
  .dismiss-btn:hover {
    color: #64748b;
  }

  .typing-dots {
    display: flex;
    gap: 4px;
    align-items: center;
    padding: 0.25rem 0;
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

  .cursor-blink {
    animation: blink 1s step-end infinite;
    margin-left: 2px;
    font-weight: bold;
    color: var(--color-accent-primary, #3b82f6);
  }
  @keyframes blink {
    50% { opacity: 0; }
  }
</style>