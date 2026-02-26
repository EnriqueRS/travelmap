<script lang="ts">
  import "../app.css";
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import { getToken } from "$lib/services/auth";

  onMount(() => {
    if (getToken()) {
      goto("/map");
    }
  });
</script>

<svelte:head>
  <title>TravelMap - Explora el Mundo</title>
  <meta
    name="description"
    content="Tu aplicación para explorar y compartir tus viajes por el mundo"
  />
</svelte:head>

<main class="home">
  <section class="hero">
    <div class="hero-content">
      <h1 class="hero-title">🌍 TravelMap</h1>
      <p class="hero-subtitle">
        Explora el mundo, comparte tus aventuras y descubre nuevos destinos
      </p>
      <div class="hero-buttons">
        <a href="/map" class="btn btn-primary"> 🗺️ Explorar Mapa </a>
        <a href="/trips" class="btn btn-secondary"> 🧳 Mis Viajes </a>
      </div>
    </div>
  </section>

  <section class="features">
    <div class="features-grid">
      <div class="feature-card">
        <div class="feature-icon">🗺️</div>
        <h3>Mapa Interactivo</h3>
        <p>
          Explora el mundo con nuestro mapa interactivo y marca tus lugares
          favoritos
        </p>
      </div>

      <div class="feature-card">
        <div class="feature-icon">📸</div>
        <h3>Galería de Fotos</h3>
        <p>Comparte tus mejores momentos y crea un album de tus aventuras</p>
      </div>

      <div class="feature-card">
        <div class="feature-icon">🧭</div>
        <h3>Planificador de Viajes</h3>
        <p>Organiza tus próximos viajes y crea itinerarios detallados</p>
      </div>

      <div class="feature-card">
        <div class="feature-icon">📊</div>
        <h3>Estadísticas</h3>
        <p>
          Lleva registro de tus viajes y descubre tus estadísticas personales
        </p>
      </div>
    </div>
  </section>

  <section class="cta">
    <div class="cta-content">
      <h2>¿Listo para empezar tu aventura?</h2>
      <p>
        Únete a miles de viajeros que ya están explorando el mundo con TravelMap
      </p>
      <a href="/map" class="btn btn-primary btn-large">Comenzar Ahora</a>
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
    font-size: 4rem;
    font-weight: 800;
    margin-bottom: 1rem;
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
    animation: fadeInUp 0.8s ease-out;
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
    background: linear-gradient(145deg, #f8fafc 0%, #e0e7ff 100%);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    transition: transform 0.3s ease;
  }

  .feature-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 15px rgba(0, 0, 0, 0.15);
  }

  .feature-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
  }

  .feature-card h3 {
    color: #1e293b;
    margin-bottom: 0.5rem;
    font-size: 1.2rem;
  }

  .feature-card p {
    color: #64748b;
    line-height: 1.6;
  }

  .cta {
    background: #1e293b;
    color: white;
    padding: 4rem 2rem;
    text-align: center;
  }

  .cta-content h2 {
    font-size: 2.5rem;
    margin-bottom: 1rem;
    color: #60a5fa;
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
    background: #3b82f6;
    color: white;
  }

  .btn-primary:hover {
    background: #2563eb;
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
    color: #3b82f6;
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

    .cta {
      padding: 3rem 1.5rem;
    }

    .cta-content h2 {
      font-size: 2rem;
    }
  }
</style>
