// sections/tmdb-section.js
import { BaseSection } from './base-section.js';

export class TMDBSection extends BaseSection {
  constructor() {
    super('tmdb', 'TMDB Content');
    this.sections = [
      { key: 'tmdb', title: 'Trending on TMDB', entityKey: 'tmdb_entity', listClass: 'tmdb-list' },
      { key: 'tmdb_airing_today', title: 'TMDB Today', entityKey: 'tmdb_airing_today_entity', listClass: 'tmdb-airing-today-list' },
      { key: 'tmdb_now_playing', title: 'TMDB Playing', entityKey: 'tmdb_now_playing_entity', listClass: 'tmdb-now-playing-list' },
      { key: 'tmdb_on_air', title: 'TMDB On Air', entityKey: 'tmdb_on_air_entity', listClass: 'tmdb-on-air-list' },
      { key: 'tmdb_upcoming', title: 'TMDB Upcoming', entityKey: 'tmdb_upcoming_entity', listClass: 'tmdb-upcoming-list' }
    ];
  }

  generateTemplate(config) {
    return this.sections
      .filter(section => config[section.entityKey])
      .map(section => `
        <div class="section" data-section="${section.key}">
          <div class="section-header">
            <div class="section-header-content">
              <ha-icon class="section-toggle-icon" icon="mdi:chevron-down"></ha-icon>
              <div class="section-label">${section.title}</div>
            </div>
          </div>
          <div class="section-content">
            <div class="${section.listClass}" data-list="${section.key}"></div>
          </div>
        </div>
      `).join('');
  }

  update(cardInstance, entity) {
    const entityId = entity.entity_id;
    // Find the section that matches this entity
    const sectionConfig = this.sections.find(section => 
      cardInstance.config[section.entityKey] === entityId
    );
    
    if (!sectionConfig) {
      console.error(`Could not find section config for entity ${entityId}`);
      return;
    }

    const items = entity.attributes.data || [];
    const listElement = cardInstance.querySelector(`[data-list="${sectionConfig.key}"]`);
    
    if (!listElement) {
      console.error(`Could not find list element for ${sectionConfig.key}`);
      return;
    }

    listElement.innerHTML = items.map((item, index) => 
      this.generateMediaItem(item, index, cardInstance.selectedType, cardInstance.selectedIndex, sectionConfig.key)
    ).join('');

    this.addClickHandlers(cardInstance, listElement, items, sectionConfig.key);
  }

  generateMediaItem(item, index, selectedType, selectedIndex, sectionKey) {
    return `
      <div class="media-item ${selectedType === sectionKey && index === selectedIndex ? 'selected' : ''}"
           data-type="${sectionKey}"
           data-index="${index}">
        <img src="${item.poster || '/api/placeholder/400/600'}" alt="${item.title}">
        <div class="media-item-title">${item.title}</div>
      </div>
    `;
  }

  updateInfo(cardInstance, item) {
    if (!item) return;

    cardInstance.background.style.backgroundImage = `url('${item.backdrop}')`;
    cardInstance.background.style.opacity = cardInstance.config.opacity || 0.7;

    cardInstance.info.innerHTML = `
      <div class="title">${item.title}${item.year ? ` (${item.year})` : ''}</div>
      <div class="details">${item.type === 'movie' ? 'Movie' : 'TV Show'}</div>
      <div class="metadata">
        ${item.vote_average ? `Rating: ${item.vote_average}/10` : ''}
        ${item.popularity ? ` | Popularity: ${Math.round(item.popularity)}` : ''}
      </div>
      ${item.overview ? `<div class="overview">${item.overview}</div>` : ''}
    `;
  }

  addClickHandlers(cardInstance, listElement, items, sectionKey) {
    listElement.querySelectorAll('.media-item').forEach(item => {
      item.onclick = () => {
        const index = parseInt(item.dataset.index);
        cardInstance.selectedType = sectionKey;
        cardInstance.selectedIndex = index;
        this.updateInfo(cardInstance, items[index]);

        cardInstance.querySelectorAll('.media-item').forEach(i => {
          i.classList.toggle('selected', 
            i.dataset.type === sectionKey && parseInt(i.dataset.index) === index);
        });
      };
    });
  }
}