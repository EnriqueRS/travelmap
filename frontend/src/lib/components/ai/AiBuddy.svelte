<script lang="ts">
  /**
   * AiBuddy - Ryu, the Shenron-style dragon travel companion.
   * On mount: 7 dragon balls appear → glow → merge → Ryu is summoned.
   * Click Ryu to open/close the chat panel.
   */
  import { onMount } from "svelte";
  import { fly, fade } from "svelte/transition";
  import { aiStore } from "./ai-store";
  import { languageStore } from "$lib/stores/ui";
  import AiChat from "./AiChat.svelte";

  // ─── Summoning animation state ─────────────────
  const DRAGON_BALLS = [
    { stars: 1, cx: 50, cy: 15 },
    { stars: 2, cx: 85, cy: 30 },
    { stars: 3, cx: 95, cy: 65 },
    { stars: 4, cx: 80, cy: 95 },
    { stars: 5, cx: 20, cy: 95 },
    { stars: 6, cx: 5, cy: 65 },
    { stars: 7, cx: 15, cy: 30 },
  ];

  let phase: "summoning" | "summoned" = "summoning";
  let summonProgress = 0;
  let showFlash = false;

  const { subscribe, openWithGreeting, toggle, preloadGreeting } = aiStore;

  $: state = $aiStore;
  $: lang = $languageStore;
  $: showChat = state.mode === "chatting" || state.mode === "loading";
  $: dragonAnimState = phase === "summoning"
    ? "hidden"
    : state.mode === "loading"
      ? "thinking"
      : "talking";

  let showHint = false;
  let hintDismissed = false;

  onMount(async () => {
    await animateProgress(0, 35, 700);
    await animateProgress(35, 72, 1000);
    showFlash = true;
    await animateProgress(72, 88, 400);
    showFlash = false;
    phase = "summoned";
    await animateProgress(88, 100, 600);

    // Preload greeting so it's ready when user clicks
    preloadGreeting(lang);

    // Show subtle hint after a few seconds.
    setTimeout(() => {
      if (!hintDismissed) showHint = true;
    }, 2000);
    setTimeout(() => {
      showHint = false;
    }, 7000);
  });

  function handleRyuClick() {
    hintDismissed = true;
    showHint = false;
    toggle(lang);
  }

  function animateProgress(from: number, to: number, duration: number): Promise<void> {
    return new Promise((resolve) => {
      const start = performance.now();
      function step(now: number) {
        const elapsed = now - start;
        const t = Math.min(elapsed / duration, 1);
        summonProgress = from + (to - from) * t;
        if (t < 1) requestAnimationFrame(step);
        else resolve();
      }
      requestAnimationFrame(step);
    });
  }

  $: ballPositions = computeBallPositions(summonProgress);

  function computeBallPositions(progress: number) {
    const centerX = 50, centerY = 50;
    return DRAGON_BALLS.map((ball, i) => {
      const angle = (i / 7) * Math.PI * 2 - Math.PI / 2;
      const spreadRadius = 42;
      const shrinkRadius = Math.max(0, spreadRadius * (1 - progress / 100));
      const cx = centerX + Math.cos(angle) * shrinkRadius;
      const cy = centerY + Math.sin(angle) * shrinkRadius;
      const scale = 1 - (progress / 100) * 0.6;
      const opacity = progress < 10 ? progress / 10 : progress > 85 ? (100 - progress) / 15 : 1;
      return { ...ball, cx, cy, scale, opacity };
    });
  }

  const starPath = "M0 -3 L0.9 -1 L3 -1 L1.3 0.5 L2 3 L0 1.2 L-2 3 L-1.3 0.5 L-3 -1 L-0.9 -1 Z";
</script>

<div
  class="ryu-buddy"
  class:ryu-buddy--chat-open={showChat}
  role="complementary"
  aria-label="Ryu dragon travel companion"
>
  {#if showChat}
    <div class="chat-wrapper" transition:fly={{ y: 16, duration: 300 }}>
      <AiChat />
    </div>
  {/if}

  {#if phase === "summoning"}
    <div class="summoning-container">
      {#each ballPositions as ball, i}
        <div
          class="dragon-ball"
          style="left:{ball.cx}px;top:{ball.cy}px;transform:translate(-50%,-50%) scale({ball.scale});opacity:{ball.opacity};z-index:{summonProgress > 60 && i === 3 ? 20 : 10}"
        >
          <svg width="28" height="28" viewBox="0 0 28 28">
            <defs>
              <radialGradient id="ballGrad{i}" cx="38%" cy="32%">
                <stop offset="0%" stop-color="#ff8c42" />
                <stop offset="50%" stop-color="#e63900" />
                <stop offset="100%" stop-color="#8b1a00" />
              </radialGradient>
            </defs>
            <circle cx="14" cy="14" r="13" fill="rgba(255, 140, 66, {0.15 + summonProgress / 300})" />
            <circle cx="14" cy="14" r="11" fill={`url(#ballGrad${i})`} stroke="#ff6b35" stroke-width="0.5" />
            <ellipse cx="10" cy="9" rx="4.5" ry="2.5" fill="rgba(255,255,255,0.25)" transform="rotate(-30,10,9)" />
            {#if ball.stars === 1}
              <path d={starPath} fill="#ff0000" transform="translate(14,14) scale(0.7)" />
            {:else if ball.stars === 2}
              <path d={starPath} fill="#ff0000" transform="translate(10,10) scale(0.6)" />
              <path d={starPath} fill="#ff0000" transform="translate(18,18) scale(0.6)" />
            {:else if ball.stars === 3}
              <path d={starPath} fill="#ff0000" transform="translate(10,10) scale(0.55)" />
              <path d={starPath} fill="#ff0000" transform="translate(18,10) scale(0.55)" />
              <path d={starPath} fill="#ff0000" transform="translate(14,18) scale(0.55)" />
            {:else if ball.stars === 4}
              <path d={starPath} fill="#ff0000" transform="translate(9,9) scale(0.5)" />
              <path d={starPath} fill="#ff0000" transform="translate(19,9) scale(0.5)" />
              <path d={starPath} fill="#ff0000" transform="translate(9,19) scale(0.5)" />
              <path d={starPath} fill="#ff0000" transform="translate(19,19) scale(0.5)" />
            {:else if ball.stars === 5}
              <path d={starPath} fill="#ff0000" transform="translate(14,8) scale(0.5)" />
              <path d={starPath} fill="#ff0000" transform="translate(9,14) scale(0.5)" />
              <path d={starPath} fill="#ff0000" transform="translate(19,14) scale(0.5)" />
              <path d={starPath} fill="#ff0000" transform="translate(11,20) scale(0.5)" />
              <path d={starPath} fill="#ff0000" transform="translate(17,20) scale(0.5)" />
            {:else if ball.stars === 6}
              <path d={starPath} fill="#ff0000" transform="translate(14,8) scale(0.45)" />
              <path d={starPath} fill="#ff0000" transform="translate(8,13) scale(0.45)" />
              <path d={starPath} fill="#ff0000" transform="translate(20,13) scale(0.45)" />
              <path d={starPath} fill="#ff0000" transform="translate(8,19) scale(0.45)" />
              <path d={starPath} fill="#ff0000" transform="translate(20,19) scale(0.45)" />
              <path d={starPath} fill="#ff0000" transform="translate(14,22) scale(0.45)" />
            {:else}
              <path d={starPath} fill="#ff0000" transform="translate(14,7) scale(0.45)" />
              <path d={starPath} fill="#ff0000" transform="translate(9,11) scale(0.45)" />
              <path d={starPath} fill="#ff0000" transform="translate(19,11) scale(0.45)" />
              <path d={starPath} fill="#ff0000" transform="translate(7,17) scale(0.45)" />
              <path d={starPath} fill="#ff0000" transform="translate(21,17) scale(0.45)" />
              <path d={starPath} fill="#ff0000" transform="translate(12,21) scale(0.45)" />
              <path d={starPath} fill="#ff0000" transform="translate(16,21) scale(0.45)" />
            {/if}
          </svg>
        </div>
      {/each}
      {#if showFlash}
        <div class="summon-flash" transition:fade={{ duration: 200 }} />
      {/if}
      <svg class="energy-lines" width="100" height="100" viewBox="0 0 100 100">
        {#if summonProgress > 20}
          {#each DRAGON_BALLS as ball, i}
            {#each DRAGON_BALLS.slice(i + 1) as other, j}
              <line
                x1={ballPositions[i].cx} y1={ballPositions[i].cy}
                x2={ballPositions[j + i + 1].cx} y2={ballPositions[j + i + 1].cy}
                stroke="#22c55e" stroke-width={0.5 + summonProgress / 80}
                opacity={0.1 + summonProgress / 200}
              />
            {/each}
          {/each}
        {/if}
      </svg>
    </div>
  {/if}

  {#if phase === "summoned"}
    <!-- Subtle hint bubble -->
    {#if showHint && !showChat}
      <div class="ryu-hint" transition:fly={{ y: 8, duration: 400 }}>
        <span>{$languageStore === 'en' ? 'Click me!' : '¡Click aquí!'}</span>
      </div>
    {/if}
    <button
      class="ryu-avatar"
      class:ryu-avatar--thinking={dragonAnimState === 'thinking'}
      class:ryu-avatar--talking={dragonAnimState === 'talking'}
      class:ryu-avatar--hint={showHint && !showChat}
      on:click={handleRyuClick}
      aria-label={showChat ? 'Close chat' : 'Open chat'}
    >
      <svg
        class="ryu-svg"
        width="110" height="120"
        viewBox="0 0 110 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <!-- Gradientes mejorados -->
          <radialGradient id="ryuAura" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#7acf4a" stop-opacity="0.35" />
            <stop offset="60%" stop-color="#7acf4a" stop-opacity="0.1" />
            <stop offset="100%" stop-color="#7acf4a" stop-opacity="0" />
          </radialGradient>

          <linearGradient id="bodyGreen" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#5cb82e" />
            <stop offset="50%" stop-color="#32731c" />
            <stop offset="100%" stop-color="#1e4711" />
          </linearGradient>

          <linearGradient id="bellyYellow" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#f5e6a3" />
            <stop offset="100%" stop-color="#c4a548" />
          </linearGradient>

          <linearGradient id="hornWood" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stop-color="#4a2e19" />
            <stop offset="100%" stop-color="#805030" />
          </linearGradient>
        </defs>

        <!-- Sombra base -->
        <ellipse cx="55" cy="116" rx="36" ry="5" fill="rgba(0,0,0,0.3)" />

        <!-- Aura de energía -->
        <ellipse class="ryu-aura" cx="55" cy="60" rx="54" ry="54" fill="url(#ryuAura)" />

        <!-- Salpicaduras de tinta de fondo -->
        <g class="ryu-ink-splatters" opacity="0.5">
          <circle cx="55" cy="20" r="30" stroke="#1a1a1a" stroke-width="0.8" stroke-dasharray="3 4 2 5" fill="none" />
          <circle cx="15" cy="30" r="1.5" fill="#1a1a1a" />
          <circle cx="95" cy="25" r="2" fill="#1a1a1a" />
          <circle cx="20" cy="10" r="1" fill="#1a1a1a" />
          <path d="M12 40 Q 8 48 15 52" stroke="#1a1a1a" stroke-width="1.2" fill="none" />
          <path d="M98 40 Q 102 48 95 52" stroke="#1a1a1a" stroke-width="1.2" fill="none" />
        </g>

        <!-- ─── CUERPO ENROLLADO DE DRAGÓN ─── -->
        <g class="ryu-body">

          <!-- 1. COLA (Sale desde abajo a la izquierda) -->
          <path d="M 20 92 C 8 82, 3 68, 12 55 C 16 50, 22 52, 26 58 L 28 62 C 24 56, 18 54, 16 58 C 8 68, 12 82, 22 90 Z" fill="url(#bodyGreen)" stroke="#1a1a1a" stroke-width="2" stroke-linejoin="round" />
          <!-- Aleta final de la cola -->
          <path d="M 12 55 L 4 48 L 12 60 L 2 64 L 14 66 Z" fill="#479e27" stroke="#1a1a1a" stroke-width="1.5" stroke-linejoin="round" />

          <!-- 2. BUCLE INFERIOR (El más ancho, base del cuerpo) -->
          <ellipse cx="45" cy="92" rx="28" ry="15" fill="url(#bodyGreen)" stroke="#1a1a1a" stroke-width="2.2" />
          <!-- Vientre inferior -->
          <ellipse cx="42" cy="93" rx="18" ry="9" fill="url(#bellyYellow)" stroke="#1a1a1a" stroke-width="1" opacity="0.9" />
          <!-- Segmentos del vientre inferior -->
          <path d="M 28 90 L 34 96 M 36 88 L 42 96 M 46 87 L 52 95 M 52 89 L 58 95" stroke="#9a7d2e" stroke-width="1" opacity="0.5" fill="none" />

          <!-- 3. BUCLE MEDIO (Se superpone al inferior) -->
          <ellipse cx="52" cy="76" rx="24" ry="13" fill="url(#bodyGreen)" stroke="#1a1a1a" stroke-width="2.2" />
          <!-- Vientre medio -->
          <ellipse cx="50" cy="77" rx="15" ry="7.5" fill="url(#bellyYellow)" stroke="#1a1a1a" stroke-width="1" opacity="0.9" />
          <!-- Segmentos del vientre medio -->
          <path d="M 38 74 L 44 80 M 46 73 L 52 80 M 54 73 L 60 80" stroke="#9a7d2e" stroke-width="1" opacity="0.5" fill="none" />

          <!-- 4. BUCLE SUPERIOR (Conecta con el cuello) -->
          <ellipse cx="55" cy="64" rx="20" ry="11" fill="url(#bodyGreen)" stroke="#1a1a1a" stroke-width="2.2" />
          <!-- Vientre superior -->
          <ellipse cx="54" cy="65" rx="12" ry="6" fill="url(#bellyYellow)" stroke="#1a1a1a" stroke-width="1" opacity="0.9" />

          <!-- 5. CUELLO (Sube hacia la cabeza) -->
          <path d="M 48 58 C 46 50, 45 42, 48 34 L 62 34 C 65 42, 64 50, 62 58 Z" fill="url(#bodyGreen)" stroke="#1a1a1a" stroke-width="2" />
          <!-- Vientre del cuello -->
          <path d="M 53 58 C 52 50, 51 42, 53 35 L 57 35 C 59 42, 58 50, 57 58 Z" fill="url(#bellyYellow)" opacity="0.9" />
          <!-- Líneas segmentarias del cuello -->
          <path d="M 50 40 L 60 40 M 50 46 L 60 46 M 51 52 L 59 52" stroke="#9a7d2e" stroke-width="0.8" opacity="0.5" fill="none" />

          <!-- ESPINAS DORSALES (Siguen la curva del cuerpo) -->
          <g fill="#1e4711" stroke="#1a1a1a" stroke-width="1.2" stroke-linejoin="round">
            <!-- Espinas del cuello -->
            <polygon points="48,48 44,42 52,46" />
            <polygon points="55,42 50,36 58,40" />
            <polygon points="62,46 58,38 66,44" />
            <!-- Espinas del bucle superior -->
            <polygon points="40,58 33,52 42,55" />
            <polygon points="42,55 36,48 44,52" />
            <!-- Espinas del bucle medio -->
            <polygon points="30,74 22,70 32,72" />
            <polygon points="32,72 24,66 34,69" />
            <polygon points="34,69 28,62 36,66" />
            <!-- Espinas del bucle inferior (lado derecho) -->
            <polygon points="68,88 75,84 70,92" />
            <polygon points="70,92 76,86 74,94" />
            <polygon points="74,84 80,80 76,88" />
          </g>

          <!-- 6. BRAZOS CON GARRAS -->
          <!-- Brazo Izquierdo -->
          <g stroke="#1a1a1a" stroke-width="1.4" stroke-linejoin="round">
            <path d="M 46 54 Q 36 50 35 43 Q 42 46 48 50" fill="url(#bodyGreen)" />
            <polygon points="35,43 31,38 36,45" fill="#ffffff" />
            <polygon points="37,41 34,36 40,42" fill="#ffffff" />
            <polygon points="40,43 40,37 43,44" fill="#ffffff" />
          </g>
          <!-- Brazo Derecho -->
          <g stroke="#1a1a1a" stroke-width="1.4" stroke-linejoin="round">
            <path d="M 64 54 Q 74 50 75 43 Q 68 46 62 50" fill="url(#bodyGreen)" />
            <polygon points="75,43 79,38 74,45" fill="#ffffff" />
            <polygon points="73,41 76,36 70,42" fill="#ffffff" />
            <polygon points="70,43 70,37 67,44" fill="#ffffff" />
          </g>
        </g>

        <!-- ─── CUERNOS (Estilo madera de ciervo, más imponentes) ─── -->
        <g class="ryu-horns" stroke="#1a1a1a" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round">
          <!-- Cuerno Izquierdo -->
          <path d="M40 28 C 32 18, 24 10, 18 0 C 24 6, 30 12, 34 18 C 28 10, 24 4, 22 -6 C 28 0, 34 8, 37 16 Z" fill="url(#hornWood)" />
          <!-- Cuerno Derecho -->
          <path d="M70 28 C 78 18, 86 10, 92 0 C 86 6, 80 12, 76 18 C 82 10, 86 4, 88 -6 C 82 0, 76 8, 73 16 Z" fill="url(#hornWood)" />
        </g>

        <!-- ─── CABEZA DE SHENRON (Más alargada y fiera) ─── -->
        <g class="ryu-head">
          <!-- Estructura de la cara superior -->
          <path d="M35 30 C 35 18, 75 18, 75 30 C 85 35, 88 45, 82 52 C 72 55, 38 55, 28 52 C 22 45, 25 35, 35 30 Z" fill="url(#bodyGreen)" stroke="#1a1a1a" stroke-width="2.2" />

          <!-- Hocico y boca superiores erguidos -->
          <path d="M30 48 C 30 38, 80 38, 80 48 C 82 58, 75 64, 55 66 C 35 64, 28 58, 30 48 Z" fill="#5cb82e" stroke="#1a1a1a" stroke-width="2.2" />

          <!-- Nariz / Fosas nasales mejor definidas -->
          <path d="M44 50 C 46 45, 64 45, 66 50 C 62 54, 48 54, 44 50 Z" fill="#32731c" stroke="#1a1a1a" stroke-width="1.5" />
          <ellipse cx="49" cy="50" rx="2.5" ry="4" fill="#1a1a1a" />
          <ellipse cx="61" cy="50" rx="2.5" ry="4" fill="#1a1a1a" />

          <!-- Cejas prominentes y furiosas -->
          <path d="M24 36 C 34 28, 48 34, 54 40 C 46 42, 36 40, 24 36 Z" fill="#1e4711" stroke="#1a1a1a" stroke-width="1.8" />
          <path d="M86 36 C 76 28, 62 34, 56 40 C 64 42, 74 40, 86 36 Z" fill="#1e4711" stroke="#1a1a1a" stroke-width="1.8" />

          <!-- Ojos rojos fieros (estilo Shenron) -->
          <g class="ryu-eyes">
            <!-- Izquierdo -->
            <polygon points="32,38 48,41 43,46 30,42" fill="#e60000" stroke="#1a1a1a" stroke-width="1.5" />
            <ellipse cx="39" cy="41" rx="2" ry="3" fill="#000000" />
            <circle cx="37" cy="40" r="1" fill="#ffffff" />

            <!-- Derecho -->
            <polygon points="78,38 62,41 67,46 80,42" fill="#e60000" stroke="#1a1a1a" stroke-width="1.5" />
            <ellipse cx="71" cy="41" rx="2" ry="3" fill="#000000" />
            <circle cx="69" cy="40" r="1" fill="#ffffff" />
          </g>

          <!-- Melena verde lateral (más larga y estilizada) -->
          <path d="M24 42 L14 38 L20 48 L10 48 L18 55 L12 62 L24 58" fill="#479e27" stroke="#1a1a1a" stroke-width="1.8" stroke-linejoin="round" />
          <path d="M86 42 L96 38 L90 48 L100 48 L92 55 L98 62 L86 58" fill="#479e27" stroke="#1a1a1a" stroke-width="1.8" stroke-linejoin="round" />

          <!-- Mandíbula inferior con barba de madera y dientes -->
          <g class="ryu-jaw">
            <path d="M32 58 C 32 58, 40 70, 55 70 C 70 70, 78 58, 78 58 Z" fill="url(#bellyYellow)" stroke="#1a1a1a" stroke-width="2" />
            <!-- Textura de barba en la barbilla -->
            <path d="M45 66 L45 72 M55 68 L55 75 M65 66 L65 72" stroke="#805030" stroke-width="1.8" stroke-linecap="round" />

            <!-- Dientes afilados más definidos -->
            <polygon points="32,56 36,60 40,57" fill="#ffffff" stroke="#1a1a1a" stroke-width="1.2" />
            <polygon points="42,57 46,62 50,58" fill="#ffffff" stroke="#1a1a1a" stroke-width="1.2" />
            <polygon points="60,58 64,62 68,57" fill="#ffffff" stroke="#1a1a1a" stroke-width="1.2" />
            <polygon points="70,57 74,60 78,56" fill="#ffffff" stroke="#1a1a1a" stroke-width="1.2" />
          </g>

          <!-- ─── BIGOTES SERPENTINOS (Más largos y dramáticos) ─── -->
          <g class="ryu-whiskers" stroke="#1a1a1a" stroke-width="2.5" fill="none" stroke-linecap="round">
            <path class="whisker whisker-l" d="M35 52 C 18 55, 5 70, 12 88 C 16 100, 6 108, 0 110" />
            <path class="whisker whisker-r" d="M75 52 C 92 55, 105 70, 98 88 C 94 100, 104 108, 110 110" />
          </g>

          <!-- Boca animada -->
          <path class="ryu-mouth" d="M34 58 Q55 62 76 58" fill="none" stroke="#1a1a1a" stroke-width="2" />
        </g>

        <!-- Orbes flotantes de energía -->
        <circle class="ryu-orb ryu-orb-1" cx="18" cy="30" r="3" fill="#7acf4a" opacity="0.6" />
        <circle class="ryu-orb ryu-orb-2" cx="92" cy="35" r="2.5" fill="#7acf4a" opacity="0.5" />
        <circle class="ryu-orb ryu-orb-3" cx="55" cy="10" r="2" fill="#7acf4a" opacity="0.4" />
      </svg>
    </button>

    <!-- 4-Star Dragon Ball -->
    <div class="four-star-ball">
      <svg width="28" height="28" viewBox="0 0 28 28">
        <radialGradient id="fourStar" cx="38%" cy="32%">
          <stop offset="0%" stop-color="#ff8c42" />
          <stop offset="50%" stop-color="#e63900" />
          <stop offset="100%" stop-color="#8b1a00" />
        </radialGradient>
        <circle cx="14" cy="14" r="13" fill="rgba(255, 140, 66, 0.15)" class="ball-glow" />
        <circle cx="14" cy="14" r="11" fill="url(#fourStar)" stroke="#ff6b35" stroke-width="0.5" />
        <ellipse cx="10" cy="9" rx="4.5" ry="2.5" fill="rgba(255,255,255,0.25)" transform="rotate(-30,10,9)" />
        <path d={starPath} fill="#ff0000" transform="translate(9,9) scale(0.5)" />
        <path d={starPath} fill="#ff0000" transform="translate(19,9) scale(0.5)" />
        <path d={starPath} fill="#ff0000" transform="translate(9,19) scale(0.5)" />
        <path d={starPath} fill="#ff0000" transform="translate(19,19) scale(0.5)" />
      </svg>
    </div>
  {/if}
</div>

<style>
  /* ─── ESTILOS BASE (mantenidos del original) ─── */
  .ryu-buddy {
    position: fixed;
    bottom: 30px;
    right: 30px;
    z-index: 9999;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 8px;
    pointer-events: none;
  }
  .chat-wrapper {
    pointer-events: auto;
  }

  .summoning-container {
    position: relative;
    width: 100px;
    height: 100px;
    pointer-events: none;
  }
  .dragon-ball {
    position: absolute;
    animation: ball-float 2s ease-in-out infinite;
    animation-delay: calc(var(--i, 0) * 0.3s);
  }
  .summon-flash {
    position: absolute;
    inset: -20px;
    background: radial-gradient(circle, rgba(255,255,255,0.9) 0%, rgba(122,207,74,0.6) 40%, transparent 70%);
    border-radius: 50%;
    z-index: 30;
    animation: flash-pulse 0.3s ease-out;
  }
  @keyframes flash-pulse {
    0% { transform: scale(0.5); opacity: 0; }
    50% { transform: scale(1.2); opacity: 1; }
    100% { transform: scale(1); opacity: 0.8; }
  }
  @keyframes ball-float {
    0%, 100% { transform: translate(-50%,-50%) translateY(0); }
    50% { transform: translate(-50%,-50%) translateY(-3px); }
  }
  .energy-lines {
    position: absolute;
    inset: 0;
    z-index: 5;
    pointer-events: none;
  }

  .ryu-avatar {
    pointer-events: auto;
    background: none;
    border: none;
    cursor: pointer;
    padding: 4px;
    border-radius: 50%;
    transition: transform 0.3s ease, filter 0.3s ease;
    filter: drop-shadow(0 4px 20px rgba(122, 207, 74, 0.4));
  }
  .ryu-avatar:hover {
    transform: scale(1.08);
    filter: drop-shadow(0 4px 30px rgba(122, 207, 74, 0.6));
  }

  /* Hint bubble */
  .ryu-hint {
    pointer-events: auto;
    background: rgba(122, 207, 74, 0.18);
    border: 1.5px solid rgba(122, 207, 74, 0.5);
    border-radius: 14px;
    padding: 0.5rem 0.85rem;
    font-size: 0.8rem;
    color: #7acf4a;
    text-shadow: 0 0 6px rgba(122, 207, 74, 0.3);
    margin-bottom: 4px;
    animation: hint-pulse 2s ease-in-out infinite;
  }
  .ryu-hint::after {
    content: '';
    position: absolute;
    bottom: -8px;
    right: 24px;
    width: 0;
    height: 0;
    border-left: 6px solid transparent;
    border-right: 6px solid transparent;
    border-top: 8px solid rgba(122, 207, 74, 0.5);
  }
  @keyframes hint-pulse {
    0%, 100% { transform: translateY(0); opacity: 0.8; }
    50% { transform: translateY(-3px); opacity: 1; }
  }

  /* Ryu does a gentle bob when hint is showing */
  .ryu-avatar--hint {
    animation: ryu-hint-bob 1.5s ease-in-out infinite;
  }
  @keyframes ryu-hint-bob {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-4px); }
  }

  .ryu-buddy--chat-open .ryu-avatar { opacity: 0.8; }
  .ryu-buddy--chat-open .ryu-avatar:hover { opacity: 1; }

  .four-star-ball {
    pointer-events: auto;
    cursor: pointer;
    transition: transform 0.3s ease;
    filter: drop-shadow(0 2px 8px rgba(255, 140, 66, 0.4));
    animation: ball-glow-pulse 3s ease-in-out infinite;
  }
  .four-star-ball:hover { transform: scale(1.15); }
  @keyframes ball-glow-pulse {
    0%, 100% { filter: drop-shadow(0 2px 8px rgba(255, 140, 66, 0.4)); }
    50% { filter: drop-shadow(0 2px 14px rgba(255, 140, 66, 0.7)); }
  }

  /* ─── NUEVAS ANIMACIONES PARA EL CUERPO EN INFINITO ─── */
  .ryu-head { 
    animation: ryu-breathe 3.5s ease-in-out infinite; 
    transform-origin: center 55px; 
  }
  
  /* El cuerpo ahora tiene una animación de "flotación" que simula el movimiento serpentino */
  .ryu-body { 
    animation: body-infinity-float 5s ease-in-out infinite; 
    transform-origin: center 80px; 
  }
  
  .ryu-whiskers { 
    animation: whisker-wave 5s ease-in-out infinite; 
    transform-origin: center top; 
  }
  .ryu-aura { 
    animation: aura-glow 3s ease-in-out infinite; 
  }
  .ryu-orb-1 { 
    animation: orb-float 4s ease-in-out infinite; 
  }
  .ryu-orb-2 { 
    animation: orb-float 4s ease-in-out infinite 2s; 
  }
  .ryu-orb-3 { 
    animation: orb-float 3.5s ease-in-out infinite 1s; 
  }

  /* Animación de respiración más sutil */
  @keyframes ryu-breathe {
    0%,100% { transform: translateY(0) scale(1); }
    50% { transform: translateY(-3px) scale(1.02); }
  }
  
  /* Nueva animación que simula el movimiento fluido del cuerpo en forma de infinito */
  @keyframes body-infinity-float {
    0% { transform: translateY(0) rotate(0deg) scaleY(1); }
    25% { transform: translateY(-2px) rotate(0.5deg) scaleY(0.98); }
    50% { transform: translateY(0) rotate(0deg) scaleY(1.02); }
    75% { transform: translateY(2px) rotate(-0.5deg) scaleY(0.98); }
    100% { transform: translateY(0) rotate(0deg) scaleY(1); }
  }

  @keyframes whisker-wave {
    0%, 100% { transform: rotate(0deg) scaleX(1); }
    50% { transform: rotate(2.5deg) scaleX(1.03); }
  }
  
  @keyframes aura-glow { 
    0%,100% { opacity: 0.2; transform: scale(1); } 
    50% { opacity: 0.5; transform: scale(1.08); } 
  }
  
  @keyframes orb-float { 
    0%,100% { transform: translateY(0); opacity: 0.4; } 
    50% { transform: translateY(-6px); opacity: 0.8; } 
  }

  /* ─── THINKING ───────────────────────────────── */
  .ryu-avatar--thinking .ryu-head { animation: ryu-think-head 1.2s ease-in-out infinite; }
  @keyframes ryu-think-head {
    0%,100% { transform: rotate(0deg) translateY(0); }
    25% { transform: rotate(5deg) translateY(-3px); }
    75% { transform: rotate(-4deg) translateY(-1px); }
  }

  /* ─── TALKING ────────────────────────────────── */
  .ryu-avatar--talking .ryu-head { animation: ryu-talk-head 0.6s ease-in-out infinite; }
  .ryu-avatar--talking .ryu-mouth { animation: mouth-talk 0.3s ease-in-out infinite alternate; }

  @keyframes ryu-talk-head { 
    0%,100% { transform: translateY(0); } 
    50% { transform: translateY(-2px); } 
  }
  @keyframes mouth-talk {
    0% { d: path("M34 58 Q55 62 76 58"); stroke-width: 2; }
    100% { d: path("M34 58 Q55 68 76 58"); stroke-width: 3; }
  }

  /* ─── RESPONSIVE ─────────────────────────────── */
  @media (max-width: 768px) {
    .ryu-buddy { bottom: 16px; right: 12px; }
    .chat-wrapper { position: fixed; inset: 0; max-width: 100%; z-index: 9999; }
    .ryu-avatar:hover { transform: none; }
  }
</style>