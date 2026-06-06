<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  
  interface Province {
    id: string;
    name: string;
    code?: string;
    visited?: boolean;
    count?: number;
  }
  
  export let provinces: Province[] = [];
  export let selectedProvinceId: string | null = null;
  export let title = 'Provinces';
  
  let searchQuery = '';
  
  const dispatch = createEventDispatcher<{
    select: { id: string };
    filter: { query: string };
  }>();
  
  $: filteredProvinces = provinces.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.code && p.code.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  
  function handleSelect(id: string) {
    dispatch('select', { id });
  }
</script>

<div class="flex h-full flex-col glass-strong border-r-0 rounded-none">
  <div class="border-b border-white/5 p-5">
    <h2 class="text-lg font-bold tracking-tight text-gradient">{title}</h2>
    <div class="mt-3 relative">
      <svg class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
      </svg>
      <input 
        type="text" 
        bind:value={searchQuery}
        on:input={() => dispatch('filter', { query: searchQuery })}
        placeholder="Search provinces..."
        class="input-glass w-full pl-9"
      />
    </div>
  </div>
  
  <div class="flex-1 overflow-y-auto p-2 scrollbar-glass">
    <div class="space-y-0.5">
      {#each filteredProvinces as province (province.id)}
        <button
          class="group flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition-all duration-200 {selectedProvinceId === province.id ? 'bg-white/10 text-white ring-1 ring-white/20' : 'text-white/50 hover:bg-white/[0.04] hover:text-white/90'}"
          style={selectedProvinceId === province.id ? 'box-shadow: inset 0 1px 0 rgba(255,255,255,0.1);' : ''}
          on:click={() => handleSelect(province.id)}
        >
          <div class="flex items-center gap-3 min-w-0">
            <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold transition-colors {province.visited ? 'bg-indigo-500/15 text-indigo-300 ring-1 ring-indigo-500/20' : 'bg-white/5 text-white/30 ring-1 ring-white/10'}">
              {province.code || province.name.slice(0,2).toUpperCase()}
            </div>
            <span class="truncate text-sm font-medium">{province.name}</span>
          </div>
          
          <div class="flex shrink-0 items-center gap-2 ml-3">
            {#if province.count !== undefined}
              <span class="rounded-md bg-white/5 px-2 py-0.5 text-xs font-medium text-white/40 ring-1 ring-white/5 group-hover:text-white/60 transition-colors">
                {province.count}
              </span>
            {/if}
            {#if province.visited}
              <div class="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]"></div>
            {/if}
          </div>
        </button>
      {:else}
        <div class="py-8 text-center">
          <p class="text-sm text-white/30">No provinces found.</p>
        </div>
      {/each}
    </div>
  </div>
  
  <div class="border-t border-white/5 p-4">
    <div class="flex items-center justify-between text-xs text-white/40">
      <span>{filteredProvinces.length} provinces</span>
      <span>{provinces.filter(p => p.visited).length} visited</span>
    </div>
  </div>
</div>
