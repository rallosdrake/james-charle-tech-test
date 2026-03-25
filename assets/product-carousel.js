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

    this.renderCarousel(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    this.querySelector('[data-loading]')?.remove();
  }
}

renderCarousel(products) {
  this.querySelector('[data-loading]')?.remove();

  const liveRegion = this.querySelector('[data-carousel-announcement]');
  if (liveRegion) {
  liveRegion.textContent = `${products.length} products loaded`;
}

  const wrapper = document.createElement('div');
  //!grid is used to overwrite base.css grid adding flex, 
  // this would be removed in a real scenario as tailwind would be setup correctly
  wrapper.innerHTML = `
    <ul class="pc-grid !grid m-0 list-none p-0 gap-8" role="list">
      ${products.map((product, i) => this.buildSlide(product, i, products.length)).join('')}
    </ul>
  `;

  this.appendChild(wrapper);
  if (liveRegion) this.appendChild(liveRegion);
}

buildSlide(product, index, total) {
  return `
    <li
      class="min-w-0"
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