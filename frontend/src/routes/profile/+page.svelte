<script lang="ts">
  import {
    User,
    Map,
    Calendar,
    Camera,
    Settings,
    X,
    Home,
    Upload,
    RefreshCw,
  } from "lucide-svelte"
  import { userProfile, locations } from "$lib/stores/data"
  import ImagePlaceholder from "$lib/components/ui/ImagePlaceholder.svelte"
  import LocationPicker from "$lib/components/map/LocationPicker.svelte"
  import { authService } from "$lib/services/auth"
  import { integrationsService } from "$lib/services/integrations"
  import { onMount } from "svelte"

  // Estado Integraciones
  let immichStatus = { isConnected: false, url: "" }
  let immichConfig = { url: "", apiKey: "" }
  let isSavingImmich = false
  let immichMessage = { type: "", text: "" }

  onMount(async () => {
    try {
      const status = await integrationsService.checkStatus()
      if (status.immich) {
        immichStatus.isConnected = true
        immichStatus.url = status.url
        immichConfig.url = status.url // Prellenar url
      }
    } catch (e) {
      console.error("No se pudo comprobar el estado de immich", e)
    }
  })

  async function handleImmichSave() {
    isSavingImmich = true
    immichMessage = { type: "", text: "" }
    try {
      const res = await integrationsService.setupImmich(
        immichConfig.url,
        immichConfig.apiKey
      )
      immichStatus.isConnected = true
      immichStatus.url = res.url
      immichMessage = {
        type: "success",
        text: "Conectado. Tus álbumes ya pueden vincularse a tus viajes.",
      }
    } catch (e: any) {
      immichMessage = {
        type: "error",
        text:
          e.response?.data?.message ||
          "Error al conectar. Verifica tu URL y API Key.",
      }
    } finally {
      isSavingImmich = false
    }
  }

  // Modal
  let showEditModal = false
  let editData = { ...$userProfile }
  let isSaving = false
  let saveMessage = { type: "", text: "" }

  // Avatar logic
  let avatarTab: "preset" | "upload" = "preset"
  let avatarFile: File | null = null
  let avatarPreview: string | null = null

  const avatarPresets = [
    "https://api.dicebear.com/7.x/shapes/svg?seed=Felix",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Zoe",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Jack",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Precious",
    "https://api.dicebear.com/7.x/bottts/svg?seed=Aneka",
    "https://api.dicebear.com/7.x/identicon/svg?seed=Map",
  ]

  // Ensure homeLocation structure exists in editData if not present
  if (!editData.homeLocation) {
    editData.homeLocation = { name: "", coordinates: [0, 0] }
  }

  function handleAvatarFile(e: Event) {
    const input = e.target as HTMLInputElement
    if (input.files && input.files[0]) {
      avatarFile = input.files[0]
      const reader = new FileReader()
      reader.onload = (e) => {
        avatarPreview = e.target?.result as string
        editData.avatar = avatarPreview // Update edit data immediately for preview
      }
      reader.readAsDataURL(avatarFile)
    }
  }

  function selectPreset(url: string) {
    editData.avatar = url
    avatarPreview = null
    avatarFile = null
  }

  async function handleSave() {
    isSaving = true
    saveMessage = { type: "", text: "" }

    try {
      // If we have stats, we should keep them, but here we only edit specific fields
      // The backend should handle partial updates or we send the full object
      // For now, let's send what we have in editData

      // Note: We are sending the whole profile structure as per the store,
      // but the backend `updateProfile` sends it to PATCH /users/me

      const payload: any = {
        name: editData.name,
        bio: editData.bio,
        avatar: editData.avatar,
      }

      if (editData.homeLocation && editData.homeLocation.coordinates) {
        payload.homeLocationLat = editData.homeLocation.coordinates[0]
        payload.homeLocationLng = editData.homeLocation.coordinates[1]
      }

      await authService.updateProfile(payload)

      saveMessage = {
        type: "success",
        text: "Perfil actualizado correctamente",
      }
      setTimeout(() => {
        showEditModal = false
        saveMessage = { type: "", text: "" }
      }, 1500)
    } catch (error: any) {
      console.error("Error saving profile:", error)
      const detail =
        error.response?.data?.message || error.message || "Error desconocido"
      saveMessage = { type: "error", text: `Error al guardar: ${detail}` }
    } finally {
      isSaving = false
    }
  }

  // Statistics Calculation
  function calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ) {
    const R = 6371 // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1)
    const dLon = deg2rad(lon2 - lon1)
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) *
        Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c // Distance in km
  }

  function deg2rad(deg: number) {
    return deg * (Math.PI / 180)
  }

  let furthestPlace: { name: string; distance: number } | null = null

  $: if ($userProfile.homeLocation && $locations.length > 0) {
    let maxDist = 0
    let placeName = ""
    const home = $userProfile.homeLocation

    $locations.forEach((loc) => {
      const dist = calculateDistance(
        home.coordinates[0],
        home.coordinates[1],
        loc.coordinates[0],
        loc.coordinates[1]
      )
      if (dist > maxDist) {
        maxDist = dist
        placeName = loc.name
      }
    })

    if (maxDist > 0) {
      furthestPlace = { name: placeName, distance: Math.round(maxDist) }
    } else {
      furthestPlace = null
    }
  }
</script>

<svelte:head>
  <title>TravelMap - Perfil</title>
  <meta
    name="description"
    content="Perfil de usuario con estadísticas y logros"
  />
</svelte:head>

<main class="profile-page">
  <section class="profile-header">
    <div class="header-background">
      <div class="header-content">
        <div class="profile-avatar">
          <div class="avatar-wrapper">
            <ImagePlaceholder text={$userProfile.name} type="profile" />
          </div>
          <div class="profile-status">
            <div class="status-indicator online" />
            <span>Activo</span>
          </div>
        </div>

        <div class="profile-info">
          <h1>{$userProfile.name}</h1>
          <p class="profile-bio">{$userProfile.bio}</p>
          <div class="profile-meta">
            <span class="meta-item">
              <Calendar size={16} />
              Miembro activo
            </span>
          </div>
        </div>

        <div class="profile-actions">
          <button
            class="btn btn-primary"
            on:click={() => {
              editData = { ...$userProfile }
              showEditModal = true
            }}
          >
            <Settings size={20} />
            Editar Perfil
          </button>
          <a href="/trips/new" class="btn btn-secondary">
            <Camera size={20} />
            Añadir Viaje
          </a>
        </div>
      </div>
    </div>
  </section>

  <section class="profile-content">
    <div class="content-grid">
      <div class="stats-section">
        <h2>📊 Estadísticas</h2>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon">🗺️</div>
            <div class="stat-content">
              <div class="stat-number">
                {$userProfile.stats.countriesVisited}
              </div>
              <div class="stat-label">Países Visitados</div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon">📍</div>
            <div class="stat-content">
              <div class="stat-number">{$userProfile.stats.placesVisited}</div>
              <div class="stat-label">Ubicaciones Totales</div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon">🧭</div>
            <div class="stat-content">
              <div class="stat-number">{$userProfile.stats.tripsCompleted}</div>
              <div class="stat-label">Viajes Completados</div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon">📸</div>
            <div class="stat-content">
              <div class="stat-number">{$userProfile.stats.photosUploaded}</div>
              <div class="stat-label">Fotos Subidas</div>
            </div>
          </div>

          {#if furthestPlace}
            <div class="stat-card" style="grid-column: span 2;">
              <div class="stat-icon">🏃</div>
              <div class="stat-content">
                <div class="stat-number" style="font-size: 1.5rem;">
                  {furthestPlace.name}
                </div>
                <div class="stat-label">
                  Más lejano ({furthestPlace.distance} km)
                </div>
              </div>
            </div>
          {/if}
        </div>
      </div>

      <div class="interests-section">
        <h2>🏆 Información</h2>
        <p class="text-gray-400">
          Bienvenido a tu perfil de TravelMap. Aquí puedes ver tu progreso y
          gestionar tu información personal.
        </p>

        <div class="integrations-container" style="margin-top: 2rem;">
          <h2>🔗 Integraciones</h2>
          <div class="integration-card">
            <div
              class="integration-header"
              style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;"
            >
              <h3
                style="margin: 0; color: #cbd5e1; display:flex; gap:0.5rem; align-items:center;"
              >
                <img
                  src="/favicon.png"
                  alt="Immich"
                  style="width:20px; filter: grayscale(1) brightness(2);"
                />
                Immich Server
              </h3>
              {#if immichStatus.isConnected}
                <span
                  class="status-badge connected"
                  style="background: rgba(16, 185, 129, 0.2); color: #34d399; padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.8rem;"
                  >Conectado</span
                >
              {:else}
                <span
                  class="status-badge disconnected"
                  style="background: rgba(239, 68, 68, 0.2); color: #f87171; padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.8rem;"
                  >Desconectado</span
                >
              {/if}
            </div>

            <p style="font-size: 0.9rem; color:#94a3b8; margin-bottom: 1rem;">
              Conecta tu servidor auto-hospedado de Immich para incrustar tus
              álbumes de fotos en tus viajes.
            </p>

            <form on:submit|preventDefault={handleImmichSave}>
              <div class="form-group" style="margin-bottom: 1rem;">
                <label style="font-size: 0.85rem;"
                  >URL de la API (Servidor)</label
                >
                <input
                  type="url"
                  bind:value={immichConfig.url}
                  placeholder="Ej: https://photos.midominio.com/api"
                  required
                  style="font-size:0.9rem; padding: 0.5rem;"
                />
              </div>
              <div class="form-group" style="margin-bottom: 1rem;">
                <label style="font-size: 0.85rem;">API Key</label>
                <input
                  type="password"
                  bind:value={immichConfig.apiKey}
                  placeholder="Pégala desde Immich > Configuración"
                  required
                  style="font-size:0.9rem; padding: 0.5rem;"
                />
              </div>

              <button
                type="submit"
                class="btn btn-primary"
                style="width: 100%; justify-content:center;"
                disabled={isSavingImmich}
              >
                {isSavingImmich
                  ? "Validando..."
                  : immichStatus.isConnected
                  ? "Actualizar Credenciales"
                  : "Conectar Immich"}
              </button>

              {#if immichMessage.text}
                <div
                  class="message {immichMessage.type}"
                  style="margin-top:1rem; font-size:0.85rem;"
                >
                  {immichMessage.text}
                </div>
              {/if}
            </form>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Modal Editar Perfil -->
  {#if showEditModal}
    <div class="modal-backdrop" on:click|self={() => (showEditModal = false)}>
      <div class="modal">
        <div class="modal-header">
          <h2>Editar Perfil</h2>
          <button class="close-btn" on:click={() => (showEditModal = false)}>
            <X size={24} />
          </button>
        </div>
        <form on:submit|preventDefault={handleSave}>
          <div class="form-group">
            <label for="name">Nombre</label>
            <input id="name" type="text" bind:value={editData.name} required />
          </div>

          <div class="form-group">
            <label for="bio">Biografía</label>
            <textarea id="bio" bind:value={editData.bio} rows="4" />
          </div>

          <div class="form-group">
            <label for="avatar">Avatar</label>
            <div class="avatar-selection">
              <div class="avatar-tabs">
                <button
                  type="button"
                  class:active={avatarTab === "preset"}
                  on:click={() => (avatarTab = "preset")}>Presets</button
                >
                <button
                  type="button"
                  class:active={avatarTab === "upload"}
                  on:click={() => (avatarTab = "upload")}>Subir Imagen</button
                >
              </div>

              <div class="current-avatar-preview">
                {#if editData.avatar && editData.avatar.startsWith("http")}
                  <img
                    src={editData.avatar}
                    alt="Avatar preview"
                    class="avatar-preview-img"
                  />
                {:else if editData.avatar && editData.avatar.startsWith("data:")}
                  <img
                    src={editData.avatar}
                    alt="Avatar preview"
                    class="avatar-preview-img"
                  />
                {:else}
                  <ImagePlaceholder
                    text={editData.name}
                    type="profile"
                    className="avatar-preview-placeholder"
                  />
                {/if}
              </div>

              {#if avatarTab === "preset"}
                <div class="presets-grid">
                  {#each avatarPresets as preset}
                    <button
                      type="button"
                      class="preset-btn"
                      class:selected={editData.avatar === preset}
                      on:click={() => selectPreset(preset)}
                    >
                      <img src={preset} alt="Preset avatar" />
                    </button>
                  {/each}
                </div>
              {:else}
                <div class="upload-area">
                  <input
                    type="file"
                    id="avatar-upload"
                    accept="image/*"
                    on:change={handleAvatarFile}
                    style="display: none;"
                  />
                  <button
                    type="button"
                    class="btn btn-secondary"
                    on:click={() =>
                      document.getElementById("avatar-upload")?.click()}
                  >
                    <Upload size={18} />
                    Seleccionar Archivo
                  </button>
                  {#if avatarFile}
                    <span class="file-name">{avatarFile.name}</span>
                  {/if}
                </div>
              {/if}
            </div>
          </div>

          <div
            class="form-group"
            style="padding-top: 1rem; border-top: 1px solid #334155;"
          >
            <h3 style="color: #60a5fa; margin-bottom: 1rem; font-size: 1.1rem;">
              Ubicación de Casa
            </h3>
            {#if editData.homeLocation}
              <div class="form-group">
                <label for="homeName">Ciudad / Nombre</label>
                <input
                  id="homeName"
                  type="text"
                  bind:value={editData.homeLocation.name}
                  placeholder="Ej. Madrid"
                />
              </div>

              <div class="map-wrapper" style="margin-top: 1rem;">
                <label style="margin-bottom: 0.5rem; display: block;"
                  >Seleccionar en mapa</label
                >
                {#if showEditModal}
                  <!-- Re-render map when modal opens -->
                  <LocationPicker
                    initialLocation={editData.homeLocation.coordinates[0] !== 0
                      ? {
                          lat: editData.homeLocation.coordinates[0],
                          lng: editData.homeLocation.coordinates[1],
                        }
                      : null}
                    on:locationSelect={(e) => {
                      if (editData.homeLocation) {
                        editData.homeLocation.coordinates = [
                          e.detail.lat,
                          e.detail.lng,
                        ]
                        // Optional: clear name if we want to force manual entry or try to fetch it
                      }
                    }}
                    height="300px"
                  />
                {/if}
                <p class="text-sm text-gray-400 mt-2">
                  Coordenadas: {editData.homeLocation.coordinates[0].toFixed(
                    4
                  )}, {editData.homeLocation.coordinates[1].toFixed(4)}
                </p>
              </div>
            {/if}
          </div>

          {#if saveMessage.text}
            <div class="message {saveMessage.type}">
              {saveMessage.text}
            </div>
          {/if}

          <div class="modal-actions">
            <button
              type="button"
              class="btn btn-secondary"
              on:click={() => (showEditModal = false)}>Cancelar</button
            >
            <button type="submit" class="btn btn-primary" disabled={isSaving}>
              {isSaving ? "Guardando..." : "Guardar Cambios"}
            </button>
          </div>
        </form>
      </div>
    </div>
  {/if}
</main>

<style>
  .profile-page {
    padding: 0;
    background: #1e293b;
    color: white;
    min-height: 100vh;
  }

  .profile-header {
    position: relative;
    height: 400px;
    background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
    overflow: hidden;
  }

  .header-background {
    height: 100%;
    position: relative;
  }

  .header-content {
    position: relative;
    z-index: 1;
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
    display: flex;
    align-items: center;
    gap: 2rem;
    height: 100%;
  }

  .profile-avatar {
    position: relative;
    flex-shrink: 0;
  }

  .avatar-wrapper {
    width: 150px;
    height: 150px;
    border-radius: 50%;
    overflow: hidden;
    border: 4px solid #60a5fa;
    background: #374151;
  }

  .profile-status {
    position: absolute;
    bottom: 8px;
    right: 8px;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: rgba(0, 0, 0, 0.8);
    padding: 0.25rem 0.5rem;
    border-radius: 12px;
  }

  .status-indicator {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #10b981;
  }

  .profile-info {
    flex: 1;
  }

  .profile-info h1 {
    font-size: 2.5rem;
    margin-bottom: 0.5rem;
    color: #60a5fa;
  }

  .profile-bio {
    font-size: 1.1rem;
    line-height: 1.6;
    color: #e2e8f0;
    max-width: 500px;
  }

  .profile-meta {
    margin-top: 1rem;
  }

  .meta-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #94a3b8;
    font-size: 0.9rem;
  }

  .profile-actions {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .profile-content {
    padding: 2rem;
  }

  .content-grid {
    display: grid;
    grid-template-columns: 1fr 2fr;
    gap: 2rem;
    max-width: 1200px;
    margin: 0 auto;
  }

  .stats-section,
  .interests-section {
    background: rgba(30, 41, 59, 0.5);
    padding: 1.5rem;
    border-radius: 8px;
    border: 1px solid #475569;
  }

  .stats-section h2,
  .interests-section h2 {
    margin-bottom: 1rem;
    color: #60a5fa;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }

  .stat-card {
    background: rgba(96, 165, 250, 0.1);
    padding: 1.5rem;
    border-radius: 8px;
    text-align: center;
    border: 1px solid #374151;
  }

  .stat-icon {
    font-size: 2rem;
    margin-bottom: 0.75rem;
    color: #60a5fa;
  }

  .stat-content {
    background: rgba(0, 0, 0, 0.3);
    padding: 1rem;
    border-radius: 6px;
  }

  .stat-number {
    font-size: 2rem;
    font-weight: 700;
    color: #60a5fa;
    margin-bottom: 0.25rem;
  }

  .stat-label {
    font-size: 0.9rem;
    color: #cbd5e1;
  }

  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    border-radius: 6px;
    text-decoration: none;
    font-weight: 600;
    transition: all 0.3s ease;
    cursor: pointer;
    border: 1px solid #475569;
    background: #1e293b;
    color: #cbd5e1;
    font-size: 0.9rem;
  }

  .btn-primary {
    background: #3b82f6;
    color: white;
    border-color: #3b82f6;
  }

  .btn-primary:hover {
    background: #2563eb;
    border-color: #2563eb;
    transform: translateY(-2px);
  }

  .btn-secondary {
    background: transparent;
    color: #60a5fa;
    border-color: #60a5fa;
  }

  .btn-secondary:hover {
    background: rgba(96, 165, 250, 0.1);
    color: #60a5fa;
    border-color: #60a5fa;
  }

  /* Modal styles */
  .modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2000;
  }

  .modal {
    background: #1e293b;
    padding: 2rem;
    border-radius: 12px;
    border: 1px solid #475569;
    width: 100%;
    max-width: 500px;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
  }

  .close-btn {
    background: transparent;
    border: none;
    color: #94a3b8;
    cursor: pointer;
    padding: 0.5rem;
  }

  .close-btn:hover {
    color: white;
  }

  .form-group {
    margin-bottom: 1.5rem;
  }

  .form-group label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 600;
    color: #cbd5e1;
  }

  input,
  textarea {
    width: 100%;
    padding: 0.75rem;
    border-radius: 6px;
    border: 1px solid #475569;
    background: #1e293b;
    color: white;
    font-family: inherit;
    box-sizing: border-box;
  }

  input:focus,
  textarea:focus {
    outline: 2px solid #60a5fa;
    border-color: #60a5fa;
  }

  .modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    margin-top: 2rem;
  }

  @media (max-width: 768px) {
    .header-content {
      flex-direction: column;
      gap: 1rem;
      text-align: center;
    }

    .content-grid {
      grid-template-columns: 1fr;
    }

    .profile-actions {
      flex-direction: row;
      justify-content: center;
      gap: 1rem;
    }
  }

  /* Avatar Selection Styles */
  .avatar-selection {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .avatar-tabs {
    display: flex;
    gap: 0.5rem;
    border-bottom: 1px solid #334155;
    padding-bottom: 0.5rem;
  }

  .avatar-tabs button {
    background: none;
    border: none;
    color: #94a3b8;
    padding: 0.5rem 1rem;
    cursor: pointer;
    font-weight: 500;
  }

  .avatar-tabs button.active {
    color: #60a5fa;
    border-bottom: 2px solid #60a5fa;
  }

  .current-avatar-preview {
    display: flex;
    justify-content: center;
    margin: 1rem 0;
  }

  .avatar-preview-img {
    width: 100px;
    height: 100px;
    border-radius: 50%;
    object-fit: cover;
    border: 3px solid #60a5fa;
  }

  .presets-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(60px, 1fr));
    gap: 0.5rem;
  }

  .preset-btn {
    background: #334155;
    border: 2px solid transparent;
    border-radius: 50%;
    cursor: pointer;
    padding: 0;
    overflow: hidden;
    transition: all 0.2s;
  }

  .preset-btn:hover {
    transform: scale(1.1);
  }

  .preset-btn.selected {
    border-color: #60a5fa;
  }

  .preset-btn img {
    width: 100%;
    height: 100%;
    display: block;
  }

  .upload-area {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 2rem;
    border: 2px dashed #334155;
    border-radius: 8px;
    justify-content: center;
  }

  .file-name {
    color: #cbd5e1;
    font-size: 0.9rem;
  }

  .message {
    margin-top: 1rem;
    padding: 0.75rem;
    border-radius: 6px;
    text-align: center;
    font-weight: 500;
  }

  .message.success {
    background: rgba(16, 185, 129, 0.2);
    color: #34d399;
    border: 1px solid #059669;
  }

  .message.error {
    background: rgba(239, 68, 68, 0.2);
    color: #f87171;
    border: 1px solid #dc2626;
  }
</style>
