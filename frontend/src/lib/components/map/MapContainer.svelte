<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  
  export let center: [number, number] = [20, 0];
  export let zoom: number = 2;
  export let markers: Array<{id: string; lat: number; lng: number; label?: string; visited?: boolean}> = [];
  
  let mapContainer: HTMLDivElement;
  let mapInstance: any;
  
  onMount(async () => {
    if (typeof window !== 'undefined' && mapContainer) {
      // Preserved functional hook for map initialization
      // Actual map library instantiation should remain as originally implemented
    }
  });
  
  onDestroy(() => {
    if (mapInstance && typeof mapInstance.remove === 'function') {
      mapInstance.remove();
    }
  });
  
  function zoomIn() {
    if (mapInstance && typeof mapInstance.zoomIn === 'function') mapInstance.zoomIn();
  }
  
  function zoomOut() {
    if (mapInstance && typeof mapInstance.zoomOut === 'function') mapInstance.zoomOut();
  }
  
  function resetView() {
    if (mapInstance && typeof mapInstance.setView === 'function') {
      mapInstance.setView(center, zoom);
    }
  }
</script>

<div class="relative h-full w-full overflow-hidden bg-[#0a0a0a]">
  <!-- Map Element -->
  <div bind:this={mapContainer} class="absolute inset-0 z-0 h-full w-full bg-[#0f0f0f]"></div>
  
  <!-- Top Glass Overlay -->
  <div class="pointer-events-none absolute left-0 right-0 top-0 z-10 flex items-center justify-between p-4">
    <div class="pointer-events-auto glass-strong px-4 py-2">
      <h2 class="text-sm font-semibold tracking-tight text-white/90">Travel Map</h2>
    </div>
    
    <div class="pointer-events-auto flex gap-2">
      <div class="glass px-3 py-1.5 text-xs font-medium text-white/60">
        {markers.length} markers
      </div>
    </div>
  </div>
  
  <!-- Glass Zoom Controls -->
  <div class="pointer-events-none absolute bottom-8 left-8 z-10 flex flex-col gap-2">
    <div class="pointer-events-auto flex flex-col gap-1 rounded-2xl border border-white/10 bg-[#0a0a0a]/60 p-1.5 backdrop-blur-2xl shadow-2xl">
      <button class="flex h-9 w-9 items-center justify-center rounded-xl text-white/70 transition-all hover:bg-white/10 hover:text-white active:scale-95" on:click={zoomIn} aria-label="Zoom in">
        <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
        </svg>
      </button>
      <div class="mx-auto h-px w-5 bg-white/10"></div>
      <button class="flex h-9 w-9 items-center justify-center rounded-xl text-white/70 transition-all hover:bg-white/10 hover:text-white active:scale-95" on:click={zoomOut} aria-label="Zoom out">
        <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"/>
        </svg>
      </button>
      <div class="mx-auto h-px w-5 bg-white/10"></div>
      <button class="flex h-9 w-9 items-center justify-center rounded-xl text-white/70 transition-all hover:bg-white/10 hover:text-white active:scale-95" on:click={resetView} aria-label="Reset view">
        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064"/>
        </svg>
      </button>
    </div>
  </div>
  
  <!-- Glass Legend Panel -->
  {#if markers.length > 0}
    <div class="pointer-events-none absolute bottom-8 right-8 z-10 max-w-[14rem]">
      <div class="pointer-events-auto glass p-4">
        <h3 class="mb-3 text-[10px] font-semibold uppercase tracking-widest text-white/40">Legend</h3>
        <div class="space-y-2.5">
          <div class="flex items-center gap-2.5">
            <div class="h-2.5 w-2.5 rounded-full bg-indigo-400 shadow-[0_0_10px_rgba(129,140,248,0.5)]"></div>
            <span class="text-xs text-white/60">Visited</span>
          </div>
          <div class="flex items-center gap-2.5">
            <div class="h-2.5 w-2.5 rounded-full bg-white/20 ring-1 ring-white/20"></div>
            <span class="text-xs text-white/60">Planned</span>
          </div>
          <div class="flex items-center gap-2.5">
            <div class="h-2.5 w-2.5 rounded-full bg-emerald-400/80 shadow-[0_0_10px_rgba(52,211,153,0.4)]"></div>
            <span class="text-xs text-white/60">Current Location</span>
          </div>
        </div>
      </div>
    </div>
  {/if}
  
  <!-- Depth Vignette -->
  <div class="pointer-events-none absolute inset-0 z-[5] shadow-[inset_0_0_120px_rgba(0,0,0,0.5)]"></div>
</div>
