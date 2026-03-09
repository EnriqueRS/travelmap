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
    Plus,
    Globe,
    MapPin,
    Navigation,
    AlertCircle,
    ChevronRight,
    Database,
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
        immichConfig.apiKey,
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
    lon2: number,
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
        loc.coordinates[1],
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
    <div class="header-content">
      <div class="profile-avatar-container">
        <div class="avatar-ring">
          <div class="avatar-wrapper">
            {#if $userProfile.avatar}
              <img src={$userProfile.avatar} alt="Avatar" class="avatar-img" />
            {:else}
              <ImagePlaceholder text={$userProfile.name} type="profile" />
            {/if}
          </div>
        </div>
        <div class="status-dot" />
      </div>

      <div class="profile-info">
        <div class="profile-name-row">
          <h1>{$userProfile.name}</h1>
          <span class="pro-badge">MIEMBRO PRO</span>
        </div>
        <p class="profile-bio">
          {$userProfile.bio ||
            "Apasionado por descubrir nuevos lugares y culturas. Fotógrafo aficionado recorriendo el mundo un click a la vez."}
        </p>
        <div class="profile-meta">
          <span class="meta-item">Joined Octubre 2023</span>
          <span class="meta-separator">•</span>
          <span class="meta-item">124 seguidores</span>
        </div>
      </div>

      <div class="profile-actions">
        <button
          class="btn btn-outline"
          on:click={() => {
            editData = { ...$userProfile }
            showEditModal = true
          }}
        >
          <Settings size={18} />
          <span>Editar Perfil</span>
        </button>
        <a href="/trips/new" class="btn btn-primary">
          <Plus size={18} />
          <span>Añadir Viaje</span>
        </a>
      </div>
    </div>
  </section>

  <section class="profile-content">
    <div class="content-grid">
      <div class="stats-sidebar">
        <div class="sidebar-header">ESTADÍSTICAS GLOBALES</div>

        <div class="stats-vertical-list">
          <div class="stats-item-card">
            <div class="stats-item-top">
              <div class="stats-icon-box icon-blue">
                <Globe size={18} />
              </div>
              <div class="stats-dash dash-blue" />
            </div>
            <div class="stats-number">
              {$userProfile.stats.countriesVisited}
            </div>
            <div class="stats-label">PAÍSES VISITADOS</div>
          </div>

          <div class="stats-item-card">
            <div class="stats-item-top">
              <div class="stats-icon-box icon-pink">
                <MapPin size={18} />
              </div>
              <div class="stats-dash dash-pink" />
            </div>
            <div class="stats-number">{$userProfile.stats.placesVisited}</div>
            <div class="stats-label">UBICACIONES</div>
          </div>

          <div class="stats-item-card">
            <div class="stats-item-top">
              <div class="stats-icon-box icon-yellow">
                <Navigation size={18} />
              </div>
              <div class="stats-dash dash-yellow" />
            </div>
            <div class="stats-number">{$userProfile.stats.tripsCompleted}</div>
            <div class="stats-label">VIAJES COMPLETADOS</div>
          </div>

          <div class="stats-item-card">
            <div class="stats-item-top">
              <div class="stats-icon-box icon-teal">
                <Camera size={18} />
              </div>
              <div class="stats-dash dash-teal" />
            </div>
            <div class="stats-number">{$userProfile.stats.photosUploaded}</div>
            <div class="stats-label">FOTOS SUBIDAS</div>
          </div>

          {#if furthestPlace}
            <div class="stats-item-card">
              <div class="stats-item-top">
                <div class="stats-icon-box icon-purple">
                  <MapPin size={18} />
                </div>
                <div class="stats-dash dash-purple" />
              </div>
              <div
                class="stats-number"
                style="font-size: 1.5rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;"
                title={furthestPlace.name}
              >
                {furthestPlace.name}
              </div>
              <div class="stats-label">
                MÁS LEJANO ({furthestPlace.distance} km)
              </div>
            </div>
          {/if}
        </div>
      </div>

      <div class="info-sidebar">
        <!-- Información de Perfil Card -->
        <div class="info-card">
          <div class="card-header">
            <div class="icon-circle text-yellow-500 border-yellow-500/30">
              <AlertCircle size={18} />
            </div>
            <h2>Información de Perfil</h2>
          </div>
          <p class="card-text">
            Bienvenido a tu panel de control de TravelMap. Aquí puedes gestionar
            tus conexiones externas, revisar tu progreso en el mapa mundial y
            personalizar cómo se ven tus memorias.
          </p>
          <button
            class="action-row-btn"
            on:click={() => (window.location.href = "/map")}
          >
            <div class="action-row-left">
              <div class="action-icon-box">
                <Map size={20} />
              </div>
              <div class="action-text">
                <span class="action-title">Ver Mapa de Calor</span>
                <span class="action-subtitle"
                  >Visualiza tus rutas Frecuentes</span
                >
              </div>
            </div>
            <ChevronRight size={18} class="text-gray-500" />
          </button>
        </div>

        <!-- Integraciones de Datos Card -->
        <div class="info-card" style="margin-top: 2rem;">
          <div class="card-header space-between">
            <div class="header-left">
              <div class="icon-circle text-purple-400 border-purple-500/30">
                <Database size={18} />
              </div>
              <h2>Integraciones de Datos</h2>
            </div>
            {#if immichStatus.isConnected}
              <div class="status-badge-chip connected">
                <RefreshCw size={12} />
                <span>CONECTADO</span>
              </div>
            {:else}
              <div class="status-badge-chip disconnected">
                <span>DESCONECTADO</span>
              </div>
            {/if}
          </div>

          <div class="integration-item">
            <div class="integration-logo">
              <img src="/immich.png" alt="Immich" />
            </div>
            <div class="integration-text">
              <h4>Servidor Immich</h4>
              <p>
                Conecta tu librería de fotos auto-hospedada para sincronizar
                automáticamente tus viajes.
              </p>
            </div>
          </div>

          <form
            class="integration-form"
            on:submit|preventDefault={handleImmichSave}
          >
            <div class="form-row">
              <div class="form-group-modern">
                <label for="immich-url">ENDPOINT API</label>
                <input
                  id="immich-url"
                  type="url"
                  bind:value={immichConfig.url}
                  placeholder="Ej: http://192.168.100.73:2283/api"
                  required
                />
              </div>
              <div class="form-group-modern">
                <label for="immich-key">CLAVE DE ACCESO (API KEY)</label>
                <input
                  id="immich-key"
                  type="password"
                  bind:value={immichConfig.apiKey}
                  placeholder="••••••••••••••••"
                  required
                />
              </div>
            </div>

            <div class="form-footer">
              <p class="disclaimer-text">
                Tus credenciales se cifran localmente antes de ser enviadas al
                motor de búsqueda.
              </p>
              <button
                type="submit"
                class="btn btn-white"
                disabled={isSavingImmich}
              >
                {isSavingImmich ? "Validando..." : "Actualizar Credenciales"}
              </button>
            </div>

            {#if immichMessage.text}
              <div class="message {immichMessage.type}">
                {immichMessage.text}
              </div>
            {/if}
          </form>
        </div>
      </div>
    </div>
  </section>

  <!-- Modal Editar Perfil -->
  {#if showEditModal}
    <div
      class="modal-overlay"
      role="dialog"
      aria-modal="true"
      on:click|self={() => (showEditModal = false)}
      on:keydown={(e) => e.key === "Escape" && (showEditModal = false)}
      tabindex="-1"
    >
      <div class="modal-glass">
        <div class="modal-header">
          <h2>Editar Perfil</h2>
          <button class="close-btn" on:click={() => (showEditModal = false)}>
            <X size={24} />
          </button>
        </div>

        <div class="scroll-content">
          <form class="edit-profile-form" on:submit|preventDefault={handleSave}>
            <div class="form-group-modern">
              <label for="name">NOMBRE A MOSTRAR</label>
              <input
                id="name"
                type="text"
                bind:value={editData.name}
                required
              />
            </div>

            <div class="form-group-modern">
              <label for="bio">BIOGRAFÍA O LEMA</label>
              <textarea
                id="bio"
                bind:value={editData.bio}
                rows="3"
                placeholder="Cuéntanos un poco sobre ti y tus viajes..."
              />
            </div>

            <div class="form-group-modern">
              <label>FOTO DE PERFIL / AVATAR</label>
              <div class="avatar-selection-modern">
                <div class="modern-tabs">
                  <button
                    type="button"
                    class="modern-tab-btn"
                    class:active={avatarTab === "preset"}
                    on:click={() => (avatarTab = "preset")}
                  >
                    Galería de Presets
                  </button>
                  <button
                    type="button"
                    class="modern-tab-btn"
                    class:active={avatarTab === "upload"}
                    on:click={() => (avatarTab = "upload")}
                  >
                    Subir Imagen
                  </button>
                </div>

                <div class="avatar-preview-container">
                  <div class="avatar-ring-small">
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
                      <ImagePlaceholder text={editData.name} type="profile" />
                    {/if}
                  </div>
                </div>

                {#if avatarTab === "preset"}
                  <div class="presets-grid-modern">
                    {#each avatarPresets as preset}
                      <button
                        type="button"
                        class="preset-item"
                        class:selected={editData.avatar === preset}
                        on:click={() => selectPreset(preset)}
                      >
                        <img src={preset} alt="Preset avatar" />
                      </button>
                    {/each}
                  </div>
                {:else}
                  <div class="upload-area-modern">
                    <input
                      type="file"
                      id="avatar-upload"
                      accept="image/*"
                      on:change={handleAvatarFile}
                      style="display: none;"
                    />
                    <button
                      type="button"
                      class="btn btn-outline w-full"
                      on:click={() =>
                        document.getElementById("avatar-upload")?.click()}
                    >
                      <Upload size={18} />
                      <span
                        >{avatarFile
                          ? "Cambiar Archivo"
                          : "Seleccionar desde dispositivo"}</span
                      >
                    </button>
                    {#if avatarFile}
                      <span class="file-name-modern">{avatarFile.name}</span>
                    {/if}
                  </div>
                {/if}
              </div>
            </div>

            <div class="form-section-divider">
              <div class="divider-line" />
              <span>UBICACIÓN BASE</span>
              <div class="divider-line" />
            </div>

            {#if editData.homeLocation}
              <div class="form-group-modern">
                <label for="homeName">CIUDAD Ó PAÍS DE RESIDENCIA</label>
                <input
                  id="homeName"
                  type="text"
                  bind:value={editData.homeLocation.name}
                  placeholder="Ej. Madrid, España"
                />
              </div>

              <div class="form-group-modern map-wrapper-modern">
                <label for="map-picker">MARCADOR EN EL MAPA</label>
                <div class="map-container-border" id="map-picker">
                  {#if showEditModal}
                    <LocationPicker
                      initialLocation={editData.homeLocation.coordinates[0] !==
                      0
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
                        }
                      }}
                      height="250px"
                    />
                  {/if}
                </div>
                <p class="map-coordinates-text">
                  <MapPin size={12} class="inline mr-1 text-blue-400" />
                  {editData.homeLocation.coordinates[0].toFixed(4)}, {editData.homeLocation.coordinates[1].toFixed(
                    4,
                  )}
                </p>
              </div>
            {/if}

            {#if saveMessage.text}
              <div class="message {saveMessage.type} modern-message">
                {saveMessage.text}
              </div>
            {/if}
          </form>
        </div>

        <div class="modal-footer-glass">
          <button
            type="button"
            class="btn btn-ghost"
            on:click={() => (showEditModal = false)}
          >
            Cancelar
          </button>
          <button
            type="button"
            class="btn btn-primary"
            disabled={isSaving}
            on:click={handleSave}
          >
            {isSaving ? "Guardando..." : "Guardar Cambios"}
          </button>
        </div>
      </div>
    </div>
  {/if}
</main>

<style>
  .profile-page {
    padding: 0;
    color: var(--color-text-primary, #e2e8f0);
    min-height: 100vh;
  }

  .profile-header {
    position: relative;
    overflow: hidden;
    padding: 3rem 0 1rem 0;
    border-bottom: 1px solid var(--color-border, #334155);
  }

  .header-content {
    position: relative;
    z-index: 1;
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 2rem;
    display: flex;
    align-items: center;
    gap: 2rem;
  }

  /* Avatar with Gradient Ring */
  .profile-avatar-container {
    position: relative;
    flex-shrink: 0;
  }

  .avatar-ring {
    padding: 4px;
    border-radius: 50%;
    background: linear-gradient(135deg, #a855f7 0%, #3b82f6 100%);
  }

  .avatar-wrapper {
    width: 120px;
    height: 120px;
    border-radius: 50%;
    overflow: hidden;
    background: #374151;
    border: 4px solid var(--color-bg-main, #1e293b);
  }

  .avatar-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .status-dot {
    position: absolute;
    bottom: 8px;
    right: 8px;
    width: 18px;
    height: 18px;
    background-color: #10b981;
    border: 3px solid var(--color-bg-main, #1e293b);
    border-radius: 50%;
  }

  .profile-info {
    flex: 1;
  }

  .profile-name-row {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 0.5rem;
  }

  .profile-name-row h1 {
    font-size: 2.2rem;
    margin: 0;
    font-weight: 700;
    color: var(--color-text-primary, white);
  }

  .pro-badge {
    background: rgba(37, 99, 235, 0.2);
    color: #60a5fa;
    border: 1px solid rgba(59, 130, 246, 0.3);
    padding: 0.2rem 0.6rem;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.05em;
  }

  .profile-bio {
    font-size: 1rem;
    line-height: 1.5;
    color: var(--color-text-muted, #94a3b8);
    max-width: 600px;
    margin-bottom: 1rem;
  }

  .profile-meta {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: var(--color-text-muted, #64748b);
    font-size: 0.85rem;
    font-style: italic;
  }

  .meta-separator {
    color: #475569;
  }

  .profile-actions {
    display: flex;
    gap: 1rem;
    align-items: center;
  }

  .btn-outline {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    border-radius: 6px;
    font-weight: 600;
    transition: all 0.3s ease;
    cursor: pointer;
    font-size: 0.9rem;
    background: transparent;
    color: var(--color-text-primary, #e2e8f0);
    border: 1px solid var(--color-border-light, #475569);
  }

  .btn-outline:hover {
    background: rgba(255, 255, 255, 0.05);
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

  .content-grid {
    display: grid;
    grid-template-columns: 320px 1fr;
    gap: 2rem;
    max-width: 1200px;
    margin: 0 auto;
  }

  .sidebar-header {
    font-size: 0.85rem;
    font-weight: 700;
    letter-spacing: 0.05em;
    color: var(--color-text-primary, #e2e8f0);
    margin-bottom: 1.5rem;
    padding-left: 0.75rem;
    border-left: 4px solid #3b82f6;
  }

  .stats-vertical-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .stats-item-card {
    background: #1e293b;
    border: 1px solid #334155;
    border-radius: 12px;
    padding: 1.25rem;
    display: flex;
    flex-direction: column;
  }

  .stats-item-top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1rem;
  }

  .stats-icon-box {
    width: 40px;
    height: 40px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .icon-blue {
    background: rgba(59, 130, 246, 0.15);
    color: #60a5fa;
  }
  .icon-pink {
    background: rgba(236, 72, 153, 0.15);
    color: #f472b6;
  }
  .icon-yellow {
    background: rgba(234, 179, 8, 0.15);
    color: #facc15;
  }
  .icon-teal {
    background: rgba(20, 184, 166, 0.15);
    color: #2dd4bf;
  }
  .icon-purple {
    background: rgba(168, 85, 247, 0.15);
    color: #c084fc;
  }

  .stats-dash {
    width: 24px;
    height: 4px;
    border-radius: 2px;
  }
  .dash-blue {
    background: #3b82f6;
  }
  .dash-pink {
    background: #ec4899;
  }
  .dash-yellow {
    background: #eab308;
  }
  .dash-teal {
    background: #14b8a6;
  }
  .dash-purple {
    background: #a855f7;
  }

  .stats-number {
    font-size: 2.5rem;
    font-weight: 700;
    color: var(--color-text-primary, #ffffff);
    line-height: 1;
    margin-bottom: 0.25rem;
  }

  .stats-label {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--color-text-muted, #94a3b8);
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }

  .interests-section {
    background: #1e293b;
    padding: 1.5rem;
    border-radius: 12px;
    border: 1px solid #334155;
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
  }

  @media (max-width: 768px) {
    .header-content {
      flex-direction: column;
      gap: 1.5rem;
      text-align: center;
    }
    .profile-info {
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .profile-name-row {
      justify-content: center;
    }
    .profile-meta {
      justify-content: center;
    }

    .content-grid {
      grid-template-columns: 1fr;
    }

    .profile-actions {
      flex-direction: row;
      justify-content: center;
      gap: 1rem;
      width: 100%;
    }
    .profile-actions .btn {
      flex: 1;
    }
    .profile-actions .btn-outline {
      flex: 1;
    }
  }

  /* Avatar Selection Styles */
  .avatar-tabs {
    display: flex;
    gap: 0.5rem;
    border-bottom: 1px solid #334155;
    padding-bottom: 0.5rem;
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

  /* Info & Integration Cards */
  .info-sidebar {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .info-card {
    background: #1e293b;
    border: 1px solid #334155;
    border-radius: 12px;
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
  }

  .card-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 1rem;
  }

  .card-header.space-between {
    justify-content: space-between;
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .card-header h2 {
    font-size: 1.2rem;
    color: var(--color-text-primary, #ffffff);
    margin: 0;
  }

  .icon-circle {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid transparent;
    background: rgba(255, 255, 255, 0.05);
  }

  .card-text {
    color: var(--color-text-muted, #94a3b8);
    font-size: 0.95rem;
    line-height: 1.5;
    margin-bottom: 1.5rem;
  }

  .action-row-btn {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: #0f172a;
    border: 1px solid #1e293b;
    border-radius: 8px;
    padding: 1rem;
    width: 100%;
    cursor: pointer;
    transition: background 0.2s ease, transform 0.2s ease;
    text-align: left;
  }

  .action-row-btn:hover {
    background: #1e293b;
    border-color: #334155;
    transform: translateY(-2px);
  }

  .action-row-left {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .action-icon-box {
    width: 40px;
    height: 40px;
    background: rgba(59, 130, 246, 0.15);
    color: #60a5fa;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .action-text {
    display: flex;
    flex-direction: column;
  }

  .action-title {
    color: var(--color-text-primary, #ffffff);
    font-weight: 600;
    font-size: 1rem;
  }

  .action-subtitle {
    color: var(--color-text-muted, #64748b);
    font-size: 0.8rem;
  }

  .status-badge-chip {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.25rem 0.5rem;
    border-radius: 12px;
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.05em;
  }

  .status-badge-chip.connected {
    background: rgba(16, 185, 129, 0.15);
    color: #10b981;
    border: 1px solid rgba(16, 185, 129, 0.3);
  }

  .status-badge-chip.disconnected {
    background: rgba(239, 68, 68, 0.15);
    color: #ef4444;
    border: 1px solid rgba(239, 68, 68, 0.3);
  }

  .integration-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    background: rgba(0, 0, 0, 0.2);
    padding: 1rem;
    border-radius: 8px;
    margin-bottom: 1.5rem;
    border: 1px solid #1e293b;
  }

  .integration-logo {
    width: 48px;
    height: 48px;
    background: white;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.5rem;
  }

  .integration-logo img {
    max-width: 100%;
    max-height: 100%;
  }

  .integration-text h4 {
    margin: 0 0 0.25rem 0;
    color: var(--color-text-primary, #ffffff);
    font-size: 1rem;
  }

  .integration-text p {
    margin: 0;
    color: var(--color-text-muted, #94a3b8);
    font-size: 0.85rem;
    line-height: 1.4;
  }

  .integration-form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .form-row {
    display: flex;
    gap: 1rem;
  }

  .form-group-modern {
    display: flex;
    flex-direction: column;
    flex: 1;
  }

  .form-group-modern label {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--color-text-muted, #64748b);
    letter-spacing: 0.05em;
    margin-bottom: 0.5rem;
  }

  .form-group-modern input {
    width: 100%;
    padding: 0.75rem 1rem;
    border-radius: 8px;
    border: 1px solid #334155;
    background: #0f172a;
    color: white;
    font-size: 0.9rem;
    transition: border-color 0.2s;
  }

  .form-group-modern input:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
  }

  .form-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid #334155;
  }

  .disclaimer-text {
    color: var(--color-text-muted, #64748b);
    font-size: 0.8rem;
    max-width: 300px;
    margin: 0;
  }

  .btn-white {
    background: white;
    color: #0f172a;
    border: 1px solid white;
    padding: 0.75rem 1.5rem;
    border-radius: 6px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-white:hover {
    background: #f8fafc;
    transform: translateY(-1px);
  }

  .btn-white:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  @media (max-width: 768px) {
    .form-row {
      flex-direction: column;
    }

    .form-footer {
      flex-direction: column;
      gap: 1rem;
      align-items: flex-start;
    }

    .btn-white {
      width: 100%;
    }
  }

  /* Edit Profile Modal Glassmorphism */
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(8px);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
    padding: 1rem;
  }

  .modal-glass {
    background: #0f172a;
    width: 100%;
    max-width: 550px;
    max-height: 90vh;
    border-radius: 16px;
    border: 1px solid #334155;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem;
    border-bottom: 1px solid #1e293b;
    background: rgba(15, 23, 42, 0.95);
  }

  .modal-header h2 {
    margin: 0;
    color: white;
    font-size: 1.25rem;
  }

  .close-btn {
    background: none;
    border: none;
    color: #94a3b8;
    cursor: pointer;
    padding: 0.25rem;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }

  .close-btn:hover {
    color: white;
    background: rgba(255, 255, 255, 0.1);
  }

  .edit-profile-form {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .form-group-modern textarea {
    width: 100%;
    padding: 0.75rem 1rem;
    border-radius: 8px;
    border: 1px solid #334155;
    background: #0f172a;
    color: white;
    font-size: 0.9rem;
    transition: border-color 0.2s;
    resize: vertical;
  }

  .form-group-modern textarea:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
  }

  .avatar-selection-modern {
    background: #1e293b;
    border-radius: 12px;
    padding: 1rem;
    border: 1px solid #334155;
  }

  .modern-tabs {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1.5rem;
    background: #0f172a;
    padding: 0.25rem;
    border-radius: 8px;
  }

  .modern-tab-btn {
    flex: 1;
    background: transparent;
    border: none;
    color: #94a3b8;
    padding: 0.5rem;
    border-radius: 6px;
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .modern-tab-btn.active {
    background: #334155;
    color: white;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
  }

  .avatar-preview-container {
    display: flex;
    justify-content: center;
    margin-bottom: 1.5rem;
  }

  .avatar-ring-small {
    padding: 3px;
    border-radius: 50%;
    background: linear-gradient(135deg, #a855f7 0%, #3b82f6 100%);
    width: 90px;
    height: 90px;
  }

  .avatar-ring-small img,
  .avatar-ring-small :global(.avatar-placeholder) {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    object-fit: cover;
    border: 3px solid #1e293b;
    background: #334155;
  }

  .presets-grid-modern {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(50px, 1fr));
    gap: 0.5rem;
  }

  .preset-item {
    padding: 0;
    border: 2px solid transparent;
    border-radius: 50%;
    overflow: hidden;
    cursor: pointer;
    transition: transform 0.2s, border-color 0.2s;
  }

  .preset-item:hover {
    transform: scale(1.05);
  }

  .preset-item.selected {
    border-color: #3b82f6;
  }

  .preset-item img {
    width: 100%;
    height: auto;
    display: block;
  }

  .upload-area-modern {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
    padding: 1.5rem;
    border: 2px dashed #475569;
    border-radius: 8px;
    background: rgba(15, 23, 42, 0.5);
  }

  .file-name-modern {
    color: #cbd5e1;
    font-size: 0.8rem;
    word-break: break-all;
    text-align: center;
  }

  .form-section-divider {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin: 1rem 0;
  }

  .divider-line {
    flex: 1;
    height: 1px;
    background: #334155;
  }

  .form-section-divider span {
    color: #64748b;
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.1em;
  }

  .map-wrapper-modern {
    gap: 0.5rem;
  }

  .map-container-border {
    border: 1px solid #334155;
    border-radius: 8px;
    overflow: hidden;
  }

  .map-coordinates-text {
    font-size: 0.8rem;
    color: #94a3b8;
    margin-top: 0.5rem;
  }

  .modern-message {
    padding: 1rem;
    border-radius: 8px;
    text-align: center;
    font-size: 0.9rem;
  }

  .modal-footer-glass {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    padding: 1rem 1.5rem;
    background: rgba(15, 23, 42, 0.95);
    border-top: 1px solid #1e293b;
    z-index: 2;
  }
</style>
