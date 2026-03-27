<script lang="ts">
  import { trips } from "$lib/stores/data"
  import { goto } from "$app/navigation"
  import type { Trip } from "$lib/stores/data"
  import CountryMultiSelect from "$lib/components/ui/CountryMultiSelect.svelte"
  import ProvinceMultiSelect from "$lib/components/ui/ProvinceMultiSelect.svelte"
  import { tripsService } from "$lib/services/trips"
  import { toast, languageStore } from "$lib/stores/ui"
  import { getCountryName } from "$lib/utils/countries"
  import { X, Plus } from "lucide-svelte"
  import DatePicker from "$lib/components/ui/DatePicker.svelte"
  import { t } from "$lib/stores/i18n"
  import { slide } from "svelte/transition"

  let name = ""
  let description = ""
  let startDate = ""
  let endDate = ""
  let status: Trip["status"] = "Planificado"

  $: if (startDate && endDate) {
    const now = new Date()
    const start = new Date(startDate)
    const end = new Date(endDate)
    now.setHours(0, 0, 0, 0)
    start.setHours(0, 0, 0, 0)
    end.setHours(0, 0, 0, 0)

    if (now < start) {
      status = "Planificado"
    } else if (now > end) {
      status = "Completado"
    } else {
      status = "En curso"
    }
  } else {
    status = "Planificado"
  }

  let selectedCountries: string[] = []
  let selectedProvinces: string[] = []

  let isSubmitting = false

  async function handleSubmit() {
    isSubmitting = true

    try {
      const newTrip = {
        name,
        description,
        startDate,
        endDate,
        countries: selectedCountries,
        provinces: selectedProvinces,
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
        <CountryMultiSelect bind:selectedCountries />
      </div>

      {#if selectedCountries.includes('ES')}
        <div class="form-group" transition:slide>
          <label for="provinces">{$t("map.provinces")}</label>
          <ProvinceMultiSelect bind:selectedProvinces />
        </div>
      {/if}


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

  .btn-remove-country:hover {
    background: rgba(239, 68, 68, 0.2);
    color: #f87171;
  }
</style>
