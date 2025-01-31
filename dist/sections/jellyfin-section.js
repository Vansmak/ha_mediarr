// sections/jellyfin-section.js
import { BaseSection } from './base-section.js';

export class JellyfinSection extends BaseSection {
  constructor() {
    super('jellyfin', 'Jellyfin Recently Added');
  }

  updateInfo(cardInstance, item) {
    if (!item) return;

    // Use fanart directly without formatting
    cardInstance.background.style.backgroundImage = `url('${item.fanart}')`;
    cardInstance.background.style.opacity = cardInstance.config.opacity || 0.7;

    const addedDate = new Date(item.added || Date.now()).toLocaleDateString();
    const runtime = item.runtime ? `${item.runtime} min` : '';
    const subtitle = item.episode ? `${item.number || ''} - ${item.episode || ''}` : '';

    cardInstance.info.innerHTML = `
      <div class="title">${item.title}${item.year ? ` (${item.year})` : ''}</div>
      <div class="details">${subtitle}</div>
      <div class="metadata">Added: ${addedDate}${runtime ? ` | ${runtime}` : ''}</div>
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

  // Remove _formatImageUrl method entirely since we're using direct URLs
}