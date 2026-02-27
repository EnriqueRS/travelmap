<script lang="ts">
  import { Compass, Map, Plus, Calendar } from "lucide-svelte"
  import { trips, getStatusColor } from "$lib/stores/data"
  import { formatDate } from "$lib/utils/formatters"
  import { getCountryFlag } from "$lib/utils/countries"
  import { API_URL } from "$lib/services/auth"
  import ImagePlaceholder from "$lib/components/ui/ImagePlaceholder.svelte"

  function getStatusIcon(status: string) {
    switch (status) {
      case "Completado":
        return "✅"
      case "En curso":
        return "🚗"
      case "Planificado":
        return "📅"
      default:
        return "❓"
    }
  }

  // Calcular estadísticas
  $: stats = {
    total: $trips.length,
    completed: $trips.filter((t) => t.status === "Completado").length,
    ongoing: $trips.filter((t) => t.status === "En curso").length,
    planned: $trips.filter((t) => t.status === "Planificado").length,
    locations: $trips.reduce((acc, t) => acc + t.locations.length, 0),
    countries: new Set($trips.flatMap((t) => t.countries)).size,
  }
</script>

<svelte:head>
  <title>TravelMap - Mis Viajes</title>
  <meta name="description" content="Gestiona y visualiza todos tus viajes" />
</svelte:head>

<main class="trips-page">
  <section class="trips-header">
    <div class="header-content">
      <h1>🧭 Mis Viajes</h1>
      <div class="header-actions">
        <a href="/trips/new" class="btn btn-primary">
          <Plus size={20} />
          Nuevo Viaje
        </a>
        <a href="/map" class="btn btn-secondary">
          <Map size={20} />
          Mapa Completo
        </a>
      </div>
    </div>
  </section>

  <section class="trips-content">
    <div class="trips-grid">
      {#each $trips as trip (trip.id)}
        <div class="trip-card">
          <div class="trip-image">
            {#if trip.coverImage && trip.coverImage.length > 5 && trip.coverImage !== trip.name}
              <img
                src={`${API_URL}/media/photos/${trip.coverImage}/image`}
                alt="Cover"
                style="width:100%; height:100%; object-fit:cover;"
              />
            {:else}
              <ImagePlaceholder text={trip.name} type="trip" />
            {/if}
            <div
              class="trip-status"
              style="background-color: {getStatusColor(trip.status)}"
            >
              {getStatusIcon(trip.status)}
              {trip.status}
            </div>
          </div>

          <div class="trip-info">
            <h3>{trip.name}</h3>
            <p class="trip-description">{trip.description}</p>

            <div class="trip-dates">
              <div class="date-item">
                <Calendar size={16} />
                <span>{formatDate(trip.startDate)}</span>
              </div>
              <div class="date-item">
                <span>hasta {formatDate(trip.endDate)}</span>
              </div>
            </div>

            <div class="trip-stats">
              <div class="stat">
                <span class="stat-icon">📍</span>
                <span>{trip.locations.length} lugares</span>
              </div>
              <div class="stat">
                <span class="stat-icon">🗺️</span>
                <span>{trip.countries.length} países</span>
              </div>
            </div>

            <div class="trip-countries">
              <div class="country-list">
                {#each trip.countries as country}
                  <span class="country-tag"
                    >{getCountryFlag(country)} {country}</span
                  >
                {/each}
              </div>
            </div>

            <div class="trip-actions">
              <a href="/trips/{trip.id}" class="btn btn-small btn-primary">
                Ver Detalles
              </a>
            </div>
          </div>
        </div>
      {:else}
        <div class="empty-state">
          <p>No tienes viajes registrados aún. ¡Empieza creando uno nuevo!</p>
          <a href="/trips/new" class="btn btn-primary mt-4"
            >Crear Primer Viaje</a
          >
        </div>
      {/each}
    </div>
  </section>

  <section class="trips-summary">
    <div class="summary-content">
      <h2>📊 Resumen de Viajes</h2>
      <div class="summary-stats">
        <div class="summary-card">
          <div class="summary-number">{stats.total}</div>
          <div class="summary-label">Viajes Totales</div>
        </div>
        <div class="summary-card">
          <div class="summary-number">{stats.completed}</div>
          <div class="summary-label">Completados</div>
        </div>
        <div class="summary-card">
          <div class="summary-number">{stats.ongoing}</div>
          <div class="summary-label">En Curso</div>
        </div>
        <div class="summary-card">
          <div class="summary-number">{stats.locations}</div>
          <div class="summary-label">Ubicaciones</div>
        </div>
        <div class="summary-card">
          <div class="summary-number">{stats.countries}</div>
          <div class="summary-label">Países Visitados</div>
        </div>
      </div>
    </div>
  </section>
</main>

<style>
  .trips-page {
    padding: 2rem 0;
    background: #1e293b;
    color: white;
    min-height: 100vh;
  }

  .trips-header {
    background: linear-gradient(135deg, #334155 0%, #1e293b 100%);
    padding: 2rem;
    border-bottom: 1px solid #475569;
  }

  .header-content {
    max-width: 1200px;
    margin: 0 auto;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .header-content h1 {
    font-size: 2.5rem;
    margin-bottom: 0;
    color: #60a5fa;
  }

  .header-actions {
    display: flex;
    gap: 1rem;
  }

  .trips-content {
    padding: 2rem;
    max-width: 1200px;
    margin: 0 auto;
  }

  .trips-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    gap: 2rem;
  }

  .trip-card {
    background: rgba(30, 41, 59, 0.5);
    border-radius: 12px;
    overflow: hidden;
    border: 1px solid #475569;
    transition: transform 0.3s ease, box-shadow 0.3s ease;
  }

  .trip-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  }

  .trip-image {
    height: 200px;
    position: relative;
  }

  .trip-status {
    position: absolute;
    top: 1rem;
    right: 1rem;
    padding: 0.5rem 0.75rem;
    border-radius: 20px;
    font-weight: 600;
    font-size: 0.8rem;
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: white; /* Ensure text is visible depending on background color */
    z-index: 2;
  }

  .trip-info {
    padding: 1.5rem;
  }

  .trip-info h3 {
    margin-bottom: 0.75rem;
    color: #60a5fa;
    font-size: 1.2rem;
  }

  .trip-description {
    color: #cbd5e1;
    margin-bottom: 1rem;
    line-height: 1.5;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .trip-dates {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1rem;
    color: #94a3b8;
    font-size: 0.9rem;
    align-items: center;
  }

  .date-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .trip-stats {
    display: flex;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .stat {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem;
    background: rgba(96, 165, 250, 0.1);
    border-radius: 6px;
    font-size: 0.8rem;
  }

  .stat-icon {
    color: #60a5fa;
  }

  .stat span {
    color: #cbd5e1;
    font-weight: 500;
  }

  .trip-countries {
    margin-bottom: 1rem;
  }

  .country-list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .country-tag {
    background: rgba(96, 165, 250, 0.2);
    color: #60a5fa;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.8rem;
    font-weight: 600;
  }

  .trip-actions {
    display: flex;
    gap: 0.75rem;
    margin-top: 1rem;
  }

  .trips-summary {
    background: #0f172a;
    padding: 2rem;
    border-top: 1px solid #1e293b;
    margin-top: 2rem;
  }

  .summary-content {
    max-width: 1200px;
    margin: 0 auto;
  }

  .summary-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
    margin-top: 1.5rem;
  }

  .summary-card {
    background: rgba(30, 41, 59, 0.5);
    padding: 1.5rem;
    border-radius: 8px;
    text-align: center;
    border: 1px solid #374151;
  }

  .summary-number {
    font-size: 2rem;
    font-weight: 700;
    color: #60a5fa;
    margin-bottom: 0.5rem;
  }

  .summary-label {
    color: #cbd5e1;
    font-size: 0.9rem;
  }

  .btn {
    display: inline-flex;
    align-items: center;
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
    border-color: #60a5fa;
  }

  .btn-small {
    padding: 0.5rem 0.75rem;
    font-size: 0.8rem;
    width: 100%;
    justify-content: center;
  }

  .empty-state {
    grid-column: 1 / -1;
    text-align: center;
    padding: 4rem;
    background: rgba(30, 41, 59, 0.3);
    border-radius: 12px;
    border: 1px dashed #475569;
  }

  @media (max-width: 768px) {
    .trips-grid {
      grid-template-columns: 1fr;
    }

    .summary-stats {
      grid-template-columns: repeat(2, 1fr);
    }

    .header-content {
      flex-direction: column;
      gap: 1rem;
      align-items: stretch;
    }

    .header-actions {
      flex-direction: column;
    }

    .trip-dates {
      flex-direction: column;
    }

    .trip-stats {
      grid-template-columns: 1fr;
    }

    .trip-actions {
      flex-direction: column;
    }
  }
</style>
