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
  this.querySelector('[data-skeleton]')?.remove();

  const list = this.querySelector('[data-embla-container]');
  if (!list) return;

  list.innerHTML = products
  .map((product, i) => this.buildSlide(product, i, products.length))
  .join('');

  this.querySelector('[data-carousel-wrapper]')?.removeAttribute('hidden');

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

  // Keyboard navigation
  viewport.addEventListener('keydown', (e) => {
    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        this.embla.scrollPrev();
        break;
      case 'ArrowRight':
        e.preventDefault();
        this.embla.scrollNext();
        break;
      case 'Home':
        e.preventDefault();
        this.embla.scrollTo(0);
        break;
      case 'End':
        e.preventDefault();
        this.embla.scrollTo(this.embla.scrollSnapList().length - 1);
        break;
    }
  });

  // Live region announcements
  this.embla.on('select', () => {
    const liveRegion = this.querySelector('[data-carousel-announcement]');
    if (!liveRegion) return;

    const index = this.embla.selectedScrollSnap() + 1;
    const total = this.embla.scrollSnapList().length;
    const template = this.dataset.announcementTemplate || 'Slide %{index} of %{total}';

    liveRegion.textContent = '';
    requestAnimationFrame(() => {
      liveRegion.textContent = template.replace('%{index}', index).replace('%{total}', total);
    });
  });
}

buildSlide(product, index, total) {
  return `
    <li
      class="pc-slide min-w-0 shrink-0"
      role="listitem"
      aria-roledescription="slide"
      aria-label="${product.title}, slide ${index + 1} of ${total}"
    >
      <a class="block text-inherit no-underline rounded-[var(--media-radius,0.4rem)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgb(var(--color-foreground))]"
        href="/products/${product.handle}">
        <div class="mb-3 aspect-square overflow-hidden rounded-[var(--media-radius,0.4rem)] bg-[rgba(var(--color-foreground),0.04)]">
          ${
            product.featuredImage
              ? `<img src="${product.featuredImage.url}" alt="${product.featuredImage.altText || product.title}" class="h-full w-full object-cover" loading="lazy">`
              : ''
          }
        </div>
        <p class="text-2xl font-bold">${product.title}</p>
          ${
          this.settings.showPrice
            ? `<p class="text-xl font-medium">
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