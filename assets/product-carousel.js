class ProductCarousel extends HTMLElement {
  connectedCallback() {
    this.embla = null;
    this.fetchProducts();
  }

  disconnectedCallback() {
    this.embla?.destroy();
    this.embla = null;
  }

  get settings() {
    return {
      showPrice:  this.dataset.showPrice  !== 'false',
      showArrows: this.dataset.showArrows !== 'false',
      loop:       this.dataset.loop       !== 'false',
      autoplay:   this.dataset.autoplay   === 'true',
      moneyFormat: this.dataset.moneyFormat || '${{amount}}',
    };
  }

  formatMoney(amount) {
  const value = Number(amount);

  if (Number.isNaN(value)) return '';

  return this.settings.moneyFormat.replace('{{amount}}', value.toFixed(2));
}

  async fetchProducts() {
  try {
    const res = await fetch('https://mock.shop/api', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `
          {
            products(first: 20) {
              edges {
                node {
                  id
                  handle
                  title
                  featuredImage {
                    url
                    altText
                  }
                  priceRange {
                    minVariantPrice {
                      amount
                      currencyCode
                    }
                  }
                  compareAtPriceRange {
                    minVariantPrice {
                      amount
                      currencyCode
                    }
                  }
                }
              }
            }
          }
        `,
      }),
    });

    const { data } = await res.json();
    const products = data.products.edges.map(({ node }) => node);

    if (!products.length) {
    this.querySelector('[data-loading]')?.remove();
    return;
    }

    this.querySelector('[data-loading]')?.remove();
    this.renderCarousel(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    this.querySelector('[data-loading]')?.remove();
  }
}

renderCarousel(products) {
  const liveRegion = this.querySelector('[data-carousel-announcement]');

  const wrapper = document.createElement('div');
 wrapper.innerHTML = `
  <div class="relative">
    <div class="overflow-hidden" data-embla-viewport>
       <ul
        class="flex m-0 p-0 list-none"
        style="gap: var(--slide-gap, 1.6rem);"
        role="list"
      >
        ${products.map((product, i) => this.buildSlide(product, i, products.length)).join('')}
      </ul>
    </div>

    ${this.settings.showArrows ? `
      <div class="flex justify-end gap-2 mt-4">
        <button
          type="button"
          class="flex items-center justify-center w-10 h-10 rounded-full border border-[rgba(var(--color-foreground),0.2)] bg-[rgb(var(--color-background))] text-[rgb(var(--color-foreground))] disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="Previous slide"
          aria-controls="product-carousel-${this.dataset.sectionId}"
          data-prev
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <button
          type="button"
          class="flex items-center justify-center w-10 h-10 rounded-full border border-[rgba(var(--color-foreground),0.2)] bg-[rgb(var(--color-background))] text-[rgb(var(--color-foreground))] disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="Next slide"
          aria-controls="product-carousel-${this.dataset.sectionId}"
          data-next
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </button>
      </div>
    ` : ''}
  </div>
`;

  this.appendChild(wrapper);
  if (liveRegion) this.appendChild(liveRegion);

  this.initEmbla();
}

initEmbla() {
  const viewport = this.querySelector('[data-embla-viewport]');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const plugins = [];

  if (this.settings.autoplay && !reducedMotion) {
    plugins.push(EmblaCarouselAutoplay({
      delay: 3000,
      stopOnMouseEnter: true,
      stopOnFocusIn: true,
      stopOnInteraction: false,
    }));
  }

  this.embla = EmblaCarousel(viewport, {
    loop: this.settings.loop,
    align: 'start',
  }, plugins);

  if (this.settings.showArrows) {
    const prev = this.querySelector('[data-prev]');
    const next = this.querySelector('[data-next]');

    prev?.addEventListener('click', () => this.embla.scrollPrev());
    next?.addEventListener('click', () => this.embla.scrollNext());

    const updateArrows = () => {
      if (prev) prev.disabled = !this.embla.canScrollPrev();
      if (next) next.disabled = !this.embla.canScrollNext();
    };

    this.embla.on('select', updateArrows);
    this.embla.on('init', updateArrows);
  }
}
buildSlide(product, index, total) {
  return `
    <li
      class="pc-slide min-w-0 shrink-0"
      role="group"
      aria-roledescription="slide"
      aria-label="Product ${index + 1} of ${total}"
    >
      <a href="/products/${product.handle}" class="block text-inherit no-underline">
        <div class="mb-3 aspect-square overflow-hidden rounded-[var(--media-radius,0.4rem)] bg-[rgba(var(--color-foreground),0.04)]">
          ${
            product.featuredImage
              ? `<img src="${product.featuredImage.url}" alt="${product.featuredImage.altText || product.title}" class="h-full w-full object-cover" loading="lazy">`
              : ''
          }
        </div>
        <p class="text-sm font-medium">${product.title}</p>
          ${
          this.settings.showPrice
            ? `<p class="text-sm font-medium">
                ${this.formatMoney(product.priceRange.minVariantPrice.amount)}
               </p>`
            : ''
        }
      </a>
    </li>
  `;
}
}

customElements.define('product-carousel', ProductCarousel);