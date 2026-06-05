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
  import { userProfile, locations, trips } from "$lib/stores/data"
  import { t } from "$lib/stores/i18n"
  import ImagePlaceholder from "$lib/components/ui/ImagePlaceholder.svelte"
  import LocationPicker from "$lib/components/map/LocationPicker.svelte"
  import { authService } from "$lib/services/auth"
  import { integrationsService } from "$lib/services/integrations"
  import { reverseGeocode } from "$lib/utils/geocode"
  import { onMount } from "svelte"
  import ProvinceExplorer from "$lib/components/ui/ProvinceExplorer.svelte"
  import { COUNTRIES, getCountryName, getCountryFlag } from "$lib/utils/countries"
  import { goto } from "$app/navigation"

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
        text: $t("profile.immichConnected"),
      }
    } catch (e: any) {
      immichMessage = {
        type: "error",
        text: e.response?.data?.message || $t("profile.immichError"),
      }
    } finally {
      isSavingImmich = false
    }
  }

  // Modal
  let showEditModal = false
  let showProvinceExplorer = false
  let showVisitedCountriesModal = false
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

        // Automatic detection of home country and province
        const geoResult = await reverseGeocode(
          payload.homeLocationLat,
          payload.homeLocationLng,
        )
        if (geoResult) {
          payload.homeCountry = geoResult.countryCode
          payload.homeProvince = geoResult.province

          // Update local editData too so it reflects in store immediately after save
          editData.homeCountry = geoResult.countryCode || undefined
          editData.homeProvince = geoResult.province || undefined
        }
      }

      await authService.updateProfile(payload)

      setTimeout(() => {
        showEditModal = false
        saveMessage = { type: "", text: "" }
        isSaving = false // Reset here after closing to avoid UI flickers
      }, 500)
      return // Exit to avoid double setting isSaving in finally if possible
    } catch (error: any) {
      console.error("Error saving profile:", error)
      const detail =
        error.response?.data?.message || error.message || "Unknown error"
      saveMessage = {
        type: "error",
        text: `${$t("profile.errorSaving")}: ${detail}`,
      }
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

  // Use backend-provided furthestPlace, with client-side fallback
  let furthestPlace: { name: string; distance: number } | null = null

  $: {
    // First try backend value
    if ($userProfile.stats.furthestPlace) {
      furthestPlace = $userProfile.stats.furthestPlace
    } else if ($userProfile.homeLocation && $locations.length > 0) {
      // Client-side fallback
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
    } else {
      furthestPlace = null
    }
  }

  // Visited countries list (derived from trips)
  $: visitedCountryCodes = (() => {
    const codes = new Set<string>()
    $trips.forEach((trip) => {
      if (Array.isArray(trip.countries)) {
        trip.countries.forEach((c) => {
          if (c) codes.add(c.toUpperCase())
        })
      }
    })
    return Array.from(codes).sort((a, b) => {
      const nameA = getCountryName(a)
      const nameB = getCountryName(b)
      return nameA.localeCompare(nameB)
    })
  })()

  // Province Statistics
  let provincesVisitedInHomeCountry = 0
  let visitedProvinceNamesSet = new Set<string>()

  $: if ($userProfile.homeCountry && $locations.length > 0) {
    const visitedSet = new Set<string>()
    $locations.forEach((loc) => {
      if (loc.country === $userProfile.homeCountry && loc.adminArea1) {
        visitedSet.add(loc.adminArea1)
      }
    })
    provincesVisitedInHomeCountry = visitedSet.size
    visitedProvinceNamesSet = visitedSet
  } else {
    provincesVisitedInHomeCountry = 0
    visitedProvinceNamesSet = new Set<string>()
  }
</script>

<svelte:head>
  <title>TravelMap - {$t("nav.profile")}</title>
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
          <!-- <span class="pro-badge">{$t("profile.proMember")}</span> -->
        </div>
        <p class="profile-bio">
          {$userProfile.bio || ""}
        </p>
        <div class="profile-meta">
          <span class="meta-item"
            >{$t("profile.joinedPrefix")}
            {new Date($userProfile.createdAt).toLocaleDateString(
              $t("common.locale"),
              { year: "numeric", month: "long" },
            )}</span
          >
          <!-- <span class="meta-separator">•</span>
          <span class="meta-item"
            >{$t("profile.followersCount", { count: 124 })}</span
          > -->
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
          <span>{$t("profile.editProfile")}</span>
        </button>
        <a href="/trips/new" class="btn btn-primary">
          <Plus size={18} />
          <span>{$t("profile.addTrip")}</span>
        </a>
      </div>
    </div>
  </section>

  <section class="profile-content">
    <div class="content-grid">
      <div class="stats-sidebar">
        <div class="sidebar-header">{$t("profile.globalStats")}</div>

        <div class="stats-vertical-list">
          <button
            class="stats-item-card clickable"
            on:click={() => (showVisitedCountriesModal = true)}
            title={$t("profile.visitedCountriesTitle")}
            style="text-align: left; width: 100%;"
          >
            <div class="stats-item-top">
              <div class="stats-icon-box icon-blue">
                <Globe size={18} />
              </div>
              <div class="stats-dash dash-blue" />
            </div>
            <div class="stats-number">
              {$userProfile.stats.countriesVisited}
            </div>
            <div class="stats-label">{$t("profile.countriesVisited")}</div>
          </button>

          {#if $userProfile.homeCountry}
            <button
              class="stats-item-card clickable"
              on:click={() => (showProvinceExplorer = true)}
              title={$t("profile.viewDetailedStats")}
              style="text-align: left; width: 100%;"
            >
              <div class="stats-item-top">
                <div class="stats-icon-box icon-purple">
                  <MapPin size={18} />
                </div>
                <div class="stats-dash dash-purple" />
              </div>
              <div class="stats-number">{provincesVisitedInHomeCountry}</div>
              <div class="stats-label">
                {$t("profile.provincesVisited", {
                  country: $userProfile.homeCountry,
                })}
              </div>
            </button>
          {/if}

          <div class="stats-item-card">
            <div class="stats-item-top">
              <div class="stats-icon-box icon-pink">
                <MapPin size={18} />
              </div>
              <div class="stats-dash dash-pink" />
            </div>
            <div class="stats-number">{$userProfile.stats.placesVisited}</div>
            <div class="stats-label">{$t("profile.placesVisited")}</div>
          </div>

          <button
            class="stats-item-card clickable"
            on:click={() => goto('/trips')}
            title={$t("profile.totalTrips")}
            style="text-align: left; width: 100%;"
          >
            <div class="stats-item-top">
              <div class="stats-icon-box icon-yellow">
                <Navigation size={18} />
              </div>
              <div class="stats-dash dash-yellow" />
            </div>
            <div class="stats-number">{$userProfile.stats.totalTrips}</div>
            <div class="stats-label">{$t("profile.totalTrips")}</div>
            <div class="stats-sublabel">
              {$t("profile.tripsDetail", {
                completed: $userProfile.stats.tripsCompleted,
              })}
            </div>
          </button>

          <div class="stats-item-card">
            <div class="stats-item-top">
              <div class="stats-icon-box icon-teal">
                <Camera size={18} />
              </div>
              <div class="stats-dash dash-teal" />
            </div>
            <div class="stats-number">{$userProfile.stats.photosUploaded}</div>
            <div class="stats-label">{$t("profile.photosUploaded")}</div>
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
                {$t("profile.furthestPlace")} ({furthestPlace.distance} km)
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
            <h2>{$t("profile.profileInfoTitle")}</h2>
          </div>
          <p class="card-text">
            {$t("profile.profileInfoDesc")}
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
                <span class="action-title">{$t("profile.viewHeatmap")}</span>
                <span class="action-subtitle">{$t("profile.viewRoutes")}</span>
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
              <h2>{$t("profile.integrationTitle")}</h2>
            </div>
            {#if immichStatus.isConnected}
              <div class="status-badge-chip connected">
                <RefreshCw size={12} />
                <span>{$t("profile.connected").toUpperCase()}</span>
              </div>
            {:else}
              <div class="status-badge-chip disconnected">
                <span>{$t("profile.notConnected").toUpperCase()}</span>
              </div>
            {/if}
          </div>

          <div class="integration-item">
            <div class="integration-logo">
              <img src="/immich.png" alt="Immich" />
            </div>
            <div class="integration-text">
              <h4>{$t("profile.immichTitle")}</h4>
              <p>
                {$t("profile.immichDesc")}
              </p>
            </div>
          </div>

          <form
            class="integration-form"
            on:submit|preventDefault={handleImmichSave}
          >
            <div class="form-row">
              <div class="form-group-modern">
                <label for="immich-url">{$t("profile.apiEndpoint")}</label>
                <input
                  id="immich-url"
                  type="url"
                  bind:value={immichConfig.url}
                  placeholder={$t("profile.immichUrlPlaceholder")}
                  required
                />
              </div>
              <div class="form-group-modern">
                <label for="immich-key">{$t("profile.apiKey")}</label>
                <input
                  id="immich-key"
                  type="password"
                  bind:value={immichConfig.apiKey}
                  placeholder={$t("profile.apiKeyPlaceholder")}
                  required
                />
              </div>
            </div>

            <div class="form-footer">
              <p class="disclaimer-text">
                {$t("profile.credentialsCrypted")}
              </p>
              <button
                type="submit"
                class="btn btn-white"
                disabled={isSavingImmich}
              >
                {isSavingImmich
                  ? $t("profile.validating")
                  : $t("profile.updateCreds")}
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
      role="button"
      tabindex="-1"
      on:click|self={() => (showEditModal = false)}
      on:keydown={(e) => e.key === "Escape" && (showEditModal = false)}
    >
      <div class="modal-glass">
        <div class="modal-header">
          <h2>{$t("profile.editProfileTitle")}</h2>
          <button class="close-btn" on:click={() => (showEditModal = false)}>
            <X size={24} />
          </button>
        </div>

        <div class="scroll-content">
          <form class="edit-profile-form" on:submit|preventDefault={handleSave}>
            <div class="form-group-modern">
              <label for="name">{$t("profile.displayName")}</label>
              <input
                id="name"
                type="text"
                bind:value={editData.name}
                required
              />
            </div>

            <div class="form-group-modern">
              <label for="bio">{$t("profile.bioPlaceholder")}</label>
              <textarea
                id="bio"
                bind:value={editData.bio}
                rows="3"
                placeholder={$t("profile.bioInputPlaceholder")}
              />
            </div>

            <div class="form-group-modern">
              <label for="modern-tab-preset">{$t("profile.avatarTitle")}</label>
              <div class="modern-tabs" id="modern-tab-preset">
                <button
                  type="button"
                  class="modern-tab-btn"
                  class:active={avatarTab === "preset"}
                  on:click={() => (avatarTab = "preset")}
                >
                  {$t("profile.presetGallery")}
                </button>
                <button
                  type="button"
                  class="modern-tab-btn"
                  class:active={avatarTab === "upload"}
                  on:click={() => (avatarTab = "upload")}
                >
                  {$t("profile.uploadImage")}
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
                        ? $t("profile.changeFile")
                        : $t("profile.selectDevice")}</span
                    >
                  </button>
                  {#if avatarFile}
                    <span class="file-name-modern">{avatarFile.name}</span>
                  {/if}
                </div>
              {/if}
            </div>

            <div class="form-section-divider">
              <div class="divider-line" />
              <span>{$t("profile.homeLocationTitle")}</span>
              <div class="divider-line" />
            </div>

            {#if editData.homeLocation}
              <!-- <div class="form-group-modern">
                <label for="homeName">{$t("profile.homeLocationLabel")}</label>
                <input
                  id="homeName"
                  type="text"
                  bind:value={editData.homeLocation.name}
                  placeholder={$t("profile.homeLocationPlaceholder")}
                />
              </div> -->

              <div class="form-group-modern map-wrapper-modern">
                <label for="map-picker">{$t("profile.mapMarkerLabel")}</label>
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
            {$t("form.cancel")}
          </button>
          <button
            type="button"
            class="btn btn-primary"
            disabled={isSaving}
            on:click={handleSave}
          >
            {isSaving ? $t("profile.validating") : $t("profile.saveChanges")}
          </button>
        </div>
      </div>
    </div>
  {/if}
  {#if showProvinceExplorer}
    <ProvinceExplorer
      countryCode={$userProfile.homeCountry || "ES"}
      visitedProvinces={visitedProvinceNamesSet}
      on:close={() => (showProvinceExplorer = false)}
    />
  {/if}

  {#if showVisitedCountriesModal}
    <div
      class="modal-overlay"
      role="button"
      tabindex="-1"
      on:click|self={() => (showVisitedCountriesModal = false)}
      on:keydown={(e) => e.key === "Escape" && (showVisitedCountriesModal = false)}
    >
      <div class="modal-glass" style="max-width: 480px;">
        <div class="modal-header">
          <h2>{$t("profile.visitedCountriesTitle")}</h2>
          <button class="close-btn" on:click={() => (showVisitedCountriesModal = false)}>
            <X size={24} />
          </button>
        </div>
        <div class="scroll-content">
          {#if visitedCountryCodes.length === 0}
            <p class="empty-state-text">{$t("profile.noVisitedCountries")}</p>
          {:else}
            <div class="visited-countries-list">
              {#each visitedCountryCodes as code}
                <div class="visited-country-item">
                  <span class="country-flag">{getCountryFlag(code)}</span>
                  <span class="country-name">{getCountryName(code)}</span>
                  <span class="country-code">{code}</span>
                </div>
              {/each}
            </div>
          {/if}
        </div>
      </div>
    </div>
  {/if}
</main>

<style>
  .profile-page {
    padding: 0;
    color: var(--color-text-primary);
    min-height: 100vh;
  }

  .profile-header {
    position: relative;
    overflow: hidden;
    padding: 3rem 0 1rem 0;
    border-bottom: 1px solid var(--color-border);
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
    background: linear-gradient(135deg, var(--color-accent-primary) 0%, var(--color-accent-primary) 100%);
  }

  .avatar-wrapper {
    width: 120px;
    height: 120px;
    border-radius: 50%;
    overflow: hidden;
    background: var(--color-bg-tertiary);
    border: 4px solid var(--color-bg-main);
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
    background-color: var(--color-success);
    border: 3px solid var(--color-bg-main);
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
    color: var(--color-text-primary);
  }

  .pro-badge {
    background: rgba(37, 99, 235, 0.2);
    color: var(--color-accent-text);
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
    color: var(--color-text-secondary);
    max-width: 600px;
    margin-bottom: 1rem;
  }

  .profile-meta {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: var(--color-text-muted);
    font-size: 0.85rem;
    font-style: italic;
  }

  .meta-separator {
    color: var(--color-border-light);
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
    color: var(--color-text-primary);
    border: 1px solid var(--color-border-light);
  }

  .btn-outline:hover {
    background: var(--color-bg-tertiary);
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
    color: var(--color-text-primary);
    margin-bottom: 1.5rem;
    padding-left: 0.75rem;
    border-left: 4px solid var(--color-accent-primary);
  }

  .stats-vertical-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .stats-item-card {
    background: var(--color-bg-secondary);
    border: 1px solid var(--color-border);
    border-radius: 16px;
    padding: 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .stats-item-card.clickable {
    cursor: pointer;
    transition: all 0.2s;
  }

  .stats-item-card.clickable:hover {
    background: var(--color-bg-elevated);
    border-color: rgba(139, 92, 246, 0.3);
    transform: translateY(-2px);
  }

  .stats-item-card.clickable:active {
    transform: translateY(0);
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
    background: var(--color-accent-muted);
    color: var(--color-accent-text);
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
    background: var(--color-accent-primary);
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
    background: var(--color-accent-primary);
  }

  .stats-number {
    font-size: 2.5rem;
    font-weight: 700;
    color: var(--color-text-primary);
    line-height: 1;
    margin-bottom: 0.25rem;
  }

  .stats-label {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--color-text-muted);
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }

  .stats-sublabel {
    font-size: 0.7rem;
    color: var(--color-text-secondary);
    margin-top: 0.25rem;
  }

  .interests-section {
    background: var(--color-bg-secondary);
    padding: 1.5rem;
    border-radius: 12px;
    border: 1px solid var(--color-border);
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
    border: 1px solid var(--color-border-light);
    background: var(--color-bg-secondary);
    color: var(--color-text-secondary);
    font-size: 0.9rem;
  }

  .btn-primary:hover {
    transform: translateY(-1px);
  }

  .btn-secondary:hover {
    transform: translateY(-1px);
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
    border-bottom: 1px solid var(--color-border);
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
    border: 3px solid var(--color-accent-text);
  }

  .presets-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(60px, 1fr));
    gap: 0.5rem;
  }

  .preset-btn {
    background: var(--color-bg-tertiary);
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
    border-color: var(--color-accent-text);
  }

  .upload-area {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 2rem;
    border: 2px dashed var(--color-border-light);
    border-radius: 8px;
    justify-content: center;
  }

  .file-name {
    color: var(--color-text-secondary);
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
    color: var(--color-success-text);
    border: 1px solid var(--color-success);
  }

  .message.error {
    background: var(--color-danger-border);
    color: var(--color-danger-text);
    border: 1px solid var(--color-danger-hover);
  }

  /* Info & Integration Cards */
  .info-sidebar {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .info-card {
    background: var(--color-bg-secondary);
    border: 1px solid var(--color-border);
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
    color: var(--color-text-primary);
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
    background: var(--color-bg-tertiary);
  }

  .card-text {
    color: var(--color-text-secondary);
    font-size: 0.95rem;
    line-height: 1.5;
    margin-bottom: 1.5rem;
  }

  .action-row-btn {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: var(--color-bg-tertiary);
    border: 1px solid var(--color-border);
    border-radius: 8px;
    padding: 1rem;
    width: 100%;
    cursor: pointer;
    transition: background 0.2s ease, transform 0.2s ease;
    text-align: left;
  }

  .action-row-btn:hover {
    background: var(--color-bg-elevated);
    border-color: var(--color-border-light);
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
    background: var(--color-accent-muted);
    color: var(--color-accent-text);
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
    color: var(--color-text-primary);
    font-weight: 600;
    font-size: 1rem;
  }

  .action-subtitle {
    color: var(--color-text-muted);
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
    color: var(--color-success);
    border: 1px solid rgba(16, 185, 129, 0.3);
  }

  .status-badge-chip.disconnected {
    background: rgba(239, 68, 68, 0.15);
    color: var(--color-danger);
    border: 1px solid var(--color-danger-border);
  }

  .integration-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    background: var(--color-bg-tertiary);
    padding: 1rem;
    border-radius: 8px;
    margin-bottom: 1.5rem;
    border: 1px solid var(--color-border);
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
    color: var(--color-text-primary);
    font-size: 1rem;
  }

  .integration-text p {
    margin: 0;
    color: var(--color-text-secondary);
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
    color: var(--color-text-secondary);
    letter-spacing: 0.05em;
    margin-bottom: 0.5rem;
  }

  .form-group-modern input {
    width: 100%;
    padding: 0.75rem 1rem;
    border-radius: 8px;
    border: 1px solid var(--color-border);
    background: var(--color-bg-tertiary);
    color: var(--color-text-primary);
    font-size: 0.9rem;
    transition: border-color 0.2s;
  }

  .form-group-modern input:focus {
    outline: none;
    border-color: var(--color-accent-primary);
    box-shadow: 0 0 0 2px var(--color-accent-muted);
  }

  .form-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid var(--color-border);
  }

  .disclaimer-text {
    color: var(--color-text-muted);
    font-size: 0.8rem;
    max-width: 300px;
    margin: 0;
  }

  .btn-white {
    background: var(--color-accent-primary);
    color: var(--color-text-inverse);
    border: 1px solid var(--color-accent-primary);
    padding: 0.75rem 1.5rem;
    border-radius: 6px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-white:hover {
    background: var(--color-accent-hover);
    border-color: var(--color-accent-hover);
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
    background: var(--color-bg-secondary);
    width: 100%;
    max-width: 550px;
    max-height: 90vh;
    border-radius: 16px;
    border: 1px solid var(--color-border);
    box-shadow: var(--shadow-xl);
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem;
    border-bottom: 1px solid var(--color-border);
    background: var(--color-bg-secondary);
  }

  .modal-header h2 {
    margin: 0;
    color: var(--color-text-primary);
    font-size: 1.25rem;
  }

  .close-btn {
    background: none;
    border: none;
    color: var(--color-text-secondary);
    cursor: pointer;
    padding: 0.25rem;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }

  .close-btn:hover {
    color: var(--color-text-primary);
    background: var(--color-bg-tertiary);
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
    border: 1px solid var(--color-border);
    background: var(--color-bg-tertiary);
    color: var(--color-text-primary);
    font-size: 0.9rem;
    transition: border-color 0.2s;
    resize: vertical;
  }

  .form-group-modern textarea:focus {
    outline: none;
    border-color: var(--color-accent-primary);
    box-shadow: 0 0 0 2px var(--color-accent-muted);
  }

  .avatar-selection-modern {
    background: var(--color-bg-tertiary);
    border-radius: 12px;
    padding: 1rem;
    border: 1px solid var(--color-border);
  }

  .modern-tabs {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1.5rem;
    background: var(--color-bg-tertiary);
    padding: 0.25rem;
    border-radius: 8px;
  }

  .modern-tab-btn {
    flex: 1;
    background: transparent;
    border: none;
    color: var(--color-text-secondary);
    padding: 0.5rem;
    border-radius: 6px;
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .modern-tab-btn.active {
    background: var(--color-bg-tertiary);
    color: var(--color-text-primary);
    box-shadow: var(--shadow-sm);
  }

  .avatar-preview-container {
    display: flex;
    justify-content: center;
    margin-bottom: 1.5rem;
  }

  .avatar-ring-small {
    padding: 3px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--color-accent-primary) 0%, var(--color-accent-primary) 100%);
    width: 90px;
    height: 90px;
  }

  .avatar-ring-small img,
  .avatar-ring-small :global(.avatar-placeholder) {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    object-fit: cover;
    border: 3px solid var(--color-bg-secondary);
    background: var(--color-bg-tertiary);
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
    border-color: var(--color-accent-primary);
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
    border: 2px dashed var(--color-border-light);
    border-radius: 8px;
    background: var(--color-bg-tertiary);
  }

  .file-name-modern {
    color: var(--color-text-secondary);
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
    background: var(--color-border);
  }

  .form-section-divider span {
    color: var(--color-text-muted);
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.1em;
  }

  .map-wrapper-modern {
    gap: 0.5rem;
  }

  .map-container-border {
    border: 1px solid var(--color-border);
    border-radius: 8px;
    overflow: hidden;
  }

  .map-coordinates-text {
    font-size: 0.8rem;
    color: var(--color-text-secondary);
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
    background: var(--color-bg-secondary);
    border-top: 1px solid var(--color-border);
    z-index: 2;
  }

  /* ─── Light Theme Profile Enhancements ─── */
  :global(.theme-light) .stats-item-card {
    background: #ffffff;
    border-color: var(--color-border);
    box-shadow: var(--shadow-sm);
  }

  :global(.theme-light) .stats-item-card:hover {
    box-shadow: var(--shadow-md);
  }

  :global(.theme-light) .stats-item-card.clickable:hover {
    background: #ffffff;
    border-color: rgba(124, 58, 237, 0.25);
    box-shadow: 0 4px 12px rgba(124, 58, 237, 0.08);
  }

  :global(.theme-light) .icon-blue {
    background: rgba(79, 70, 229, 0.1);
    color: #4f46e5;
  }
  :global(.theme-light) .icon-pink {
    background: rgba(236, 72, 153, 0.1);
    color: #ec4899;
  }
  :global(.theme-light) .icon-yellow {
    background: rgba(217, 119, 6, 0.1);
    color: #d97706;
  }
  :global(.theme-light) .icon-teal {
    background: rgba(13, 148, 136, 0.1);
    color: #0d9488;
  }
  :global(.theme-light) .icon-purple {
    background: rgba(124, 58, 237, 0.1);
    color: #7c3aed;
  }

  :global(.theme-light) .info-card {
    box-shadow: var(--shadow-sm);
  }

  :global(.theme-light) .action-row-btn {
    background: var(--color-bg-main);
    border-color: var(--color-border);
  }

  :global(.theme-light) .action-row-btn:hover {
    background: #ffffff;
    box-shadow: var(--shadow-sm);
  }

  :global(.theme-light) .integration-item {
    background: var(--color-bg-main);
    border-color: var(--color-border);
  }

  :global(.theme-light) .integration-logo {
    background: var(--color-bg-tertiary);
    border: 1px solid var(--color-border);
  }

  :global(.theme-light) .btn-outline {
    border-color: var(--color-border);
  }

  :global(.theme-light) .btn-outline:hover {
    background: var(--color-bg-tertiary);
    border-color: var(--color-border-light);
  }

  :global(.theme-light) .modal-overlay {
    background: rgba(15, 23, 42, 0.35);
  }

  :global(.theme-light) .modal-glass {
    box-shadow: 0 20px 60px -10px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.04);
  }

  :global(.theme-light) .profile-header {
    background: linear-gradient(180deg, var(--color-bg-secondary) 0%, var(--color-bg-main) 100%);
  }

  :global(.theme-light) .modern-tabs {
    background: var(--color-bg-main);
    border: 1px solid var(--color-border);
  }

  :global(.theme-light) .modern-tab-btn.active {
    background: #ffffff;
    color: var(--color-accent-primary);
    box-shadow: var(--shadow-sm);
  }

  /* Visited Countries Modal */
  .scroll-content {
    padding: 1.5rem;
    max-height: 60vh;
  }

  .empty-state-text {
    text-align: center;
    color: var(--color-text-muted);
    font-size: 0.95rem;
    padding: 2rem 1rem;
  }

  .visited-countries-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .visited-country-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    background: var(--color-bg-tertiary);
    border: 1px solid var(--color-border);
    border-radius: 8px;
    transition: background 0.2s;
  }

  .visited-country-item:hover {
    background: var(--color-bg-elevated);
  }

  .country-flag {
    font-size: 1.5rem;
    line-height: 1;
  }

  .country-name {
    flex: 1;
    font-size: 0.95rem;
    font-weight: 500;
    color: var(--color-text-primary);
  }

  .country-code {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--color-text-muted);
    letter-spacing: 0.05em;
  }
</style>
