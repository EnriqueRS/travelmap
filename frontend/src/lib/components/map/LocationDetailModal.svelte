<script lang="ts">
  import { createEventDispatcher } from "svelte"
  import { fade, scale } from "svelte/transition"
  import { MapPin, X, Star, Calendar, Tag, Globe, Map as MapIcon, ExternalLink } from "lucide-svelte"
  import { t } from "$lib/stores/i18n"
  import { API_URL } from "$lib/services/auth"
  import type { Location } from "$lib/stores/data"
  import type { AppPhoto } from "$lib/services/media"
  import { formatDate } from "$lib/utils/formatters"
  import { getCountryName } from "$lib/utils/countries"
  import { languageStore } from "$lib/stores/ui"
  import { trips } from "$lib/stores/data"

  export let location: Location | null = null
  export let photos: AppPhoto[] = []
  export let loading = false
  export let error = false

  let selectedPhotoIndex = 0

  const dispatch = createEventDispatcher()

  function close() {
    dispatch("close")
  }

  function getPhotoUrl(photo: AppPhoto): string {
    if (photo.provider === "local") {
      return `${API_URL}${photo.url}`
    }
    return `${API_URL}/media/photos/${photo.id}/image`
  }

  function getCategoryEmoji(category: string): string {
    const map: Record<string, string> = {
      Monumento: "🏛️",
      landmark: "🏛️",
      Naturaleza: "🌲",
      nature: "🌲",
      Ciudad: "🏙️",
      city: "🏙️",
      "Ciudad de escala": "✈️",
      transport: "✈️",
      Playa: "🏖️",
      Montaña: "🏔️",
      Cultura: "🏛️",
      cultural: "🏛️",
      restaurant: "🍽️",
      accommodation: "🏨",
      activity: "🎯",
      shopping: "🛍️",
      nightlife: "🎶",
      Otro: "📍",
    }
    return map[category] || "📍"
  }

  function getCategoryLabel(category: string): string {
    const map: Record<string, string> = {
      landmark: "Monumento",
      nature: "Naturaleza",
      city: "Ciudad",
      transport: "Ciudad de escala",
      cultural: "Cultura",
      restaurant: "Restaurante",
      accommodation: "Alojamiento",
      activity: "Actividad",
      shopping: "Compras",
      nightlife: "Vida nocturna",
    }
    return map[category] || category
  }

  $: locationTrip = location?.tripId
    ? $trips.find((t) => t.id === location!.tripId)
    : null

  $: locationPhotos = photos

  $: coverPhoto = locationPhotos.length > 0 ? locationPhotos[selectedPhotoIndex] : null
</script>

{#if location !== null || loading || error}
  <div
    class="modal-overlay"
    on:click|self={close}
    transition:fade={{ duration: 200 }}
    role="dialog"
    aria-modal="true"
    aria-label={$t("map.locationDetail")}
  >
    <div
      class="location-detail-modal"
      transition:scale={{ duration: 200, start: 0.95 }}
    >
      <!-- Header -->
      <header class="modal-header-premium">
        <div class="header-main">
          <div class="header-icon">
            <MapPin size={24} />
          </div>
          <div class="header-text">
            <h3>{location?.name ?? $t("map.locationDetail")}</h3>
            <p class="subheader">{$t("map.locationDetail").toUpperCase()}</p>
          </div>
        </div>
        <button
          class="btn-close-modal"
          on:click={close}
          aria-label={$t("map.locationClose")}
        >
          <X size={20} />
        </button>
      </header>

      <div class="modal-body-scroll custom-scrollbar">
        {#if loading}
          <div class="loading-state">
            <div class="spinner"></div>
            <p>{$t("map.locationDetail")}...</p>
          </div>
        {:else if error}
          <div class="error-state">
            <MapPin size={32} />
            <p>{$t("map.locationLoadError")}</p>
          </div>
        {:else if location}
          <!-- Photo Gallery -->
          {#if locationPhotos.length > 0}
            <div class="photo-gallery">
              <div class="photo-main">
                <img
                  src={getPhotoUrl(coverPhoto)}
                  alt={location.name}
                  class="main-photo"
                />
                {#if locationPhotos.length > 1}
                  <div class="photo-counter">
                    {selectedPhotoIndex + 1} / {locationPhotos.length}
                  </div>
                {/if}
              </div>
              {#if locationPhotos.length > 1}
                <div class="photo-thumbnails custom-scrollbar" on:wheel={(e) => { e.preventDefault(); e.currentTarget.scrollLeft += e.deltaY; }}>
                  {#each locationPhotos as photo, i}
                    <button
                      class="photo-thumb"
                      class:active={i === selectedPhotoIndex}
                      on:click={() => (selectedPhotoIndex = i)}
                    >
                      <img src={getPhotoUrl(photo)} alt="" />
                    </button>
                  {/each}
                </div>
              {/if}
            </div>
          {:else}
            <div class="no-photos">
              <span class="category-emoji">{getCategoryEmoji(location.category)}</span>
              <p class="no-photos-text">{$t("map.locationNoPhotos")}</p>
            </div>
          {/if}

          <!-- Location Details -->
          <div class="detail-grid">
            <!-- Category -->
            <div class="detail-item">
              <div class="detail-icon">
                <Tag size={16} />
              </div>
              <div class="detail-content">
                <span class="detail-label">{$t("map.locationCategory")}</span>
                <span class="detail-value">
                  {getCategoryEmoji(location.category)}
                  {$t(`categories.${getCategoryLabel(location.category)}`) || getCategoryLabel(location.category)}
                </span>
              </div>
            </div>

            <!-- Country -->
            {#if location.country}
              <div class="detail-item">
                <div class="detail-icon">
                  <Globe size={16} />
                </div>
                <div class="detail-content">
                  <span class="detail-label">{$t("map.locationCountry")}</span>
                  <span class="detail-value">
                    {getCountryName(location.country, $languageStore) || location.country}
                  </span>
                </div>
              </div>
            {/if}

            <!-- Province -->
            {#if location.adminArea1}
              <div class="detail-item">
                <div class="detail-icon">
                  <MapIcon size={16} />
                </div>
                <div class="detail-content">
                  <span class="detail-label">{$t("map.locationProvince")}</span>
                  <span class="detail-value">{location.adminArea1}</span>
                </div>
              </div>
            {/if}

            <!-- Visit Date -->
            {#if location.visitedDate}
              <div class="detail-item">
                <div class="detail-icon">
                  <Calendar size={16} />
                </div>
                <div class="detail-content">
                  <span class="detail-label">{$t("map.locationDate")}</span>
                  <span class="detail-value">{formatDate(location.visitedDate)}</span>
                </div>
              </div>
            {/if}

            <!-- Rating -->
            {#if location.rating}
              <div class="detail-item">
                <div class="detail-icon">
                  <Star size={16} />
                </div>
                <div class="detail-content">
                  <span class="detail-label">{$t("map.locationRating")}</span>
                  <span class="detail-value rating-stars">
                    {#each Array(5) as _, i}
                      <Star
                        size={14}
                        class={i < location.rating ? "star-filled" : "star-empty"}
                        fill={i < location.rating ? "currentColor" : "none"}
                      />
                    {/each}
                  </span>
                </div>
              </div>
            {/if}

            <!-- Trip -->
            {#if locationTrip}
              <div class="detail-item">
                <div class="detail-icon">
                  <ExternalLink size={16} />
                </div>
                <div class="detail-content">
                  <span class="detail-label">{$t("map.locationTrip")}</span>
                  <a
                    href="/trips/{locationTrip.id}"
                    class="detail-trip-link"
                  >
                    {locationTrip.name}
                  </a>
                </div>
              </div>
            {/if}
          </div>

          <!-- Description -->
          {#if location.description}
            <div class="description-section">
              <h4 class="section-title">{$t("map.locationDescription")}</h4>
              <p class="description-text">{location.description}</p>
            </div>
          {/if}
        {/if}
      </div>
    </div>
  </div>
{/if}

<style>
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(2, 6, 23, 0.85);
    backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    padding: 1rem;
  }

  .location-detail-modal {
    background: var(--color-bg-main);
    width: 100%;
    max-width: 520px;
    max-height: 90vh;
    border-radius: 24px;
    border: 1px solid var(--color-bg-secondary);
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    position: relative;
    color: var(--color-text-primary);
  }

  .modal-header-premium {
    padding: 1.5rem 2rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid var(--color-bg-secondary);
    flex-shrink: 0;
  }

  .header-main {
    display: flex;
    align-items: center;
    gap: 1.25rem;
  }

  .header-icon {
    width: 48px;
    height: 48px;
    background: rgba(37, 99, 235, 0.1);
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-accent-primary);
    flex-shrink: 0;
  }

  .header-text h3 {
    margin: 0;
    font-size: 1.1rem;
    font-weight: 700;
    line-height: 1.2;
    word-break: break-word;
  }

  .header-text .subheader {
    font-size: 0.65rem;
    font-weight: 700;
    color: var(--color-text-muted);
    letter-spacing: 0.1em;
    text-transform: uppercase;
    margin-top: 2px;
  }

  .btn-close-modal {
    color: var(--color-text-muted);
    background: transparent;
    border: none;
    cursor: pointer;
    padding: 0.5rem;
    border-radius: 50%;
    transition: all 0.2s;
    flex-shrink: 0;
  }

  .btn-close-modal:hover {
    background: rgba(255, 255, 255, 0.05);
    color: var(--color-text-primary);
  }

  .modal-body-scroll {
    flex: 1;
    overflow-y: auto;
    padding: 1.5rem 2rem;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  /* Loading / Error states */
  .loading-state,
  .error-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    padding: 3rem 1rem;
    color: var(--color-text-muted);
    text-align: center;
  }

  .spinner {
    width: 32px;
    height: 32px;
    border: 3px solid var(--color-bg-secondary);
    border-top-color: var(--color-accent-primary);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  /* Photo Gallery */
  .photo-gallery {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    margin: -1.5rem -2rem 0;
  }

  .photo-main {
    position: relative;
    width: 100%;
    aspect-ratio: 16/9;
    overflow: hidden;
    background: var(--color-bg-secondary);
  }

  .main-photo {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .photo-counter {
    position: absolute;
    bottom: 0.75rem;
    right: 0.75rem;
    background: rgba(0, 0, 0, 0.6);
    color: white;
    font-size: 0.75rem;
    font-weight: 600;
    padding: 0.25rem 0.625rem;
    border-radius: 12px;
    backdrop-filter: blur(4px);
  }

  .photo-thumbnails {
    display: flex;
    gap: 0.5rem;
    overflow-x: auto;
    padding: 0 2rem 0.5rem;
    scrollbar-width: thin;
  }

  .photo-thumb {
    flex-shrink: 0;
    width: 60px;
    height: 60px;
    border-radius: 8px;
    overflow: hidden;
    border: 2px solid transparent;
    cursor: pointer;
    transition: border-color 0.2s;
    background: none;
    padding: 0;
  }

  .photo-thumb.active {
    border-color: var(--color-accent-primary);
  }

  .photo-thumb img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  /* No photos placeholder */
  .no-photos {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    padding: 2rem 1rem;
    background: var(--color-bg-secondary);
    border-radius: 16px;
    color: var(--color-text-muted);
  }

  .category-emoji {
    font-size: 3rem;
    line-height: 1;
  }

  .no-photos-text {
    font-size: 0.875rem;
    margin: 0;
  }

  /* Detail grid */
  .detail-grid {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .detail-item {
    display: flex;
    align-items: flex-start;
    gap: 0.875rem;
    padding: 0.875rem 1rem;
    background: var(--color-bg-secondary);
    border-radius: 12px;
  }

  .detail-icon {
    width: 32px;
    height: 32px;
    background: rgba(37, 99, 235, 0.1);
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-accent-primary);
    flex-shrink: 0;
  }

  .detail-content {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
    min-width: 0;
  }

  .detail-label {
    font-size: 0.65rem;
    font-weight: 700;
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  .detail-value {
    font-size: 0.95rem;
    font-weight: 500;
    color: var(--color-text-primary);
    display: flex;
    align-items: center;
    gap: 0.375rem;
    word-break: break-word;
  }

  .rating-stars {
    display: flex;
    align-items: center;
    gap: 2px;
  }

  :global(.star-filled) {
    color: var(--color-warning);
  }

  :global(.star-empty) {
    color: var(--color-text-muted);
  }

  .detail-trip-link {
    color: var(--color-accent-primary);
    text-decoration: none;
    font-weight: 600;
    font-size: 0.95rem;
    transition: color 0.2s;
  }

  .detail-trip-link:hover {
    color: var(--color-accent-hover);
    text-decoration: underline;
  }

  /* Description */
  .description-section {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .section-title {
    font-size: 0.75rem;
    font-weight: 700;
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    margin: 0;
  }

  .description-text {
    font-size: 0.925rem;
    color: var(--color-text-secondary);
    line-height: 1.6;
    margin: 0;
    background: var(--color-bg-secondary);
    border-radius: 12px;
    padding: 1rem;
  }

  /* Mobile adjustments */
  @media (max-width: 640px) {
    .location-detail-modal {
      max-height: 95vh;
      border-radius: 16px;
    }

    .modal-header-premium {
      padding: 1.25rem 1.25rem;
    }

    .modal-body-scroll {
      padding: 1.25rem;
    }

    .photo-gallery {
      margin: -1.25rem -1.25rem 0;
    }

    .photo-thumbnails {
      padding: 0 1.25rem 0.5rem;
    }
  }
</style>
