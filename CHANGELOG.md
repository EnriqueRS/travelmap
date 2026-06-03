# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

### Improved

- Country multi-select dropdown now auto-focuses the search filter input when opened, allowing immediate typing

### Fixed

- Photo horizontal scroll in "Add Location" modals now works properly on mobile devices (touch-action, visible scrollbar, scroll snap)
- Resolved nested scroll conflict between modal body (vertical) and photo scroller (horizontal) on touch devices
- Added mobile-responsive full-screen modal layout for add location on map page
- Prevented horizontal overflow leakage in modal body with overflow-x: hidden
