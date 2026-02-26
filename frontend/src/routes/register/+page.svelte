<script lang="ts">
  import { authService } from "$lib/services/auth";
  import LocationPicker from "$lib/components/map/LocationPicker.svelte";
  import { goto } from "$app/navigation";
  import {
    UserPlus,
    MapPin,
    Mail,
    Lock,
    User,
    AlertCircle,
    Globe,
    ArrowRight,
    Eye,
    EyeOff,
  } from "lucide-svelte";

  let username = "";
  let email = "";
  let password = "";
  let firstName = "";
  let lastName = "";
  let homeLocation: { lat: number; lng: number } | null = null;
  let errorMessage = "";
  let loading = false;
  let showPassword = false;

  async function handleRegister() {
    try {
      if (!homeLocation) {
        errorMessage = "Por favor selecciona tu ubicación en el mapa.";
        return;
      }

      loading = true;
      errorMessage = "";

      await authService.register({
        username,
        email,
        password,
        firstName,
        lastName,
        homeLocation: {
          type: "Point",
          coordinates: [homeLocation.lat, homeLocation.lng],
        },
      });

      goto("/profile");
    } catch (error: any) {
      errorMessage = error.response?.data?.message || "Error en el registro";
    } finally {
      loading = false;
    }
  }

  function handleLocationSelect(event: CustomEvent) {
    homeLocation = event.detail;
    errorMessage = "";
  }
</script>

<div class="auth-wrap auth-wrap-register">
  <div class="auth-bg">
    <img
      src="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?ixlib=rb-4.0.3&auto=format&fit=crop&w=2021&q=80"
      alt=""
    />
    <div class="auth-bg-overlay" />
  </div>

  <div class="auth-card auth-card-register">
    <div class="auth-panel auth-panel-form">
      <a href="/" class="auth-brand">
        <Globe class="auth-brand-icon" />
        <span>TravelMap</span>
      </a>
      <h1 class="auth-title">Crear cuenta</h1>
      <p class="auth-subtitle">Únete y empieza a mapear tus aventuras.</p>

      <form
        on:submit|preventDefault={handleRegister}
        class="auth-form auth-form-register"
      >
        <div class="auth-row">
          <div class="auth-field">
            <label for="firstName">Nombre</label>
            <input
              id="firstName"
              name="firstName"
              type="text"
              bind:value={firstName}
              placeholder="John"
            />
          </div>
          <div class="auth-field">
            <label for="lastName">Apellidos</label>
            <input
              id="lastName"
              name="lastName"
              type="text"
              bind:value={lastName}
              placeholder="Doe"
            />
          </div>
        </div>

        <div class="auth-field">
          <label for="username">Usuario</label>
          <div class="auth-input-wrap">
            <User class="auth-input-icon" />
            <input
              id="username"
              name="username"
              type="text"
              required
              bind:value={username}
              placeholder="username"
            />
          </div>
        </div>
        <div class="auth-field">
          <label for="email">Correo</label>
          <div class="auth-input-wrap">
            <Mail class="auth-input-icon" />
            <input
              id="email"
              name="email"
              type="email"
              required
              bind:value={email}
              placeholder="tu@email.com"
            />
          </div>
        </div>
        <div class="auth-field">
          <label for="password">Contraseña</label>
          <div class="auth-input-wrap">
            <Lock class="auth-input-icon" />
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              required
              value={password}
              on:input={(e) => (password = e.currentTarget.value)}
              placeholder="••••••••"
            />
            <button
              type="button"
              class="auth-input-toggle"
              on:click={() => (showPassword = !showPassword)}
              aria-label={showPassword
                ? "Ocultar contraseña"
                : "Mostrar contraseña"}
              title={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            >
              {#if showPassword}
                <EyeOff class="auth-toggle-icon" />
              {:else}
                <Eye class="auth-toggle-icon" />
              {/if}
            </button>
          </div>
        </div>

        <div
          class="auth-field auth-field-location"
          role="group"
          aria-labelledby="location-label"
        >
          <span id="location-label" class="auth-label-location">
            <MapPin class="auth-label-location-icon" />
            Ubicación de casa
          </span>
          <div class="auth-map-wrap">
            <LocationPicker
              on:locationSelect={handleLocationSelect}
              height="200px"
            />
            {#if !homeLocation}
              <div class="auth-map-overlay">
                <span>Haz clic en el mapa para elegir</span>
              </div>
            {/if}
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
            <span>Creando cuenta...</span>
          {:else}
            <UserPlus class="auth-submit-icon" />
            <span>Registrarse</span>
            <ArrowRight class="auth-submit-icon" />
          {/if}
        </button>

        <p class="auth-footer-link">
          ¿Ya tienes cuenta?
          <a href="/login">Inicia sesión</a>
        </p>
      </form>
    </div>

    <div class="auth-panel auth-panel-visual">
      <div class="auth-visual-icon-wrap">
        <MapPin class="auth-visual-icon" />
      </div>
      <h3 class="auth-visual-title">Descubre el mundo</h3>
      <p class="auth-visual-text">
        Registra tus viajes, comparte tus lugares favoritos y conecta con otros
        viajeros.
      </p>
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

  .auth-card-register {
    min-height: 640px;
  }

  @media (min-width: 1024px) {
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
      padding: 2.5rem;
    }
  }

  .auth-panel-form {
    flex: 1;
    min-width: 0;
    background: #0f172a;
    border-bottom: 1px solid rgba(51, 65, 85, 0.5);
    overflow-y: auto;
    max-height: 90vh;
  }
  @media (min-width: 1024px) {
    .auth-panel-form {
      width: 55%;
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
    margin-bottom: 1.5rem;
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
    margin: 0 0 1.5rem 0;
  }

  .auth-form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  .auth-form-register {
    gap: 1rem;
  }
  .auth-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }
  @media (max-width: 640px) {
    .auth-row {
      grid-template-columns: 1fr;
    }
  }
  .auth-field {
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
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
  .auth-input-wrap input,
  .auth-field input {
    width: 100%;
    padding: 0.75rem 1rem;
    border-radius: 0.75rem;
    border: 1px solid rgba(71, 85, 105, 0.6);
    background: rgba(30, 41, 59, 0.8);
    color: #fff;
    font-size: 1rem;
    font-family: inherit;
    transition: border-color 0.2s, box-shadow 0.2s;
    box-sizing: border-box;
  }
  .auth-input-wrap input {
    padding-left: 2.75rem;
    padding-right: 3rem;
  }
  .auth-input-wrap input::placeholder,
  .auth-field input::placeholder {
    color: #64748b;
  }
  .auth-input-wrap input:focus,
  .auth-field input:focus {
    outline: none;
    border-color: rgba(96, 165, 250, 0.8);
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.25);
  }

  .auth-input-toggle {
    position: absolute;
    right: 1rem;
    background: transparent;
    border: none;
    padding: 0;
    cursor: pointer;
    color: #64748b;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: color 0.2s;
  }
  .auth-input-toggle:hover {
    color: #94a3b8;
  }
  .auth-input-toggle:focus {
    outline: none;
    color: #60a5fa;
  }
  .auth-toggle-icon {
    width: 1.25rem;
    height: 1.25rem;
  }

  .auth-field-location {
    gap: 0.5rem;
  }
  .auth-label-location {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    font-weight: 500;
    color: #cbd5e1;
  }
  .auth-label-location-icon {
    width: 1rem;
    height: 1rem;
    color: #60a5fa;
  }
  .auth-map-wrap {
    position: relative;
    border-radius: 0.75rem;
    overflow: hidden;
    border: 2px dashed rgba(71, 85, 105, 0.6);
    background: rgba(30, 41, 59, 0.5);
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .auth-map-wrap:focus-within {
    border-color: rgba(96, 165, 250, 0.8);
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
  }
  .auth-map-overlay {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(15, 23, 42, 0.6);
    pointer-events: none;
  }
  .auth-map-overlay span {
    font-size: 0.875rem;
    font-weight: 500;
    color: #cbd5e1;
    background: rgba(30, 41, 59, 0.9);
    padding: 0.5rem 1rem;
    border-radius: 0.5rem;
    border: 1px solid rgba(71, 85, 105, 0.5);
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
  .auth-submit .auth-submit-icon {
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

  .auth-footer-link {
    text-align: center;
    font-size: 0.875rem;
    color: #94a3b8;
    margin: 0.5rem 0 0 0;
  }
  .auth-footer-link a {
    font-weight: 500;
    color: #60a5fa;
    text-decoration: none;
    margin-left: 0.25rem;
  }
  .auth-footer-link a:hover {
    color: #93c5fd;
  }

  .auth-panel-visual {
    display: none;
    background: linear-gradient(
      135deg,
      #1e293b 0%,
      rgba(30, 58, 138, 0.5) 100%
    );
    text-align: left;
    min-height: 280px;
  }
  @media (min-width: 768px) {
    .auth-panel-visual {
      display: flex;
      width: 48%;
      flex: none;
    }
  }
  .auth-visual-icon-wrap {
    width: 4rem;
    height: 4rem;
    border-radius: 1rem;
    background: rgba(96, 165, 250, 0.2);
    color: #60a5fa;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 2rem;
  }
  .auth-visual-icon {
    width: 2rem;
    height: 2rem;
  }
  .auth-visual-title {
    font-size: 1.5rem;
    font-weight: 700;
    color: #fff;
    margin: 0 0 1rem 0;
  }
  .auth-visual-text {
    font-size: 1rem;
    color: #cbd5e1;
    line-height: 1.6;
    margin: 0;
    max-width: 20rem;
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
