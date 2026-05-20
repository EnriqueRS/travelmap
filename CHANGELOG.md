# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

### Fixed
- Location photos not displaying in "Lugares Visitados" section on trip detail page (/trips/<id>) until a full page reload (2026-05-20)

### Added
- Enhanced location marker popups on the map to prominently display images when clicking on locations that have photos (2026-05-20)
- Location popups now show category badge, trip link, and larger image preview (max 150px height)
- Clicking trip name in location popup navigates to the trip detail page
- Applied dark-popup styling to location marker popups for visual consistency with photo markers
