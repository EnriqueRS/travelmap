# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

### Fixed

- Profile statistics: `photosUploaded` now shows actual photo count from database instead of hardcoded 0
- Profile statistics: `tripsCompleted` now correctly counts only trips with status 'Completado' instead of all trips
- Photo horizontal scroll in "Add Location" modals now works properly on mobile devices (touch-action, visible scrollbar, scroll snap)
- Resolved nested scroll conflict between modal body (vertical) and photo scroller (horizontal) on touch devices
- Added mobile-responsive full-screen modal layout for add location on map page
- Prevented horizontal overflow leakage in modal body with overflow-x: hidden

### Added

- Profile statistics: Added `totalTrips` stat showing total number of trips with completed count as detail
- Added i18n translation keys for `profile.totalTrips` and `profile.tripsDetail` in both English and Spanish
