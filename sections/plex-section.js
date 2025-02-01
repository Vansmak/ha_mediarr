// sections/plex-section.js
import { BaseSection } from './base-section.js';

export class PlexSection extends BaseSection {
 constructor() {
   super('plex', 'Plex Recently Added');
 }

 updateInfo(cardInstance, item) {
   if (!item) return;

   cardInstance.background.style.backgroundImage = `url('${item.fanart || item.banner}')`;
   cardInstance.background.style.opacity = cardInstance.config.opacity || 0.7;

   const addedDate = item.release !== 'Unknown' ? 
     new Date(item.release).toLocaleDateString() : 
     new Date(item.added || Date.now()).toLocaleDateString();

   cardInstance.info.innerHTML = `
     <div class="title">${item.title}${item.year ? ` (${item.year})` : ''}</div>
     ${item.number ? `<div class="details">${item.number}${item.episode ? ` - ${item.episode}` : ''}</div>` : ''}
     <div class="metadata">Added: ${addedDate}</div>
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
}