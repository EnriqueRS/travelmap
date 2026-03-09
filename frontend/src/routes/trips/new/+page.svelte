<script lang="ts">
  import { trips } from "$lib/stores/data"
  import { goto } from "$app/navigation"
  import type { Trip } from "$lib/stores/data"
  import CountryPicker from "$lib/components/ui/CountryPicker.svelte"
  import { tripsService } from "$lib/services/trips"
  import { toast, languageStore } from "$lib/stores/ui"
  import { getCountryName } from "$lib/utils/countries"
  import { X, Plus } from "lucide-svelte"
  import DatePicker from "$lib/components/ui/DatePicker.svelte"
  import { t } from "$lib/stores/i18n"

  let name = ""
  let description = ""
  let startDate = ""
  let endDate = ""
  let status: Trip["status"] = "Planificado"

  let selectedCountry = ""
  let selectedCountries: string[] = []

  function addCountry() {
    if (selectedCountry && !selectedCountries.includes(selectedCountry)) {
      selectedCountries = [...selectedCountries, selectedCountry]
      selectedCountry = "" // Reset
    }
  }

  function removeCountry(country: string) {
    selectedCountries = selectedCountries.filter((c) => c !== country)
  }

  let isSubmitting = false

  async function handleSubmit() {
    isSubmitting = true

    // Auto-add pending country explicitly chosen but not yet added
    addCountry()

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
      }

      // Persistir en backend
      const createdTrip = await tripsService.createTrip(newTrip)
      createdTrip.locations = createdTrip.locations || []

      // Actualizar frontend
      trips.update((current) => [...current, createdTrip])
      goto("/trips")
    } catch (e) {
      console.error("Error creando el viaje", e)
      toast.error($t("form.errorCreating"))
    } finally {
      isSubmitting = false
    }
  }
</script>

<div class="page-container">
  <header class="page-header">
    <h1>{$t("dashboard.newTrip")}</h1>
    <p>
      {$t("dashboard.planAventure")}
    </p>
  </header>

  <div class="form-container">
    <form on:submit|preventDefault={handleSubmit}>
      <div class="form-group">
        <label for="name">{$t("form.name")}</label>
        <input
          type="text"
          id="name"
          bind:value={name}
          required
          placeholder={$t("form.namePlaceholder")}
          class="input-box"
        />
      </div>

      <div class="form-group">
        <label for="description">{$t("form.description")}</label>
        <textarea
          id="description"
          bind:value={description}
          rows="3"
          placeholder={$t("form.descPlaceholder")}
          class="input-box"
        />
      </div>

      <div class="row">
        <div class="form-group">
          <label for="startDate">{$t("form.startDate")}</label>
          <DatePicker id="startDate" bind:value={startDate} required={true} />
        </div>

        <div
          class="form-group"
          on:click={() => {
            if (!endDate && startDate) endDate = startDate
          }}
        >
          <label for="endDate">{$t("form.endDate")}</label>
          <DatePicker id="endDate" bind:value={endDate} required={true} />
        </div>
      </div>

      <div class="form-group">
        <label>{$t("form.countries")}</label>
        <div class="country-selector">
          <CountryPicker bind:value={selectedCountry} placeholder="..." />
          <button
            type="button"
            class="btn btn-primary"
            on:click={addCountry}
            disabled={!selectedCountry}
            style="padding: 0.75rem;"
          >
            <Plus size={16} />
          </button>
        </div>

        {#if selectedCountries.length > 0}
          <div class="selected-countries">
            {#each selectedCountries as country}
              <div class="country-tag">
                {getCountryName(country, $languageStore)}
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
        <label for="status">{$t("form.status")}</label>
        <select id="status" bind:value={status} class="input-box">
          <option value="Planificado">{$t("status.Planificado")}</option>
          <option value="En curso">{$t("status.En curso")}</option>
          <option value="Completado">{$t("status.Completado")}</option>
        </select>
      </div>

      <div class="form-actions">
        <a href="/trips" class="btn btn-ghost border border-border"
          >{$t("form.cancel")}</a
        >
        <button type="submit" class="btn btn-primary">{$t("form.save")}</button>
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
    background: var(--color-bg-secondary);
    padding: 2rem;
    border-radius: 12px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    border: 1px solid var(--color-border);
  }

  .form-group {
    margin-bottom: 1.5rem;
  }

  label {
    display: block;
    margin-bottom: 0.5rem;
    color: var(--color-text-secondary);
    font-weight: 500;
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
    border-top: 1px solid var(--color-border);
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
