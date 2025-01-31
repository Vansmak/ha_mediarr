// base-section.js
export class BaseSection {
  constructor(key, title) {
    this.key = key;
    this.title = title;
    this._lastBackgroundUpdate = 0;
  }

  generateTemplate() {
    return `
      <div class="section" data-section="${this.key}">
        <div class="section-header">
          <div class="section-header-content">
            <ha-icon class="section-toggle-icon" icon="mdi:chevron-down"></ha-icon>
            <div class="section-label">${this.title}</div>
          </div>
        </div>
        <div class="section-content">
          <div class="${this.key}-list"></div>
        </div>
      </div>
    `;
  }

  generateMediaItem(item, index, selectedType, selectedIndex) {
    return `
      <div class="media-item ${selectedType === this.key && index === selectedIndex ? 'selected' : ''}"
           data-type="${this.key}"
           data-index="${index}">
        <img src="${item.poster}" alt="${item.title}">
        <div class="media-item-title">${item.title}</div>
      </div>
    `;
  }

  updateInfo(cardInstance, item) {
    if (!item) return;

    // Update main content background
    cardInstance.background.style.backgroundImage = `url('${item.fanart || item.banner}')`;
    cardInstance.background.style.opacity = cardInstance.config.opacity || 0.7;

    // Update card background if enough time has passed
    const now = Date.now();
    if (now - this._lastBackgroundUpdate > 5000) { // Only update every 5 seconds max
      const bgImage = this.getRandomArtwork([item]);
      if (bgImage && cardInstance.cardBackground) {
        cardInstance.cardBackground.style.backgroundImage = `url('${bgImage}')`;
        this._lastBackgroundUpdate = now;
      }
    }

    cardInstance.info.innerHTML = `
      <div class="title">${item.title}${item.year ? ` (${item.year})` : ''}</div>
    `;
   }

  update(cardInstance, entity) {
    const items = entity.attributes.data || [];
    const listElement = cardInstance.querySelector(`.${this.key}-list`);
    if (!listElement) return;

    listElement.innerHTML = items.map((item, index) => 
      this.generateMediaItem(item, index, cardInstance.selectedType, cardInstance.selectedIndex)
    ).join('');

    this.addClickHandlers(cardInstance, listElement, items);
    
    // Update card background periodically with random artwork
    if (cardInstance.cardBackground && (!this._lastBackgroundUpdate || Date.now() - this._lastBackgroundUpdate > 30000)) {
      const bgImage = this.getRandomArtwork(items);
      if (bgImage) {
        cardInstance.cardBackground.style.backgroundImage = `url('${bgImage}')`;
        this._lastBackgroundUpdate = Date.now();
      }
    }
  }

  addClickHandlers(cardInstance, listElement, items) {
      listElement.querySelectorAll('.media-item').forEach(item => {
          item.onclick = () => {
              const index = parseInt(item.dataset.index);
              cardInstance.selectedType = this.key;
              cardInstance.selectedIndex = index;
              
              // Update both backgrounds on selection
              const selectedItem = items[index];
              const background = selectedItem.fanart || selectedItem.backdrop || selectedItem.banner;
              if (background) {
                  cardInstance.background.style.backgroundImage = `url('${background}')`;
                  cardInstance.cardBackground.style.backgroundImage = `url('${background}')`;
              }

              this.updateInfo(cardInstance, items[index]);

              cardInstance.querySelectorAll('.media-item').forEach(i => {
                  i.classList.toggle('selected', 
                      i.dataset.type === this.key && parseInt(i.dataset.index) === index);
              });
          };
      });
  }

  getRandomArtwork(items) {
    if (!items || items.length === 0) return null;
    
    // Filter items that have any kind of artwork
    const validItems = items.filter(item => item.fanart || item.backdrop || item.banner);
    if (validItems.length === 0) return null;
    
    // Get a random item from valid items
    const randomItem = validItems[Math.floor(Math.random() * validItems.length)];
    
    // Return the first available artwork type
    return randomItem.fanart || randomItem.backdrop || randomItem.banner;
  }

  getAllArtwork(items) {
    if (!items || items.length === 0) return [];
    
    return items.reduce((artworks, item) => {
      if (item.fanart) artworks.push(item.fanart);
      if (item.backdrop) artworks.push(item.backdrop);
      if (item.banner) artworks.push(item.banner);
      return artworks;
    }, []);
  }

  formatDate(dateString) {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      return date.toLocaleDateString();
    } catch {
      return '';
    }
  }
}