# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

### Added

- Multi-select photos with Shift+click (range select) and Ctrl/Cmd+click (toggle individual)
- Auto-enter selection mode when Shift/Ctrl clicking thumbnails
- Batch operations toolbar: Show on Map, Hide from Map, Hide from Gallery, Show in Gallery, Delete
- Select All / Deselect All buttons in selection mode
- Selection count indicator showing number of selected photos
- Mobile-optimized batch operations bar with compact icon buttons
- Keyboard shortcut hint displayed when in selection mode with no photos selected
- i18n translations for all new batch operation strings (English and Spanish)

### Improved

- Country multi-select dropdown now auto-focuses the search filter input when opened, allowing immediate typing

### Fixed

- Photo horizontal scroll in "Add Location" modals now works properly on mobile devices (touch-action, visible scrollbar, scroll snap)
- Resolved nested scroll conflict between modal body (vertical) and photo scroller (horizontal) on touch devices
- Added mobile-responsive full-screen modal layout for add location on map page
- Prevented horizontal overflow leakage in modal body with overflow-x: hidden
