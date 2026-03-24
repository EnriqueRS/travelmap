<script lang="ts">
  export let text: string = ""
  export let alt: string = ""
  export let type: "trip" | "location" | "profile" = "location"
  export let className: string = ""

  // Helper to generate consistent, premium dark gradients based on text
  function getPremiumGradient(str: string): string {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash)
    }

    // Curated dark, deep colors for a premium feel
    const palettes = [
      ["#0f172a", "#1e1b4b", "#312e81"], // Deep slate to indigo
      ["#052e16", "#064e3b", "#0f172a"], // Deep emerald to slate
      ["#4c0519", "#881337", "#171717"], // Deep rose to neutral dark
      ["#2e1065", "#4c1d95", "#0f172a"], // Deep purple to slate
      ["#172554", "#1e3a8a", "#0f172a"], // Deep blue to slate
    ]

    const paletteIndex = Math.abs(hash) % palettes.length
    const [c1, c2, c3] = palettes[paletteIndex]

    return `radial-gradient(circle at top left, ${c1}, transparent 80%), radial-gradient(circle at bottom right, ${c2}, transparent 80%), radial-gradient(circle at center, ${c3}, transparent 100%)`
  }

  function getIcon(t: string): string {
    switch (t) {
      case "trip":
        return "✈️"
      case "location":
        return "📍"
      case "profile":
        return "👤"
      default:
        return "📷"
    }
  }

  $: background = getPremiumGradient(text || alt || "placeholder")
  $: icon = getIcon(type)
</script>

<div
  class="image-placeholder {className}"
  style="background-image: {background}; background-color: #0f172a;"
>
  <div class="animated-mesh" />
  <div class="placeholder-content">
    <span class="icon">{icon}</span>
    {#if text}
      <span class="text" class:large={type === "trip"}>{text}</span>
    {/if}
  </div>
</div>

<style>
  .image-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: bold;
    text-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
    position: relative;
    overflow: hidden;
    /* Soft border inside */
    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.05);
  }

  .animated-mesh {
    position: absolute;
    inset: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(
      circle at 50% 50%,
      rgba(255, 255, 255, 0.03) 0%,
      transparent 50%
    );
    animation: rotateMesh 20s linear infinite;
    pointer-events: none;
    z-index: 0;
  }

  @keyframes rotateMesh {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }

  .image-placeholder::before {
    content: "";
    position: absolute;
    inset: 0;
    background: linear-gradient(
      to bottom,
      rgba(0, 0, 0, 0.1),
      rgba(0, 0, 0, 0.5)
    );
    z-index: 0;
  }

  .placeholder-content {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    text-align: center;
    padding: 1.5rem;
  }

  .icon {
    font-size: 2.5rem;
    filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.4));
    margin-bottom: 0.5rem;
  }

  .text {
    font-size: 1.1rem;
    max-width: 100%;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    letter-spacing: 0.02em;
    font-weight: 500;
  }

  .text.large {
    font-size: 1.5rem;
    font-weight: 700;
  }
</style>
