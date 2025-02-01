Support This Project If you find this project helpful, please consider supporting it. Your contributions help maintain and improve the project. Any support is greatly appreciated! ❤️ https://buymeacoffee.com/vansmak Thank you for your support!


# Mediarr for Home Assistant (inspired by upcoming media card)

A comprehensive media management card and integration for Home Assistant that brings together your media servers, management tools, and discovery services in one place.

## Features

Modular design
 - add what you want
 - collapsible sections
 - dynamic backgrounds

- **Media Server Integration**
  - Plex: View recently added content
  - Jellyfin 
  - Emby, soon to come
    
- **Media Management**
  - Sonarr: View upcoming TV shows and episodes
  - Radarr: Track upcoming movie releases
  - other arrs can easily be added

- **Media Discovery**
  - Overseer or Jellyseer: see requests
  - Trakt: Browse popular TV shows and movies
  - TMDB: Explore trending content (configurable for TV, movies, or both)
 
- **Media player state**
  - whats currenty playing on media_player.jf or plex (click to play coming soon)  
   

## Screenshots
![Screenshot 2025-01-31 at 14-43-03 mediarr – Home Assistant](https://github.com/user-attachments/assets/ce041d96-d9a1-421b-8d34-2dc5194c2034)

 (https://youtu.be/6Ik-8KVS--w)

![Screenshot 2025-01-21 at 14-51-50 mediarr – Home Assistant](https://github.com/user-attachments/assets/4c73b44a-680a-42ea-8d2b-0d96806fb1c6)

## Installation  SEE MANUAL INSTALL FOR LATEST

### HACS Installation
1. Open HACS
2. Go to "Integrations"
3. Click the three dots menu and select "Custom repositories"
4. Add this repository URL and select "Dashboard" as the category
5. Click "Add"
6. Find and install "Mediarr-card" from HACS
7. Restart Home Assistant



### Manual Installation
1. To Download the latest release thats not in hacs yet, v2.0 
2. Copy all contents from `\dist` on this repo to `/config/www/community/mediarr-card/`
  
3.  Add to Resources:
   - Go to Settings -> Dashboards -> Resources
   - Click "Add Resource"
   - Enter URL: `/local/community/mediarr-card/main-card.js`
   - Select "JavaScript Module"
   - Click "Create"
4. Restart Home Assistant

## Configuration

### Step 1: requires mediarr from https://github.com/Vansmak/mediarr_server/
***Configure Sensors
Add one or more of the following sensors to your `configuration.yaml` `sensors.yaml`:

```yaml
sensor:
  - platform: mediarr
    plex:  # Optional
      host: localhost
      port: 32400
      token: your_plex_token
      max_items: 10

    jellyfin:  
      host: localhost
      port: 8096
      token: your_jf_token
      max_items: 10

    seer:  # Optional
      host: localhost
      port: 5055
      token: your_seer_token
      max_items: 10

    sonarr:  # Optional
      url: http://localhost:8989
      api_key: your_sonarr_api_key
      max_items: 10
      days_to_check: 60
    
    radarr:  # Optional
      url: http://localhost:7878
      api_key: your_radarr_api_key
      max_items: 10
    
    trakt:  # Optional
      client_id: "your_client_id"
      client_secret: "your_client_secret"
      tmdb_api_key: "your_tmdb_api_key"  # Required for posters
      trending_type: both  # Options: movies, shows, both
      max_items: 10
     
    
    tmdb:  # Optional
      api_key: "your_api_key"
      trending_type: all  # Options: movie, tv, all
      max_items: 10
      trending: true          # Default endpoint
      now_playing: true       # Optional
      upcoming: true          # Optional
      on_air: true            # Optional
      airing_today: false     # Optional
```

   
### Step 2: Add the Card
Add the 1 or all to your card on your dashboard:  (may need to clear cache)

```yaml
type: custom:mediarr-card
plex_entity: sensor.plex_mediarr
jellyfin_entity: sensor.jellyfin.mediarr
sonarr_entity: sensor.sonarr_mediarr
radarr_entity: sensor.radarr_mediarr
seer_emtity: sendor.seer_mediarr
trakt_entity: sensor.trakt_mediarr
tmdb_entity: sensor.tmdb_mediarr

# Granular TMDB lists (Optional)
tmdb_now_playing_entity: sensor.tmdb_mediarr_now_playing
tmdb_upcoming_entity: sensor.tmdb_mediarr_upcoming
tmdb_on_air_entity: sensor.tmdb_mediarr_on_air
# Optional media player for progress tracking
media_player_entity: media_player.your_plex_player
```
Note: Not all endpoints may be functional depending on the current implementation of the Mediarr server. Always check the latest documentation and server capabilities.
## Options

### Sensor Configuration
- **max_items**: Number of items to display (default: 10)
- **days_to_check**: Days to look ahead for upcoming content (Sonarr only, default: 60)
- **trending_type**: Content type to display for Trakt and TMDB

### Card Configuration
- All entity configurations are optional - use only what you need
- Media player entity enables playback control (coming soon)

## Getting API Keys

### Plex
1. Get your Plex token from your Plex account settings
2. More details at [Plex Support](https://support.plex.tv/articles/204059436-finding-an-authentication-token-x-plex-token/)

### Sonarr/Radarr
1. Go to Settings -> General
2. Copy your API key

### Trakt
1. Create an application at [Trakt API](https://trakt.tv/oauth/applications)
2. Get your client ID and secret

### TMDB
1. Create an account at [TMDB](https://www.themoviedb.org/)
2. Request an API key from your account settings

## Upcoming Features

- Emby support
- playback functionality
- who knows

## Contributors
Vansmak aka Vanhacked

## License
MIT
