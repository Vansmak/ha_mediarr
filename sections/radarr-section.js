// sections/radarr-section.js
import { BaseSection } from './base-section.js';

export class RadarrSection extends BaseSection {
  constructor() {
    super('radarr', 'Upcoming Movies');
  }

  updateInfo(cardInstance, item) {
    if (!item) return;

    cardInstance.background.style.backgroundImage = `url('${item.fanart || item.banner}')`;
    cardInstance.background.style.opacity = cardInstance.config.opacity || 0.7;

    let releaseDate = '';
    if (item.release && !item.release.includes('Unknown')) {
      const dateStr = item.release.split(' - ')[1] || item.release;
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        releaseDate = date.toLocaleDateString();
      }
    }

    const runtime = item.runtime ? `${item.runtime} min` : '';

    cardInstance.info.innerHTML = `
      <div class="title">${item.title}${item.year ? ` (${item.year})` : ''}</div>
      <div class="details">${item.genres || ''}</div>
      <div class="metadata">${releaseDate}${runtime ? ` | ${runtime}` : ''}</div>
      ${item.overview ? `<div class="overview">${item.overview}</div>` : ''}
    `;
  }
}