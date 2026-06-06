<script lang="ts">
  import { goto } from '$app/navigation';
  
  export let data: {
    trips?: Array<{
      id: string;
      name: string;
      description?: string;
      status?: string;
      startDate?: string;
      endDate?: string;
      provinceCount?: number;
      coverImage?: string;
    }>;
  } = { trips: [] };
  
  $: trips = data?.trips ?? [];
  
  function formatDate(date: string | undefined) {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
  
  function getStatusColor(status: string | undefined) {
    switch (status?.toLowerCase()) {
      case 'active':
      case 'ongoing':
        return 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/20';
      case 'completed':
        return 'bg-blue-500/15 text-blue-300 ring-blue-500/20';
      case 'cancelled':
        return 'bg-red-500/15 text-red-300 ring-red-500/20';
      default:
        return 'bg-white/5 text-white/60 ring-white/10';
    }
  }
</script>

<svelte:head>
  <title>Your Trips — TravelMap</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-b from-[#050505] to-[#171717] text-white/90">
  <!-- Header -->
  <header class="sticky top-0 z-30 border-b border-white/5 bg-[#050505]/60 backdrop-blur-2xl">
    <div class="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
      <div>
        <h1 class="text-2xl font-bold tracking-tight text-gradient">Your Trips</h1>
        <p class="mt-1 text-sm text-white/40">Explore and manage your journeys</p>
      </div>
      <button class="btn-primary-glass" on:click={() => goto('/trips/new')}>
        <span class="mr-2">+</span> New Trip
      </button>
    </div>
  </header>

  <main class="mx-auto max-w-7xl px-6 py-10">
    {#if trips.length === 0}
      <div class="glass-strong flex flex-col items-center justify-center py-24 text-center">
        <div class="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 ring-1 ring-white/10">
          <svg class="h-8 w-8 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/>
          </svg>
        </div>
        <h3 class="text-lg font-semibold text-white/90">No trips yet</h3>
        <p class="mt-2 max-w-sm text-sm text-white/40">Start your adventure by creating your first trip and track every province you visit.</p>
        <button class="btn-glass mt-6" on:click={() => goto('/trips/new')}>Create Trip</button>
      </div>
    {:else}
      <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {#each trips as trip (trip.id)}
          <button 
            class="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 text-left backdrop-blur-xl transition-all duration-500 hover:border-white/20 hover:bg-white/[0.06]"
            style="box-shadow: inset 0 1px 1px rgba(255,255,255,0.04), 0 8px 32px rgba(0,0,0,0.2);"
            on:click={() => goto(`/trips/${trip.id}`)}
          >
            <!-- Ambient hover glow -->
            <div class="absolute -inset-px rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100" style="background: radial-gradient(800px circle at 50% 0%, rgba(255,255,255,0.06), transparent 40%);"></div>
            
            <div class="relative">
              <div class="flex items-start justify-between">
                <span class="inline-flex rounded-lg px-2.5 py-1 text-xs font-medium ring-1 {getStatusColor(trip.status)}">
                  {trip.status || 'Planned'}
                </span>
                {#if trip.provinceCount}
                  <span class="text-xs text-white/30">{trip.provinceCount} provinces</span>
                {/if}
              </div>
              
              <h3 class="mt-4 text-lg font-semibold tracking-tight text-white transition-all duration-300 group-hover:text-gradient">{trip.name}</h3>
              
              {#if trip.description}
                <p class="mt-2 line-clamp-2 text-sm leading-relaxed text-white/40">{trip.description}</p>
              {/if}
              
              <div class="mt-6 flex items-center gap-4 text-xs text-white/30">
                {#if trip.startDate}
                  <span class="flex items-center gap-1.5">
                    <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                    </svg>
                    {formatDate(trip.startDate)}
                  </span>
                {/if}
                {#if trip.endDate}
                  <span class="flex items-center gap-1.5">
                    <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    {formatDate(trip.endDate)}
                  </span>
                {/if}
              </div>
            </div>
          </button>
        {/each}
      </div>
    {/if}
  </main>
</div>
