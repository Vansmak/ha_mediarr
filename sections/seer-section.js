// sections/seer-section.js
import { BaseSection } from './base-section.js';

export class SeerSection extends BaseSection {
  constructor() {
    super('seer', 'Media Requests');
  }

  generateMediaItem(item, index, selectedType, selectedIndex) {
    // Make sure status exists and is a string
    const status = String(item.status || 'unknown');
    const statusClass = this._getStatusClass(status);
    
    return `
      <div class="media-item ${selectedType === this.key && index === selectedIndex ? 'selected' : ''}"
           data-type="${this.key}"
           data-index="${index}">
        <div class="request-status ${statusClass}">${status}</div>
        <img src="${item.poster}" alt="${item.title}">
        <div class="media-item-title">${item.title}</div>
      </div>
    `;
  }

  updateInfo(cardInstance, item) {
    if (!item) return;

    cardInstance.background.style.backgroundImage = `url('${item.fanart || item.banner}')`;
    cardInstance.background.style.opacity = cardInstance.config.opacity || 0.7;

    cardInstance.info.innerHTML = `
        <div class="title">${item.title}</div>
        <div class="details">
          ${item.requested_by} - ${item.requested_date}
        </div>
      `;
    }

  _getStatusClass(status) {
    const statusMap = {
      'pending': 'status-pending',
      'approved': 'status-approved',
      'available': 'status-available',
      'processing': 'status-processing',
      'declined': 'status-declined'
    };
    return statusMap[status.toLowerCase()] || 'status-unknown';
  }
}