<script lang="ts">
  import "../app.css"
  import Toast from "$lib/components/ui/Toast.svelte"
  import { Map, Globe, Compass, User, Home, LogOut, LogIn } from "lucide-svelte"
  import { currentUser, authService } from "$lib/services/auth"
  import { goto } from "$app/navigation"
  import { onMount } from "svelte"

  let isInitializing = true

  onMount(async () => {
    if ($currentUser?.access_token) {
      await authService.fetchUserData($currentUser.access_token)
    }
    isInitializing = false
  })

  function handleLogout() {
    authService.logout()
    goto("/login")
  }
</script>

{#if isInitializing && $currentUser}
  <div class="loading-screen">
    <div class="spinner" />
    <p>Cargando tu mapa...</p>
  </div>
{:else}
  <nav class="navbar">
    <div class="nav-container">
      <div class="nav-brand">
        <Globe size={24} />
        <span class="brand-text">TravelMap</span>
        {#if !$currentUser}
          <span class="demo-badge">Modo Demo</span>
        {/if}
      </div>

      <!-- Demo Banner for Mobile/Desktop if needed, or just keep it subtle in header -->

      <div class="nav-links">
        {#if !$currentUser}
          <a href="/" class="nav-link">
            <Home size={18} />
            <span>Inicio</span>
          </a>
        {/if}

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

        {#if $currentUser}
          <button class="nav-link logout-btn" on:click={handleLogout}>
            <LogOut size={18} />
            <span>Salir</span>
          </button>
        {:else}
          <a href="/login" class="nav-link login-btn">
            <LogIn size={18} />
            <span>Acceder</span>
          </a>
        {/if}
      </div>
    </div>
  </nav>

  {#if !$currentUser}
    <div class="demo-banner">
      <p>
        👀 Estás viendo datos de demostración. <a href="/login">Inicia sesión</a
        >
        o <a href="/register">Regístrate</a> para guardar tus propios viajes.
      </p>
    </div>
  {/if}

  <main>
    <slot />
  </main>

  <footer class="footer">
    <div class="footer-content">
      <p>&copy; 2026 TravelMap. Todos los derechos reservados.</p>
      <p>Explora el mundo, comparte tus aventuras.</p>
    </div>
  </footer>
{/if}

<Toast />

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

    .demo-banner {
      font-size: 0.8rem;
      padding: 0.5rem;
    }
  }

  .demo-badge {
    background: #f59e0b;
    color: #0f172a;
    font-size: 0.75rem;
    padding: 0.1rem 0.5rem;
    border-radius: 9999px;
    margin-left: 0.5rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .demo-banner {
    background: linear-gradient(90deg, #3b82f6, #8b5cf6);
    color: white;
    text-align: center;
    padding: 0.75rem;
    font-size: 0.9rem;
    position: relative;
    z-index: 900;
  }

  .demo-banner a {
    color: white;
    font-weight: bold;
    text-decoration: underline;
  }

  .logout-btn {
    background: transparent;
    border: 1px solid rgba(239, 68, 68, 0.5);
    color: #ef4444;
    cursor: pointer;
  }

  .logout-btn:hover {
    background: rgba(239, 68, 68, 0.1);
    color: #ef4444;
    border-color: #ef4444;
  }

  .login-btn {
    background: rgba(59, 130, 246, 0.1);
    border: 1px solid rgba(59, 130, 246, 0.5);
    color: #60a5fa;
  }

  .login-btn:hover {
    background: rgba(59, 130, 246, 0.2);
    color: #93c5fd;
  }

  .loading-screen {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    background-color: #0f172a;
    color: #cbd5e1;
    z-index: 9999;
  }

  .spinner {
    width: 40px;
    height: 40px;
    border: 3px solid rgba(255, 255, 255, 0.1);
    border-radius: 50%;
    border-top-color: #60a5fa;
    animation: spin 1s ease-in-out infinite;
    margin-bottom: 1rem;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>
