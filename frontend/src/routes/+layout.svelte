<script lang="ts">
  import "../app.css"
  import Toast from "$lib/components/ui/Toast.svelte"
  import {
    Map,
    Globe,
    Compass,
    User,
    Home,
    LogOut,
    LogIn,
    Palette,
    Check,
    Languages,
  } from "lucide-svelte"
  import { currentUser, authService } from "$lib/services/auth"
  import {
    themeStore,
    languageStore,
    type ThemeType,
    type LangType,
  } from "$lib/stores/ui"
  import { t } from "$lib/stores/i18n"
  import { goto } from "$app/navigation"
  import { page } from "$app/stores"
  import { onMount } from "svelte"

  let isInitializing = true
  let currentTheme: ThemeType

  themeStore.subscribe((value) => {
    currentTheme = value
    if (typeof window !== "undefined") {
      document.body.className = value
    }
  })

  function setTheme(t: ThemeType) {
    themeStore.set(t)
    showThemeMenu = false
  }

  function setLanguage(l: LangType) {
    languageStore.set(l)
    showLangMenu = false
  }

  let showThemeMenu = false
  let showLangMenu = false

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
    <p>{$t("common.loading")}</p>
  </div>
{:else}
  <nav class="navbar">
    <div class="nav-container">
      <div class="nav-brand">
        <div class="brand-icon-box">
          <Globe size={20} />
        </div>
        <span class="brand-text">TravelMap</span>
        {#if !$currentUser}
          <span class="demo-badge">{$t("common.demoBadge")}</span>
        {/if}
      </div>

      <!-- Demo Banner for Mobile/Desktop if needed, or just keep it subtle in header -->

      <div class="nav-links">
        <!-- Center navigation links -->
        <div class="nav-center-links">
          {#if !$currentUser}
            <a
              href="/"
              class="nav-link"
              class:active={$page.url.pathname === "/"}
            >
              <Home size={18} />
              <span>{$t("nav.home")}</span>
            </a>
          {/if}

          <a
            href="/map"
            class="nav-link"
            class:active={$page.url.pathname.startsWith("/map")}
          >
            <Map size={18} />
            <span>{$t("nav.map")}</span>
          </a>

          <a
            href="/trips"
            class="nav-link"
            class:active={$page.url.pathname.startsWith("/trips")}
          >
            <Compass size={18} />
            <span>{$t("nav.trips")}</span>
          </a>

          <a
            href="/profile"
            class="nav-link"
            class:active={$page.url.pathname.startsWith("/profile")}
          >
            <User size={18} />
            <span>{$t("nav.profile")}</span>
          </a>
        </div>

        <!-- Right side icons / actions -->
        <div class="nav-actions">
          <!-- Theme Switcher -->
          <div class="relative">
            <button
              class="nav-link"
              on:click={() => (showThemeMenu = !showThemeMenu)}
              title={$t("nav.changeTheme")}
            >
              <Palette size={18} />
            </button>

            {#if showThemeMenu}
              <div
                class="absolute right-0 mt-2 w-48 bg-background-secondary border border-border rounded-lg shadow-xl py-2 z-50"
              >
                <button
                  class="w-full text-left px-4 py-2 text-sm flex items-center justify-between hover:bg-bg-tertiary transition-colors"
                  on:click={() => setTheme("theme-sea-blue")}
                >
                  <span
                    class={currentTheme === "theme-sea-blue"
                      ? "text-accent-primary font-medium"
                      : "text-text-primary"}>{$t("nav.themeSeaBlue")}</span
                  >
                  {#if currentTheme === "theme-sea-blue"}
                    <Check size={14} class="text-accent-primary" />
                  {/if}
                </button>
                <button
                  class="w-full text-left px-4 py-2 text-sm flex items-center justify-between hover:bg-bg-tertiary transition-colors"
                  on:click={() => setTheme("theme-light")}
                >
                  <span
                    class={currentTheme === "theme-light"
                      ? "text-accent-primary font-medium"
                      : "text-text-primary"}>{$t("nav.themeLight")}</span
                  >
                  {#if currentTheme === "theme-light"}
                    <Check size={14} class="text-accent-primary" />
                  {/if}
                </button>
                <button
                  class="w-full text-left px-4 py-2 text-sm flex items-center justify-between hover:bg-bg-tertiary transition-colors"
                  on:click={() => setTheme("theme-neon-obsidian")}
                >
                  <span
                    class={currentTheme === "theme-neon-obsidian"
                      ? "text-accent-primary font-medium"
                      : "text-text-primary"}>{$t("nav.themeNeon")}</span
                  >
                  {#if currentTheme === "theme-neon-obsidian"}
                    <Check size={14} class="text-accent-primary" />
                  {/if}
                </button>
              </div>
            {/if}
          </div>

          <!-- Language Switcher -->
          <div class="relative">
            <button
              class="nav-link"
              on:click={() => {
                showLangMenu = !showLangMenu
                if (showLangMenu) showThemeMenu = false
              }}
              title={$t("nav.changeLanguage")}
            >
              <Languages size={18} />
            </button>

            {#if showLangMenu}
              <div
                class="absolute right-0 mt-2 w-32 bg-background-secondary border border-border rounded-lg shadow-xl py-2 z-50"
              >
                <button
                  class="w-full text-left px-4 py-2 text-sm flex items-center justify-between hover:bg-bg-tertiary transition-colors"
                  on:click={() => setLanguage("es")}
                >
                  <span
                    class={$languageStore === "es"
                      ? "text-accent-primary font-medium"
                      : "text-text-primary"}>Español</span
                  >
                  {#if $languageStore === "es"}
                    <Check size={14} class="text-accent-primary" />
                  {/if}
                </button>
                <button
                  class="w-full text-left px-4 py-2 text-sm flex items-center justify-between hover:bg-bg-tertiary transition-colors"
                  on:click={() => setLanguage("en")}
                >
                  <span
                    class={$languageStore === "en"
                      ? "text-accent-primary font-medium"
                      : "text-text-primary"}>English</span
                  >
                  {#if $languageStore === "en"}
                    <Check size={14} class="text-accent-primary" />
                  {/if}
                </button>
              </div>
            {/if}
          </div>

          {#if $currentUser}
            <button class="nav-link logout-btn" on:click={handleLogout}>
              <LogOut size={16} />
              <span>{$t("nav.logout")}</span>
            </button>
          {:else}
            <a href="/login" class="nav-link login-btn">
              <LogIn size={16} />
              <span>{$t("nav.login")}</span>
            </a>
          {/if}
        </div>
      </div>
    </div>
  </nav>

  {#if !$currentUser}
    <div class="demo-banner">
      <p>
        {$t("common.demoBanner")} <a href="/login">{$t("auth.loginBtn")}</a>
        {$t("common.or")} <a href="/register">{$t("auth.registerBtn")}</a>
      </p>
    </div>
  {/if}

  <main class="main-layout">
    <slot />
  </main>

  <footer class="footer">
    <div class="footer-content">
      <p>{$t("common.copyright")}</p>
      <p>{$t("common.tagline")}</p>
    </div>
  </footer>

  <!-- Mobile Bottom Navigation Bar -->
  <nav class="mobile-bottom-nav" aria-label="Mobile navigation">
    <a
      href="/map"
      class="mobile-nav-item"
      class:active={$page.url.pathname.startsWith('/map')}
    >
      <Map size={20} />
      <span>{$t('nav.map')}</span>
    </a>
    <a
      href="/trips"
      class="mobile-nav-item"
      class:active={$page.url.pathname.startsWith('/trips')}
    >
      <Compass size={20} />
      <span>{$t('nav.trips')}</span>
    </a>
    <a
      href="/profile"
      class="mobile-nav-item"
      class:active={$page.url.pathname.startsWith('/profile')}
    >
      <User size={20} />
      <span>{$t('nav.profile')}</span>
    </a>
  </nav>
{/if}

<Toast />

<style>
  .navbar {
    background: color-mix(in srgb, var(--color-bg-secondary) 50%, transparent);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border-bottom: 1px solid rgba(255, 255, 255, 0.05); /* very subtle border */
    position: sticky;
    top: 0;
    z-index: 1000;
  }

  .nav-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 1.5rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 4.5rem;
  }

  .nav-brand {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--color-text-primary);
    text-decoration: none;
  }

  .brand-icon-box {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 38px;
    height: 38px;
    background-color: #3b82f6; /* bright blue accent */
    border-radius: 10px;
    color: white;
  }

  .nav-links {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex: 1;
    margin-left: 2rem;
  }

  .nav-center-links {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .nav-actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .nav-link {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.6rem 1rem;
    border-radius: 8px;
    font-size: 0.95rem;
    font-weight: 500;
    text-decoration: none;
    color: var(--color-text-secondary);
    transition: all 0.2s ease;
    cursor: pointer;
    background: transparent;
    border: none;
  }

  .nav-link:hover {
    color: var(--color-text-primary);
  }

  .nav-link.active {
    color: var(--color-accent-primary);
  }

  main.main-layout {
    min-height: calc(100vh - 8rem);
  }

  .footer {
    background: var(--color-bg-secondary);
    border-top: 1px solid var(--color-border);
    margin-top: 4rem;
  }

  .footer-content {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
    text-align: center;
    color: var(--color-text-secondary);
  }

  .footer-content p {
    margin: 0.5rem 0;
  }

  /* Mobile Bottom Navigation Bar */
  .mobile-bottom-nav {
    display: none;
  }

  @media (max-width: 768px) {
    .nav-container {
      flex-direction: row;
      height: 3.25rem;
      padding: 0 1rem;
    }

    .nav-center-links {
      display: none;
    }

    /* Hide theme/language switchers on mobile, keep logout/login visible */
    .nav-actions > .relative {
      display: none;
    }

    .nav-links {
      margin-left: auto;
      margin-top: 0;
      flex: unset;
    }

    .nav-link {
      padding: 0.4rem 0.75rem;
      font-size: 0.85rem;
    }

    main.main-layout {
      padding: 0;
      min-height: calc(100vh - 3.25rem - 56px); /* Subtract mobile nav + bottom nav */
      padding-bottom: 56px; /* Space for bottom nav */
    }

    .footer {
      display: none;
    }

    .demo-banner {
      font-size: 0.8rem;
      padding: 0.5rem;
    }

    /* Mobile Bottom Navigation */
    .mobile-bottom-nav {
      display: flex;
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      height: 56px;
      background: color-mix(in srgb, var(--color-bg-secondary) 85%, transparent);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      z-index: 1000;
      justify-content: space-around;
      align-items: center;
      padding: 0 1rem;
    }

    .mobile-nav-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
      padding: 0.4rem 1rem;
      text-decoration: none;
      color: var(--color-text-secondary);
      font-size: 0.7rem;
      font-weight: 500;
      transition: color 0.2s;
      border-radius: 8px;
    }

    .mobile-nav-item.active {
      color: var(--color-accent-primary);
    }

    .mobile-nav-item:hover {
      color: var(--color-text-primary);
    }
  }

  .demo-badge {
    background: var(--color-third);
    color: var(--color-bg-main);
    font-size: 0.75rem;
    padding: 0.1rem 0.5rem;
    border-radius: 9999px;
    margin-left: 0.5rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .demo-banner {
    background: linear-gradient(
      90deg,
      var(--color-accent-primary),
      var(--color-accent-hover)
    );
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
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid transparent;
    color: #ef4444;
    cursor: pointer;
    margin-left: 0.5rem;
  }

  .logout-btn:hover {
    background: rgba(239, 68, 68, 0.15);
    color: #ef4444;
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
    background-color: var(--color-bg-main);
    color: var(--color-text-secondary);
    z-index: 9999;
  }

  .spinner {
    width: 40px;
    height: 40px;
    border: 3px solid var(--color-border);
    border-radius: 50%;
    border-top-color: var(--color-accent-primary);
    animation: spin 1s ease-in-out infinite;
    margin-bottom: 1rem;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>
