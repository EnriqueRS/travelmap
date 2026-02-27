<script lang="ts">
  import { createEventDispatcher, onMount } from "svelte"
  import { Search, ChevronDown } from "lucide-svelte"

  import { COUNTRIES } from "$lib/utils/countries"

  export let value = ""
  export let placeholder = "Selecciona un país..."
  export let id = ""
  export let disabled = false

  const dispatch = createEventDispatcher()

  let isOpen = false
  let searchQuery = ""
  let dropdownRef: HTMLDivElement

  $: filteredCountries = COUNTRIES.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  )
  $: selectedCountryObj = COUNTRIES.find((c) => c.name === value)

  function toggleDropdown() {
    if (disabled) return
    isOpen = !isOpen
    if (isOpen) {
      searchQuery = ""
      // Focus the input in the next tick
      setTimeout(() => {
        const input = dropdownRef?.querySelector("input")
        if (input) input.focus()
      }, 0)
    }
  }

  function selectCountry(countryName: string) {
    value = countryName
    isOpen = false
    searchQuery = ""
    dispatch("change", { value })
  }

  // Cerrar al hacer click fuera
  onMount(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef && !dropdownRef.contains(event.target as Node)) {
        isOpen = false
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  })
</script>

<div
  class="custom-dropdown-container {$$props.class || ''}"
  bind:this={dropdownRef}
  {id}
>
  <button
    type="button"
    class="dropdown-trigger"
    class:disabled
    on:click={toggleDropdown}
  >
    {#if selectedCountryObj}
      <span class="country-display">
        <span class="flag">{selectedCountryObj.flag}</span>
        <span class="name">{selectedCountryObj.name}</span>
      </span>
    {:else}
      <span class="placeholder">{placeholder}</span>
    {/if}
    <ChevronDown size={16} class="chevron" />
  </button>

  {#if isOpen}
    <div class="dropdown-menu">
      <div class="search-box">
        <Search size={14} class="search-icon" />
        <input
          type="text"
          bind:value={searchQuery}
          placeholder="Buscar..."
          on:click|stopPropagation
        />
      </div>

      <ul class="options-list">
        {#each filteredCountries as country}
          <li>
            <button
              type="button"
              class="option-btn"
              class:selected={value === country.name}
              on:click={() => selectCountry(country.name)}
            >
              <span class="option-flag">{country.flag}</span>
              <span class="option-name">{country.name}</span>
            </button>
          </li>
        {:else}
          <li class="no-results">No se encontraron países</li>
        {/each}
      </ul>
    </div>
  {/if}
</div>

<style>
  .custom-dropdown-container {
    position: relative;
    width: 100%;
    font-family: inherit;
  }

  .dropdown-trigger {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: #0f172a;
    border: 1px solid #334155;
    padding: 0.75rem;
    border-radius: 6px;
    color: white;
    font-size: 1rem;
    cursor: pointer;
    transition: border-color 0.2s, box-shadow 0.2s;
  }

  .dropdown-trigger.disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .dropdown-trigger:focus-visible {
    outline: none;
    border-color: #6366f1;
    box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2);
  }

  .country-display {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .flag {
    font-size: 1.1rem;
    line-height: 1;
  }

  .placeholder {
    color: #94a3b8;
  }

  .chevron {
    color: #64748b;
  }

  .dropdown-menu {
    position: absolute;
    top: calc(100% + 4px);
    left: 0;
    width: 100%;
    background: #1e293b;
    border: 1px solid #334155;
    border-radius: 8px;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.5);
    z-index: 50;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    max-height: 300px;
  }

  .search-box {
    position: relative;
    padding: 0.5rem;
    border-bottom: 1px solid #334155;
    background: #0f172a;
  }

  .search-icon {
    position: absolute;
    left: 0.8rem;
    top: 50%;
    transform: translateY(-50%);
    color: #64748b;
  }

  .search-box input {
    width: 100%;
    background: #1e293b;
    border: 1px solid #334155;
    padding: 0.4rem 0.4rem 0.4rem 2rem;
    border-radius: 4px;
    color: white;
    font-size: 0.9rem;
  }

  .search-box input:focus {
    outline: none;
    border-color: #6366f1;
  }

  .options-list {
    list-style: none;
    margin: 0;
    padding: 0.25rem 0;
    overflow-y: auto;
    flex: 1;
  }

  .option-btn {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    background: transparent;
    border: none;
    color: #e2e8f0;
    font-size: 0.95rem;
    cursor: pointer;
    text-align: left;
    transition: background 0.15s;
  }

  .option-btn:hover {
    background: #334155;
  }

  .option-btn.selected {
    background: rgba(99, 102, 241, 0.15);
    color: #818cf8;
  }

  .option-flag {
    font-size: 1.1rem;
    line-height: 1;
  }

  .no-results {
    padding: 0.75rem;
    color: #94a3b8;
    text-align: center;
    font-size: 0.9rem;
  }

  /* Custom Scrollbar for dropdown */
  .options-list::-webkit-scrollbar {
    width: 6px;
  }
  .options-list::-webkit-scrollbar-track {
    background: #1e293b;
  }
  .options-list::-webkit-scrollbar-thumb {
    background: #475569;
    border-radius: 3px;
  }
  .options-list::-webkit-scrollbar-thumb:hover {
    background: #64748b;
  }
</style>
