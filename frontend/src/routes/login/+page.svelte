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
  } from "lucide-svelte"

  let username = ""
  let password = ""
  let errorMessage = ""
  let loading = false

  async function handleLogin() {
    try {
      loading = true
      errorMessage = ""
      authService
        .login(username, password)
        .then((res) => {
          if (res.access_token) {
            goto("/profile")
          } else {
            errorMessage = res.data.message
          }
        })
        .catch((error: any) => {
          errorMessage =
            error.response?.data?.message || "Credenciales inválidas"
        })
        .finally(() => {
          loading = false
        })
    } catch (error: any) {
      errorMessage = error.response?.data?.message || "Credenciales inválidas"
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
      <h1 class="auth-title">Bienvenido de nuevo</h1>
      <p class="auth-subtitle">
        Inicia sesión para seguir explorando el mundo.
      </p>

      <form on:submit|preventDefault={handleLogin} class="auth-form">
        <div class="auth-field">
          <label for="username">Usuario</label>
          <div class="auth-input-wrap">
            <User class="auth-input-icon" />
            <input
              id="username"
              type="text"
              bind:value={username}
              required
              placeholder="username"
            />
          </div>
        </div>
        <div class="auth-field">
          <label for="password">Contraseña</label>
          <div class="auth-input-wrap">
            <Lock class="auth-input-icon" />
            <input
              id="password"
              type="password"
              bind:value={password}
              required
              placeholder="••••••••"
            />
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
            <span>Entrando...</span>
          {:else}
            <span>Entrar</span>
            <ArrowRight class="auth-submit-icon" />
          {/if}
        </button>
        <div class="auth-links">
          <a href="/register">Crear cuenta</a>
          <span class="auth-links-muted" title="Próximamente"
            >¿Olvidaste tu contraseña?</span
          >
        </div>
      </form>
    </div>

    <div class="auth-panel auth-panel-quote">
      <div class="auth-quote-icon-wrap">
        <Quote class="auth-quote-icon" />
      </div>
      <p class="auth-quote-text">
        "No viajas para escapar de la vida, sino para que la vida no se te
        escape."
      </p>
      <p class="auth-quote-author">Anónimo</p>
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
    font-family: "Plus Jakarta Sans", system-ui, sans-serif;
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
      rgba(2, 6, 23, 0.95) 0%,
      rgba(30, 58, 138, 0.4) 50%,
      rgba(2, 6, 23, 0.95) 100%
    );
  }

  .auth-card {
    position: relative;
    z-index: 10;
    width: 100%;
    max-width: 64rem;
    min-height: 580px;
    border-radius: 1.5rem;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    border: 1px solid rgba(71, 85, 105, 0.5);
    background: #0f172a;
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
    background: #0f172a;
    border-bottom: 1px solid rgba(51, 65, 85, 0.5);
  }
  @media (min-width: 768px) {
    .auth-panel-form {
      width: 52%;
      flex: none;
      border-bottom: none;
      border-right: 1px solid rgba(51, 65, 85, 0.5);
    }
  }

  .auth-brand {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    color: #60a5fa;
    text-decoration: none;
    font-weight: 700;
    font-size: 1.125rem;
    margin-bottom: 2rem;
    width: fit-content;
  }
  .auth-brand:hover {
    color: #93c5fd;
  }
  .auth-brand-icon {
    width: 1.75rem;
    height: 1.75rem;
    transition: transform 0.2s;
  }
  .auth-brand:hover .auth-brand-icon {
    transform: scale(1.1);
  }

  .auth-title {
    font-size: 1.875rem;
    font-weight: 800;
    color: #fff;
    margin: 0 0 0.5rem 0;
    letter-spacing: -0.025em;
  }
  @media (min-width: 768px) {
    .auth-title {
      font-size: 2.25rem;
    }
  }
  .auth-subtitle {
    color: #94a3b8;
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
    color: #cbd5e1;
  }
  .auth-input-wrap {
    position: relative;
    display: flex;
    align-items: center;
    gap: 1rem;
  }
  .auth-input-wrap .auth-input-icon {
    position: absolute;
    left: 1rem;
    width: 1.25rem;
    height: 1.25rem;
    color: #64748b;
    pointer-events: none;
    transition: color 0.2s;
  }
  .auth-input-wrap:focus-within .auth-input-icon {
    color: #60a5fa;
  }
  .auth-input-wrap input {
    width: 100%;
    padding: 0.875rem 1rem 0.875rem 2.75rem;
    border-radius: 0.75rem;
    border: 1px solid rgba(71, 85, 105, 0.6);
    background: rgba(30, 41, 59, 0.8);
    color: #fff;
    font-size: 1rem;
    font-family: inherit;
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .auth-input-wrap input::placeholder {
    color: #64748b;
  }
  .auth-input-wrap input:focus {
    outline: none;
    border-color: rgba(96, 165, 250, 0.8);
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.25);
  }

  .auth-error {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    border-radius: 0.75rem;
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.2);
    color: #f87171;
    font-size: 0.875rem;
  }
  .auth-error-icon {
    width: 1rem;
    height: 1rem;
    flex-shrink: 0;
  }

  .auth-submit {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 1rem 1.25rem;
    border-radius: 0.75rem;
    border: none;
    font-size: 1rem;
    font-weight: 600;
    font-family: inherit;
    color: #fff;
    background: linear-gradient(to right, #3b82f6, #2563eb);
    box-shadow: 0 10px 15px -3px rgba(59, 130, 246, 0.25);
    cursor: pointer;
    transition: background 0.2s, box-shadow 0.2s, transform 0.1s;
  }
  .auth-submit:hover:not(:disabled) {
    background: linear-gradient(to right, #60a5fa, #3b82f6);
    box-shadow: 0 10px 15px -3px rgba(96, 165, 250, 0.3);
  }
  .auth-submit:active:not(:disabled) {
    transform: scale(0.99);
  }
  .auth-submit:focus {
    outline: none;
    box-shadow: 0 0 0 2px #0f172a, 0 0 0 4px rgba(59, 130, 246, 0.5);
  }
  .auth-submit:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  .auth-submit-icon {
    width: 1.25rem;
    height: 1.25rem;
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
    color: #60a5fa;
    text-decoration: none;
  }
  .auth-links a:hover {
    color: #93c5fd;
  }
  .auth-links-muted {
    font-size: 0.875rem;
    color: #64748b;
    cursor: default;
  }

  .auth-panel-quote {
    display: none;
    background: linear-gradient(
      135deg,
      #1e293b 0%,
      rgba(30, 58, 138, 0.5) 100%
    );
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
    border-radius: 1rem;
    background: rgba(96, 165, 250, 0.2);
    color: #60a5fa;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 2rem;
  }
  .auth-quote-icon {
    width: 2rem;
    height: 2rem;
  }
  .auth-quote-text {
    font-size: 1.25rem;
    font-weight: 500;
    color: #e2e8f0;
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
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    margin: 0;
  }

  @keyframes auth-zoom {
    from {
      transform: scale(1.05);
    }
    to {
      transform: scale(1.12);
    }
  }
  @keyframes auth-fade-in {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  @keyframes auth-spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>
