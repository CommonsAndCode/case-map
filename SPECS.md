# Specifications

## Main use case

- A collection of case studies in the realm of digital municipality services
  - Short description on map & link
  - Longer explanation as article on website
    - WHY do we consider it a best/worst practice? WHY is it on the map?
- It has to be fun to explore and navigate
- It should encourage people to adopt the practice (or avoid it)

## Technical

- Static deployment (with calls to OSM-derived tiles only on opt-in)
- Data format is generated from Hugo-compatible Markdown frontmatter
  - JSON array of cases, each with 1–n locations
- Standalone repo
- AGPL license
- Build-time i18n: separate `de` and `en` static builds, no runtime
  language switching
- An entry has 1 to n locations mapped to it

## Privacy

- By default, no external network requests are made. A bundled
  low-resolution basemap renders the cases.
- External map tiles (VersaTiles, EU-hosted, non-tracking) load only on
  explicit user opt-in, or when an embedder passes `&tiles=on`.
- The case list view conveys all content without any external tile
  loading.

## Users' POVs

### Visitors

- They see a map with clickable markers indicating cases as the main way
  to explore the map
- They can zoom in and see more detailed pins (thecrag.com-style,
  zoom-dependent — Phase 2)
- If they want to, they can select one or more categories from a list of
  max. 10 predefined categories
- An accessible case list is provided as the primary path for
  screen-reader and keyboard users
- Visitors can propose new cases via a link, but handling submissions is
  out of scope for the tool itself (Phase 2)

### CoCo Editors

- Write a markdown article with metadata without worrying about how it'll
  appear on the map
- 1–3 members
