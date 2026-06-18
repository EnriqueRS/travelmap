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

  $: filteredProvinces = provinces
    .filter((p) => {
      const matchesSearch =
        !searchQuery ||
        normalizeString(p.name).includes(normalizeString(searchQuery))
      const matchesRegion =
        selectedRegion === "Todos" || p.region === selectedRegion
      return matchesSearch && matchesRegion
    })
    .sort((a, b) => {
      const aVisited = visitedProvinces.has(a.name)
      const bVisited = visitedProvinces.has(b.name)
      const aPlanned = plannedProvinces.has(a.name) && !aVisited
      const bPlanned = plannedProvinces.has(b.name) && !bVisited
      if (aVisited && !bVisited) return -1
      if (!aVisited && bVisited) return 1
      if (aPlanned && !bPlanned) return -1
      if (!aPlanned && bPlanned) return 1
      return 0
    })

  $: totalProvinces = provinces.length
  $: visitedCount = provinces.filter((p) => visitedProvinces.has(p.name)).length
  $: plannedCount = provinces.filter(
    (p) => plannedProvinces.has(p.name) && !visitedProvinces.has(p.name),
  ).length

  $: visitedProgress =
    totalProvinces > 0 ? (visitedCount / totalProvinces) * 100 : 0
  $: plannedProgress =
    totalProvinces > 0 ? (plannedCount / totalProvinces) * 100 : 0
  $: globalProgress = Math.round(visitedProgress)

  $: regionStats = regions.map((r) => {
    const regionalProvinces = provinces.filter((p) => p.region === r.id)
    const visitedInRegion = regionalProvinces.filter((p) =>
      visitedProvinces.has(p.name),
    ).length
    const plannedInRegion = regionalProvinces.filter(
      (p) => plannedProvinces.has(p.name) && !visitedProvinces.has(p.name),
    ).length
    const totalInRegion = regionalProvinces.length

    return {
      ...r,
      visited: visitedInRegion,
      planned: plannedInRegion,
      total: totalInRegion,
      visitedProgress:
        totalInRegion > 0 ? (visitedInRegion / totalInRegion) * 100 : 0,
      plannedProgress:
        totalInRegion > 0 ? (plannedInRegion / totalInRegion) * 100 : 0,
      totalProgress:
        totalInRegion > 0
          ? Math.round((visitedInRegion / totalInRegion) * 100)
          : 0,
    }
  })

  function getRegionForProvince(
    province: ProvinceInfo,
  ): RegionInfo | undefined {
    return regions.find((r) => r.id === province.region)
  }

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
          <div
            class="progress-bar-fill visited"
            style="width: {visitedProgress}%"
          />
          <div
            class="progress-bar-fill planned"
            style="width: {plannedProgress}%; left: {visitedProgress}%"
          />
        </div>
        <div class="progress-legend">
          <p class="progress-detail">
            <span class="dot visited" />
            {visitedCount} / {totalProvinces}
            {$t("map.visited")}
          </p>
          {#if plannedCount > 0}
            <p class="progress-detail">
              <span class="dot planned" />
              {plannedCount}
              {$t("map.planned")}
            </p>
          {/if}
        </div>
      </div>

      <div class="regions-list custom-scrollbar">
        <button
          class="region-card"
          class:active={selectedRegion === "Todos"}
          on:click={() => (selectedRegion = "Todos")}
        >
          <div
            class="region-card-bg"
            style="background: linear-gradient(135deg, rgba(99,102,241,0.15), rgba(168,85,247,0.1));"
          />
          <div class="region-card-content">
            <div class="region-info">
              <span class="region-flag-emoji">🌍</span>
              <span class="region-name">{$t("map.all")}</span>
            </div>
          </div>
        </button>

        {#each regionStats as region}
          <button
            class="region-card"
            class:active={selectedRegion === region.id}
            on:click={() => (selectedRegion = region.id)}
          >
            <div
              class="region-card-bg"
              style="background: linear-gradient(135deg, {region.colors?.[0] ||
                '#6366f1'}30, {region.colors?.[1] || '#a855f7'}20);"
            />
            <div class="region-card-content">
              <div class="region-info">
                <div
                  class="region-color-dot"
                  style="background: linear-gradient(135deg, {region
                    .colors?.[0] || '#6366f1'}, {region.colors?.[1] ||
                    '#a855f7'});"
                />
                <span class="region-name">{region.name}</span>
              </div>
              <div class="region-meta">
                <span class="region-count">
                  {region.visited}{#if region.planned > 0}<span
                      class="planned-plus">+{region.planned}</span
                    >{/if} / {region.total}
                </span>
                <div class="mini-progress">
                  <div
                    class="fill visited"
                    style="width: {region.visitedProgress}%"
                  />
                  <div
                    class="fill planned"
                    style="width: {region.plannedProgress}%"
                  />
                </div>
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
          {@const region = getRegionForProvince(province)}
          {@const color1 = region?.colors?.[0] || "#6366f1"}
          {@const color2 = region?.colors?.[1] || "#a855f7"}
          <div
            class="province-card"
            class:visited={isVisited}
            class:planned={isPlanned}
          >
            <!-- Region color accent band -->
            <div
              class="province-color-band"
              style="background: linear-gradient(180deg, {color1}, {color2});"
            />
            <!-- Card content -->
            <div class="province-card-body">
              {#if isVisited}
                <div class="status-badge visited-badge">
                  <CheckCircle2 size={11} />
                </div>
              {:else if isPlanned}
                <div class="status-badge planned-badge">
                  <MapPin size={11} />
                </div>
              {/if}
              <div class="province-top">
                <span
                  class="province-name"
                  class:muted={!isVisited && !isPlanned}>{province.name}</span
                >
              </div>
              <div class="province-bottom">
                <span class="province-region-label">{region?.name || ""}</span>
                {#if isPlanned}
                  <span class="province-status-tag planned"
                    >{$t("map.planned")}</span
                  >
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
    background: linear-gradient(
      90deg,
      var(--color-success),
      var(--color-success-text)
    );
    z-index: 2;
  }

  .progress-bar-fill.planned {
    background: linear-gradient(
      90deg,
      var(--color-accent-primary),
      var(--color-accent-text)
    );
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

  .dot.visited {
    background: var(--color-success);
  }
  .dot.planned {
    background: var(--color-accent-primary);
  }

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

  .regions-list::-webkit-scrollbar {
    width: 6px;
  }
  .regions-list::-webkit-scrollbar-track {
    background: transparent;
  }
  .regions-list::-webkit-scrollbar-thumb {
    background: var(--color-border-light);
    border-radius: var(--radius-full);
  }

  /* Region Card - with flag background */
  .region-card {
    position: relative;
    display: flex;
    flex-direction: column;
    padding: 0;
    background: var(--color-bg-main);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    cursor: pointer;
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    text-align: left;
    width: 100%;
    overflow: hidden;
    min-height: 64px;
  }

  .region-card:hover {
    border-color: var(--color-border-light);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  .region-card.active {
    border-color: var(--color-accent-primary);
    box-shadow: 0 0 0 2px var(--color-accent-muted),
      0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .region-card-flag-bg {
    position: absolute;
    inset: 0;
    overflow: hidden;
    z-index: 0;
  }

  .region-card-bg {
    position: absolute;
    inset: 0;
    z-index: 0;
  }

  .region-color-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    flex-shrink: 0;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  }

  .region-card-content {
    position: relative;
    z-index: 1;
    padding: 0.75rem 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .region-info {
    display: flex;
    align-items: center;
    gap: 0.6rem;
  }

  .region-flag-emoji {
    font-size: 1.1rem;
  }

  .region-name {
    font-size: 0.82rem;
    font-weight: 700;
    color: var(--color-text-primary);
    letter-spacing: -0.01em;
  }

  .region-meta {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .region-count {
    font-size: 0.68rem;
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
    height: 3px;
    background: rgba(255, 255, 255, 0.1);
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

  /* Province Cards Grid */
  .provinces-grid {
    flex: 1;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    align-content: start;
    gap: 0.85rem;
    overflow-y: auto;
    padding-bottom: 2rem;
    scrollbar-width: thin;
    scrollbar-color: var(--color-border-light) transparent;
  }

  .provinces-grid::-webkit-scrollbar {
    width: 6px;
  }
  .provinces-grid::-webkit-scrollbar-track {
    background: transparent;
  }
  .provinces-grid::-webkit-scrollbar-thumb {
    background: var(--color-border-light);
    border-radius: var(--radius-full);
  }

  /* Province Card - Modern with color band */
  .province-card {
    position: relative;
    display: flex;
    align-items: stretch;
    background: var(--color-bg-secondary);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    overflow: hidden;
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    cursor: default;
    min-height: 72px;
  }

  .province-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
    border-color: var(--color-border-light);
  }

  .province-card.visited {
    border-color: rgba(16, 185, 129, 0.4);
  }

  .province-card.visited:hover {
    box-shadow: 0 8px 24px rgba(16, 185, 129, 0.15);
  }

  .province-card.planned {
    border-color: rgba(59, 130, 246, 0.4);
  }

  .province-card.planned:hover {
    box-shadow: 0 8px 24px rgba(59, 130, 246, 0.15);
  }

  .province-color-band {
    width: 5px;
    flex-shrink: 0;
    opacity: 0.8;
    transition: opacity 0.2s;
  }

  .province-card:hover .province-color-band {
    opacity: 1;
  }

  .province-card.visited .province-color-band {
    opacity: 1;
  }

  .province-card-body {
    flex: 1;
    padding: 0.85rem 1rem;
    display: flex;
    flex-direction: column;
    justify-content: center;
    position: relative;
    gap: 0.3rem;
  }

  .status-badge {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  }

  .visited-badge {
    background: var(--color-success);
  }
  .planned-badge {
    background: var(--color-accent-primary);
  }

  .province-top {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .province-name {
    font-size: 0.88rem;
    font-weight: 700;
    color: var(--color-text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    letter-spacing: -0.01em;
  }

  .province-name.muted {
    color: var(--color-text-muted);
    font-weight: 600;
  }

  .province-bottom {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .province-region-label {
    font-size: 0.65rem;
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    font-weight: 600;
  }

  .province-status-tag {
    font-size: 0.55rem;
    padding: 1px 5px;
    border-radius: var(--radius-sm);
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.02em;
  }

  .province-status-tag.planned {
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
      height: 100dvh;
      border-radius: 0;
      max-width: 100%;
    }

    .explorer-sidebar {
      width: 100%;
      height: auto;
      max-height: 180px;
      border-right: none;
      border-bottom: 1px solid var(--color-border);
      padding: 1rem;
      flex-shrink: 0;
    }

    .sidebar-header {
      margin-bottom: 1rem;
    }

    .progress-section {
      margin-bottom: 0;
      padding: 0.85rem;
    }

    .regions-list {
      display: none;
    }

    .explorer-main {
      padding: 1rem;
      flex: 1;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .main-header h2 {
      font-size: 1.25rem;
    }

    .main-header p {
      font-size: 0.8rem;
    }

    .controls {
      margin: 1rem 0;
    }

    .search-box {
      max-width: 100%;
      height: 42px;
    }

    .close-btn {
      top: 0.75rem;
      right: 0.75rem;
      width: 34px;
      height: 34px;
    }

    .provinces-grid {
      grid-template-columns: 1fr;
      gap: 0.6rem;
      flex: 1;
      overflow-y: auto;
    }

    .province-card {
      min-height: 60px;
    }

    .province-card-body {
      padding: 0.7rem 0.85rem;
    }

    .province-name {
      font-size: 0.85rem;
    }

    .province-region-label {
      font-size: 0.6rem;
    }
  }
</style>
