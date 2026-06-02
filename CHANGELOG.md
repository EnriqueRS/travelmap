# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

### Fixed

- Profile statistics: countries visited now counts from both `user_country_statuses` and trip countries arrays (was showing 0)
- Profile statistics: `photosUploaded` now shows actual photo count from database instead of hardcoded 0
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
