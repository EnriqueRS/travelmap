<script lang="ts">
  import { trips } from "$lib/stores/data";
  import { goto } from "$app/navigation";
  import type { Trip } from "$lib/stores/data";
  import CountryPicker from "$lib/components/ui/CountryPicker.svelte";
  import { tripsService } from "$lib/services/trips";
  import { toast } from "$lib/stores/ui";
  import { X } from "lucide-svelte";
  import DatePicker from "$lib/components/ui/DatePicker.svelte";

  let name = "";
  let description = "";
  let startDate = "";
  let endDate = "";
  let status: Trip["status"] = "Planificado";

  let selectedCountry = "";
  let selectedCountries: string[] = [];

  function addCountry() {
    if (selectedCountry && !selectedCountries.includes(selectedCountry)) {
      selectedCountries = [...selectedCountries, selectedCountry];
      selectedCountry = ""; // Reset
    }
  }

  function removeCountry(country: string) {
    selectedCountries = selectedCountries.filter((c) => c !== country);
  }

  let isSubmitting = false;

  async function handleSubmit() {
    isSubmitting = true;
    try {
      const newTrip = {
        name,
        description,
        startDate,
        endDate,
        countries: selectedCountries,
        status,
        coverImage: name,
        locations: [],
      };

      // Persistir en backend
      const createdTrip = await tripsService.createTrip(newTrip);
      createdTrip.locations = createdTrip.locations || [];

      // Actualizar frontend
      trips.update((current) => [...current, createdTrip]);
      goto("/trips");
    } catch (e) {
      console.error("Error creando el viaje", e);
      toast.error("Hubo un error al crear el viaje");
    } finally {
      isSubmitting = false;
    }
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
          <DatePicker id="startDate" bind:value={startDate} required={true} />
        </div>

        <div class="form-group">
          <label for="endDate">Fecha Fin</label>
          <DatePicker id="endDate" bind:value={endDate} required={true} />
        </div>
      </div>

      <div class="form-group">
        <label>Países</label>
        <div class="country-selector">
          <CountryPicker
            bind:value={selectedCountry}
            placeholder="Añadir un país..."
          />
          <button
            type="button"
            class="btn btn-primary"
            on:click={addCountry}
            disabled={!selectedCountry}
            style="padding: 0.75rem;">Añadir</button
          >
        </div>

        {#if selectedCountries.length > 0}
          <div class="selected-countries">
            {#each selectedCountries as country}
              <div class="country-tag">
                {country}
                <button
                  type="button"
                  class="btn-remove-country"
                  on:click={() => removeCountry(country)}
                >
                  <X size={14} />
                </button>
              </div>
            {/each}
          </div>
        {/if}
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

  .country-selector {
    display: flex;
    gap: 0.5rem;
  }
  .country-selector :global(select) {
    flex: 1;
  }

  .selected-countries {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-top: 1rem;
  }

  .country-tag {
    background: rgba(59, 130, 246, 0.2);
    border: 1px solid rgba(59, 130, 246, 0.4);
    color: #93c5fd;
    padding: 0.25rem 0.5rem 0.25rem 0.75rem;
    border-radius: 9999px;
    font-size: 0.875rem;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
  }

  .btn-remove-country {
    background: transparent;
    border: none;
    color: #93c5fd;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.1rem;
    cursor: pointer;
    border-radius: 50%;
    transition: background 0.2s, color 0.2s;
  }
  .btn-remove-country:hover {
    background: rgba(239, 68, 68, 0.2);
    color: #f87171;
  }
</style>
