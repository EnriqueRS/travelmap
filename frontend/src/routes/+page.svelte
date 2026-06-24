<script lang="ts">
  import "../app.css"
  import { t } from "$lib/stores/i18n"
  import { onMount } from "svelte"
  import { goto } from "$app/navigation"
  import { getToken } from "$lib/services/auth"
  import {
    Globe,
    Map as MapIcon,
    Compass,
    Camera,
    Navigation,
  } from "lucide-svelte"

  // Redirect authenticated users to the map on mount (existing behavior).
  onMount(() => {
    if (getToken()) {
      goto("/map")
    }
  })

  // Cinematic travel photo from Unsplash — aerial view of a traveler
  // in a mountain landscape. Matches the Stitch design's "professional
  // travel photography background" spec with warm, evocative lighting.
  const heroBgImage =
    "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=80"

  // Feature cards definition (kept here for clarity + easy iteration).
  const features = [
    {
      Icon: MapIcon,
      titleKey: "landing.interactiveMap",
      descKey: "landing.interactiveMapDesc",
    },
    {
      Icon: Camera,
      titleKey: "landing.photoGallery",
      descKey: "landing.photoGalleryDesc",
    },
    {
      Icon: Navigation,
      titleKey: "landing.tripPlanner",
      descKey: "landing.tripPlannerDesc",
    },
  ]

  // Stats counters — the numeric values come from i18n so both
  // Spanish and English coordinated content stays in sync.
  const stats = [
    {
      valueKey: "landing.statTravelersValue",
      labelKey: "landing.statTravelers",
    },
    {
      valueKey: "landing.statCountriesValue",
      labelKey: "landing.statCountries",
    },
    { valueKey: "landing.statPhotosValue", labelKey: "landing.statPhotos" },
  ]
</script>

<svelte:head>
  <title>TravelMap - {$t("landing.exploreTheWorld")}</title>
  <meta name="description" content={$t("landing.heroSubtitle")} />
</svelte:head>

<main class="home">
  <!-- ═══════════════════════════════════════════════════════
       1. HERO SECTION
       Full viewport on mobile, 70vh on desktop.
       Gradient blends the accent primary into the secondary bg.
       ═══════════════════════════════════════════════════════ -->
  <section class="hero">
    <div class="hero-content">
      <div class="hero-globe">
        <Globe size={56} />
      </div>

      <h1 class="hero-heading">
        {$t("landing.heroHeading")}
      </h1>

      <p class="hero-subtitle">
        {$t("landing.heroSub")}
      </p>

      <div class="hero-buttons">
        <a href="/map" class="btn btn-primary btn-lg">
          <MapIcon size={20} />
          {$t("landing.exploreMapBtn")}
        </a>
        <a href="/trips" class="btn btn-secondary btn-lg hero-btn-secondary">
          <Compass size={20} />
          {$t("landing.myTrips")}
        </a>
      </div>
    </div>
  </section>

  <!-- ═══════════════════════════════════════════════════════
       2. FEATURES SECTION
       3 cards, stacked on mobile, grid on desktop.
       ═══════════════════════════════════════════════════════ -->
  <section class="features">
    <div class="features-grid">
      {#each features as { Icon, titleKey, descKey }}
        <article class="feature-card card">
          <div class="feature-icon" aria-hidden="true">
            <Icon size={40} aria-hidden="true" />
          </div>
          <h2 class="feature-title">{$t(titleKey)}</h2>
          <p>{$t(descKey)}</p>
        </article>
      {/each}
    </div>
  </section>

  <!-- ═══════════════════════════════════════════════════════
       3. STATS SECTION
       3 counters with large bold numbers + muted labels.
       ═══════════════════════════════════════════════════════ -->
  <!-- <section class="stats">
    <div class="stats-grid">
      {#each stats as { valueKey, labelKey }}
        <div class="stat-item">
          <span class="stat-value">{$t(valueKey)}</span>
          <span class="stat-label">{$t(labelKey)}</span>
        </div>
      {/each}
    </div>
  </section> -->

  <!-- ═══════════════════════════════════════════════════════
       4. CTA SECTION
       Gradient background matching hero, centered content.
       ═══════════════════════════════════════════════════════ -->
  <section class="cta">
    <div class="cta-content">
      <h2>{$t("landing.ctaTitle")}</h2>
      <p>{$t("landing.ctaDesc")}</p>
      <a href="/map" class="btn btn-primary btn-lg">
        <Navigation size={20} />
        {$t("landing.ctaButton")}
      </a>
    </div>
  </section>
</main>

<style>
  .home {
    /* The hero provides its own gradient bg; remaining sections
       use surface tokens so light/dark themes work transparently. */
    background-color: var(--color-bg-main);
    min-height: 100vh;
  }

  /* ─── HERO ──────────────────────────────────────────── */
  .hero {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    color: #ffffff;
    /* Cinematic travel photo background with dark overlay */
    background-image: linear-gradient(
        180deg,
        rgba(0, 0, 0, 0.55) 0%,
        rgba(0, 0, 0, 0.45) 50%,
        rgba(0, 0, 0, 0.65) 100%
      ),
      var(
        --hero-bg,
        url("https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=80")
      );
    background-size: cover;
    background-position: center 30%;
    background-repeat: no-repeat;
    position: relative;
    overflow: hidden;
  }

  .hero::before {
    /* Subtle gradient vignette overlay for extra depth */
    content: "";
    position: absolute;
    inset: 0;
    background: radial-gradient(
      circle at 50% 40%,
      transparent 0%,
      rgba(0, 0, 0, 0.25) 80%
    );
    pointer-events: none;
  }

  .hero-content {
    position: relative;
    z-index: 1;
    max-width: 800px;
    padding: 2rem 1.5rem;
  }

  .hero-globe {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 1.25rem;
    color: #ffffff;
    opacity: 0.95;
    animation: fadeInUp 0.8s ease-out both;
  }

  .hero-heading {
    font-size: clamp(2.25rem, 6vw, 4rem);
    font-weight: 800;
    line-height: 1.1;
    letter-spacing: -0.025em;
    margin: 0 0 1rem 0;
    color: #ffffff;
    text-shadow: 0 2px 16px rgba(0, 0, 0, 0.45), 0 4px 32px rgba(0, 0, 0, 0.25);
    animation: fadeInUp 0.8s ease-out 0.15s both;
  }

  .hero-subtitle {
    font-size: clamp(1rem, 2.5vw, 1.35rem);
    line-height: 1.55;
    margin: 0 auto 2rem;
    max-width: 620px;
    color: rgba(255, 255, 255, 0.92);
    text-shadow: 0 1px 8px rgba(0, 0, 0, 0.4);
    animation: fadeInUp 0.8s ease-out 0.3s both;
  }

  .hero-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    justify-content: center;
    animation: fadeInUp 0.8s ease-out 0.45s both;
  }

  /* Secondary CTA on the hero needs a white border + transparent bg
     to read on the dark gradient (overrides default btn-secondary
     which uses surface tokens). */
  .hero-btn-secondary {
    background: transparent;
    color: #ffffff;
    border: 2px solid rgba(255, 255, 255, 0.8);
  }
  .hero-btn-secondary:hover {
    background: rgba(255, 255, 255, 0.12);
    border-color: #ffffff;
    color: #ffffff;
  }

  /* ─── FEATURES ──────────────────────────────────────── */
  .features {
    padding: 4rem 1.5rem;
    background-color: var(--color-bg-secondary);
  }

  .features-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1.5rem;
    max-width: 1200px;
    margin: 0 auto;
  }

  .feature-card {
    text-align: center;
    padding: 2rem 1.5rem;
    border-radius: var(--radius-xl);
    transition: transform var(--transition-slow),
      box-shadow var(--transition-slow);
  }

  .feature-card:hover {
    transform: translateY(-6px);
    box-shadow: var(--shadow-lg);
  }

  .feature-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 1.25rem;
    width: 64px;
    height: 64px;
    border-radius: var(--radius-full);
    background-color: var(--color-accent-muted);
    color: var(--color-accent-primary);
  }

  .feature-card .feature-title {
    margin: 0 0 0.5rem;
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--color-text-primary);
  }

  .feature-card p {
    margin: 0;
    font-size: 0.95rem;
    line-height: 1.6;
    color: var(--color-text-secondary);
  }

  /* ─── STATS ─────────────────────────────────────────── */
  .stats {
    padding: 3rem 1.5rem;
    background-color: var(--color-bg-tertiary);
    border-top: 1px solid var(--color-border);
    border-bottom: 1px solid var(--color-border);
  }

  .stats-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1.5rem;
    max-width: 900px;
    margin: 0 auto;
    text-align: center;
  }

  .stat-item {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .stat-value {
    font-family: var(--font-heading);
    font-size: clamp(1.75rem, 5vw, 3rem);
    font-weight: 800;
    line-height: 1;
    color: var(--color-accent-primary);
    letter-spacing: -0.03em;
  }

  .stat-label {
    font-size: 0.8rem;
    color: var(--color-text-muted);
    line-height: 1.3;
  }

  /* ─── CTA ───────────────────────────────────────────── */
  .cta {
    background-image: linear-gradient(
        180deg,
        rgba(0, 0, 0, 0.72) 0%,
        rgba(0, 0, 0, 0.8) 100%
      ),
      var(
        --hero-bg,
        url("https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=80")
      );
    background-size: cover;
    background-position: center 60%;
    background-repeat: no-repeat;
    color: #ffffff;
    padding: 4rem 1.5rem;
    text-align: center;
    position: relative;
    overflow: hidden;
  }

  .cta::before {
    content: "";
    position: absolute;
    inset: 0;
    background: radial-gradient(
      circle at 50% 50%,
      transparent 0%,
      rgba(0, 0, 0, 0.2) 80%
    );
    pointer-events: none;
  }

  .cta-content {
    position: relative;
    z-index: 1;
    max-width: 700px;
    margin: 0 auto;
  }

  .cta-content h2 {
    font-size: clamp(1.75rem, 5vw, 2.5rem);
    font-weight: 800;
    margin: 0 0 1rem;
    color: #ffffff;
    text-shadow: 0 2px 16px rgba(0, 0, 0, 0.45), 0 4px 32px rgba(0, 0, 0, 0.25);
  }

  .cta-content p {
    font-size: 1.1rem;
    margin: 0 0 2rem;
    color: rgba(255, 255, 255, 0.9);
    text-shadow: 0 1px 8px rgba(0, 0, 0, 0.4);
    line-height: 1.6;
  }

  /* ─── ANIMATION ─────────────────────────────────────── */
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* ─── RESPONSIVE: TABLET/DESKTOP ───────────────────── */
  @media (min-width: 768px) {
    .hero {
      min-height: 70vh;
    }

    .hero-content {
      padding: 2rem;
    }

    .features {
      padding: 5rem 2rem;
    }

    .features-grid {
      grid-template-columns: repeat(3, 1fr);
      gap: 2rem;
    }

    .feature-card {
      padding: 2.5rem 2rem;
    }

    .stats {
      padding: 4rem 2rem;
    }

    .stats-grid {
      grid-template-columns: repeat(3, 1fr);
      gap: 1rem;
    }

    .stat-label {
      font-size: 0.95rem;
    }

    .cta {
      padding: 5rem 2rem;
    }
  }
</style>
