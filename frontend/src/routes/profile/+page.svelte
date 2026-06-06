<script lang="ts">
  export let data: {
    user?: {
      name?: string;
      email?: string;
      avatar?: string;
      tripCount?: number;
      countryCount?: number;
      distanceKm?: number;
      recentActivity?: Array<{ title: string; date: string; type: string }>;
      achievements?: Array<{ name: string; description: string; unlockedAt?: string }>;
    };
  } = {};
  
  $: user = data?.user ?? {};
</script>

<svelte:head>
  <title>Profile — TravelMap</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-b from-[#050505] to-[#171717] text-white/90">
  <div class="mx-auto max-w-5xl px-6 py-12">
    <!-- Profile Header -->
    <div class="glass-strong relative overflow-hidden p-8 md:p-12">
      <!-- Decorative orbs -->
      <div class="glow-orb -right-20 -top-20 h-64 w-64 bg-indigo-500/20"></div>
      <div class="glow-orb -bottom-20 -left-20 h-64 w-64 bg-purple-500/20"></div>
      
      <div class="relative flex flex-col items-center gap-6 md:flex-row md:items-start">
        <div class="relative shrink-0">
          <div class="h-24 w-24 rounded-full bg-gradient-to-br from-white/15 to-transparent p-[2px] ring-1 ring-white/20 backdrop-blur-xl">
            <div class="flex h-full w-full items-center justify-center rounded-full bg-[#0a0a0a] text-2xl font-bold text-white/80">
              {#if user.avatar}
                <img src={user.avatar} alt="" class="h-full w-full rounded-full object-cover" />
              {:else}
                {user.name?.[0] || user.email?.[0] || 'U'}
              {/if}
            </div>
          </div>
          <div class="absolute bottom-1 right-1 h-4 w-4 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.6)] ring-2 ring-[#0a0a0a]"></div>
        </div>
        
        <div class="flex-1 text-center md:text-left">
          <h1 class="text-3xl font-bold tracking-tight text-gradient">{user.name || 'Traveler'}</h1>
          <p class="mt-1 text-sm text-white/40">{user.email || 'explorer@travelmap.app'}</p>
          
          <div class="mt-6 flex flex-wrap justify-center gap-3 md:justify-start">
            <div class="badge-glass gap-2 px-4 py-1.5">
              <span class="text-white/50">Trips</span>
              <span class="font-semibold text-white">{user.tripCount ?? 0}</span>
            </div>
            <div class="badge-glass gap-2 px-4 py-1.5">
              <span class="text-white/50">Countries</span>
              <span class="font-semibold text-white">{user.countryCount ?? 0}</span>
            </div>
            <div class="badge-glass gap-2 px-4 py-1.5">
              <span class="text-white/50">Distance</span>
              <span class="font-semibold text-white">{user.distanceKm ?? 0} km</span>
            </div>
          </div>
        </div>
        
        <div class="flex shrink-0 gap-3">
          <button class="btn-glass">Edit Profile</button>
          <button class="btn-primary-glass">Settings</button>
        </div>
      </div>
    </div>

    <!-- Content Grid -->
    <div class="mt-8 grid gap-6 lg:grid-cols-3">
      <!-- Main Column -->
      <div class="glass lg:col-span-2 p-6">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold tracking-tight text-white/90">Recent Activity</h2>
          <button class="text-xs font-medium text-white/40 hover:text-white/80 transition-colors">View all</button>
        </div>
        <div class="mt-5 space-y-2">
          {#each user.recentActivity ?? [] as activity}
            <div class="flex items-center gap-4 rounded-xl border border-white/5 bg-white/[0.02] p-4 transition-all hover:border-white/10 hover:bg-white/[0.04]">
              <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/5 ring-1 ring-white/10">
                {#if activity.type === 'trip'}
                  <svg class="h-5 w-5 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/></svg>
                {:else}
                  <svg class="h-5 w-5 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                {/if}
              </div>
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-medium text-white/80">{activity.title}</p>
                <p class="text-xs text-white/30">{activity.date}</p>
              </div>
            </div>
          {:else}
            <div class="rounded-xl border border-white/5 bg-white/[0.02] p-8 text-center">
              <p class="text-sm text-white/30">No recent activity to show.</p>
            </div>
          {/each}
        </div>
      </div>
      
      <!-- Side Column -->
      <div class="glass p-6">
        <h2 class="text-lg font-semibold tracking-tight text-white/90">Achievements</h2>
        <div class="mt-5 space-y-4">
          {#each user.achievements ?? [] as achievement}
            <div class="flex items-start gap-3">
              <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-yellow-400/20 to-orange-400/20 text-sm ring-1 ring-white/10">🏆</div>
              <div class="min-w-0">
                <p class="text-sm font-medium text-white/80">{achievement.name}</p>
                <p class="text-xs leading-relaxed text-white/40">{achievement.description}</p>
                {#if achievement.unlockedAt}
                  <p class="mt-1 text-[10px] uppercase tracking-wider text-white/25">{achievement.unlockedAt}</p>
                {/if}
              </div>
            </div>
          {:else}
            <div class="py-4 text-center">
              <p class="text-sm text-white/30">Unlock achievements by exploring new places.</p>
            </div>
          {/each}
        </div>
      </div>
    </div>
  </div>
</div>
