Mediarr for Home Assistant (Inspired by Upcoming Media Card)
A comprehensive media management card for Home Assistant that brings together your media servers, management tools, and discovery services in one place.

Support This Project
If you find this project helpful, please consider supporting it. Your contributions help maintain and improve the project. Any support is greatly appreciated! ❤️ https://buymeacoffee.com/vansmak Thank you for your support!

***Features

Modular Design

✅ Collapsible sections
✅ Dynamic backgrounds

*Media Server Integration

Plex: View recently added content

Jellyfin: View recently added content

Emby: (Coming soon!)

*Media Management

Sonarr: View upcoming TV shows and episodes

Radarr: Track upcoming movie releases

Other Arrs can easily be added

*Media Discovery

Overseerr / Jellyseer: View     media requests

Trakt: Browse popular TV shows and movies

TMDB: Explore trending content (configurable for TV, movies, or both)

*Media Player State

Displays what’s currently playing on Plex / Jellyfin (Click-to-play coming soon!)

Screenshots
![Screenshot 2025-01-31 at 14-43-03 mediarr – Home Assistant](https://github.com/user-attachments/assets/ce041d96-d9a1-421b-8d34-2dc5194c2034)

 🎥 Demo Video(https://youtu.be/6Ik-8KVS--w)

![Screenshot 2025-01-21 at 14-51-50 mediarr – Home Assistant](https://github.com/user-attachments/assets/4c73b44a-680a-42ea-8d2b-0d96806fb1c6)

**Installation

HACS Installation (Recommended)

1. Open HACS


2. Go to "Frontend"


3. Click the three dots (⋮) → "Custom repositories"


4. Add this repository URL:
🔗 https://github.com/Vansmak/mediarr-card

Select Category: Lovelace) Dashboard 

5. Click "Add"

6. Find and install "Mediarr-card" from HACS

7. Restart Home Assistant

Manual Installation

1. Download the latest release from this repository.

2. Copy all contents into:

/config/www/community/mediarr-card/

3. Add the resource:

Go to Settings → Dashboards → Resources

Click "Add Resource"

Enter the URL:

/hacsfiles/mediarr-card/main.js

Select "JavaScript Module"

Click "Create"

4. Restart Home Assistant

Configuration

Step 1: Install the Mediarr Server

🔗 Mediarr Server Repository github.com/Vansmak/mediarr_server

Step 2: Configure Sensors

Add one or more of the following sensors to your configuration.yaml or sensors.yaml:

sensor:
  - platform: mediarr
    plex:  
      host: localhost
      port: 32400
      token: your_plex_token
      max_items: 10

    jellyfin:  
      host: localhost
      port: 8096
      token: your_jf_token
      max_items: 10

    seer:  
      host: localhost
      port: 5055
      token: your_seer_token
      max_items: 10

    sonarr:  
      url: http://localhost:8989
      api_key: your_sonarr_api_key
      max_items: 10
      days_to_check: 60
    
    radarr:  
      url: http://localhost:7878
      api_key: your_radarr_api_key
      max_items: 10
    
    trakt:  
      client_id: "your_client_id"
      client_secret: "your_client_secret"
      tmdb_api_key: "your_tmdb_api_key"
      trending_type: both  # Options: movies, shows, both
      max_items: 10
     
    tmdb:  
      api_key: "your_api_key"
      trending_type: all  # Options: movie, tv, all
      max_items: 10
      trending: true
      now_playing: true
      upcoming: true
      on_air: true
      airing_today: false

Step 3: Add the Card to Lovelace

Add the following YAML to your dashboard:

type: custom:mediarr-card
plex_entity: sensor.plex_mediarr
jellyfin_entity: sensor.jellyfin_mediarr
sonarr_entity: sensor.sonarr_mediarr
radarr_entity: sensor.radarr_mediarr
seer_entity: sensor.seer_mediarr
trakt_entity: sensor.trakt_mediarr
tmdb_entity: sensor.tmdb_mediarr

# Optional TMDB lists
tmdb_now_playing_entity: sensor.tmdb_mediarr_now_playing
tmdb_upcoming_entity: sensor.tmdb_mediarr_upcoming
tmdb_on_air_entity: sensor.tmdb_mediarr_on_air

# Optional media player for progress tracking
media_player_entity: media_player.your_plex_player

**Options

Sensor Configuration

max_items: Number of items to display (default: 10)

days_to_check: Days to look ahead for upcoming content (Sonarr only, default: 60)

trending_type: Content type to display for Trakt and TMDB


Card Configuration

All entity configurations are optional—use only what you need

media_player_entity enables playback control (Coming Soon!)

Getting API Keys

Plex

🔗 Find your Plex token

Sonarr / Radarr

1. Go to Settings → General

2. Copy your API key

Trakt

1. Create an application at Trakt API

2. Get your Client ID and Client Secret

TMDB

1. Create an account at TMDB

2. Request an API key from your account settings

Upcoming Features

🚀 Emby support
🎬 Click-to-play functionality for Plex/Jellyfin
🔍 More integrations based on user feedback!

Contributors

👤 Vansmak (aka Vanhacked)


---

License

📜 MIT License


---
