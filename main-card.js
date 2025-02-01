// main-card.js
import { PlexSection } from './sections/plex-section.js';
import { JellyfinSection } from './sections/jellyfin-section.js';
import { SonarrSection } from './sections/sonarr-section.js';
import { RadarrSection } from './sections/radarr-section.js';
import { SeerSection } from './sections/seer-section.js';
import { TMDBSection } from './sections/tmdb-section.js';
import { TraktSection } from './sections/trakt-section.js';
import { styles } from './styles.js';

class MediarrCard extends HTMLElement {
  constructor() {
    super();
    this.selectedType = null;
    this.selectedIndex = 0;
    this.collapsedSections = new Set();
    this.progressInterval = null;

    this.sections = {
      plex: new PlexSection(),
      jellyfin: new JellyfinSection(),
      sonarr: new SonarrSection(),
      radarr: new RadarrSection(),
      seer: new SeerSection(),
      tmdb: new TMDBSection(),
      trakt: new TraktSection()
    };
  }

  async _getPlexClients(plexUrl, plexToken) {
    try {
      const response = await fetch(`${plexUrl}/clients?X-Plex-Token=${plexToken}`);
      if (!response.ok) throw new Error('Failed to fetch clients');
      
      const text = await response.text();
      const parser = new DOMParser();
      const xml = parser.parseFromString(text, 'text/xml');
      
      return Array.from(xml.querySelectorAll('Server')).map(server => ({
        name: server.getAttribute('name'),
        product: server.getAttribute('product'),
        version: server.getAttribute('version'),
        clientId: server.getAttribute('machineIdentifier')
      }));
    } catch (error) {
      console.error('Error fetching Plex clients:', error);
      return [];
    }
  }

  async _showClientSelector(mediaItem) {
    const plexUrl = this._formattedPlexUrl || this.config.plex_url;
    const plexToken = this.config.plex_token;
    
    if (!plexUrl || !plexToken) {
      console.error('Plex URL or token not available');
      return;
    }
    
    const clients = await this._getPlexClients(plexUrl, plexToken);
    const modal = this.querySelector('.client-modal');
    const clientList = this.querySelector('.client-list');
    
    if (clients.length === 0) {
      clientList.innerHTML = `
        <div style="padding: 16px; text-align: center;">
          <div style="opacity: 0.7; margin-bottom: 12px;">No Available Clients</div>
          <div style="font-size: 0.85em; color: var(--secondary-text-color);">
            Make sure your Plex clients are online and connected.
          </div>
        </div>
      `;
    } else {
      clientList.innerHTML = clients.map(client => `
        <div class="client-item" data-client-id="${client.clientId}">
          <ha-icon class="client-item-icon" icon="${this._getClientIcon(client.product)}"></ha-icon>
          <div class="client-item-info">
            <div class="client-item-name">${client.name}</div>
            <div class="client-item-details">${client.product} ${client.version}</div>
          </div>
        </div>
      `).join('');
      
      this.querySelectorAll('.client-item').forEach(item => {
        item.onclick = async () => {
          const clientId = item.dataset.clientId;
          const success = await this._playOnPlexClient(plexUrl, plexToken, clientId, mediaItem.key);
          if (success) {
            modal.classList.add('hidden');
          }
        };
      });
    }
    
    modal.classList.remove('hidden');
  }

  _getClientIcon(product) {
    const productMap = {
      'Plex for Android (TV)': 'mdi:android-tv',
      'Plex for Android': 'mdi:android',
      'Plex for iOS': 'mdi:apple',
      'Plex Web': 'mdi:web',
      'Plex HTPC': 'mdi:monitor',
      'Plex Media Player': 'mdi:play-circle',
      'Plex for Samsung': 'mdi:television',
      'Plex for LG': 'mdi:television',
      'Plex for Xbox': 'mdi:xbox',
      'Plex for PlayStation': 'mdi:playstation'
    };
    return productMap[product] || 'mdi:play-network';
  }

  _toggleSection(sectionKey) {
    const section = this.querySelector(`[data-section="${sectionKey}"]`);
    if (!section) return;

    const content = section.querySelector('.section-content');
    const icon = section.querySelector('.section-toggle-icon');
    
    if (this.collapsedSections.has(sectionKey)) {
      this.collapsedSections.delete(sectionKey);
      content.classList.remove('collapsed');
      icon.style.transform = 'rotate(0deg)';
    } else {
      this.collapsedSections.add(sectionKey);
      content.classList.add('collapsed');
      icon.style.transform = 'rotate(-90deg)';
    }
  }

  _updateNowPlaying(entity) {
    if (!entity || entity.state === 'unavailable' || entity.state === 'idle' || entity.state === 'off') {
      this.nowPlaying.classList.add('hidden');
      return;
    }

    this.nowPlaying.classList.remove('hidden');
    this.nowPlayingTitle.textContent = entity.attributes.media_title || '';
    this.nowPlayingSubtitle.textContent = entity.attributes.media_series_title || '';
    
    if (entity.attributes.media_position && entity.attributes.media_duration) {
      const progress = (entity.attributes.media_position / entity.attributes.media_duration) * 100;
      this.progressBar.style.width = `${progress}%`;
    }
    
    if (entity.attributes.entity_picture) {
      this.querySelector('.now-playing-background').style.backgroundImage = 
        `url('${entity.attributes.entity_picture}')`;
    }
  }

  initializeCard(hass) {
    this.innerHTML = `
      <ha-card>
        <div class="card-background"></div>
        <div class="card-content">
          <div class="client-modal hidden">
            <div class="client-modal-content">
              <div class="client-modal-header">
                <div class="client-modal-title">Select Plex Client</div>
                <ha-icon class="client-modal-close" icon="mdi:close"></ha-icon>
              </div>
              <div class="client-list"></div>
            </div>
          </div>
          
          <div class="now-playing hidden">
            <div class="now-playing-background"></div>
            <div class="now-playing-content">
              <div class="now-playing-info">
                <div class="now-playing-title"></div>
                <div class="now-playing-subtitle"></div>
              </div>
            </div>
            <div class="progress-bar">
              <div class="progress-bar-fill"></div>
            </div>
          </div>
          
          <div class="media-content">
            <div class="media-background"></div>
            <div class="media-info"></div>
            <div class="play-button hidden">
              <ha-icon class="play-icon" icon="mdi:play-circle-outline"></ha-icon>
            </div>
          </div>
          
          ${Object.entries(this.sections)
            .filter(([key]) => {
              if (key === 'tmdb') {
                return this.sections.tmdb.sections.some(section => 
                  this.config[section.entityKey]
                );
              }
              return this.config[`${key}_entity`];
            })
            .map(([key, section]) => section.generateTemplate(this.config))
            .join('')}
        </div>
      </ha-card>
    `;

    // Initialize elements
    this.content = this.querySelector('.media-content');
    this.background = this.querySelector('.media-background');
    this.cardBackground = this.querySelector('.card-background');
    this.info = this.querySelector('.media-info');
    this.playButton = this.querySelector('.play-button');
    this.nowPlaying = this.querySelector('.now-playing');
    this.nowPlayingTitle = this.querySelector('.now-playing-title');
    this.nowPlayingSubtitle = this.querySelector('.now-playing-subtitle');
    this.progressBar = this.querySelector('.progress-bar-fill');
    
    // Set initial background if available
    const firstBackground = Object.entries(this.sections).reduce((found, [key, section]) => {
      if (found) return found;
      if (key === 'tmdb') {
        for (const tmdbSection of section.sections) {
          const entityId = this.config[tmdbSection.entityKey];
          if (entityId && hass.states[entityId]?.attributes?.data?.[0]) {
            return hass.states[entityId].attributes.data[0].backdrop;
          }
        }
      } else {
        const entityId = this.config[`${key}_entity`];
        if (entityId && hass.states[entityId]?.attributes?.data?.[0]) {
          return hass.states[entityId].attributes.data[0].backdrop;
        }
      }
      return found;
    }, null);

    if (firstBackground) {
      this.background.style.backgroundImage = `url('${firstBackground}')`;
      this.cardBackground.style.backgroundImage = `url('${firstBackground}')`;
      this.background.style.opacity = this.config.opacity || 0.7;
    }

    // Add styles
    const style = document.createElement('style');
    style.textContent = styles;
    this.appendChild(style);

    // Initialize click handlers
    this._initializeEventListeners(hass);
  }

  _initializeEventListeners(hass) {
    // Section headers
    this.querySelectorAll('.section-header').forEach(header => {
      header.onclick = () => {
        const sectionKey = header.closest('[data-section]').dataset.section;
        this._toggleSection(sectionKey);
      };
    });

    // Play button
    if (this.playButton) {
      this.playButton.onclick = async (e) => {
        e.stopPropagation();
        if (this.selectedType === 'plex' && this.config.plex_entity) {
          const plexEntity = hass.states[this.config.plex_entity];
          if (plexEntity?.attributes?.data) {
            const mediaItem = plexEntity.attributes.data[this.selectedIndex];
            if (mediaItem?.key) {
              await this._showClientSelector(mediaItem);
            }
          }
        }
      };
    }

    // Modal close
    const modal = this.querySelector('.client-modal');
    const closeButton = this.querySelector('.client-modal-close');
    
    if (closeButton) {
      closeButton.onclick = () => modal.classList.add('hidden');
    }
    
    if (modal) {
      modal.onclick = (e) => {
        if (e.target === modal) modal.classList.add('hidden');
      };
    }
  }

  set hass(hass) {
    if (!this.content) {
      this.initializeCard(hass);
    }

    if (this.config.media_player_entity) {
      this._updateNowPlaying(hass.states[this.config.media_player_entity]);
    }

    Object.entries(this.sections).forEach(([key, section]) => {
      if (key === 'tmdb') {
        const tmdbEntities = [
          'tmdb_entity',
          'tmdb_airing_today_entity',
          'tmdb_now_playing_entity',
          'tmdb_on_air_entity',
          'tmdb_upcoming_entity'
        ];

        tmdbEntities.forEach(entityKey => {
          const entityId = this.config[entityKey];
          if (entityId && hass.states[entityId]) {
            section.update(this, hass.states[entityId]);
          }
        });
      } else {
        const entityId = this.config[`${key}_entity`];
        if (entityId && hass.states[entityId]) {
          section.update(this, hass.states[entityId]);
        }
      }
    });
  }

  setConfig(config) {
    const tmdbEntities = [
      'tmdb_entity',
      'tmdb_airing_today_entity',
      'tmdb_now_playing_entity',
      'tmdb_on_air_entity',
      'tmdb_upcoming_entity'
    ];

    const hasEntity = Object.keys(this.sections).some(key => {
      if (key === 'tmdb') {
        return tmdbEntities.some(entityKey => config[entityKey]);
      }
      return config[`${key}_entity`];
    });

    if (!hasEntity) {
      throw new Error('Please define at least one media entity');
    }
    
    this.config = config;
    
    if (config.plex_url && !config.plex_url.endsWith('/')) {
      this._formattedPlexUrl = config.plex_url + '/';
    }
    if (config.jellyfin_url && !config.jellyfin_url.endsWith('/')) {
      this._formattedJellyfinUrl = config.jellyfin_url + '/';
    }
  }

  static getStubConfig() {
    return {
      tmdb_entity: 'sensor.tmdb_mediarr',
      tmdb_airing_today_entity: 'sensor.tmdb_airing_today_mediarr',
      tmdb_now_playing_entity: 'sensor.tmdb_now_playing_mediarr',
      tmdb_on_air_entity: 'sensor.tmdb_on_air_mediarr',
      tmdb_upcoming_entity: 'sensor.tmdb_upcoming_mediarr',
      plex_entity: 'sensor.plex_mediarr',
      jellyfin_entity: 'sensor.jellyfin_mediarr',
      sonarr_entity: 'sensor.sonarr_mediarr',
      radarr_entity: 'sensor.radarr_mediarr',
      seer_entity: 'sensor.seer_mediarr',
      trakt_entity: 'sensor.trakt_mediarr',
      media_player_entity: '',
      opacity: 0.7,
      blur_radius: 0
    };
  }
}

customElements.define('mediarr-card', MediarrCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "mediarr-card",
  name: "Mediarr Card",
  description: "A modular card for displaying media from various sources",
  preview: true
});
