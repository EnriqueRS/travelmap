<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import flatpickr from "flatpickr";
  import "flatpickr/dist/flatpickr.min.css";
  import "flatpickr/dist/themes/dark.css";
  import { Spanish } from "flatpickr/dist/l10n/es.js";

  export let value: string = ""; // Valor en DB siempre YYYY-MM-DD
  export let id: string = "";
  export let required: boolean = false;
  export let placeholder: string = "DD/MM/AAAA";

  let inputElement: HTMLInputElement;
  let fpInstance: any;

  onMount(() => {
    fpInstance = flatpickr(inputElement, {
      locale: Spanish,
      dateFormat: "Y-m-d", // Formato del valor "value"
      altInput: true,
      altFormat: "d/m/Y", // Formato visible al usuario
      defaultDate: value || undefined,
      onChange: (selectedDates, dateStr) => {
        value = dateStr;
      },
    });
  });

  onDestroy(() => {
    if (fpInstance) {
      fpInstance.destroy();
    }
  });

  $: if (fpInstance && value) {
    fpInstance.setDate(value, false);
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

  /* Ajustes para el popup premium sobre fondo oscuro */
  :global(.flatpickr-calendar) {
    font-family: inherit;
    border: 1px solid #334155 !important;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5) !important;
  }

  /* flatpickr clona la clase original al altInput */
  :global(input.custom-input) {
    width: 100%;
    padding: 0.75rem;
    border-radius: 8px;
    border: 1px solid #475569;
    background: #0f172a;
    color: white;
    font-family: inherit;
    transition: border-color 0.2s;
    box-sizing: border-box;
  }

  :global(input.custom-input:focus) {
    outline: none;
    border-color: #60a5fa;
    background: #1e293b;
  }
</style>
