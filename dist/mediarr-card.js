class MediarrCard extends HTMLElement {
    constructor() {
      super();
      this.selectedType = 'plex';
      this.selectedIndex = 0;
      this.sectionOrder = [];
    }
    tmdbSensorTypes = [
      { key: 'tmdb_entity', listSelector: '.tmdb-list', defaultTitle: 'Trending on TMDB' },
      { key: 'tmdb_airing_today_entity', listSelector: '.tmdb-airing-today-list', defaultTitle: 'TMDB Airing Today' },
      { key: 'tmdb_now_playing_entity', listSelector: '.tmdb-now-playing-list', defaultTitle: 'TMDB Now Playing' },
      { key: 'tmdb_on_air_entity', listSelector: '.tmdb-on-air-list', defaultTitle: 'TMDB On Air' },
      { key: 'tmdb_upcoming_entity', listSelector: '.tmdb-upcoming-list', defaultTitle: 'TMDB Upcoming' }
    ];
  
    _formatImageUrl(url, entityType) {
      if (!url) return '';
      if (url.startsWith('http')) {
        if (entityType === 'plex' && !url.includes('X-Plex-Token')) {
          const plexToken = this.config.plex_token;
          if (plexToken) {
            return `${url}${url.includes('?') ? '&' : '?'}X-Plex-Token=${plexToken}`;
          }
        }
        return url;
      }
      return url;
    }
  
    async _getPlexClients(plexUrl, plexToken) {
      console.log('Client detection will be implemented in a future update');
      return [];
    }
  
    async _playOnPlexClient(plexUrl, plexToken, clientId, mediaKey) {
      try {
        console.log('Starting playback on client:', clientId);
        const metadataResponse = await fetch(
          `${plexUrl}/library/metadata/${mediaKey}?X-Plex-Token=${plexToken}`
        );
        if (!metadataResponse.ok) throw new Error('Failed to fetch metadata');
        
        const metadataText = await metadataResponse.text();
        const parser = new DOMParser();
        const metadata = parser.parseFromString(metadataText, "text/xml");
        const video = metadata.querySelector('Video');
        
        if (!video) throw new Error('Media not found');
        
        const playbackUrl = new URL(`${plexUrl}/player/playback/playMedia`, window.location.origin);
        const params = new URLSearchParams({
          'X-Plex-Token': plexToken,
          'X-Plex-Client-Identifier': clientId,
          'key': video.getAttribute('key'),
          'offset': '0',
          'machineIdentifier': video.getAttribute('machineIdentifier'),
          'address': new URL(plexUrl).hostname,
          'port': new URL(plexUrl).port,
          'protocol': 'http',
          'containerKey': `/playQueue/${Date.now()}`
        });
        
        playbackUrl.search = params.toString();
        const playResponse = await fetch(playbackUrl.toString(), { method: 'GET' });
        return playResponse.ok;
      } catch (error) {
        console.error('Error playing media:', error);
        return false;
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
            <div style="opacity: 0.7; margin-bottom: 12px;">
              Client Selection Coming Soon
            </div>
            <div style="font-size: 0.85em; color: var(--secondary-text-color);">
              Direct playback functionality is under development.
              Check back in a future update!
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
  
    _setSectionOrder(config) {
      this.sectionOrder = Object.keys(config).filter(key => 
        ['plex_entity', 'sonarr_entity', 'radarr_entity', 'trakt_entity', 'tmdb_entity',
         'tmdb_airing_today_entity', 'tmdb_now_playing_entity', 'tmdb_on_air_entity', 
         'tmdb_upcoming_entity'].includes(key)
      );
    }
  
    set hass(hass) {
      if (!this.content) {
        this._setSectionOrder(this.config);
        
        
  
        const sectionTemplates = {
          plex_entity: `
            <div class="section-header">
              <div class="section-label">Recently Added</div>
            </div>
            <div class="plex-list"></div>
          `,
          sonarr_entity: `
            <div class="section-header">
              <div class="section-label">Upcoming Shows</div>
            </div>
            <div class="show-list"></div>
          `,
          radarr_entity: `
            <div class="section-header">
              <div class="section-label">Upcoming Movies</div>
            </div>
            <div class="movie-list"></div>
          `,
          trakt_entity: `
            <div class="section-header">
              <div class="section-label">Popular on Trakt</div>
            </div>
            <div class="trakt-list"></div>
          `
        };
  
        this.tmdbSensorTypes.forEach(({ key, defaultTitle, listSelector }) => {
          sectionTemplates[key] = `
            <div class="section-header">
              <div class="section-label">${defaultTitle}</div>
            </div>
            <div class="${listSelector.slice(1)}"></div>
          `;
        });
  
        const orderedSectionsHtml = this.sectionOrder
          .map(entityKey => sectionTemplates[entityKey])
          .join('');
  
        this.innerHTML = `
          <ha-card>
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
                <ha-icon class="play-icon" icon="mdi:play-circle-outline">
                  <ha-svg-icon></ha-svg-icon>
                </ha-icon>
              </div>
            </div>
            
            ${orderedSectionsHtml}
          </ha-card>
        `;
  
        const style = document.createElement('style');
        style.textContent = `
          ha-card {
            overflow: hidden;
            padding-bottom: 8px;
          }
          .media-content {
            position: relative;
            width: 100%;
            height: 160px;
            overflow: hidden;
            border-radius: var(--ha-card-border-radius, 4px);
            margin-bottom: 8px;
            cursor: pointer;
          }
          .media-background {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-size: cover;
            background-position: center;
            background-repeat: no-repeat;
            transition: all 0.3s ease-in-out;
            filter: blur(var(--blur-radius, 0px));
            transform: scale(1.1);
          }
          .media-content:hover .media-background {
            transform: scale(1.15);
          }
          .media-info {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            padding: 12px;
            background: linear-gradient(transparent, rgba(0,0,0,0.8));
            color: white;
            opacity: 1;
            z-index: 1;
          }
          .play-button {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            z-index: 2;
            color: white;
            opacity: 0;
            transition: opacity 0.3s ease-in-out;
            background: rgba(0, 0, 0, 0.5);
            border-radius: 50%;
            padding: 8px;
            cursor: pointer;
          }
          .play-button ha-icon {
            --mdc-icon-size: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .play-button ha-svg-icon {
            width: 40px;
            height: 40px;
            fill: currentColor;
          }
          .media-content:hover .play-button:not(.hidden) {
            opacity: 1;
          }
          .section-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 4px 8px;
          }
          .section-label {
            font-weight: 500;
            font-size: 13px;
            color: var(--primary-text-color);
            text-transform: uppercase;
          }
          .show-list,
          .movie-list,
          .plex-list,
          .trakt-list,
          .tmdb-list,
          .tmdb-airing-today-list,
          .tmdb-now-playing-list,
          .tmdb-on-air-list,
          .tmdb-upcoming-list {
            padding: 0 8px;
            display: flex;
            gap: 6px;
            overflow-x: auto;
            scrollbar-width: thin;
            margin-bottom: 8px;
          }
          .media-item {
            flex: 0 0 auto;
            width: 90px;
            height: 135px;
            position: relative;
            cursor: pointer;
            transition: all 0.2s;
            border-radius: 4px;
            overflow: hidden;
          }
          .media-item:hover {
            transform: translateY(-2px);
          }
          .media-item.selected {
            box-shadow: 0 0 0 2px var(--primary-color);
          }
          .media-item img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
          .media-item::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            height: 50%;
            background: linear-gradient(transparent, rgba(0,0,0,0.9));
            pointer-events: none;
          }
          .media-item-title {
            position: absolute;
            bottom: 4px;
            left: 4px;
            right: 4px;
            font-size: 0.75em;
            color: white;
            z-index: 1;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            line-height: 1.2;
            text-shadow: 1px 1px 1px rgba(0,0,0,0.5);
          }
          .title {
            font-size: 1.2em;
            font-weight: 500;
            margin-bottom: 2px;
          }
          .details {
            font-size: 1em;
            margin-bottom: 2px;
          }
          .metadata {
            font-size: 0.85em;
            opacity: 0.8;
          }
          .hidden {
            display: none;
          }

          /* Custom scrollbar styles */
          .show-list::-webkit-scrollbar,
          .movie-list::-webkit-scrollbar,
          .plex-list::-webkit-scrollbar,
          .trakt-list::-webkit-scrollbar,
          .tmdb-list::-webkit-scrollbar,
          .tmdb-airing-today-list::-webkit-scrollbar,
          .tmdb-now-playing-list::-webkit-scrollbar,
          .tmdb-on-air-list::-webkit-scrollbar,
          .tmdb-upcoming-list::-webkit-scrollbar {
            height: 4px;
          }
          
          .show-list::-webkit-scrollbar-track,
          .movie-list::-webkit-scrollbar-track,
          .plex-list::-webkit-scrollbar-track,
          .trakt-list::-webkit-scrollbar-track,
          .tmdb-list::-webkit-scrollbar-track,
          .tmdb-airing-today-list::-webkit-scrollbar-track,
          .tmdb-now-playing-list::-webkit-scrollbar-track,
          .tmdb-on-air-list::-webkit-scrollbar-track,
          .tmdb-upcoming-list::-webkit-scrollbar-track {
            background: rgba(0, 0, 0, 0.1);
            border-radius: 2px;
          }
          
          .show-list::-webkit-scrollbar-thumb,
          .movie-list::-webkit-scrollbar-thumb,
          .plex-list::-webkit-scrollbar-thumb,
          .trakt-list::-webkit-scrollbar-thumb,
          .tmdb-list::-webkit-scrollbar-thumb,
          .tmdb-airing-today-list::-webkit-scrollbar-thumb,
          .tmdb-now-playing-list::-webkit-scrollbar-thumb,
          .tmdb-on-air-list::-webkit-scrollbar-thumb,
          .tmdb-upcoming-list::-webkit-scrollbar-thumb {
            background: var(--primary-color);
            border-radius: 2px;
          }
          
          .now-playing {
            position: relative;
            width: 100%;
            height: 60px;
            background: var(--primary-background-color);
            overflow: hidden;
          }
          .now-playing.hidden {
            display: none;
          }
          .now-playing-background {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-size: cover;
            background-position: center;
            filter: blur(10px) brightness(0.3);
            transform: scale(1.2);
          }
          .now-playing-content {
            position: relative;
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 16px;
            height: 44px;
            color: white;
          }
          .now-playing-info {
            flex: 1;
            overflow: hidden;
            margin-right: 16px;
          }
          .now-playing-title {
            font-weight: 500;
            font-size: 1em;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .now-playing-subtitle {
            font-size: 0.8em;
            opacity: 0.8;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .media-controls {
            display: flex;
            gap: 16px;
            align-items: center;
          }
          .control-button {
            --mdc-icon-size: 24px;
            cursor: pointer;
            opacity: 0.8;
            transition: opacity 0.2s;
          }
          .control-button:hover {
            opacity: 1;
          }
          .progress-bar {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: rgba(255,255,255,0.2);
          }
          .progress-bar-fill {
            height: 100%;
            background: var(--primary-color);
            width: 0%;
            transition: width 1s linear;
          }

          /* Client Modal Styles */
          .client-modal {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 999;
          }
          .client-modal.hidden {
            display: none;
          }
          .client-modal-content {
            background: var(--ha-card-background, var(--card-background-color, white));
            border-radius: var(--ha-card-border-radius, 4px);
            width: 90%;
            max-width: 400px;
            max-height: 90vh;
            overflow-y: auto;
          }
          .client-modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 16px;
            border-bottom: 1px solid var(--divider-color, rgba(0, 0, 0, 0.12));
          }
          .client-modal-title {
            font-size: 1.1em;
            font-weight: 500;
          }
          .client-modal-close {
            cursor: pointer;
            opacity: 0.7;
            transition: opacity 0.2s;
          }
          .client-modal-close:hover {
            opacity: 1;
          }
          .client-list {
            padding: 8px;
          }
          .client-item {
            display: flex;
            align-items: center;
            padding: 12px;
            cursor: pointer;
            border-radius: 4px;
            transition: background-color 0.2s;
          }
          .client-item:hover {
            background-color: var(--secondary-background-color);
          }
          .client-item-icon {
            margin-right: 12px;
            --mdc-icon-size: 24px;
          }
          .client-item-info {
            flex: 1;
          }
          .client-item-name {
            font-weight: 500;
            margin-bottom: 2px;
          }
          .client-item-details {
            font-size: 0.85em;
            opacity: 0.7;
          }
        `;
        this.appendChild(style);
  
        this.card = this.querySelector('ha-card');
        this.content = this.querySelector('.media-content');
        this.background = this.querySelector('.media-background');
        this.info = this.querySelector('.media-info');
        this.plexList = this.querySelector('.plex-list');
        this.showList = this.querySelector('.show-list');
        this.movieList = this.querySelector('.movie-list');
        this.traktList = this.querySelector('.trakt-list');
        this.tmdbList = this.querySelector('.tmdb-list');
        this.tmdbAiringTodayList = this.querySelector('.tmdb-airing-today-list');
        this.tmdbNowPlayingList = this.querySelector('.tmdb-now-playing-list');
        this.tmdbOnAirList = this.querySelector('.tmdb-on-air-list');
        this.tmdbUpcomingList = this.querySelector('.tmdb-upcoming-list');
        this.playButton = this.querySelector('.play-button');
        this.nowPlaying = this.querySelector('.now-playing');
        this.nowPlayingTitle = this.querySelector('.now-playing-title');
        this.nowPlayingSubtitle = this.querySelector('.now-playing-subtitle');
        this.progressBar = this.querySelector('.progress-bar-fill');
        
        this.progressInterval = setInterval(() => {
          if (this.config.media_player_entity && hass) {
            const entity = hass.states[this.config.media_player_entity];
            if (entity && entity.attributes.media_position && entity.attributes.media_duration) {
              const progress = (entity.attributes.media_position / entity.attributes.media_duration) * 100;
              this.progressBar.style.width = `${progress}%`;
            }
          }
        }, 1000);
  
        if (this.playButton) {
          this.playButton.onclick = async (e) => {
            e.stopPropagation();
            console.log('Play button clicked');
            
            if (this.selectedType === 'plex' && this.config.plex_entity) {
              const plexEntity = hass.states[this.config.plex_entity];
              
              if (plexEntity?.attributes?.data) {
                const mediaItem = plexEntity.attributes.data[this.selectedIndex];
                
                if (mediaItem?.key) {
                  await this._showClientSelector(mediaItem);
                } else {
                  console.warn('No media key found for item:', mediaItem);
                }
              }
            }
          };
        }
  
        const modal = this.querySelector('.client-modal');
        const closeButton = this.querySelector('.client-modal-close');
        
        if (closeButton) {
          closeButton.onclick = () => {
            modal.classList.add('hidden');
          };
        }
        
        if (modal) {
          modal.onclick = (e) => {
            if (e.target === modal) {
              modal.classList.add('hidden');
            }
          };
        }
      }
  
      const config = this.config;
  
      if (this.config.media_player_entity) {
        const entity = hass.states[this.config.media_player_entity];
        if (entity && entity.state !== 'unavailable' && entity.state !== 'idle' && entity.state !== 'off') {
          this.nowPlaying.classList.remove('hidden');
          this.nowPlayingTitle.textContent = entity.attributes.media_title || '';
          this.nowPlayingSubtitle.textContent = entity.attributes.media_series_title || '';
          
          if (entity.attributes.entity_picture) {
            const backgroundUrl = entity.attributes.entity_picture;
            this.querySelector('.now-playing-background').style.backgroundImage = `url('${backgroundUrl}')`;
          }
        } else {
          this.nowPlaying.classList.add('hidden');
        }
      }
  
      const updateMediaSection = (entityKey, listSelector, dataProcessor) => {
        const entity = hass.states[config[entityKey]];
        if (entity) {
          const items = entity.attributes.data || [];
          const listElement = this.querySelector(listSelector);
          
          if (listElement) {
            listElement.innerHTML = items.map((item, index) => {
              const processedItem = dataProcessor ? dataProcessor(item) : item;
              return `
                <div class="media-item ${this.selectedType === entityKey.replace('_entity', '') && index === this.selectedIndex ? 'selected' : ''}"
                     data-type="${entityKey.replace('_entity', '')}"
                     data-index="${index}">
                  <img src="${processedItem.poster || '/api/placeholder/400/600'}" alt="${processedItem.title}">
                  <div class="media-item-title">${processedItem.title}</div>
                </div>
              `;
            }).join('');
          }
        }
      };
  
      // Update all media sections
      updateMediaSection('plex_entity', '.plex-list');
      updateMediaSection('sonarr_entity', '.show-list');
      updateMediaSection('radarr_entity', '.movie-list');
      updateMediaSection('trakt_entity', '.trakt-list', item => ({
        ...item,
        poster: item.poster || `/api/placeholder/400/600`
      }));
  
      // Update TMDB sections
      this.tmdbSensorTypes.forEach(({ key, listSelector }) => {
        updateMediaSection(key, listSelector);
      });
  
      // Add click handlers for media items
      this.querySelectorAll('.media-item').forEach(item => {
        item.onclick = () => {
          const type = item.dataset.type;
          const index = parseInt(item.dataset.index);
          this.selectedType = type;
          this.selectedIndex = index;
  
          let entity, mediaItem;
          switch(type) {
            case 'plex':
              entity = hass.states[config.plex_entity];
              mediaItem = entity.attributes.data[index];
              break;
            case 'sonarr':
              entity = hass.states[config.sonarr_entity];
              mediaItem = entity.attributes.data[index];
              break;
            case 'radarr':
              entity = hass.states[config.radarr_entity];
              mediaItem = entity.attributes.data[index];
              break;
            case 'trakt':
              entity = hass.states[config.trakt_entity];
              mediaItem = entity.attributes.data[index];
              
              if (mediaItem?.backdrop) {
                this.background.style.backgroundImage = `url('${mediaItem.backdrop}')`;
                this.background.style.opacity = config.opacity || 0.7;
              }
              
              this.info.innerHTML = `
                <div class="title">${mediaItem.title}${mediaItem.year ? ` (${mediaItem.year})` : ''}</div>
                <div class="details">${mediaItem.type.charAt(0).toUpperCase() + mediaItem.type.slice(1)}</div>
                <div class="metadata">
                  ${mediaItem.ids?.imdb ? `IMDB: ${mediaItem.ids.imdb}` : ''}
                  ${mediaItem.ids?.tmdb ? ` | TMDB: ${mediaItem.ids.tmdb}` : ''}
                </div>
              `;
              break;
            default:
              if (type.startsWith('tmdb')) {
                entity = hass.states[config[`${type}_entity`]];
                mediaItem = entity.attributes.data[index];
                
                if (mediaItem?.backdrop) {
                  this.background.style.backgroundImage = `url('${mediaItem.backdrop}')`;
                  this.background.style.opacity = config.opacity || 0.7;
                }
                
                this.info.innerHTML = `
                  <div class="title">${mediaItem.title}${mediaItem.year ? ` (${mediaItem.year})` : ''}</div>
                  <div class="details">${mediaItem.type === 'movie' ? 'Movie' : 'TV Show'}</div>
                  <div class="metadata">
                    ${mediaItem.vote_average ? `Rating: ${mediaItem.vote_average}/10` : ''}
                    ${mediaItem.popularity ? ` | Popularity: ${Math.round(mediaItem.popularity)}` : ''}
                  </div>
                  ${mediaItem.overview ? `<div class="overview" style="margin-top: 8px; font-size: 0.9em; opacity: 0.9;">${mediaItem.overview}</div>` : ''}
                `;
              }
              break;
          }
  
          if (mediaItem?.fanart) {
            this.background.style.backgroundImage = `url('${mediaItem.fanart}')`;
            this.background.style.opacity = config.opacity || 0.7;
          }
  
          if (type === 'plex') {
            this.playButton.classList.remove('hidden');
            const addedDate = new Date(mediaItem.added).toLocaleDateString();
            const runtime = mediaItem.runtime ? `${mediaItem.runtime} min` : '';
            const subtitle = mediaItem.type === 'show' ? `${mediaItem.number || ''} - ${mediaItem.episode || ''}` : '';
            this.info.innerHTML = `
              <div class="title">${mediaItem.title}${mediaItem.year ? ` (${mediaItem.year})` : ''}</div>
              <div class="details">${subtitle}</div>
              <div class="metadata">Added: ${addedDate}${runtime ? ` | ${runtime}` : ''}</div>
            `;
          } else {
            this.playButton.classList.add('hidden');
          }
  
          this.querySelectorAll('.media-item').forEach(i => {
            i.classList.toggle('selected', 
              i.dataset.type === type && parseInt(i.dataset.index) === index);
          });
        };
      });
  
      if (!this.background.style.backgroundImage) {
        const firstItem = this.querySelector('.media-item');
        if (firstItem) {
          firstItem.click();
        }
      }
    }
  
    setConfig(config) {
            
      this.config = { ...config };
      this._setSectionOrder(config);
      
      if (this.config.plex_url && !this.config.plex_url.endsWith('/')) {
        this._formattedPlexUrl = this.config.plex_url + '/';
      } else {
        this._formattedPlexUrl = this.config.plex_url;
      }
    }
  
    static getStubConfig() {
      return {
        plex_entity: 'sensor.plex_mediarr',
        sonarr_entity: 'sensor.sonarr_mediarr',
        radarr_entity: 'sensor.radarr_mediarr',
        trakt_entity: 'sensor.trakt_mediarr',
        tmdb_entity: 'sensor.tmdb_mediarr',
        media_player_entity: '',
        plex_url: '',
        plex_token: '',
        opacity: 0.7,
        blur_radius: 0,
        tmdb_airing_today_entity: 'sensor.tmdb_mediarr_airing_today',
        tmdb_now_playing_entity: 'sensor.tmdb_mediarr_now_playing',
        tmdb_on_air_entity: 'sensor.tmdb_mediarr_on_air',
        tmdb_upcoming_entity: 'sensor.tmdb_mediarr_upcoming'
      };
    }
  
    disconnectedCallback() {
      if (this.progressInterval) {
        clearInterval(this.progressInterval);
      }
    }
  }
  
  customElements.define('mediarr-card', MediarrCard);
  
  window.customCards = window.customCards || [];
  window.customCards.push({
    type: "mediarr-card",
    name: "Mediarr Card",
    description: "A card for displaying Plex, Sonarr, and Radarr media",
    preview: true
  });
