<script lang="ts">
  import { onMount, onDestroy } from "svelte"
  import flatpickr from "flatpickr"
  import "flatpickr/dist/flatpickr.min.css"
  import "flatpickr/dist/themes/dark.css"
  import { Spanish } from "flatpickr/dist/l10n/es.js"
  import { languageStore } from "$lib/stores/ui"
  import { t } from "$lib/stores/i18n"

  export let value: string = "" // Valor en DB siempre YYYY-MM-DD
  export let id: string = ""
  export let required: boolean = false
  export let placeholder: string = $t("common.datePlaceholder")

  let inputElement: HTMLInputElement
  let fpInstance: any

  onMount(() => {
    fpInstance = flatpickr(inputElement, {
      locale: $languageStore === "es" ? Spanish : "en",
      dateFormat: "Y-m-d", // Formato del valor "value"
      altInput: true,
      altFormat: "d/m/Y", // Formato visible al usuario
      defaultDate: value || undefined,
      onChange: (selectedDates, dateStr) => {
        value = dateStr
      },
    })
  })

  $: if (fpInstance) {
    fpInstance.set("locale", $languageStore === "es" ? Spanish : "en")
    // flatpickr sometimes needs to redraw/rebuild parts when locale changes
    // But setting it via .set("locale", ...) is usually enough for simple stuff.
  }

  onDestroy(() => {
    if (fpInstance) {
      fpInstance.destroy()
    }
  })

  $: if (fpInstance && value) {
    fpInstance.setDate(value, false)
  }
</script>

<div class="datepicker-wrapper">
  <input
    type="text"
    bind:this={inputElement}
    {id}
    {required}
    {placeholder}
    class="custom-input"
  />
</div>

<style>
  .datepicker-wrapper {
    width: 100%;
  }

  /* Flatpickr calendar popup styling */
  :global(.flatpickr-calendar) {
    font-family: inherit;
    border: 1px solid var(--color-border-light) !important;
    box-shadow: var(--shadow-lg) !important;
    background: var(--color-bg-elevated) !important;
  }

  /* flatpickr clones the class to altInput */
  :global(input.custom-input) {
    width: 100%;
    padding: 0.625rem 0.75rem;
    border-radius: var(--radius-base);
    border: 1px solid var(--color-border);
    background: var(--color-bg-tertiary);
    color: var(--color-text-primary);
    font-family: inherit;
    font-size: 0.875rem;
    transition: border-color 0.2s, box-shadow 0.2s;
    box-sizing: border-box;
  }

  :global(input.custom-input:focus) {
    outline: none;
    border-color: var(--color-accent-primary);
    box-shadow: 0 0 0 3px var(--color-accent-muted);
  }
</style>
