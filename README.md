# james-charle-tech-test

## Overview

This branch adds a new **Product Carousel** section to the Shopify theme. Products are fetched client-side from the [mock.shop](https://mock.shop) GraphQL API and rendered into an accessible, configurable carousel using the Embla Carousel library.

---

## Changes

### New files

- **[assets/product-carousel.js](assets/product-carousel.js)**
  A custom element (`<product-carousel>`) that handles the full carousel lifecycle:
  - Fetches up to 20 products from the mock.shop GraphQL API on mount
  - Renders product cards (image, title, optional price) into an Embla-powered carousel
  - Supports prev/next arrow buttons with disabled-state management
  - Keyboard navigation: `ArrowLeft`, `ArrowRight`, `Home`, `End`
  - Live region announcements for screen readers ("Slide X of Y")
  - Respects `prefers-reduced-motion` — autoplay is disabled when the user has motion sensitivity enabled
  - Cleans up the Embla instance on disconnect

- **[assets/icon-chev-left.svg](assets/icon-chev-left.svg)** / **[assets/icon-chev-right.svg](assets/icon-chev-right.svg)**
  SVG chevron icons used for the carousel's prev/next navigation buttons.

- **[sections/product-carousel.liquid](sections/product-carousel.liquid)**
  The Shopify section file that renders the `<product-carousel>` custom element. Includes:
  - Optional heading (with configurable semantic level: h1/h2/h3) and subheading
  - Loading spinner shown while products are being fetched
  - A hidden ARIA live region for carousel slide announcements
  - Inline SVG icons passed to the JS via `data-` attributes
  - Responsive column layout driven by CSS custom properties
  - Full schema with settings for heading, layout, carousel behaviour, colour scheme, and spacing

### Modified files

- **[layout/theme.liquid](layout/theme.liquid)**
  Added the Tailwind CSS v4 Play CDN script for utility-class styling.

- **[locales/en.default.json](locales/en.default.json)**
  Added `sections.product_carousel` translation keys: `loading` and `viewport_label`.

- **[locales/en.default.schema.json](locales/en.default.schema.json)**
  Added full schema translation strings for all product carousel section settings (labels, headers, info text).

- **[templates/index.json](templates/index.json)**
  Replaced the default `featured-collection` section on the homepage with the new `product-carousel` section.

---

## Customiser settings

| Setting | Default | Description |
|---|---|---|
| Heading | "Product Carousel" | Section heading text |
| Heading size | h2 | Semantic heading level (h1 / h2 / h3) |
| Subheading | "Explore our latest collection" | Optional subheading below the heading |
| Show price | true | Show or hide product prices |
| Columns (desktop) | 4 | Number of visible slides on desktop (2–6) |
| Columns (tablet) | 3 | Number of visible slides on tablet (1–3) |
| Show navigation arrows | true | Show prev/next buttons |
| Loop carousel | true | Loop back to the start/end |
| Auto-advance slides | false | Autoplay (pauses on hover/focus; disabled for reduced-motion users) |
| Colour scheme | scheme-1 | Theme colour scheme |
| Top / bottom padding | 10 | Section spacing |

---

## Accessibility

- The carousel viewport has `aria-roledescription="carousel"` and an `aria-label` matching the section heading
- Each slide has `aria-roledescription="slide"` and `aria-label="Product X of Y"`
- Navigation buttons have descriptive `aria-label` and `aria-controls` attributes
- Arrow buttons are disabled (with `disabled:opacity-30`) when scrolling is not possible
- Full keyboard support via the focused viewport element
- Live region announces the current slide position to screen readers on change
- Autoplay is suppressed for users with `prefers-reduced-motion: reduce`
