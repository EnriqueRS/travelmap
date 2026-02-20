<script lang="ts">
  export let text: string = ""
  export let alt: string = ""
  export let type: "trip" | "location" | "profile" = "location"
  export let className: string = ""

  // color generator based on the text for consistency
  function stringToColor(str: string): string {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash)
    }

    const h = Math.abs(hash % 360)
    return `hsl(${h}, 70%, 50%)`
  }

  // gradient generator based on the text for consistency
  function getGradient(str: string): string {
    const c1 = stringToColor(str)
    const c2 = stringToColor(str.split("").reverse().join(""))
    return `linear-gradient(135deg, ${c1}, ${c2})`
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

  $: background = getGradient(text || alt || "placeholder")
  $: icon = getIcon(type)
</script>

<div class="image-placeholder {className}" style="background: {background}">
  <div class="placeholder-content">
    <span class="icon">{icon}</span>
    {#if text}
      <span class="text">{text}</span>
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
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    position: relative;
    overflow: hidden;
  }

  .image-placeholder::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.1);
  }

  .placeholder-content {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    text-align: center;
    padding: 1rem;
  }

  .icon {
    font-size: 2rem;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
  }

  .text {
    font-size: 1.2rem;
    max-width: 100%;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
</style>
