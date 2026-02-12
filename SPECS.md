# Specifications

## Main use case

- A collection of case studies in the realm of digital municipality services
  - Short description on map & link
  - Longer explanation as article on website
    - WHY do we consider it a best/worst practice? WHY is it on the map?
- It has to be fun to explore and navigate
- It should encourage people to adopt the practice (or avoid it)

## Technical

- Static deployment (with calls to OSM but nothing else) is possible
- Data format should be generatable from hugo-compatible Markdown files/frontmatter
  - e.g. JSON or sqlite
- Standalone repo
- AGPL license
- i18n support
- An entry should have 1 to n locations mapped to it
- An entry should be mappable to an area/region

## Users' POVs

### Visitors

- They should see a map with lots of clickable markers indicating cases as the main way to explore the map
- They should be able to zoom in and see more detailed pins (like thecrag.com map)
- If they want to, they should be able to select one or more categories from a list of max. 10 predefined categories
- Visitors should be able to propose new cases but handling this is out of scope for the tool itself

### CoCo Editors

- Should be able to write a markdown article with metadata without having to worry about how it'll appear on the map
- 1-3 members

### CoCo Members (?)
