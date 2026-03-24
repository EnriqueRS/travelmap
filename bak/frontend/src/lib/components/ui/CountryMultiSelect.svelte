<script lang="ts">
  import { createEventDispatcher, onMount } from "svelte"
  import { Search, X, Check, ChevronDown } from "lucide-svelte"
  import { COUNTRIES, getCountryName } from "$lib/utils/countries"
  import { normalizeString } from "$lib/utils/string"
  import { slide, fade } from "svelte/transition"
  import { t } from "$lib/stores/i18n"
  import { languageStore } from "$lib/stores/ui"

  export let selectedCountries: string[] = []
  export let placeholder = $t("common.selectCountry")

  const dispatch = createEventDispatcher()

  let searchQuery = ""
  let isOpen = false
  let dropdownRef: HTMLDivElement

  $: filteredCountries = COUNTRIES.filter(
    (c) =>
      normalizeString(c.labelEs).includes(normalizeString(searchQuery)) ||
      normalizeString(c.labelEn).includes(normalizeString(searchQuery)) ||
      normalizeString(c.id).includes(normalizeString(searchQuery))
  )

  function toggleDropdown() {
    isOpen = !isOpen
    if (isOpen) {
      searchQuery = ""
    }
  }

  function toggleCountry(countryId: string) {
    if (selectedCountries.includes(countryId)) {
      selectedCountries = selectedCountries.filter((c) => c !== countryId)
    } else {
      selectedCountries = [...selectedCountries, countryId]
    }
    dispatch("change", { value: selectedCountries })
  }

  function removeCountry(countryId: string) {
    selectedCountries = selectedCountries.filter((c) => c !== countryId)
    dispatch("change", { value: selectedCountries })
  }

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

<div class="country-multi-select" bind:this={dropdownRef}>
  <div class="selected-tags-container">
    {#each selectedCountries as countryId}
      {@const country = COUNTRIES.find((c) => c.id === countryId)}
      <div class="country-tag" transition:fade={{ duration: 150 }}>
        {#if country}
          <span class="tag-flag">{country.flag}</span>
        {/if}
        <span>{getCountryName(countryId, $languageStore)}</span>
        <button
          type="button"
          class="remove-btn"
          on:click|stopPropagation={() => removeCountry(countryId)}
        >
          <X size={12} />
        </button>
      </div>
    {/each}

    <button
      type="button"
      class="dropdown-trigger"
      class:is-active={isOpen}
      on:click={toggleDropdown}
    >
      <span class="placeholder-text">
        {selectedCountries.length === 0 ? placeholder : $t("common.addMore")}
      </span>
      <ChevronDown size={16} class="chevron {isOpen ? 'rotate' : ''}" />
    </button>
  </div>

  {#if isOpen}
    <div class="dropdown-menu" transition:slide={{ duration: 200 }}>
      <div class="search-container">
        <Search size={14} class="search-icon" />
        <input
          type="text"
          bind:value={searchQuery}
          placeholder={$t("common.search")}
          class="search-input"
          on:click|stopPropagation
        />
      </div>

      <div class="options-container custom-scrollbar">
        {#each filteredCountries as country}
          <button
            type="button"
            class="option-item"
            class:selected={selectedCountries.includes(country.id)}
            on:click={() => toggleCountry(country.id)}
          >
            <div class="option-content">
              <span class="option-flag">{country.flag}</span>
              <span class="option-name">{getCountryName(country.id, $languageStore)}</span>
            </div>
            {#if selectedCountries.includes(country.id)}
              <Check size={16} class="check-icon" />
            {/if}
          </button>
        {:else}
          <div class="no-results">{$t("common.noResults")}</div>
        {/each}
      </div>
    </div>
  {/if}
</div>

<style>
  .country-multi-select {
    position: relative;
    width: 100%;
  }

  .selected-tags-container {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    padding: 0.6rem;
    background: var(--color-bg-tertiary);
    border: 1px solid var(--color-border);
    border-radius: 12px;
    min-height: 48px;
    align-items: center;
    transition: all 0.2s;
  }

  .selected-tags-container:focus-within {
    border-color: var(--color-accent-primary);
    box-shadow: 0 0 0 2px rgba(96, 165, 250, 0.1);
  }

  .country-tag {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.25rem 0.5rem;
    background: rgba(96, 165, 250, 0.15);
    border: 1px solid rgba(96, 165, 250, 0.3);
    border-radius: 8px;
    color: var(--color-text-primary);
    font-size: 0.85rem;
    font-weight: 500;
  }

  .tag-flag {
    font-size: 1rem;
    line-height: 1;
  }

  .remove-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    color: var(--color-text-secondary);
    padding: 0.1rem;
    cursor: pointer;
    border-radius: 4px;
    transition: all 0.2s;
  }

  .remove-btn:hover {
    background: rgba(239, 68, 68, 0.15);
    color: #f87171;
  }

  .dropdown-trigger {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: transparent;
    border: none;
    color: var(--color-text-secondary);
    cursor: pointer;
    padding: 0.2rem 0.4rem;
    min-width: 120px;
    text-align: left;
  }

  .placeholder-text {
    font-size: 0.9rem;
    color: #64748b;
  }

  .chevron {
    transition: transform 0.2s;
    color: #64748b;
  }

  .chevron.rotate {
    transform: rotate(180deg);
  }

  .dropdown-menu {
    position: absolute;
    top: calc(100% + 8px);
    left: 0;
    width: 100%;
    background: var(--color-bg-secondary);
    border: 1px solid var(--color-border);
    border-radius: 12px;
    box-shadow: 0 12px 24px -8px rgba(0, 0, 0, 0.5);
    z-index: 100;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    max-height: 320px;
  }

  .search-container {
    position: relative;
    padding: 0.75rem;
    border-bottom: 1px solid var(--color-border);
    background: var(--color-bg-main);
  }

  .search-icon {
    position: absolute;
    left: 1.25rem;
    top: 50%;
    transform: translateY(-50%);
    color: #64748b;
  }

  .search-input {
    width: 100%;
    padding: 0.5rem 0.5rem 0.5rem 2rem;
    background: var(--color-bg-tertiary);
    border: 1px solid var(--color-border);
    border-radius: 8px;
    color: var(--color-text-primary);
    font-size: 0.9rem;
    outline: none;
  }

  .search-input:focus {
    border-color: var(--color-accent-primary);
  }

  .options-container {
    flex: 1;
    overflow-y: auto;
    padding: 0.5rem;
  }

  .option-item {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.6rem 0.75rem;
    background: transparent;
    border: none;
    border-radius: 8px;
    color: var(--color-text-primary);
    cursor: pointer;
    transition: all 0.15s;
    margin-bottom: 2px;
  }

  .option-item:hover {
    background: var(--color-bg-tertiary);
  }

  .option-item.selected {
    background: rgba(96, 165, 250, 0.1);
    color: var(--color-accent-primary);
  }

  .option-content {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .option-flag {
    font-size: 1.2rem;
    line-height: 1;
  }

  .option-name {
    font-size: 0.95rem;
    font-weight: 500;
  }

  .check-icon {
    color: var(--color-accent-primary);
  }

  .no-results {
    padding: 2rem 1rem;
    text-align: center;
    color: #64748b;
    font-size: 0.9rem;
  }

  /* Scrollbar Customization */
  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: #334155;
    border-radius: 3px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #475569;
  }
</style>
