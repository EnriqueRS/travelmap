<script lang="ts">
  import { page } from "$app/stores"
  import {
    trips,
    locations,
    getCategoryEmoji,
    getStatusColor,
  } from "$lib/stores/data"
  import { goto } from "$app/navigation"
  import ImagePlaceholder from "$lib/components/ui/ImagePlaceholder.svelte"

  $: tripId = $page.params.id
  $: trip = $trips.find((t) => t.id === tripId)
  $: tripLocations = $locations.filter(
    (l) => trip?.locations.includes(l.id) || l.tripId === tripId
  )

  function handleDelete() {
    if (confirm("¿Estás seguro de que quieres eliminar este viaje?")) {
      trips.update((current) => current.filter((t) => t.id !== tripId))
      goto("/trips")
    }
  }
</script>

{#if trip}
  <div class="page-container">
    <header class="trip-header">
      <div class="trip-cover">
        <ImagePlaceholder text={trip.name} type="trip" />
      </div>
      <div class="header-content">
        <div class="badge {getStatusColor(trip.status)}">{trip.status}</div>
        <h1>{trip.name}</h1>
        <p class="dates">{trip.startDate} - {trip.endDate}</p>
        <div class="countries">
          {#each trip.countries as country}
            <span class="country-tag">🌍 {country}</span>
          {/each}
        </div>
      </div>
    </header>

    <section class="description-section">
      <h2>Acerca del viaje</h2>
      <p>{trip.description}</p>
    </section>

    <section class="locations-section">
      <div class="section-header">
        <h2>Lugares Visitados</h2>
        <a href="/locations?trip={trip.id}" class="btn btn-sm">Añadir Lugar</a>
      </div>

      {#if tripLocations.length > 0}
        <div class="locations-grid">
          {#each tripLocations as location}
            <div class="location-card">
              <div class="location-image">
                <ImagePlaceholder text={location.name} type="location" />
              </div>
              <div class="location-info">
                <h3>{getCategoryEmoji(location.category)} {location.name}</h3>
                <p class="location-country">{location.country}</p>
                <div class="rating">
                  {"⭐".repeat(location.rating)}
                </div>
              </div>
            </div>
          {/each}
        </div>
      {:else}
        <div class="empty-state">
          <p>No hay lugares registrados en este viaje aún.</p>
        </div>
      {/if}
    </section>

    <div class="actions">
      <button class="btn btn-danger" on:click={handleDelete}
        >Eliminar Viaje</button
      >
      <a href="/trips" class="btn btn-secondary">Volver a Viajes</a>
    </div>
  </div>
{:else}
  <div class="not-found">
    <h1>Viaje no encontrado</h1>
    <a href="/trips" class="btn btn-primary">Volver a mis viajes</a>
  </div>
{/if}

<style>
  .page-container {
    max-width: 1000px;
    margin: 0 auto;
    padding: 2rem;
  }

  .trip-cover {
    height: 300px;
    border-radius: 16px;
    overflow: hidden;
    margin-bottom: 2rem;
  }

  .header-content {
    text-align: center;
    margin-bottom: 3rem;
  }

  h1 {
    font-size: 3rem;
    margin: 1rem 0;
    color: white;
  }

  .badge {
    display: inline-block;
    padding: 0.5rem 1rem;
    border-radius: 20px;
    font-weight: 600;
    font-size: 0.9rem;
  }

  .badge.green {
    background: rgba(34, 197, 94, 0.2);
    color: #4ade80;
  }
  .badge.blue {
    background: rgba(59, 130, 246, 0.2);
    color: #60a5fa;
  }
  .badge.gray {
    background: rgba(148, 163, 184, 0.2);
    color: #cbd5e1;
  }

  .dates {
    color: #94a3b8;
    font-size: 1.1rem;
  }

  .countries {
    display: flex;
    gap: 0.5rem;
    justify-content: center;
    margin-top: 1rem;
    flex-wrap: wrap;
  }

  .country-tag {
    background: #1e293b;
    padding: 0.5rem 1rem;
    border-radius: 8px;
    border: 1px solid #334155;
  }

  section {
    margin-bottom: 3rem;
    background: #1e293b;
    padding: 2rem;
    border-radius: 12px;
    border: 1px solid #334155;
  }

  h2 {
    color: #60a5fa;
    margin-bottom: 1.5rem;
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
  }

  .locations-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 1.5rem;
  }

  .location-card {
    background: #0f172a;
    border-radius: 8px;
    overflow: hidden;
    border: 1px solid #334155;
  }

  .location-image {
    height: 150px;
  }

  .location-info {
    padding: 1rem;
  }

  .location-info h3 {
    font-size: 1.1rem;
    margin-bottom: 0.25rem;
  }

  .location-country {
    color: #94a3b8;
    font-size: 0.9rem;
    margin-bottom: 0.5rem;
  }

  .actions {
    display: flex;
    justify-content: space-between;
    margin-top: 2rem;
  }

  .btn {
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    text-decoration: none;
    border: none;
    display: inline-block;
  }

  .btn-secondary {
    background: #334155;
    color: white;
  }

  .btn-danger {
    background: rgba(239, 68, 68, 0.2);
    color: #f87171;
    border: 1px solid rgba(239, 68, 68, 0.5);
  }

  .btn-danger:hover {
    background: rgba(239, 68, 68, 0.3);
  }

  .btn-sm {
    padding: 0.5rem 1rem;
    font-size: 0.9rem;
    background: #3b82f6;
    color: white;
  }

  .not-found {
    text-align: center;
    padding: 5rem;
  }
</style>
