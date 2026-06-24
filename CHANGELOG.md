# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

### Added

- Landing page redesign with cinematic travel photo background (Unsplash) and dark overlay
- Hero section: full-viewport with "Registra cada paso de tu aventura" heading, subtitle, and two CTAs (Explorar Mapa / Mis Viajes)
- Features section: 3 feature cards (Mapa Interactivo, Galería de Fotos, Planificador de Viajes)
- Stats section: 3 counters (120k+ Travelers, 195 Countries, 4M+ Photos)
- CTA section with photo background matching hero style
- i18n keys for all new landing page sections (ES/EN)

### Changed

- Landing page hero now uses hardcoded white text with enhanced text-shadows for consistent contrast across all themes (Light, Deep Sea, Neon Obsidian)
- Landing page feature cards replaced old demo trips showcase with cleaner 3-card layout
- Removed unused BarChart3 icon import from landing page

- Multi-select photos with Shift+click (range select) and Ctrl/Cmd+click (toggle individual)
- Auto-enter selection mode when Shift/Ctrl clicking thumbnails
- Batch operations toolbar: Show on Map, Hide from Map, Hide from Gallery, Show in Gallery, Delete
- Select All / Deselect All buttons in selection mode
- Selection count indicator showing number of selected photos
- Mobile-optimized batch operations bar with compact icon buttons
- Keyboard shortcut hint displayed when in selection mode with no photos selected
- i18n translations for all new batch operation strings (English and Spanish)
- **14 realistic demo trips** covering 16 countries (ES, FR, IT, JP, US, AR, CL, TH, MX, TZ, KE, GR, HR, NP, GB, PT) with working photos from picsum.photos
- **45 demo locations** with real coordinates, categories, ratings, and Spain province tracking
- **29 demo photos** with EXIF metadata for map display — all using direct URLs (no backend needed)
- **Demo mode CRUD service** (`demo.ts`): create trips, locations, and upload photos locally via localStorage without authentication
- **Image URL utility** (`images.ts`): shared functions `getTripCoverUrl`, `getPhotoUrl`, `getLocationImageUrl` that handle both direct URLs (demo) and API-based URLs (authenticated)
- **Example trips showcase** on landing page — 3 demo trip cards visible to unauthenticated users
- **Demo photos auto-seeding** into localStorage on first load in demo mode
- MIME type validation for file uploads in demo mode (rejects non-image files)
- URL safety validation for external photo links in demo mode
- localStorage quota error handling for demo photo storage
- try/catch protection for JSON.parse in persistent stores (prevents crash on corrupted localStorage)

### Improved

- Country multi-select dropdown now auto-focuses the search input when opened, allowing immediate filtering without extra clicks
- **All demo trip/location data now uses ISO Alpha-2 country codes** (ES, FR, IT...) instead of full Spanish names — fixes map country highlighting
- **Trip coverImage stores direct URLs** for demo mode, with `coverImageUrl` fallback for seamless image display
- **All image URLs in pages and map** now use shared utility functions that detect whether the URL is direct or needs API construction
- **XSS protection**: user-supplied strings (trip names, location names) are HTML-escaped before rendering in Leaflet map popups
- Landing page: replaced all emoji icons with lucide-svelte icons for consistency

### Fixed

- Photo selection in multi-select mode now properly toggles individual photos while preserving other selections instead of replacing the entire selection
- Shift+click now adds the selected range to existing selections rather than replacing them; also falls back to `activeIndex` when no previous anchor exists
- Ctrl/Cmd+click outside selection mode now correctly toggles the clicked photo while keeping any existing selections
- Profile statistics: countries visited now counts from both `user_country_statuses` and trip countries arrays (was showing 0)
- Profile statistics: `photosUploaded` now shows actual photo count from database instead of hardcoded 0
- **Broken image URLs** throughout the app — all `${API_URL}/media/photos/{id}/image` references now check for direct URLs first via shared utility
- **Map country/province highlighting** — demo data now uses ISO Alpha-2 codes so `countriesInfo.toAlpha3()` works correctly for GeoJSON matching
- **Demo photos not showing** in gallery and map — now auto-seeded into localStorage on first demo-mode load
- Removed `console.log` leak of formatted trip data (security hardening)
- Profile statistics: `tripsCompleted` now correctly counts only trips with status 'Completado' instead of all trips
- Furthest place calculation: excludes locations with (0,0) coordinates
- Furthest place calculation: calculates country centroids from `geometry_json` when `centroid_lat` is null
- Photo horizontal scroll in "Add Location" modals now works properly on mobile devices (touch-action, visible scrollbar, scroll snap)
- Resolved nested scroll conflict between modal body (vertical) and photo scroller (horizontal) on touch devices
- Added mobile-responsive full-screen modal layout for add location on map page
- Prevented horizontal overflow leakage in modal body with overflow-x: hidden
- Province data persistence: resolved a critical bug where province selection in trips was not persisted to the backend
- I18n store restoration: fixed corruption in the internationalization store and completed missing translations
- Fixed map page "Unexpected token" syntax error that prevented compilation
- Eliminated duplicate translation keys and fixed property errors in the User Profile interface
- Improved map visual hierarchy: refined country background opacity (0.03) when zoomed in for high contrast provinces

### Added

- Profile page: "Paises visitados" stat is now clickable and opens a modal with the list of visited countries (flags + names)
- Profile page: "Viajes totales" stat is now clickable and navigates to `/trips`
- Profile page: "Lugar mas lejano" now considers locations, photos with EXIF GPS, and visited country centroids
- Profile page: photos as furthest place show reverse-geocoded city + country (e.g. "Las Vegas (United States)")
- Profile page: if a visited country centroid is the furthest point, it shows the country name
- Profile statistics: Added `totalTrips` stat showing total number of trips with completed count as detail
- Added i18n translation keys for `profile.totalTrips` and `profile.tripsDetail` in both English and Spanish
- Conditional Home Highlight: the home province highlight and home marker on the map can be toggled on/off via `showHome` setting
- Province-Level Tracking: auto-detects user's home country and province via GPS + reverse geocoding; visited provinces highlighted on map (Spain)
- Province Explorer & SVG Flags: official high-quality SVG flags for Spanish Autonomous Communities and provinces; premium Province Explorer modal
- Robust Province Auto-Detection: handles naming variations and administrative hierarchies from Nominatim for accurate province matching (Spain)
- Province selection in trips: granular itinerary tracking for Spanish provinces in trip creation/edit forms
- Zoom-Dependent Map Highlights: national-level highlights at Zoom < 6, province-level at Zoom >= 6 (Spain)
- Mobile Map Page Redesign: complete mobile-first redesign with inline stats panel, search bar, full-screen map, and bottom navigation bar
- Mobile Photo Gallery Redesign: premium interface with top toolbar, enhanced carousel with "Cover" and "Map" overlays, horizontal navigation strip
- Gallery Layout Optimization: double-layer view with blurred backgrounds and `object-contain` for full image visibility
- Map Add-Trip Button: floating "+" button on mobile map view for quick trip creation
- Redesigned Info Modal: photo metadata (EXIF) as mobile bottom sheet with camera details and integrated location map
- Full Internationalization (i18n): robust translation system supporting English and Spanish across all views and components
- Location Modal Redesigns: premium design for Add & Edit location modals with dynamic headers, grid layout, redesigned photo scroller
- UI Component Refactor: detected country badge integrated directly into `LocationPicker` component
- Casing Standardization: database uses `snake_case`, application code uses `camelCase`, with Objection.js `snakeCaseMappers` for automatic conversion
- Premium Trip Edit Modal: modern design with smooth transitions, Lucide icons, and refined grid layout
- Country Multi-selection UI: multi-select dropdown with flags, search, and province integration
- Grouped Province Detail View: provinces organized under countries in chip-based layout in trip detail header
- Map Sidebar Redesign: premium icon-driven layout with adventure statistics and visualization filters
- Add Location Modal Redesign: integrated search, map preview, and premium styling
- Country Explorer Redesign: modern dark theme with smooth animations and progress sidebar
- Toast notifications replacing native browser alerts on the map page
- Filter locations and photos on map by selecting individual trips from sidebar
- Carousel photos sorted: cover first, then map-visible, then rest; map indicator on thumbnails
- "My Trips" filter on map view for authenticated user's trips only
- Enhanced demo data for richer unlogged user experience
