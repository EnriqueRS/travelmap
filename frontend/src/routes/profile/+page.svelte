<script lang="ts">
  import { User, Map, Calendar, Camera, Settings, X, Home } from "lucide-svelte"
  import { userProfile, locations } from "$lib/stores/data"
  import ImagePlaceholder from "$lib/components/ui/ImagePlaceholder.svelte"

  // Modal
  let showEditModal = false
  let editData = { ...$userProfile }

  // Ensure homeLocation structure exists in editData if not present
  if (!editData.homeLocation) {
    editData.homeLocation = { name: "", coordinates: [0, 0] }
  }

  function handleSave() {
    userProfile.set(editData)
    showEditModal = false
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

          <div
            class="form-group"
            style="padding-top: 1rem; border-top: 1px solid #334155;"
          >
            <h3 style="color: #60a5fa; margin-bottom: 1rem; font-size: 1.1rem;">
              Ubicación de Casa
            </h3>
            {#if editData.homeLocation}
              <label for="homeName">Ciudad / Nombre</label>
              <input
                id="homeName"
                type="text"
                bind:value={editData.homeLocation.name}
                placeholder="Ej. Madrid"
              />

              <div
                style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 1rem;"
              >
                <div>
                  <label for="homeLat">Latitud</label>
                  <input
                    id="homeLat"
                    type="number"
                    step="any"
                    bind:value={editData.homeLocation.coordinates[0]}
                  />
                </div>
                <div>
                  <label for="homeLng">Longitud</label>
                  <input
                    id="homeLng"
                    type="number"
                    step="any"
                    bind:value={editData.homeLocation.coordinates[1]}
                  />
                </div>
              </div>
            {/if}
          </div>

          <div class="modal-actions">
            <button
              type="button"
              class="btn btn-secondary"
              on:click={() => (showEditModal = false)}>Cancelar</button
            >
            <button type="submit" class="btn btn-primary"
              >Guardar Cambios</button
            >
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
</style>
