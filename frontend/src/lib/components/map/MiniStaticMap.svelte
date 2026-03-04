<script lang="ts">
  import { onMount } from "svelte"
  import { browser } from "$app/environment"
  import "leaflet/dist/leaflet.css"
  import markerIconUrl from "leaflet/dist/images/marker-icon.png"
  import markerShadowUrl from "leaflet/dist/images/marker-shadow.png"

  export let lat: number
  export let lng: number
  export let height = "200px"

  let mapContainer: HTMLDivElement
  let map: any
  let marker: any
  let L: any

  $: if (map && L && lat && lng) {
    map.setView([lat, lng], 13)
    if (marker) {
      marker.setLatLng([lat, lng])
    } else {
      const customIcon = L.icon({
        iconUrl: markerIconUrl,
        shadowUrl: markerShadowUrl,
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      })
      marker = L.marker([lat, lng], { icon: customIcon }).addTo(map)
    }
  }

  onMount(async () => {
    if (browser) {
      L = (await import("leaflet")).default

      map = L.map(mapContainer, {
        center: [lat || 0, lng || 0],
        zoom: 13,
        zoomControl: false,
        dragging: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        boxZoom: false,
        keyboard: false,
        touchZoom: false,
      })

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map)

      if (lat && lng) {
        const customIcon = L.icon({
          iconUrl: markerIconUrl,
          shadowUrl: markerShadowUrl,
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41],
        })
        marker = L.marker([lat, lng], { icon: customIcon }).addTo(map)
      }
    }
  })
</script>

<div
  bind:this={mapContainer}
  class="static-map-container"
  style="height: {height}; width: 100%; border-radius: 0.5rem; overflow: hidden; z-index: 1;"
/>

<style>
  .static-map-container {
    box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.2);
  }
</style>
