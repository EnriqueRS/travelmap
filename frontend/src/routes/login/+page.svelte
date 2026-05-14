<script lang="ts">
  import { authService } from "$lib/services/auth"
  import { goto } from "$app/navigation"
  import {
    User,
    Lock,
    Quote,
    Globe,
    ArrowRight,
    AlertCircle,
    Eye,
    EyeOff,
  } from "lucide-svelte"

  import { t } from "$lib/stores/i18n"

  let username = ""
  let password = ""
  let errorMessage = ""
  let loading = false
  let showPassword = false

  async function handleLogin() {
    try {
      loading = true
      errorMessage = ""
      authService
        .login(username, password)
        .then((res) => {
          if (res.accessToken) {
            goto("/map")
          } else {
            errorMessage = $t("auth.invalidCredentials")
          }
        })
        .catch((error: any) => {
          errorMessage =
            error.response?.data?.message || $t("auth.invalidCredentials")
        })
        .finally(() => {
          loading = false
        })
    } catch (error: any) {
      errorMessage =
        error.response?.data?.message || $t("auth.invalidCredentials")
    } finally {
      loading = false
    }
  }
</script>

<div class="auth-wrap">
  <div class="auth-bg">
    <img
      src="https://images.unsplash.com/photo-1488646953014-85cb44e25828?ixlib=rb-4.0.3&auto=format&fit=crop&w=2067&q=80"
      alt=""
    />
    <div class="auth-bg-overlay" />
  </div>

  <div class="auth-card">
    <div class="auth-panel auth-panel-form">
      <a href="/" class="auth-brand">
        <Globe class="auth-brand-icon" />
        <span>TravelMap</span>
      </a>
      <h1 class="auth-title">{$t("auth.welcome")}</h1>
      <p class="auth-subtitle">
        {$t("auth.loginSubtitle")}
      </p>

      <form on:submit|preventDefault={handleLogin} class="auth-form">
        <div class="auth-field">
          <label for="username">{$t("auth.username")}</label>
          <div class="auth-input-wrap">
            <User class="auth-input-icon" />
            <input
              id="username"
              type="text"
              bind:value={username}
              required
              placeholder={$t("auth.usernamePlaceholder")}
            />
          </div>
        </div>
        <div class="auth-field">
          <label for="password">{$t("auth.password")}</label>
          <div class="auth-input-wrap">
            <Lock class="auth-input-icon" />
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              on:input={(e) => (password = e.currentTarget.value)}
              required
              placeholder={$t("auth.passwordPlaceholder")}
            />
            <button
              type="button"
              class="auth-input-toggle"
              on:click={() => (showPassword = !showPassword)}
              aria-label={showPassword
                ? $t("auth.hidePassword")
                : $t("auth.showPassword")}
              title={showPassword
                ? $t("auth.hidePassword")
                : $t("auth.showPassword")}
            >
              {#if showPassword}
                <EyeOff class="auth-toggle-icon" />
              {:else}
                <Eye class="auth-toggle-icon" />
              {/if}
            </button>
          </div>
        </div>
        {#if errorMessage}
          <div class="auth-error" role="alert">
            <AlertCircle class="auth-error-icon" />
            <span>{errorMessage}</span>
          </div>
        {/if}
        <button type="submit" disabled={loading} class="auth-submit">
          {#if loading}
            <span class="auth-spinner" />
            <span>{$t("auth.loggingIn")}</span>
          {:else}
            <span>{$t("auth.loginBtn")}</span>
            <ArrowRight class="auth-submit-icon" />
          {/if}
        </button>
        <div class="auth-links">
          <a href="/register">{$t("auth.registerBtn")}</a>
          <span class="auth-links-muted" title={$t("common.demoBanner")}
            >{$t("auth.forgotPassword")}</span
          >
        </div>
      </form>
    </div>

    <div class="auth-panel auth-panel-quote">
      <div class="auth-quote-icon-wrap">
        <Quote class="auth-quote-icon" />
      </div>
      <p class="auth-quote-text">
        "{$t("auth.quote")}"
      </p>
      <p class="auth-quote-author">{$t("auth.quoteAuthor")}</p>
    </div>
  </div>
</div>

<style>
  .auth-wrap {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
    position: relative;
    overflow: hidden;
    font-family: var(--font-heading);
  }

  .auth-bg {
    position: absolute;
    inset: 0;
    z-index: 0;
  }
  .auth-bg img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    animation: auth-zoom 20s ease-in-out infinite alternate;
  }
  .auth-bg-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(
      135deg,
      rgba(0, 0, 0, 0.92) 0%,
      rgba(30, 58, 138, 0.3) 50%,
      rgba(0, 0, 0, 0.92) 100%
    );
  }

  .auth-card {
    position: relative;
    z-index: 10;
    width: 100%;
    max-width: 64rem;
    min-height: 580px;
    border-radius: var(--radius-2xl);
    overflow: hidden;
    display: flex;
    flex-direction: column;
    box-shadow: var(--shadow-xl);
    border: 1px solid var(--color-border-light);
    background: var(--color-bg-main);
    animation: auth-fade-in 0.5s ease-out;
  }

  @media (min-width: 768px) {
    .auth-card {
      flex-direction: row;
    }
  }

  .auth-panel {
    padding: 2rem;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  @media (min-width: 768px) {
    .auth-panel {
      padding: 3rem;
    }
  }

  .auth-panel-form {
    flex: 1;
    min-width: 0;
    background: var(--color-bg-main);
    border-bottom: 1px solid var(--color-border);
  }
  @media (min-width: 768px) {
    .auth-panel-form {
      width: 52%;
      flex: none;
      border-bottom: none;
      border-right: 1px solid var(--color-border);
    }
  }

  .auth-brand {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    color: var(--color-accent-text);
    text-decoration: none;
    font-weight: 700;
    font-size: 1.125rem;
    margin-bottom: 2rem;
    width: fit-content;
  }
  .auth-brand:hover {
    color: var(--color-accent-primary);
  }

  .auth-title {
    font-size: 1.875rem;
    font-weight: 800;
    color: var(--color-text-primary);
    margin: 0 0 0.5rem 0;
    letter-spacing: -0.025em;
  }
  @media (min-width: 768px) {
    .auth-title {
      font-size: 2.25rem;
    }
  }
  .auth-subtitle {
    color: var(--color-text-secondary);
    font-size: 1rem;
    margin: 0 0 2rem 0;
  }

  .auth-form {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }
  .auth-field {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  .auth-field label {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--color-text-secondary);
  }
  .auth-input-wrap {
    position: relative;
    display: flex;
    align-items: center;
    gap: 1rem;
  }
  .auth-input-wrap input {
    width: 100%;
    padding: 0.75rem 3rem 0.75rem 2.75rem;
    border-radius: var(--radius-base);
    border: 1px solid var(--color-border-light);
    background: var(--color-bg-tertiary);
    color: var(--color-text-primary);
    font-size: 1rem;
    font-family: inherit;
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .auth-input-wrap input::placeholder {
    color: var(--color-text-muted);
  }
  .auth-input-wrap input:focus {
    outline: none;
    border-color: var(--color-accent-primary);
    box-shadow: 0 0 0 3px var(--color-accent-muted);
  }

  .auth-input-toggle {
    position: absolute;
    right: 1rem;
    background: transparent;
    border: none;
    padding: 0;
    cursor: pointer;
    color: var(--color-text-muted);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: color 0.2s;
  }
  .auth-input-toggle:hover {
    color: var(--color-text-secondary);
  }
  .auth-input-toggle:focus {
    outline: none;
    color: var(--color-accent-text);
  }

  .auth-error {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    border-radius: var(--radius-base);
    background: var(--color-danger-muted);
    border: 1px solid var(--color-danger-border);
    color: var(--color-danger-text);
    font-size: 0.875rem;
  }

  .auth-submit {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.875rem 1.25rem;
    border-radius: var(--radius-base);
    border: none;
    font-size: 1rem;
    font-weight: 600;
    font-family: inherit;
    color: var(--color-text-inverse);
    background: var(--color-accent-primary);
    box-shadow: var(--shadow-md);
    cursor: pointer;
    transition: background 0.2s, box-shadow 0.2s, transform 0.1s;
  }
  .auth-submit:hover:not(:disabled) {
    background: var(--color-accent-hover);
    box-shadow: var(--shadow-lg);
  }
  .auth-submit:active:not(:disabled) {
    transform: scale(0.98);
  }
  .auth-submit:focus-visible {
    outline: 2px solid var(--color-accent-primary);
    outline-offset: 2px;
  }
  .auth-submit:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  .auth-spinner {
    width: 1.25rem;
    height: 1.25rem;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: #fff;
    border-radius: 50%;
    animation: auth-spin 0.8s linear infinite;
  }

  .auth-links {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    padding-top: 0.5rem;
  }
  .auth-links a {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--color-accent-text);
    text-decoration: none;
  }
  .auth-links a:hover {
    color: var(--color-accent-primary);
  }
  .auth-links-muted {
    font-size: 0.875rem;
    color: var(--color-text-muted);
    cursor: default;
  }

  .auth-panel-quote {
    display: none;
    background: var(--color-bg-secondary);
    text-align: center;
    min-height: 280px;
  }
  @media (min-width: 768px) {
    .auth-panel-quote {
      display: flex;
      width: 48%;
      flex: none;
    }
  }
  .auth-quote-icon-wrap {
    width: 3.5rem;
    height: 3.5rem;
    border-radius: var(--radius-xl);
    background: var(--color-accent-muted);
    color: var(--color-accent-text);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 2rem;
  }
  .auth-quote-text {
    font-size: 1.25rem;
    font-weight: 500;
    color: var(--color-text-primary);
    font-style: italic;
    line-height: 1.6;
    margin: 0 0 1.5rem 0;
    max-width: 20rem;
  }
  @media (min-width: 768px) {
    .auth-quote-text {
      font-size: 1.5rem;
    }
  }
  .auth-quote-author {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    margin: 0;
  }

  @keyframes auth-zoom {
    from { transform: scale(1.05); }
    to { transform: scale(1.12); }
  }
  @keyframes auth-fade-in {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes auth-spin {
    to { transform: rotate(360deg); }
  }
</style>
