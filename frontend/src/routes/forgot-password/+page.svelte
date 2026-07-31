<script lang="ts">
  import { goto } from "$app/navigation"
  import {
    Mail,
    Globe,
    ArrowRight,
    AlertCircle,
    CheckCircle,
  } from "lucide-svelte"
  import { t } from "$lib/stores/i18n"
  import { API_URL } from "$lib/services/auth"
  import axios from "axios"

  let email = ""
  let loading = false
  let success = false
  let errorMessage = ""

  async function handleSubmit() {
    loading = true
    errorMessage = ""
    try {
      await axios.post(`${API_URL}/auth/forgot-password`, { email })
      success = true
    } catch (error: any) {
      errorMessage =
        error.response?.data?.message || "Error al procesar la solicitud"
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

      {#if success}
        <div class="success-state">
          <CheckCircle size={48} />
          <h1 class="auth-title">Revisa tu email</h1>
          <p class="auth-subtitle">
            Si el email existe en nuestro sistema, se ha generado un enlace de
            restablecimiento. Revisa la consola del backend en desarrollo.
          </p>
          <a href="/login" class="auth-back-link">
            Volver a iniciar sesión
          </a>
        </div>
      {:else}
        <h1 class="auth-title">Recuperar contraseña</h1>
        <p class="auth-subtitle">
          Introduce tu email y te enviaremos un enlace para restablecer tu contraseña.
        </p>

        <form on:submit|preventDefault={handleSubmit} class="auth-form">
          <div class="auth-field">
            <label for="email">Email</label>
            <div class="auth-input-wrap">
              <Mail class="auth-input-icon" />
              <input
                id="email"
                type="email"
                bind:value={email}
                required
                placeholder="tu@email.com"
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
              <span>Enviando...</span>
            {:else}
              <span>Enviar enlace</span>
              <ArrowRight class="auth-submit-icon" />
            {/if}
          </button>

          <a href="/login" class="auth-back-link">
            Volver a iniciar sesión
          </a>
        </form>
      {/if}
    </div>

    <div class="auth-panel auth-panel-quote">
      <div class="auth-quote-icon-wrap">
        <Mail class="auth-quote-icon" />
      </div>
      <p class="auth-quote-text">
        "No todos los que vagan están perdidos."
      </p>
      <p class="auth-quote-author">J.R.R. Tolkien</p>
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
  }
  .auth-bg-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(0,0,0,0.92) 0%, rgba(30,58,138,0.3) 50%, rgba(0,0,0,0.92) 100%);
  }
  .auth-card {
    position: relative;
    z-index: 10;
    width: 100%;
    max-width: 64rem;
    min-height: 480px;
    border-radius: var(--radius-2xl);
    overflow: hidden;
    display: flex;
    flex-direction: column;
    box-shadow: var(--shadow-xl);
    border: 1px solid var(--color-border-light);
    background: var(--color-bg-main);
  }
  @media (min-width: 768px) {
    .auth-card { flex-direction: row; }
  }
  .auth-panel {
    padding: 2rem;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
  @media (min-width: 768px) {
    .auth-panel { padding: 3rem; }
  }
  .auth-panel-form {
    flex: 1;
    min-width: 0;
    background: var(--color-bg-main);
  }
  @media (min-width: 768px) {
    .auth-panel-form { width: 52%; flex: none; }
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
  .auth-brand:hover { color: var(--color-accent-primary); }
  .auth-title {
    font-size: 1.875rem;
    font-weight: 800;
    color: var(--color-text-primary);
    margin: 0 0 0.5rem 0;
    letter-spacing: -0.025em;
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
  .auth-field { display: flex; flex-direction: column; gap: 0.5rem; }
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
  }
  .auth-input-wrap input::placeholder { color: var(--color-text-muted); }
  .auth-input-wrap input:focus {
    outline: none;
    border-color: var(--color-accent-primary);
    box-shadow: 0 0 0 3px var(--color-accent-muted);
  }
  .auth-input-icon {
    position: absolute;
    left: 1rem;
    color: var(--color-text-muted);
    pointer-events: none;
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
    transition: background 0.2s, transform 0.1s;
  }
  .auth-submit:hover:not(:disabled) { background: var(--color-accent-hover); }
  .auth-submit:active:not(:disabled) { transform: scale(0.98); }
  .auth-submit:disabled { opacity: 0.6; cursor: not-allowed; }
  .auth-spinner {
    width: 1.25rem;
    height: 1.25rem;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: #fff;
    border-radius: 50%;
    animation: auth-spin 0.8s linear infinite;
  }
  .auth-back-link {
    text-align: center;
    font-size: 0.875rem;
    color: var(--color-accent-text);
    text-decoration: none;
    margin-top: 0.5rem;
  }
  .auth-back-link:hover { color: var(--color-accent-primary); }
  .success-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 1rem;
  }
  .success-state :global(svg) { color: #22c55e; }
  .auth-panel-quote {
    display: none;
    background: var(--color-bg-secondary);
    text-align: center;
  }
  @media (min-width: 768px) {
    .auth-panel-quote { display: flex; width: 48%; flex: none; }
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
    font-size: 1.5rem;
    font-weight: 500;
    color: var(--color-text-primary);
    font-style: italic;
    line-height: 1.6;
    margin: 0 0 1.5rem 0;
    max-width: 20rem;
  }
  .auth-quote-author {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }
  @keyframes auth-spin { to { transform: rotate(360deg); } }
</style>