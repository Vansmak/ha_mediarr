// sections/sonarr-section.js
import { BaseSection } from './base-section.js';

export class SonarrSection extends BaseSection {
  constructor() {
    super('sonarr', 'Upcoming Shows');
  }

  updateInfo(cardInstance, item) {
    if (!item) return;

    cardInstance.background.style.backgroundImage = `url('${item.fanart || item.banner}')`;
    cardInstance.background.style.opacity = cardInstance.config.opacity || 0.7;

    let airDate = '';
    if (item.release && item.release !== 'Unknown') {
      const date = new Date(item.release);
      if (!isNaN(date.getTime())) {
        airDate = date.toLocaleDateString();
      }
    }

    cardInstance.info.innerHTML = `
      <div class="title">${item.title}</div>
      <div class="details">${item.number || ''} - ${item.episode || ''}</div>
      <div class="metadata">
        Airs: ${airDate}${item.network ? ` on ${item.network}` : ''}
      </div>
    `;
  }

  generateMediaItem(item, index, selectedType, selectedIndex) {
    return `
      <div class="media-item ${selectedType === this.key && index === selectedIndex ? 'selected' : ''}"
           data-type="${this.key}"
           data-index="${index}">
        <img src="${item.poster}" alt="${item.title}">
        <div class="media-item-title">${item.number} - ${item.title}</div>
      </div>
    `;
  }
}