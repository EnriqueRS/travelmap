<script lang="ts">
  import { createEventDispatcher } from "svelte"
  import { fade, scale, slide } from "svelte/transition"
  import { X, Search, MapPin, CheckCircle2, Globe, Flag } from "lucide-svelte"
  import { t } from "$lib/stores/i18n"
  import {
    getProvincesForCountry,
    getRegionsForCountry,
    type ProvinceInfo,
    type RegionInfo,
  } from "$lib/utils/provinces"
  import { normalizeString } from "$lib/utils/string"

  export let countryCode = "ES"
  export let visitedProvinces: Set<string> = new Set()
  export let plannedProvinces: Set<string> = new Set()

  const dispatch = createEventDispatcher()
  let searchQuery = ""
  let selectedRegion = "Todos"

  const provinces = getProvincesForCountry(countryCode)
  const regions = getRegionsForCountry(countryCode)

  $: filteredProvinces = provinces.filter((p) => {
    const matchesSearch =
      !searchQuery ||
      normalizeString(p.name).includes(normalizeString(searchQuery))
    const matchesRegion =
      selectedRegion === "Todos" || p.region === selectedRegion
    return matchesSearch && matchesRegion
  })

  $: totalProvinces = provinces.length
  $: visitedCount = provinces.filter((p) => visitedProvinces.has(p.name)).length
  $: plannedCount = provinces.filter((p) => plannedProvinces.has(p.name) && !visitedProvinces.has(p.name)).length
  
  $: visitedProgress = totalProvinces > 0 ? (visitedCount / totalProvinces) * 100 : 0
  $: plannedProgress = totalProvinces > 0 ? (plannedCount / totalProvinces) * 100 : 0
  $: globalProgress = Math.round(visitedProgress)

  $: regionStats = regions.map((r) => {
    const regionalProvinces = provinces.filter((p) => p.region === r.id)
    const visitedInRegion = regionalProvinces.filter((p) =>
      visitedProvinces.has(p.name),
    ).length
    const plannedInRegion = regionalProvinces.filter((p) =>
      plannedProvinces.has(p.name) && !visitedProvinces.has(p.name),
    ).length
    const totalInRegion = regionalProvinces.length
    
    return {
      ...r,
      visited: visitedInRegion,
      planned: plannedInRegion,
      total: totalInRegion,
      visitedProgress: totalInRegion > 0 ? (visitedInRegion / totalInRegion) * 100 : 0,
      plannedProgress: totalInRegion > 0 ? (plannedInRegion / totalInRegion) * 100 : 0,
      totalProgress: totalInRegion > 0 ? Math.round((visitedInRegion / totalInRegion) * 100) : 0,
    }
  })

  function close() {
    dispatch("close")
  }
</script>

<div
  class="province-explorer-backdrop"
  on:click|self={close}
  on:keydown={(e) => e.key === "Escape" && close()}
  transition:fade
  role="button"
  tabindex="-1"
>
  <div class="explorer-modal" transition:scale={{ duration: 300, start: 0.95 }}>
    <!-- Sidebar -->
    <div class="explorer-sidebar">
      <div class="sidebar-header">
        <div class="header-icon">
          <Globe size={20} />
        </div>
        <div>
          <h3>{countryCode === "ES" ? "España" : countryCode}</h3>
          <p>{$t("profile.globalStats")}</p>
        </div>
      </div>

      <div class="progress-section">
        <div class="progress-header">
          <span>{$t("map.progress")}</span>
          <span class="pct">{globalProgress}%</span>
        </div>
        <div class="progress-bar-bg">
          <div class="progress-bar-fill visited" style="width: {visitedProgress}%" />
          <div class="progress-bar-fill planned" style="width: {plannedProgress}%; left: {visitedProgress}%" />
        </div>
        <div class="progress-legend">
          <p class="progress-detail">
            <span class="dot visited"></span> {visitedCount} / {totalProvinces} {$t("map.visited")}
          </p>
          {#if plannedCount > 0}
            <p class="progress-detail">
              <span class="dot planned"></span> {plannedCount} {$t("map.planned")}
            </p>
          {/if}
        </div>
      </div>

      <div class="regions-list custom-scrollbar">
        <button
          class="region-item"
          class:active={selectedRegion === "Todos"}
          on:click={() => (selectedRegion = "Todos")}
        >
          <div class="region-info">
            <span class="region-flag">🌍</span>
            <span class="region-name">{$t("map.all")}</span>
          </div>
        </button>

        {#each regionStats as region}
          <button
            class="region-item"
            class:active={selectedRegion === region.id}
            on:click={() => (selectedRegion = region.id)}
          >
            <div class="region-info">
              {#if region.flag && region.flag.startsWith("http")}
                <img src={region.flag} alt={region.name} class="region-flag-img" />
              {:else}
                <span class="region-flag">{region.flag || "🚩"}</span>
              {/if}
              <span class="region-name">{region.name}</span>
            </div>
            <div class="region-meta">
              <span class="region-count">
                {region.visited}{#if region.planned > 0}<span class="planned-plus">+{region.planned}</span>{/if} / {region.total}
              </span>
              <div class="mini-progress">
                <div class="fill visited" style="width: {region.visitedProgress}%" />
                <div class="fill planned" style="width: {region.plannedProgress}%" />
              </div>
            </div>
          </button>
        {/each}
      </div>
    </div>

    <!-- Main Content -->
    <div class="explorer-main">
      <button class="close-btn" on:click={close}>
        <X size={20} />
      </button>

      <div class="main-header">
        <h2>{$t("map.explorerTitle")}</h2>
        <p>{$t("map.explorerSubtitle")}</p>
      </div>

      <div class="controls">
        <div class="search-box">
          <Search size={18} />
          <input
            type="text"
            bind:value={searchQuery}
            placeholder={$t("map.searchCountryPlaceholder")}
          />
        </div>
      </div>

      <div class="provinces-grid custom-scrollbar">
        {#each filteredProvinces as province}
          {@const isVisited = visitedProvinces.has(province.name)}
          {@const isPlanned = plannedProvinces.has(province.name) && !isVisited}
          <div class="province-card" class:visited={isVisited} class:planned={isPlanned}>
            {#if isVisited}
              <div class="visited-badge">
                <CheckCircle2 size={12} />
              </div>
            {:else if isPlanned}
              <div class="planned-badge">
                <MapPin size={12} />
              </div>
            {/if}
            <div class="province-flag-box" class:grayscale={!isVisited && !isPlanned}>
              {#if province.flag && province.flag.startsWith("http")}
                <img src={province.flag} alt={province.name} class="province-flag-img" />
              {:else}
                <span class="province-flag-placeholder">{isVisited ? "🏆" : isPlanned ? "📍" : "🚩"}</span>
              {/if}
            </div>
            <div class="province-details">
              <span class="province-name" class:muted={!isVisited && !isPlanned}
                >{province.name}</span
              >
              <div class="province-meta-tags">
                <span class="region-tag"
                  >{regions.find((r) => r.id === province.region)?.name ||
                    ""}</span
                >
                {#if isPlanned}
                  <span class="status-tag planned">{$t("map.planned")}</span>
                {/if}
              </div>
            </div>
          </div>
        {/each}

        {#if filteredProvinces.length === 0}
          <div class="empty-state">
            <Search size={40} />
            <p>{$t("common.noLocationFound")}</p>
          </div>
        {/if}
      </div>
    </div>
  </div>
</div>

<style>
  .province-explorer-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
  }

  .explorer-modal {
    width: 100%;
    max-width: 1100px;
    height: 90vh;
    background: var(--color-bg-main);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-xl);
    display: flex;
    overflow: hidden;
    box-shadow: var(--shadow-xl);
  }

  /* Sidebar Styles */
  .explorer-sidebar {
    width: 320px;
    background: var(--color-bg-secondary);
    border-right: 1px solid var(--color-border);
    display: flex;
    flex-direction: column;
    padding: 1.5rem;
  }

  .sidebar-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 2rem;
  }

  .header-icon {
    width: 40px;
    height: 40px;
    background: var(--color-accent-muted);
    border-radius: var(--radius-lg);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-accent-primary);
  }

  .sidebar-header h3 {
    font-size: 1.1rem;
    font-weight: 700;
    margin: 0;
  }

  .sidebar-header p {
    font-size: 0.75rem;
    color: var(--color-text-muted);
    margin: 0;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .progress-section {
    background: var(--color-bg-main);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    padding: 1.25rem;
    margin-bottom: 1.5rem;
  }

  .progress-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 0.75rem;
    font-size: 0.85rem;
    font-weight: 600;
  }

  .progress-header .pct {
    color: var(--color-accent-primary);
  }

  .progress-bar-bg {
    height: 8px;
    background: var(--color-bg-tertiary);
    border-radius: var(--radius-sm);
    overflow: hidden;
    margin-bottom: 0.5rem;
    position: relative;
  }

  .progress-bar-fill {
    height: 100%;
    border-radius: var(--radius-sm);
    position: absolute;
    top: 0;
  }

  .progress-bar-fill.visited {
    background: linear-gradient(90deg, var(--color-success), var(--color-success-text));
    z-index: 2;
  }

  .progress-bar-fill.planned {
    background: linear-gradient(90deg, var(--color-accent-primary), var(--color-accent-text));
    z-index: 1;
    opacity: 0.6;
  }

  .progress-legend {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .progress-detail {
    font-size: 0.75rem;
    color: var(--color-text-muted);
    margin: 0;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
  }

  .dot.visited { background: var(--color-success); }
  .dot.planned { background: var(--color-accent-primary); }

  .regions-list {
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding-right: 0.5rem;
    scrollbar-width: thin;
    scrollbar-color: var(--color-border-light) transparent;
  }

  .regions-list::-webkit-scrollbar { width: 6px; }
  .regions-list::-webkit-scrollbar-track { background: transparent; }
  .regions-list::-webkit-scrollbar-thumb { background: var(--color-border-light); border-radius: var(--radius-full); }

  .region-item {
    display: flex;
    flex-direction: column;
    padding: 0.75rem 1rem;
    background: transparent;
    border: 1px solid transparent;
    border-radius: var(--radius-lg);
    cursor: pointer;
    transition: all 0.2s;
    text-align: left;
    width: 100%;
  }

  .region-item:hover {
    background: var(--color-bg-tertiary);
    border-color: var(--color-border);
  }

  .region-item.active {
    background: var(--color-accent-muted);
    border-color: var(--color-accent-primary);
  }

  .region-info {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 0.5rem;
  }

  .region-flag-img {
    width: 24px;
    height: 16px;
    object-fit: cover;
    border-radius: 2px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.3);
  }

  .region-name {
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--color-text-primary);
  }

  .region-meta {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .region-count {
    font-size: 0.7rem;
    color: var(--color-text-muted);
    font-variant-numeric: tabular-nums;
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }

  .planned-plus {
    color: var(--color-accent-primary);
    font-weight: 700;
  }

  .mini-progress {
    flex: 1;
    height: 4px;
    background: var(--color-bg-main);
    border-radius: 2px;
    overflow: hidden;
  }

  .mini-progress .fill {
    height: 100%;
  }

  .mini-progress .fill.visited {
    background: var(--color-success);
  }

  .mini-progress .fill.planned {
    background: var(--color-accent-primary);
    opacity: 0.5;
  }

  /* Main Area Styles */
  .explorer-main {
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: 2.5rem;
    position: relative;
  }

  .close-btn {
    position: absolute;
    top: 1.5rem;
    right: 1.5rem;
    width: 40px;
    height: 40px;
    background: var(--color-bg-tertiary);
    border: 1px solid var(--color-border);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-text-muted);
    transition: all 0.2s;
    cursor: pointer;
  }

  .close-btn:hover {
    background: var(--color-danger-muted);
    color: var(--color-danger);
    border-color: var(--color-danger-border);
    transform: rotate(90deg);
  }

  .main-header h2 {
    font-size: 1.75rem;
    font-weight: 800;
    margin: 0 0 0.25rem 0;
    color: var(--color-text-primary);
  }

  .main-header p {
    font-size: 0.95rem;
    color: var(--color-text-muted);
    margin: 0;
  }

  .controls {
    margin: 2rem 0;
  }

  .search-box {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    background: var(--color-bg-secondary);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    padding: 0 1rem;
    height: 48px;
    width: 100%;
    max-width: 400px;
    transition: all 0.2s;
    color: var(--color-text-muted);
  }

  .search-box:focus-within {
    border-color: var(--color-accent-primary);
    background: var(--color-bg-main);
    box-shadow: 0 0 0 3px var(--color-accent-muted);
  }

  .search-box input {
    background: transparent;
    border: none;
    color: var(--color-text-primary);
    flex: 1;
    font-size: 0.95rem;
  }

  .search-box input::placeholder {
    color: var(--color-text-muted);
  }

  .search-box input:focus {
    outline: none;
  }

  .provinces-grid {
    flex: 1;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 1rem;
    overflow-y: auto;
    padding-bottom: 2rem;
    scrollbar-width: thin;
    scrollbar-color: var(--color-border-light) transparent;
  }

  .provinces-grid::-webkit-scrollbar { width: 6px; }
  .provinces-grid::-webkit-scrollbar-track { background: transparent; }
  .provinces-grid::-webkit-scrollbar-thumb { background: var(--color-border-light); border-radius: var(--radius-full); }

  .province-card {
    background: var(--color-bg-secondary);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    padding: 1.25rem;
    display: flex;
    align-items: center;
    gap: 1rem;
    position: relative;
    transition: all 0.2s;
    cursor: default;
  }

  .province-card.visited {
    border-color: rgba(16, 185, 129, 0.3);
    background: var(--color-success-muted);
  }

  .province-card.planned {
    border-color: rgba(59, 130, 246, 0.3);
    background: var(--color-accent-muted);
  }

  .visited-badge, .planned-badge {
    position: absolute;
    top: -6px;
    right: -6px;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    box-shadow: var(--shadow-md);
  }

  .visited-badge { background: var(--color-success); }
  .planned-badge { background: var(--color-accent-primary); }

  .province-flag-box {
    width: 44px;
    height: 32px;
    background: var(--color-bg-tertiary);
    border-radius: var(--radius-md);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    overflow: hidden;
    border: 1px solid var(--color-border);
  }

  .province-flag-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .province-flag-placeholder {
    font-size: 1.25rem;
  }

  .grayscale {
    filter: grayscale(1);
    opacity: 0.5;
  }

  .province-details {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  .province-name {
    font-size: 0.95rem;
    font-weight: 700;
    color: var(--color-text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .province-name.muted {
    color: var(--color-text-muted);
    font-weight: 600;
  }

  .province-meta-tags {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-top: 2px;
  }

  .region-tag {
    font-size: 0.65rem;
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-weight: 700;
  }

  .status-tag {
    font-size: 0.6rem;
    padding: 1px 4px;
    border-radius: var(--radius-sm);
    font-weight: 800;
    text-transform: uppercase;
  }

  .status-tag.planned {
    background: var(--color-accent-muted);
    color: var(--color-accent-text);
    border: 1px solid var(--color-accent-primary);
  }

  .empty-state {
    grid-column: 1 / -1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 4rem;
    color: var(--color-text-muted);
    text-align: center;
  }

  .empty-state p {
    margin-top: 1rem;
    font-size: 1rem;
    font-weight: 600;
  }

  @media (max-width: 768px) {
    .province-explorer-backdrop {
      padding: 0;
    }

    .explorer-modal {
      flex-direction: column;
      height: 100vh;
      border-radius: 0;
    }

    .explorer-sidebar {
      width: 100%;
      height: auto;
      border-right: none;
      border-bottom: 1px solid var(--color-border);
      padding: 1rem;
    }

    .regions-list {
      display: none;
    }

    .explorer-main {
      padding: 1.5rem;
    }

    .provinces-grid {
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    }
  }
</style>
