<script lang="ts">
  import "../app.css"
  import { Map, Globe, Compass, User, Home } from "lucide-svelte"
</script>

<nav class="navbar">
  <div class="nav-container">
    <div class="nav-brand">
      <Globe size={24} />
      <span class="brand-text">TravelMap</span>
    </div>

    <div class="nav-links">
      <a href="/" class="nav-link">
        <Home size={18} />
        <span>Inicio</span>
      </a>

      <a href="/map" class="nav-link">
        <Map size={18} />
        <span>Mapa</span>
      </a>

      <a href="/trips" class="nav-link">
        <Compass size={18} />
        <span>Viajes</span>
      </a>

      <a href="/locations" class="nav-link">
        <Map size={18} />
        <span>Ubicaciones</span>
      </a>

      <a href="/profile" class="nav-link">
        <User size={18} />
        <span>Perfil</span>
      </a>
    </div>
  </div>
</nav>

<main>
  <slot />
</main>

<footer class="footer">
  <div class="footer-content">
    <p>&copy; 2026 TravelMap. Todos los derechos reservados.</p>
    <p>Explora el mundo, comparte tus aventuras.</p>
  </div>
</footer>

<style>
  :global(body) {
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
      sans-serif;
    background-color: #0f172a;
    color: #e2e8f0;
  }

  .navbar {
    background: rgba(30, 41, 59, 0.8);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    position: sticky;
    top: 0;
    z-index: 1000;
  }

  .nav-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 2rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 4rem;
  }

  .nav-brand {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 1.5rem;
    font-weight: 700;
    color: #60a5fa;
    text-decoration: none;
  }

  .nav-links {
    display: flex;
    gap: 1rem;
  }

  .nav-link {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    border-radius: 0.5rem;
    text-decoration: none;
    color: #cbd5e1;
    transition: all 0.3s ease;
    border: 1px solid transparent;
  }

  .nav-link:hover {
    background-color: #475569;
    color: #60a5fa;
    transform: translateY(-2px);
  }

  .nav-link.active {
    background-color: #60a5fa;
    color: #0f172a;
    border-color: #60a5fa;
  }

  main {
    min-height: calc(100vh - 8rem);
  }

  .footer {
    background: #1e293b;
    border-top: 1px solid #475569;
    margin-top: 4rem;
  }

  .footer-content {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
    text-align: center;
    color: #94a3b8;
  }

  .footer-content p {
    margin: 0.5rem 0;
  }

  @media (max-width: 768px) {
    .nav-container {
      flex-direction: column;
      height: auto;
      padding: 1rem;
    }

    .nav-links {
      margin-top: 1rem;
      flex-wrap: wrap;
      justify-content: center;
    }

    .nav-link {
      padding: 0.5rem 0.75rem;
      font-size: 0.9rem;
    }

    main {
      padding: 1rem;
    }
  }
</style>
