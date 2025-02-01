// sections/trakt-section.js
import { BaseSection } from './base-section.js';

export class TraktSection extends BaseSection {
  constructor() {
    super('trakt', 'Trakt Popular');
  }

  generateMediaItem(item, index, selectedType, selectedIndex) {
    return `
      <div class="media-item ${selectedType === this.key && index === selectedIndex ? 'selected' : ''}"
           data-type="${this.key}"
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
      <div class="details">${item.type || 'Unknown Type'}</div>
      <div class="metadata">
        ${item.rating ? `Rating: ${item.rating}/10` : ''}
        ${item.watched ? ' | Watched' : ' | Unwatched'}
      </div>
      ${item.overview ? `<div class="overview">${item.overview}</div>` : ''}
    `;
  }
}