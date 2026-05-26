# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

### Added

- Instagram OAuth2 integration for importing photos into trips
  - Backend: OAuth flow with short-lived to long-lived token exchange
  - Backend: Token refresh endpoint for maintaining access
  - Backend: Media fetching from Instagram Graph API
  - Backend: Disconnect endpoint to remove integration
  - Frontend: Instagram connect/disconnect UI in Profile page
  - Frontend: OAuth callback handling with URL parameter cleanup
  - Frontend: Integration status display with user ID
  - Database migration extending provider enums for Instagram support
  - New environment variables: `INSTAGRAM_CLIENT_ID`, `INSTAGRAM_CLIENT_SECRET`, `INSTAGRAM_REDIRECT_URI`
  - i18n translations for Instagram feature (English and Spanish)
  - Unit tests for Instagram integration service

### Fixed

- Photo horizontal scroll in "Add Location" modals now works properly on mobile devices (touch-action, visible scrollbar, scroll snap)
- Resolved nested scroll conflict between modal body (vertical) and photo scroller (horizontal) on touch devices
- Added mobile-responsive full-screen modal layout for add location on map page
- Prevented horizontal overflow leakage in modal body with overflow-x: hidden
