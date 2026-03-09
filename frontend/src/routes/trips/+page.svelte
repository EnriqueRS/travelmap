<script lang="ts">
  import {
    Navigation,
    Map,
    Plus,
    Calendar,
    Search,
    Filter,
    MoreVertical,
    MapPin,
    Globe,
    ChevronRight,
  } from "lucide-svelte"
  import { trips, locations, getStatusColor } from "$lib/stores/data"
  import { goto } from "$app/navigation"
  import { formatDate } from "$lib/utils/formatters"
  import { getCountryFlag, getCountryName } from "$lib/utils/countries"
  import { languageStore } from "$lib/stores/ui"
  import { t } from "$lib/stores/i18n"
  import { API_URL } from "$lib/services/auth"
  import ImagePlaceholder from "$lib/components/ui/ImagePlaceholder.svelte"
  import DatePicker from "$lib/components/ui/DatePicker.svelte"

  function getStatusIcon(status: string) {
    // Actually, the new UI uses a small dot "•" instead of an emoji
    return "•"
  }

  // To simulate the specific translucent color pills from the design based on hex colors
  function getStatusBadgeStyle(status: string, baseColor: string) {
    // Solid border, very transparent background, colored text
    return `background-color: ${baseColor}22; color: ${baseColor}; border: 1px solid ${baseColor}55;`
  }

  // Calculate stats (unchanged functionality)
  $: stats = {
    total: $trips.length,
    completed: $trips.filter((t) => t.status === "Completado").length,
    ongoing: $trips.filter((t) => t.status === "En curso").length,
    planned: $trips.filter((t) => t.status === "Planificado").length,
    locations: $trips.reduce((acc, t) => acc + t.locations.length, 0),
    countries: new Set($trips.flatMap((t) => t.countries)).size,
  }

  // Local state for the new search input
  let searchQuery = ""
  let showFilters = false

  // Advanced filters state
  let filterStatus = "Todos"
  let filterName = ""
  let filterCountry = ""
  let filterLocation = ""
  let filterStartDate = ""
  let filterEndDate = ""

  function clearFilters() {
    filterStatus = "Todos"
    filterName = ""
    filterCountry = ""
    filterLocation = ""
    filterStartDate = ""
    filterEndDate = ""
  }

  // Reactive filtered trips
  $: filteredTrips = $trips.filter((trip) => {
    // 1. Global Search
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const nameMatch = trip.name.toLowerCase().includes(query)
      const descMatch =
        trip.description && trip.description.toLowerCase().includes(query)

      const countryMatch = trip.countries.some((c) =>
        getCountryName(c, $languageStore).toLowerCase().includes(query),
      )

      const locMatch = $locations.some(
        (l) =>
          (l.tripId === trip.id ||
            (trip.locations && trip.locations.includes(l.id))) &&
          l.name.toLowerCase().includes(query),
      )

      if (!nameMatch && !descMatch && !countryMatch && !locMatch) return false
    }

    // 2. Advanced Filters
    if (filterStatus !== "Todos" && trip.status !== filterStatus) return false

    if (
      filterName &&
      !trip.name.toLowerCase().includes(filterName.toLowerCase())
    )
      return false

    if (filterCountry) {
      const countryMatch = trip.countries.some((c) =>
        getCountryName(c, $languageStore)
          .toLowerCase()
          .includes(filterCountry.toLowerCase()),
      )
      if (!countryMatch) return false
    }

    if (filterLocation) {
      const locMatch = $locations.some(
        (l) =>
          (l.tripId === trip.id ||
            (trip.locations && trip.locations.includes(l.id))) &&
          l.name.toLowerCase().includes(filterLocation.toLowerCase()),
      )
      if (!locMatch) return false
    }

    if (filterStartDate && trip.startDate < filterStartDate) return false // Compares YYYY-MM-DD correctly
    if (filterEndDate && trip.endDate > filterEndDate) return false

    return true
  })
</script>

<svelte:head>
  <title>TravelMap - {$t("dashboard.title")}</title>
  <meta name="description" content="Gestiona y visualiza todos tus viajes" />
</svelte:head>

<main class="trips-page">
  <div class="trips-container">
    <header class="trips-header">
      <div class="header-content">
        <div class="header-titles">
          <div class="title-wrap">
            <div class="nav-icon-wrap">
              <Navigation size={24} class="nav-icon" fill="currentColor" />
            </div>
            <h1>{$t("dashboard.title")}</h1>
          </div>
          <p class="subtitle">
            {$t("dashboard.subtitle")}
          </p>
        </div>
        <div class="header-actions">
          <button
            class="action-btn-map"
            on:click={() => goto("/map")}
            title={$t("nav.map")}
          >
            <Map size={20} />
          </button>
          <button
            class="action-btn-new btn-primary"
            on:click={() => goto("/trips/new")}
          >
            <Plus size={18} />
            {$t("dashboard.newTrip")}
          </button>
        </div>
      </div>
    </header>

    <div class="trips-toolbar">
      <div class="search-wrap">
        <Search size={18} class="search-icon" />
        <input
          type="text"
          placeholder={$t("dashboard.searchPlaceholder")}
          bind:value={searchQuery}
        />
      </div>
      <button
        class="filter-btn"
        class:active={showFilters}
        on:click={() => (showFilters = !showFilters)}
      >
        <Filter size={18} />
        {$t("dashboard.filters")}
      </button>
    </div>

    {#if showFilters}
      <div class="filters-panel">
        <div class="filters-grid">
          <div class="filter-group">
            <label>{$t("dashboard.filterState")}</label>
            <select bind:value={filterStatus} class="filter-input">
              <option value="Todos">{$t("dashboard.filterAll")}</option>
              <option value="Planificado">{$t("status.Planificado")}</option>
              <option value="En curso">{$t("status.En curso")}</option>
              <option value="Completado">{$t("status.Completado")}</option>
            </select>
          </div>
          <div class="filter-group">
            <label>{$t("dashboard.filterTripName")}</label>
            <input
              type="text"
              bind:value={filterName}
              class="filter-input"
              placeholder={$t("dashboard.filterTripNameExample")}
            />
          </div>
          <div class="filter-group">
            <label>{$t("dashboard.filterCountry")}</label>
            <input
              type="text"
              bind:value={filterCountry}
              class="filter-input"
              placeholder={$t("dashboard.filterCountryExample")}
            />
          </div>
          <div class="filter-group">
            <label>{$t("dashboard.filterVisitedPlace")}</label>
            <input
              type="text"
              bind:value={filterLocation}
              class="filter-input"
              placeholder={$t("dashboard.filterVisitedPlaceExample")}
            />
          </div>
          <div class="filter-group">
            <label>{$t("dashboard.filterDateFrom")}</label>
            <DatePicker
              bind:value={filterStartDate}
              id="filterStartDate"
              placeholder="DD/MM/YYYY"
            />
          </div>
          <div class="filter-group">
            <label>{$t("dashboard.filterDateTo")}</label>
            <DatePicker
              bind:value={filterEndDate}
              id="filterEndDate"
              placeholder="DD/MM/YYYY"
            />
          </div>
        </div>
        <div class="filters-actions">
          <button class="btn-clear" on:click={clearFilters}
            >{$t("dashboard.filterClear")}</button
          >
        </div>
      </div>
    {/if}

    <section class="trips-content">
      <div class="trips-grid">
        {#each filteredTrips as trip (trip.id)}
          <!-- svelte-ignore a11y-click-events-have-key-events // handled below -->
          <!-- svelte-ignore a11y-no-static-element-interactions -->
          <div
            class="trip-card"
            on:click={() => goto(`/trips/${trip.id}`)}
            on:keydown={(e) => e.key === "Enter" && goto(`/trips/${trip.id}`)}
            tabindex="0"
          >
            <div class="trip-image">
              {#if trip.coverImage && trip.coverImage.length > 5 && trip.coverImage !== trip.name}
                <img
                  src={`${API_URL}/media/photos/${trip.coverImage}/image`}
                  alt="Cover"
                />
              {:else}
                <ImagePlaceholder text={trip.name} type="trip" />
              {/if}

              <!-- Updated Status Badge Design -->
              <div
                class="trip-status"
                style={getStatusBadgeStyle(
                  trip.status,
                  getStatusColor(trip.status),
                )}
              >
                <span
                  class="status-dot"
                  style={`background-color: ${getStatusColor(trip.status)};`}
                />
                {$t(`status.${trip.status}`).toUpperCase()}
              </div>
            </div>

            <div class="trip-info">
              <div class="trip-title-row">
                <h3>{trip.name}</h3>
              </div>
              <p class="trip-description">{trip.description}</p>

              <div class="trip-dates">
                <Calendar size={14} class="date-icon" />
                <span
                  >{formatDate(trip.startDate)} - {formatDate(
                    trip.endDate,
                  )}</span
                >
              </div>

              <div class="trip-stats">
                <div class="stat-pill">
                  <MapPin size={14} class="text-accent-primary" />
                  <span
                    >{$locations.filter(
                      (l) =>
                        l.tripId === trip.id ||
                        (trip.locations && trip.locations.includes(l.id)),
                    ).length} Lugares</span
                  >
                </div>
                <div class="stat-pill">
                  <Globe size={14} class="text-green-400" />
                  <span>{trip.countries.length} Países</span>
                </div>
              </div>

              <div class="trip-countries">
                <div class="country-list">
                  {#each trip.countries as country}
                    <span class="country-tag">
                      <span class="flag-icon">{getCountryFlag(country)}</span>
                      {getCountryName(country, $languageStore).toUpperCase()}
                    </span>
                  {/each}
                </div>
              </div>

              <!-- Sleek Details Button -->
              <button class="details-btn">
                Ver detalles
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        {:else}
          <div class="empty-state">
            <p>{$t("dashboard.emptyState")}</p>
            <button
              class="action-btn-new btn-primary mt-4"
              on:click={() => goto("/trips/new")}
            >
              {$t("dashboard.createFirst")}
            </button>
          </div>
        {/each}
      </div>
    </section>
  </div>
</main>

<style>
  .trips-page {
    min-height: calc(100vh - 4rem);
    background-color: var(--color-bg-main);
    padding: 2rem 0;
  }

  .trips-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 1.5rem;
  }

  /* Header Styles */
  .trips-header {
    margin-bottom: 2rem;
  }

  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }

  .title-wrap {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 0.25rem;
  }

  .nav-icon-wrap {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    background: rgba(var(--color-accent-primary), 0.1);
    border-radius: 12px;
  }

  .nav-icon {
    color: var(--color-accent-primary);
  }

  .header-titles h1 {
    font-size: 2rem;
    font-weight: 700;
    color: var(--color-text-primary);
    margin: 0;
    line-height: 1;
  }

  .subtitle {
    color: var(--color-text-secondary);
    font-size: 1rem;
    margin: 0;
  }

  .header-actions {
    display: flex;
    gap: 1rem;
    align-items: center;
  }

  .action-btn-map {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 42px;
    height: 42px;
    background: var(--color-bg-secondary);
    border: 1px solid var(--color-border);
    border-radius: 10px;
    color: var(--color-text-secondary);
    cursor: pointer;
    transition: all 0.2s;
  }

  .action-btn-map:hover {
    background: var(--color-bg-tertiary);
    color: var(--color-text-primary);
  }

  .action-btn-new {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0 1.25rem;
    height: 42px;
    border-radius: 10px;
    font-weight: 600;
    font-size: 0.95rem;
    cursor: pointer;
    transition: all 0.2s;
    border: none;
    color: #ffffff;
    background: var(--color-accent-primary);
  }

  .action-btn-new:hover {
    background: var(--color-accent-hover);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(96, 165, 250, 0.3);
  }

  /* Toolbar containing search and filter */
  .trips-toolbar {
    display: flex;
    gap: 1rem;
    margin-bottom: 2rem;
  }

  .search-wrap {
    flex: 1;
    display: flex;
    align-items: center;
    background: var(--color-bg-secondary);
    border: 1px solid var(--color-border);
    border-radius: 10px;
    padding: 0 1rem;
    height: 42px;
    transition: all 0.2s;
  }

  .search-wrap:focus-within {
    border-color: var(--color-accent-primary);
    box-shadow: 0 0 0 2px rgba(var(--color-accent-primary), 0.1);
  }

  .search-icon {
    color: var(--color-text-secondary);
    margin-right: 0.75rem;
  }

  .search-wrap input {
    flex: 1;
    background: transparent;
    border: none;
    color: var(--color-text-primary);
    font-size: 0.95rem;
    outline: none;
  }

  .search-wrap input::placeholder {
    color: var(--color-text-secondary);
  }

  .filter-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0 1.25rem;
    height: 42px;
    background: var(--color-bg-secondary);
    border: 1px solid var(--color-border);
    border-radius: 10px;
    color: var(--color-text-primary);
    font-weight: 500;
    font-size: 0.95rem;
    cursor: pointer;
    transition: all 0.2s;
  }

  .filter-btn:hover {
    background: var(--color-bg-tertiary);
  }

  .filter-btn.active {
    background: rgba(96, 165, 250, 0.15);
    border-color: var(--color-accent-primary);
    color: var(--color-accent-primary);
  }

  /* Advanced Filters Panel */
  .filters-panel {
    background: var(--color-bg-secondary);
    border: 1px solid var(--color-border);
    border-radius: 12px;
    padding: 1.5rem;
    margin-bottom: 2rem;
    animation: slideDown 0.3s ease-out;
  }

  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .filters-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 1.25rem;
    margin-bottom: 1.5rem;
  }

  .filter-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .filter-group label {
    font-size: 0.85rem;
    color: var(--color-text-secondary);
    font-weight: 600;
  }

  .filter-input {
    background: rgba(0, 0, 0, 0.2);
    border: 1px solid var(--color-border);
    color: var(--color-text-primary);
    padding: 0.6rem 0.8rem;
    border-radius: 8px;
    font-size: 0.9rem;
    outline: none;
    transition: all 0.2s;
  }

  .filter-input:focus {
    border-color: var(--color-accent-primary);
    box-shadow: 0 0 0 2px rgba(96, 165, 250, 0.1);
  }

  select.filter-input option {
    background-color: var(--color-bg-secondary);
    color: var(--color-text-primary);
  }

  .filters-actions {
    display: flex;
    justify-content: flex-end;
  }

  .btn-clear {
    background: transparent;
    border: 1px solid var(--color-border);
    color: var(--color-text-secondary);
    padding: 0.5rem 1rem;
    border-radius: 8px;
    font-size: 0.85rem;
    cursor: pointer;
    transition: all 0.2s;
    font-weight: 500;
  }

  .btn-clear:hover {
    background: rgba(255, 255, 255, 0.05);
    color: var(--color-text-primary);
  }

  /* Content Grid */
  .trips-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 2rem;
  }

  /* Trip Card Styling - UI Overhaul */
  .trip-card {
    background: var(--color-bg-secondary);
    border-radius: 16px;
    overflow: hidden;
    position: relative;
    border: 1px solid var(--color-border);
    transition: all 0.3s ease;
    display: flex;
    flex-direction: column;
    outline: none;
  }

  .trip-card:hover {
    border-color: rgba(var(--color-accent-primary), 0.3);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
    transform: translateY(-2px);
  }

  .trip-image {
    height: 180px;
    position: relative;
    overflow: hidden;
  }

  .trip-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.5s ease;
  }

  .trip-card:hover .trip-image img {
    transform: scale(1.05);
  }

  /* Glassmorphic Badge */
  .trip-status {
    position: absolute;
    top: 1rem;
    right: 1rem;
    padding: 0.35rem 0.8rem;
    border-radius: 9999px; /* full pill */
    font-weight: 700;
    font-size: 0.7rem;
    letter-spacing: 0.05em;
    display: flex;
    align-items: center;
    gap: 0.4rem;
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    z-index: 2;
  }

  .status-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    display: inline-block;
  }

  .trip-info {
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    flex: 1;
  }

  .trip-title-row {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 0.25rem;
  }

  .trip-title-row h3 {
    margin: 0;
    color: var(--color-text-primary);
    font-size: 1.25rem;
    font-weight: 700;
    line-height: 1.3;
  }

  .more-btn {
    background: transparent;
    border: none;
    color: var(--color-text-secondary);
    padding: 0.2rem;
    cursor: pointer;
    border-radius: 4px;
    transition: background 0.2s;
    margin-right: -0.25rem;
  }

  .more-btn:hover {
    background: rgba(255, 255, 255, 0.05);
    color: var(--color-text-primary);
  }

  .trip-description {
    color: var(--color-text-secondary);
    font-size: 0.9rem;
    margin: 0 0 1.25rem 0;
    display: -webkit-box;
    -webkit-line-clamp: 2; /* Increased to 2 for better text display based on the image size */
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    line-height: 1.5;
  }

  .trip-dates {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: var(--color-text-secondary);
    font-size: 0.85rem;
    margin-bottom: 1.25rem;
    font-weight: 500;
  }

  .date-icon {
    color: var(--color-text-secondary);
  }

  .trip-stats {
    display: flex;
    gap: 0.75rem;
    margin-bottom: 1.25rem;
  }

  .stat-pill {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.35rem 0.75rem;
    background: var(--color-bg-tertiary);
    border: 1px solid var(--color-border);
    border-radius: 9999px;
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--color-text-primary);
  }

  .text-accent-primary {
    color: var(--color-accent-primary);
  }

  .text-green-400 {
    color: #4ade80; /* matches tailwind green-400 */
  }

  .trip-countries {
    margin-bottom: 1.25rem;
    margin-top: auto; /* push to bottom before the button */
  }

  .country-list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .country-tag {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    background: var(--color-bg-tertiary);
    border: 1px solid rgba(255, 255, 255, 0.05);
    color: var(--color-text-secondary);
    padding: 0.25rem 0.6rem;
    border-radius: 6px;
    font-size: 0.7rem;
    font-weight: 600;
    letter-spacing: 0.05em;
  }

  .flag-icon {
    /* To slightly offset generic emojis or give them a standard look */
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .details-btn {
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 0.5rem;
    background: var(--color-bg-tertiary);
    border: 1px solid var(--color-border);
    color: white; /* Strong contrast */
    padding: 0.85rem;
    border-radius: 12px;
    font-weight: 600;
    font-size: 0.95rem;
    cursor: pointer;
    transition: all 0.2s;
    margin-top: 0.5rem;
  }

  .details-btn:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.2);
  }

  /* Empty State */
  .empty-state {
    grid-column: 1 / -1;
    text-align: center;
    padding: 4rem;
    background: var(--color-bg-secondary);
    border-radius: 16px;
    border: 1px dashed var(--color-border);
    color: var(--color-text-secondary);
  }

  /* Responsive Adjustments */
  @media (max-width: 768px) {
    .header-content {
      flex-direction: column;
      gap: 1.5rem;
    }

    .header-actions {
      width: 100%;
    }

    .action-btn-new {
      flex: 1;
      justify-content: center;
    }

    .trips-toolbar {
      flex-direction: column;
    }

    .trips-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
