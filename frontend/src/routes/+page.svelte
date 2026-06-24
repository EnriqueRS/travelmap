<script lang="ts">
  import "../app.css"
  import { t } from "$lib/stores/i18n"
  import { onMount } from "svelte"
  import { goto } from "$app/navigation"
  import { getToken } from "$lib/services/auth"
  import { getTripCoverUrl } from "$lib/utils/images"
  import {
    Globe,
    Map as MapIcon,
    Compass,
    Camera,
    Navigation,
    BarChart3,
  } from "lucide-svelte"

  onMount(() => {
    if (getToken()) {
      goto("/map")
    }
  })

  const demoPreviewTrips = [
    {
      name: "Ruta por Andalucía",
      description:
        "Una vuelta por el sur de España: Sevilla, Córdoba, Granada, Cádiz y Málaga.",
      coverImage: "https://picsum.photos/seed/andalucia-route-2024/800/600",
      coverImageUrl: "https://picsum.photos/seed/andalucia-route-2024/800/600",
      countries: ["ES"],
      startDate: "May 2024",
      endDate: "May 2024",
    },
    {
      name: "Aventura en Japón",
      description: "Explorando la cultura, gastronomía y paisajes nipones.",
      coverImage: "https://picsum.photos/seed/japan-adventure-2025/800/600",
      coverImageUrl: "https://picsum.photos/seed/japan-adventure-2025/800/600",
      countries: ["JP"],
      startDate: "Apr 2025",
      endDate: "Apr 2025",
    },
    {
      name: "Viaje a Tailandia",
      description: "Templos, playas y selva tropical en el sudeste asiático.",
      coverImage: "https://picsum.photos/seed/thailand-trip-2025/800/600",
      coverImageUrl: "https://picsum.photos/seed/thailand-trip-2025/800/600",
      countries: ["TH"],
      startDate: "Jan 2025",
      endDate: "Jan 2025",
    },
  ]
</script>

<svelte:head>
  <title>TravelMap - {$t("landing.exploreTheWorld")}</title>
  <meta name="description" content={$t("landing.heroSubtitle")} />
</svelte:head>

<main class="home">
  <section class="hero">
    <div class="hero-content">
      <h1 class="hero-title">
        <Globe size={48} class="hero-icon" />
        TravelMap
      </h1>
      <p class="hero-subtitle">
        {$t("landing.heroSubtitle")}
      </p>
      <div class="hero-buttons">
        <a href="/map" class="btn btn-primary">
          <MapIcon size={20} />
          {$t("landing.exploreMap")}
        </a>
        <a href="/trips" class="btn btn-secondary">
          <Compass size={20} />
          {$t("dashboard.title")}
        </a>
      </div>
    </div>
  </section>

  <section class="features">
    <div class="features-grid">
      <div class="feature-card">
        <div class="feature-icon">
          <MapIcon size={40} />
        </div>
        <h3>{$t("landing.interactiveMap")}</h3>
        <p>
          {$t("landing.interactiveMapDesc")}
        </p>
      </div>

      <div class="feature-card">
        <div class="feature-icon">
          <Camera size={40} />
        </div>
        <h3>{$t("landing.photoGallery")}</h3>
        <p>{$t("landing.photoGalleryDesc")}</p>
      </div>

      <div class="feature-card">
        <div class="feature-icon">
          <Navigation size={40} />
        </div>
        <h3>{$t("landing.tripPlanner")}</h3>
        <p>{$t("landing.tripPlannerDesc")}</p>
      </div>

      <div class="feature-card">
        <div class="feature-icon">
          <BarChart3 size={40} />
        </div>
        <h3>{$t("landing.statistics")}</h3>
        <p>
          {$t("landing.statisticsDesc")}
        </p>
      </div>
    </div>
  </section>

  <section class="demo-trips">
    <div class="demo-trips-header">
      <h2>Viajes de ejemplo</h2>
      <p>Explora viajes creados por nuestra comunidad para inspirarte</p>
    </div>
    <div class="demo-trips-grid">
      {#each demoPreviewTrips as trip}
        <div class="demo-trip-card">
          <div class="demo-trip-image">
            <img src={getTripCoverUrl(trip) || ""} alt={trip.name} />
          </div>
          <div class="demo-trip-info">
            <h3>{trip.name}</h3>
            <p>{trip.description}</p>
            <div class="demo-trip-meta">
              <span>{trip.countries.length} {trip.countries.length === 1 ? 'país' : 'países'}</span>
              <span>{trip.startDate} - {trip.endDate}</span>
            </div>
          </div>
        </div>
      {/each}
    </div>
  </section>

  <section class="cta">
    <div class="cta-content">
      <h2>{$t("landing.ctaTitle")}</h2>
      <p>
        {$t("landing.ctaDesc")}
      </p>
      <a href="/map" class="btn btn-primary btn-large"
        >{$t("landing.ctaButton")}</a
      >
    </div>
  </section>
</main>

<style>
  .home {
    padding: 0;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    min-height: 100vh;
  }

  .hero {
    min-height: 60vh;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    color: white;
    background: rgba(0, 0, 0, 0.2);
  }

  .hero-content {
    max-width: 800px;
    padding: 2rem;
  }

  .hero-title {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    font-size: 4rem;
    font-weight: 800;
    margin-bottom: 1rem;
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
    animation: fadeInUp 0.8s ease-out;
  }

  .hero-icon {
    color: white;
  }

  .hero-subtitle {
    font-size: 1.3rem;
    margin-bottom: 2rem;
    opacity: 0.9;
    animation: fadeInUp 0.8s ease-out 0.2s both;
  }

  .hero-buttons {
    display: flex;
    gap: 1rem;
    justify-content: center;
    animation: fadeInUp 0.8s ease-out 0.4s both;
  }

  .features {
    padding: 4rem 2rem;
    background: white;
  }

  .features-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 2rem;
    max-width: 1200px;
    margin: 0 auto;
  }

  .feature-card {
    text-align: center;
    padding: 2rem;
    border-radius: 12px;
    background: linear-gradient(145deg, var(--color-text-primary) 0%, #e0e7ff 100%);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    transition: transform 0.3s ease;
  }

  .feature-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 15px rgba(0, 0, 0, 0.15);
  }

  .feature-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 1rem;
    color: var(--color-accent-primary);
  }

  .feature-card h3 {
    color: var(--color-bg-secondary);
    margin-bottom: 0.5rem;
    font-size: 1.2rem;
  }

  .feature-card p {
    color: var(--color-text-muted);
    line-height: 1.6;
  }

  /* Demo Trips Section */
  .demo-trips {
    padding: 4rem 2rem;
    background: var(--color-bg-secondary);
  }

  .demo-trips-header {
    text-align: center;
    margin-bottom: 3rem;
  }

  .demo-trips-header h2 {
    font-size: 2rem;
    font-weight: 700;
    color: var(--color-text-primary);
    margin: 0 0 0.5rem 0;
  }

  .demo-trips-header p {
    color: var(--color-text-secondary);
    font-size: 1.1rem;
    margin: 0;
  }

  .demo-trips-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    gap: 2rem;
    max-width: 1200px;
    margin: 0 auto;
  }

  .demo-trip-card {
    background: var(--color-bg-tertiary);
    border-radius: 16px;
    overflow: hidden;
    border: 1px solid var(--color-border);
    transition: transform 0.3s ease, box-shadow 0.3s ease;
  }

  .demo-trip-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.2);
  }

  .demo-trip-image {
    height: 200px;
    overflow: hidden;
  }

  .demo-trip-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.5s ease;
  }

  .demo-trip-card:hover .demo-trip-image img {
    transform: scale(1.05);
  }

  .demo-trip-info {
    padding: 1.5rem;
  }

  .demo-trip-info h3 {
    color: var(--color-text-primary);
    font-size: 1.25rem;
    font-weight: 700;
    margin: 0 0 0.5rem 0;
  }

  .demo-trip-info p {
    color: var(--color-text-secondary);
    font-size: 0.9rem;
    line-height: 1.5;
    margin: 0 0 1rem 0;
  }

  .demo-trip-meta {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .demo-trip-meta span {
    background: var(--color-accent-muted);
    color: var(--color-accent-text);
    padding: 0.25rem 0.75rem;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 600;
  }

  .cta {
    background: var(--color-bg-secondary);
    color: white;
    padding: 4rem 2rem;
    text-align: center;
  }

  .cta-content h2 {
    font-size: 2.5rem;
    margin-bottom: 1rem;
    color: var(--color-accent-text);
  }

  .cta-content p {
    font-size: 1.1rem;
    margin-bottom: 2rem;
    opacity: 0.8;
  }

  .btn {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 1rem 2rem;
    border-radius: 8px;
    text-decoration: none;
    font-weight: 600;
    transition: all 0.3s ease;
    cursor: pointer;
    border: none;
  }

  .btn-primary {
    background: var(--color-accent-primary);
    color: white;
  }

  .btn-primary:hover {
    background: var(--color-accent-hover);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  }

  .btn-secondary {
    background: transparent;
    color: white;
    border: 2px solid white;
  }

  .btn-secondary:hover {
    background: white;
    color: var(--color-accent-primary);
  }

  .btn-large {
    padding: 1.2rem 2.5rem;
    font-size: 1.1rem;
  }

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

  @media (max-width: 768px) {
    .hero-title {
      font-size: 2.5rem;
    }

    .hero-subtitle {
      font-size: 1.1rem;
    }

    .hero-buttons {
      flex-direction: column;
      align-items: center;
    }

    .features-grid {
      grid-template-columns: 1fr;
      gap: 1.5rem;
    }

    .demo-trips-grid {
      grid-template-columns: 1fr;
      gap: 1.5rem;
    }

    .cta {
      padding: 3rem 1.5rem;
    }

    .cta-content h2 {
      font-size: 2rem;
    }
  }
</style>
