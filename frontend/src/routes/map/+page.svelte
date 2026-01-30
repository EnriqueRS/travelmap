<script lang="ts">
  import { onMount } from "svelte"
  import MapContainer from "$lib/components/map/MapContainer.svelte"
  import { locations, trips } from "$lib/stores/data"
  import {
    Search,
    Plus,
    Map as MapIcon,
    Layers,
    BarChart3,
    Eye,
    Calendar,
    MapPin,
  } from "lucide-svelte"

  // Bind to map component
  let mapComponent: any
  let currentLayer: "default" | "satellite" = "default"

  // Filters
  let showVisited = true
  let showPlanned = true
  let showHome = true
  let searchQuery = ""

  // Stats derivation
  $: totalLocations = $locations.length
  $: visitedCount = $locations.length // Approximation, typically derived from trips/dates
  $: plannedCount = $trips.filter((t) => t.status === "Planificado").length * 5 // Fake multiplier
  $: regions = new Set($locations.map((l) => l.country)).size

  // Filter Logic
  $: filteredLocations = $locations.filter((loc) => {
    // Search filter
    if (
      searchQuery &&
      !loc.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !loc.country.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false
    }

    // Status filter
    let isPlanned = false
    let isVisited = false

    if (loc.tripId) {
      const trip = $trips.find((t) => t.id === loc.tripId)
      if (trip && trip.status === "Planificado") {
        isPlanned = true
      } else {
        isVisited = true // Completed or In Progress assumed visited
      }
    } else {
      // If no trip, assume visited (standalone location or just saved)
      // For this demo, let's treat it as visited
      isVisited = true
    }

    if (showVisited && isVisited) return true
    if (showPlanned && isPlanned) return true

    return false
  })

  // Fake progress for visual flair
  let completion = 13

  function toggleLayer() {
    currentLayer = currentLayer === "default" ? "satellite" : "default"
    if (mapComponent) {
      mapComponent.setMapLayer(currentLayer)
    }
  }
</script>

<svelte:head>
  <title>TravelMap - Dashboard</title>
</svelte:head>

<main class="dashboard-page">
  <!-- Sidebar -->
  <aside class="sidebar">
    <div class="sidebar-header">
      <h2 class="section-title">
        <BarChart3 size={18} /> Estadísticas de aventura
      </h2>
    </div>

    <div class="stats-container">
      <div class="stat-main">
        <span class="stat-label">Aventuras totales</span>
        <span class="stat-value big">{totalLocations + plannedCount}</span>
      </div>

      <div class="stats-row">
        <div class="stat-item">
          <span class="stat-label">Visitado</span>
          <span class="stat-value text-green">{visitedCount}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Planificado</span>
          <span class="stat-value text-blue">{plannedCount}</span>
        </div>
      </div>

      <div class="stat-item mt-4">
        <span class="stat-label">Regiones</span>
        <span class="stat-value text-teal">{regions}</span>
      </div>

      <div class="progress-section mt-4">
        <div class="progress-labels">
          <span>Terminación</span>
          <span>{completion}%</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" style="width: {completion}%" />
        </div>
      </div>
    </div>

    <div class="sidebar-section mt-6">
      <h2 class="section-title"><Eye size={18} /> Opciones de visualización</h2>

      <div class="options-list">
        <label class="option-item">
          <input type="checkbox" bind:checked={showVisited} />
          <span class="checkmark checked-green" />
          <span class="option-text">Visitado ({visitedCount})</span>
        </label>

        <label class="option-item">
          <input type="checkbox" bind:checked={showHome} />
          <span class="checkmark checked-red" />
          <span class="option-text">Casa</span>
        </label>

        <label class="option-item">
          <input type="checkbox" bind:checked={showPlanned} />
          <span class="checkmark checked-blue" />
          <span class="option-text">Planificado ({plannedCount})</span>
        </label>

        <label class="option-item">
          <input type="checkbox" />
          <span class="checkmark checked-teal" />
          <span class="option-text">Regiones visitadas ({regions})</span>
        </label>

        <label class="option-item">
          <input type="checkbox" />
          <span class="checkmark checked-yellow" />
          <span class="option-text">Ciudades visitadas</span>
        </label>
      </div>
    </div>

    <div class="sidebar-footer">
      <h2 class="section-title"><Plus size={18} /> Nueva ubicación</h2>
      <p class="help-text">Haga clic en el mapa para colocar un marcador.</p>
      <button class="btn-sidebar-action">
        <Plus size={16} /> Agregar nueva ubicación
      </button>
    </div>
  </aside>

  <!-- Main Content -->
  <section class="main-content">
    <!-- Top Bar -->
    <header class="topbar">
      <div class="topbar-left">
        <MapIcon size={24} class="text-blue" />
        <div class="title-group">
          <h1>Mapa de ubicación</h1>
          <p>
            {filteredLocations.length} de {totalLocations} ubicaciones mostradas
          </p>
        </div>
      </div>

      <div class="topbar-center">
        <div class="search-bar">
          <Search size={16} class="search-icon" />
          <input
            type="text"
            placeholder="Buscar ubicaciones..."
            bind:value={searchQuery}
          />
        </div>
        <button class="btn-top-action">
          <Plus size={16} /> Agregar nueva ubicación
        </button>
      </div>

      <div class="topbar-right">
        <div class="mini-stat">
          <span class="label">Visitado</span>
          <span class="value text-green">{visitedCount}</span>
        </div>
        <div class="mini-stat">
          <span class="label">Planificado</span>
          <span class="value text-blue">{plannedCount}</span>
        </div>
      </div>
    </header>

    <!-- Map Area -->
    <div class="map-area">
      <MapContainer
        bind:this={mapComponent}
        locations={filteredLocations}
        {showHome}
        height="100%"
      />

      <!-- Floating Map Controls -->
      <div class="map-controls-floating">
        <button class="control-btn" on:click={toggleLayer}>
          <Layers size={16} />
          {currentLayer === "default" ? "Satélite" : "Default"}
        </button>
      </div>
    </div>
  </section>
</main>

<style>
  :global(body) {
    overflow: hidden; /* Prevent body scroll for dashboard feel */
  }

  .dashboard-page {
    display: grid;
    grid-template-columns: 300px 1fr;
    height: calc(100vh - 64px); /* Subtract navbar height approx */
    background: #0f172a;
    color: #e2e8f0;
    overflow: hidden;
  }

  /* Sidebar styles */
  .sidebar {
    background: #111827;
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    border-right: 1px solid #1f2937;
    overflow-y: auto;
  }

  .section-title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.95rem;
    font-weight: 600;
    color: #94a3b8;
    margin-bottom: 1rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .stat-main {
    margin-bottom: 1.5rem;
  }

  .stat-value {
    display: block;
    font-weight: 700;
  }

  .stat-value.big {
    font-size: 2.5rem;
    line-height: 1;
    color: #f8fafc;
    margin-top: 0.25rem;
  }

  .stats-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }

  .text-green {
    color: #10b981;
  }
  .text-blue {
    color: #3b82f6;
  }
  .text-teal {
    color: #14b8a6;
  }
  .text-yellow {
    color: #eab308;
  }

  .progress-section {
    margin-top: 1.5rem;
  }

  .progress-labels {
    display: flex;
    justify-content: space-between;
    font-size: 0.85rem;
    color: #64748b;
    margin-bottom: 0.5rem;
  }

  .progress-bar {
    height: 6px;
    background: #374151;
    border-radius: 3px;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    background: #6366f1;
    border-radius: 3px;
  }

  /* Options List */
  .options-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .option-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    cursor: pointer;
    font-size: 0.9rem;
    color: #cbd5e1;
  }

  .option-item input {
    display: none;
  }

  .checkmark {
    width: 18px;
    height: 18px;
    border: 2px solid #475569;
    border-radius: 50%;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .option-item input:checked + .checkmark::after {
    content: "";
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: white;
  }

  .checkmark.checked-green {
    border-color: #10b981;
  }
  .option-item input:checked + .checkmark.checked-green {
    background: #10b981;
  }

  .checkmark.checked-blue {
    border-color: #3b82f6;
  }
  .option-item input:checked + .checkmark.checked-blue {
    background: #3b82f6;
  }

  .checkmark.checked-teal {
    border-color: #14b8a6;
  }
  .option-item input:checked + .checkmark.checked-teal {
    background: #14b8a6;
  }

  .checkmark.checked-yellow {
    border-color: #eab308;
  }
  .option-item input:checked + .checkmark.checked-yellow {
    background: #eab308;
  }

  .checkmark.checked-red {
    border-color: #ef4444;
  }
  .option-item input:checked + .checkmark.checked-red {
    background: #ef4444;
  }

  /* Sidebar Footer */
  .sidebar-footer {
    margin-top: auto;
    padding-top: 2rem;
  }

  .help-text {
    font-size: 0.85rem;
    color: #64748b;
    margin-bottom: 1rem;
  }

  .btn-sidebar-action {
    width: 100%;
    padding: 0.75rem;
    background: #6366f1;
    color: white;
    border: none;
    border-radius: 8px;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    cursor: pointer;
    transition: background 0.2s;
  }

  .btn-sidebar-action:hover {
    background: #4f46e5;
  }

  /* Main Content Styles */
  .main-content {
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .topbar {
    background: #111827;
    padding: 1rem 1.5rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid #1f2937;
  }

  .topbar-left {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .title-group h1 {
    font-size: 1.25rem;
    color: #8b5cf6;
    margin: 0;
  }

  .title-group p {
    font-size: 0.85rem;
    color: #64748b;
    margin: 0;
  }

  .topbar-center {
    display: flex;
    gap: 1rem;
    align-items: center;
  }

  .search-bar {
    position: relative;
    width: 300px;
    display: flex;
    align-items: center;
  }

  .search-icon {
    position: absolute;
    left: 10px;
    color: #64748b;
    z-index: 10;
  }

  .search-bar input {
    width: 100%;
    background: #1f2937;
    border: 1px solid #374151;
    padding: 0.5rem 0.5rem 0.5rem 2.5rem;
    border-radius: 6px;
    color: white;
    line-height: normal; /* Fix for centering text */
  }

  .btn-top-action {
    background: #6366f1;
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 6px;
    font-size: 0.9rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .topbar-right {
    display: flex;
    gap: 1.5rem;
  }

  .mini-stat {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
  }

  .mini-stat .label {
    font-size: 0.75rem;
    color: #64748b;
  }

  .mini-stat .value {
    font-weight: 700;
    font-size: 1.1rem;
  }

  .map-area {
    flex: 1;
    position: relative;
    background: #000;
    padding: 1rem;
  }

  .map-controls-floating {
    position: absolute;
    top: 30px;
    right: 30px;
    z-index: 1000;
  }

  .control-btn {
    background: #1f2937;
    color: #e2e8f0;
    border: 1px solid #374151;
    padding: 0.5rem 1rem;
    border-radius: 6px;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    font-size: 0.9rem;
  }

  /* Responsive */
  @media (max-width: 1024px) {
    .dashboard-page {
      grid-template-columns: 1fr;
      overflow-y: auto;
      height: auto;
    }

    .sidebar {
      border-right: none;
      border-bottom: 1px solid #1f2937;
      height: auto;
    }

    .map-area {
      height: 600px;
    }

    .topbar {
      flex-direction: column;
      align-items: stretch;
      gap: 1rem;
    }

    .topbar-center {
      order: 3;
    }
  }
</style>
