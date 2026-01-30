<script lang="ts">
  import { trips } from "$lib/stores/data"
  import { goto } from "$app/navigation"
  import type { Trip } from "$lib/stores/data"

  let name = ""
  let description = ""
  let startDate = ""
  let endDate = ""
  let countriesInput = ""
  let status: Trip["status"] = "Planificado"

  function handleSubmit() {
    const newTrip: Trip = {
      id: crypto.randomUUID(),
      name,
      description,
      startDate,
      endDate,
      countries: countriesInput
        .split(",")
        .map((c) => c.trim())
        .filter((c) => c),
      status,
      coverImage: name,
      locations: [],
    }

    trips.update((current) => [...current, newTrip])
    goto("/trips")
  }
</script>

<div class="page-container">
  <header class="page-header">
    <h1>Nuevo Viaje</h1>
    <p>Planifica tu próxima aventura</p>
  </header>

  <div class="form-container">
    <form on:submit|preventDefault={handleSubmit}>
      <div class="form-group">
        <label for="name">Nombre del Viaje</label>
        <input
          type="text"
          id="name"
          bind:value={name}
          required
          placeholder="Ej: Verano en Italia"
        />
      </div>

      <div class="form-group">
        <label for="description">Descripción</label>
        <textarea
          id="description"
          bind:value={description}
          rows="3"
          placeholder="Describe brevemente tu viaje..."
        />
      </div>

      <div class="row">
        <div class="form-group">
          <label for="startDate">Fecha Inicio</label>
          <input type="date" id="startDate" bind:value={startDate} required />
        </div>

        <div class="form-group">
          <label for="endDate">Fecha Fin</label>
          <input type="date" id="endDate" bind:value={endDate} required />
        </div>
      </div>

      <div class="form-group">
        <label for="countries">Países (separados por coma)</label>
        <input
          type="text"
          id="countries"
          bind:value={countriesInput}
          placeholder="España, Francia, Italia"
        />
      </div>

      <div class="form-group">
        <label for="status">Estado</label>
        <select id="status" bind:value={status}>
          <option value="Planificado">Planificado</option>
          <option value="En curso">En curso</option>
          <option value="Completado">Completado</option>
        </select>
      </div>

      <div class="form-actions">
        <a href="/trips" class="btn btn-secondary">Cancelar</a>
        <button type="submit" class="btn btn-primary">Crear Viaje</button>
      </div>
    </form>
  </div>
</div>

<style>
  .page-container {
    max-width: 800px;
    margin: 0 auto;
    padding: 2rem;
  }

  .page-header {
    margin-bottom: 2rem;
    text-align: center;
  }

  .page-header h1 {
    color: #60a5fa;
    margin-bottom: 0.5rem;
  }

  .form-container {
    background: #1e293b;
    padding: 2rem;
    border-radius: 12px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    border: 1px solid #334155;
  }

  .form-group {
    margin-bottom: 1.5rem;
  }

  label {
    display: block;
    margin-bottom: 0.5rem;
    color: #cbd5e1;
    font-weight: 500;
  }

  input,
  textarea,
  select {
    width: 100%;
    padding: 0.75rem;
    border-radius: 8px;
    border: 1px solid #475569;
    background: #0f172a;
    color: white;
    font-family: inherit;
    transition: border-color 0.2s;
    box-sizing: border-box; /* Fix for width 100% pushing layout */
  }

  input:focus,
  textarea:focus,
  select:focus {
    outline: none;
    border-color: #60a5fa;
    background: #1e293b;
  }

  .row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;
  }

  .form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    margin-top: 2rem;
    padding-top: 1rem;
    border-top: 1px solid #334155;
  }

  .btn {
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    text-decoration: none;
    transition: all 0.2s;
    border: none;
  }

  .btn-primary {
    background: #3b82f6;
    color: white;
  }

  .btn-primary:hover {
    background: #2563eb;
  }

  .btn-secondary {
    background: transparent;
    color: #cbd5e1;
    border: 1px solid #475569;
  }

  .btn-secondary:hover {
    background: #334155;
    color: white;
  }
</style>
