<script lang="ts">
  import { Map, Star, Calendar, Camera, Heart, Plus, X } from "lucide-svelte"
  import { locations, getCategoryEmoji, type Location } from "$lib/stores/data"
  import { formatDate } from "$lib/utils/formatters"
  import ImagePlaceholder from "$lib/components/ui/ImagePlaceholder.svelte"
  import CountryPicker from "$lib/components/ui/CountryPicker.svelte"

  // Filtros
  let categoryFilter = ""
  let ratingFilter = ""
  let countryFilter = ""

  // Modal
  let showModal = false
  let newLocation: Partial<Location> = {
    category: "Naturaleza",
    rating: 5,
    country: "",
  }

  $: filteredLocations = $locations.filter((loc) => {
    const matchCategory = !categoryFilter || loc.category === categoryFilter
    const matchRating = !ratingFilter || loc.rating >= parseInt(ratingFilter)
    const matchCountry =
      !countryFilter ||
      loc.country.toLowerCase().includes(countryFilter.toLowerCase())
    return matchCategory && matchRating && matchCountry
  })

  function getRatingStars(rating: number) {
    return "⭐".repeat(rating)
  }

  function handleAddLocation() {
    if (!newLocation.name || !newLocation.country) return

    const location: Location = {
      id: crypto.randomUUID(),
      name: newLocation.name,
      description: newLocation.description || "",
      country: newLocation.country,
      category: (newLocation.category as any) || "Otro",
      coordinates: [0, 0], // Placeholder
      rating: newLocation.rating || 5,
      visitedDate: new Date().toISOString().split("T")[0],
      images: [],
      ...newLocation,
    } as Location

    locations.update((current) => [location, ...current])
    showModal = false
    newLocation = { category: "Naturaleza", rating: 5, country: "" }
  }
</script>

<svelte:head>
  <title>TravelMap - Ubicaciones</title>
  <meta
    name="description"
    content="Explora todas las ubicaciones que has visitado"
  />
</svelte:head>

<main class="locations-page">
  <section class="locations-header">
    <div class="header-content">
      <h1>📍 Ubicaciones</h1>
      <p>Todos los lugares memorables que has visitado en tus viajes</p>
      <div class="header-actions">
        <a href="/map" class="btn btn-primary">
          <Map size={20} />
          Ver en Mapa
        </a>
        <button class="btn btn-secondary" on:click={() => (showModal = true)}>
          <Plus size={20} />
          Añadir Ubicación
        </button>
      </div>
    </div>
  </section>

  <section class="filters">
    <div class="filter-container">
      <div class="filter-group">
        <label for="category-filter">Categoría:</label>
        <select id="category-filter" bind:value={categoryFilter}>
          <option value="">Todas</option>
          <option value="Naturaleza">Naturaleza</option>
          <option value="Ciudad">Ciudad</option>
          <option value="Ciudad de escala">Ciudad de escala</option>
          <option value="Cultura">Cultura</option>
          <option value="Playa">Playa</option>
          <option value="Montaña">Montaña</option>
        </select>
      </div>

      <div class="filter-group">
        <label for="rating-filter">Puntuación:</label>
        <select id="rating-filter" bind:value={ratingFilter}>
          <option value="">Todas</option>
          <option value="5">5 estrellas</option>
          <option value="4">4+ estrellas</option>
          <option value="3">3+ estrellas</option>
        </select>
      </div>

      <div class="filter-group">
        <label for="country-filter">País:</label>
        <CountryPicker
          id="country-filter"
          bind:value={countryFilter}
          placeholder="Todos los países"
        />
      </div>
    </div>
  </section>

  <section class="locations-content">
    {#if filteredLocations.length > 0}
      <div class="locations-grid">
        {#each filteredLocations as location (location.id)}
          <div class="location-card">
            <div class="location-image">
              <ImagePlaceholder text={location.name} type="location" />
              <div class="location-rating">
                {getRatingStars(location.rating)}
              </div>
              <div class="location-category">
                {getCategoryEmoji(location.category)}
              </div>
            </div>

            <div class="location-info">
              <h3>{location.name}</h3>
              <p class="location-description">{location.description}</p>

              <div class="location-meta">
                <div class="meta-item">
                  <Camera size={16} />
                  <span>{location.country}</span>
                </div>
                <div class="meta-item">
                  <Calendar size={16} />
                  <span>{formatDate(location.visitedDate)}</span>
                </div>
              </div>

              <div class="location-actions">
                <a href="/map" class="btn btn-small btn-primary">
                  <Map size={14} />
                  Ver en Mapa
                </a>
              </div>
            </div>
          </div>
        {/each}
      </div>
    {:else}
      <div class="empty-state">
        <p>No se encontraron ubicaciones con los filtros seleccionados.</p>
        <button
          class="btn btn-secondary mt-4"
          on:click={() => {
            categoryFilter = ""
            ratingFilter = ""
            countryFilter = ""
          }}>Limpiar Filtros</button
        >
      </div>
    {/if}
  </section>

  {#if showModal}
    <div class="modal-backdrop" on:click|self={() => (showModal = false)}>
      <div class="modal">
        <div class="modal-header">
          <h2>Añadir Nueva Ubicación</h2>
          <button class="close-btn" on:click={() => (showModal = false)}>
            <X size={24} />
          </button>
        </div>
        <form on:submit|preventDefault={handleAddLocation}>
          <div class="form-group">
            <label for="loc-name">Nombre</label>
            <input
              id="loc-name"
              type="text"
              bind:value={newLocation.name}
              required
              placeholder="Ej: Torre Eiffel"
            />
          </div>

          <div class="form-group">
            <label for="loc-country">País</label>
            <CountryPicker id="loc-country" bind:value={newLocation.country} />
          </div>

          <div class="row">
            <div class="form-group">
              <label for="loc-category">Categoría</label>
              <select id="loc-category" bind:value={newLocation.category}>
                <option value="Naturaleza">Naturaleza</option>
                <option value="Ciudad">Ciudad</option>
                <option value="Ciudad de escala">Ciudad de escala</option>
                <option value="Cultura">Cultura</option>
                <option value="Playa">Playa</option>
                <option value="Montaña">Montaña</option>
                <option value="Otro">Otro</option>
              </select>
            </div>

            <div class="form-group">
              <label for="loc-rating">Puntuación</label>
              <select id="loc-rating" bind:value={newLocation.rating}>
                <option value={5}>⭐⭐⭐⭐⭐ (5)</option>
                <option value={4}>⭐⭐⭐⭐ (4)</option>
                <option value={3}>⭐⭐⭐ (3)</option>
                <option value={2}>⭐⭐ (2)</option>
                <option value={1}>⭐ (1)</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label for="loc-desc">Descripción</label>
            <textarea
              id="loc-desc"
              bind:value={newLocation.description}
              rows="3"
            />
          </div>

          <div class="modal-actions">
            <button
              type="button"
              class="btn btn-secondary"
              on:click={() => (showModal = false)}>Cancelar</button
            >
            <button type="submit" class="btn btn-primary">Guardar</button>
          </div>
        </form>
      </div>
    </div>
  {/if}
</main>

<style>
  .locations-page {
    padding: 2rem 0;
    background: #1e293b;
    color: white;
    min-height: 100vh;
  }

  .locations-header {
    background: linear-gradient(135deg, #334155 0%, #1e293b 100%);
    padding: 2rem;
    border-bottom: 1px solid #475569;
    text-align: center;
  }

  .header-content h1 {
    font-size: 2.5rem;
    margin-bottom: 1rem;
    color: #60a5fa;
  }

  .header-content p {
    font-size: 1.2rem;
    opacity: 0.8;
    margin-bottom: 2rem;
  }

  .header-actions {
    display: flex;
    justify-content: center;
    gap: 1rem;
  }

  .filters {
    background: rgba(30, 41, 59, 0.5);
    padding: 1.5rem 2rem;
    border-bottom: 1px solid #475569;
  }

  .filter-container {
    max-width: 1200px;
    margin: 0 auto;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
  }

  .filter-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .filter-group label,
  label {
    font-weight: 600;
    color: #cbd5e1;
    font-size: 0.9rem;
  }

  select,
  input,
  textarea {
    padding: 0.75rem;
    border-radius: 6px;
    border: 1px solid #475569;
    background: #1e293b;
    color: white;
    font-size: 0.9rem;
    width: 100%;
    box-sizing: border-box;
  }

  select:focus,
  input:focus,
  textarea:focus {
    outline: 2px solid #60a5fa;
    border-color: #60a5fa;
  }

  .locations-content {
    padding: 2rem;
  }

  .locations-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 2rem;
    max-width: 1200px;
    margin: 0 auto;
  }

  .location-card {
    background: rgba(30, 41, 59, 0.5);
    border-radius: 12px;
    overflow: hidden;
    border: 1px solid #475569;
    transition: transform 0.3s ease, box-shadow 0.3s ease;
  }

  .location-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  }

  .location-image {
    height: 200px;
    position: relative;
  }

  .location-rating {
    position: absolute;
    top: 1rem;
    right: 1rem;
    background: rgba(0, 0, 0, 0.8);
    backdrop-filter: blur(8px);
    padding: 0.25rem 0.5rem;
    border-radius: 20px;
    color: #fbbf24;
    font-weight: 600;
    font-size: 0.8rem;
    z-index: 2;
  }

  .location-category {
    position: absolute;
    top: 1rem;
    left: 1rem;
    background: rgba(0, 0, 0, 0.8);
    backdrop-filter: blur(8px);
    padding: 0.25rem 0.5rem;
    border-radius: 20px;
    font-size: 1.2rem;
    z-index: 2;
  }

  .location-info {
    padding: 1.5rem;
  }

  .location-info h3 {
    margin-bottom: 0.75rem;
    color: #60a5fa;
    font-size: 1.2rem;
  }

  .location-description {
    color: #cbd5e1;
    margin-bottom: 1rem;
    line-height: 1.5;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .location-meta {
    display: flex;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .meta-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem;
    background: rgba(96, 165, 250, 0.1);
    border-radius: 6px;
    font-size: 0.9rem;
  }

  .meta-item span {
    color: #cbd5e1;
  }

  .location-actions {
    display: flex;
    gap: 0.5rem;
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
  }

  .btn-small {
    padding: 0.5rem 0.75rem;
    font-size: 0.8rem;
    width: 100%;
  }

  .empty-state {
    text-align: center;
    padding: 4rem;
    background: rgba(30, 41, 59, 0.3);
    border-radius: 12px;
    border: 1px dashed #475569;
    color: #94a3b8;
    grid-column: 1 / -1;
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

  .row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }

  .modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    margin-top: 2rem;
  }
</style>
