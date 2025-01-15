import os
import requests
import logging
from datetime import datetime, timedelta
import voluptuous as vol
from homeassistant.components.sensor import PLATFORM_SCHEMA, SensorEntity
from homeassistant.const import CONF_API_KEY, CONF_URL
import homeassistant.helpers.config_validation as cv

_LOGGER = logging.getLogger(__name__)

# Configuration constants
CONF_MAX_ITEMS = "max_items"
CONF_INCLUDE_TITLES = "include_titles"
CONF_BLUR_RADIUS = "blur_radius"
CONF_IMAGE_OPACITY = "image_opacity"
CONF_TEXT_OVERLAY = "text_overlay"
CONF_TEXT_COLOR = "text_color"
CONF_TEXT_BACKGROUND = "text_background"

# Schema for text overlay positioning
TEXT_OVERLAY_SCHEMA = vol.Schema({
    vol.Optional('position', default='top'): vol.In(['top', 'bottom', 'center']),
    vol.Optional('padding', default=20): cv.positive_int,
    vol.Optional('background_opacity', default=0.7): vol.All(
        vol.Coerce(float), vol.Range(min=0.0, max=1.0)
    ),
})

PLATFORM_SCHEMA = PLATFORM_SCHEMA.extend({
    vol.Required(CONF_API_KEY): cv.string,
    vol.Required(CONF_URL): cv.url,
    vol.Optional(CONF_MAX_ITEMS, default=5): cv.positive_int,
    vol.Optional(CONF_INCLUDE_TITLES, default=True): cv.boolean,
    vol.Optional(CONF_BLUR_RADIUS, default=0): cv.positive_float,
    vol.Optional(CONF_IMAGE_OPACITY, default=0.7): vol.All(
        vol.Coerce(float), vol.Range(min=0.0, max=1.0)
    ),
    vol.Optional(CONF_TEXT_OVERLAY, default={}): TEXT_OVERLAY_SCHEMA,
    vol.Optional(CONF_TEXT_COLOR, default='#FFFFFF'): cv.string,
    vol.Optional(CONF_TEXT_BACKGROUND, default='rgba(0,0,0,0.7)'): cv.string,
})

SCAN_INTERVAL = timedelta(minutes=10)

async def async_setup_platform(hass, config, async_add_entities, discovery_info=None):
    """Set up the Sonarr sensor."""
    api_key = config[CONF_API_KEY]
    url = config[CONF_URL]
    max_items = config[CONF_MAX_ITEMS]
    include_titles = config[CONF_INCLUDE_TITLES]
    blur_radius = config[CONF_BLUR_RADIUS]
    image_opacity = config[CONF_IMAGE_OPACITY]
    text_overlay = config[CONF_TEXT_OVERLAY]
    text_color = config[CONF_TEXT_COLOR]
    text_background = config[CONF_TEXT_BACKGROUND]
    
    async_add_entities([
        SonarrRecentlyAddedSensor(
            api_key, url, max_items, include_titles, blur_radius, 
            image_opacity, text_overlay, text_color, text_background
        ),
        SonarrUpcomingShowsSensor(
            api_key, url, max_items, include_titles, blur_radius,
            image_opacity, text_overlay, text_color, text_background
        )
    ], True)

class SonarrRecentlyAddedSensor(SensorEntity):
    """Representation of a Sonarr recently added sensor."""

    def __init__(self, api_key, url, max_items, include_titles, blur_radius,
                 image_opacity, text_overlay, text_color, text_background):
        self._api_key = api_key
        self._url = url.rstrip('/')
        self._max_items = max_items
        self._include_titles = include_titles
        self._blur_radius = blur_radius
        self._image_opacity = image_opacity
        self._text_overlay = text_overlay
        self._text_color = text_color
        self._text_background = text_background
        self._name = "Sonarr Recently Added"
        self._state = None
        self._attributes = {}

    @property
    def name(self):
        return self._name

    @property
    def state(self):
        return self._state

    @property
    def extra_state_attributes(self):
        return self._attributes

    def update(self):
        """Update the sensor."""
        try:
            headers = {'X-Api-Key': self._api_key}
            series_response = requests.get(f"{self._url}/api/v3/series", headers=headers)
            
            if series_response.ok:
                series_list = series_response.json()
                recently_added = []

                for series in series_list:
                    episodes_url = f"{self._url}/api/v3/episode"
                    params = {'seriesId': series['id']}
                    episodes_response = requests.get(episodes_url, headers=headers, params=params)
                    
                    if episodes_response.ok:
                        episodes = episodes_response.json()
                        for episode in episodes:
                            if episode.get('hasFile'):
                                episode_file_url = f"{self._url}/api/v3/episodefile/{episode['episodeFileId']}"
                                file_response = requests.get(episode_file_url, headers=headers)
                                
                                if file_response.ok:
                                    file_data = file_response.json()
                                    date_added = datetime.fromisoformat(file_data['dateAdded'].replace('Z', '+00:00'))
                                    
                                    show_data = {
                                        'title': series['title'],
                                        'episode': episode['title'],
                                        'number': f"S{episode['seasonNumber']:02d}E{episode['episodeNumber']:02d}",
                                        'runtime': series.get('runtime', 0),
                                        'rating': "",
                                        'poster': f"{self._url}/api/v3/mediacover/{series['id']}/poster.jpg?apikey={self._api_key}",
                                        'fanart': f"{self._url}/api/v3/mediacover/{series['id']}/fanart.jpg?apikey={self._api_key}",
                                        'airdate': file_data['dateAdded'],
                                        'aired': episode.get('airDate', ''),
                                        'overview': episode.get('overview', ''),
                                        'display_title': self._include_titles,
                                        'opacity': self._image_opacity,
                                        'text_overlay': {
                                            'position': self._text_overlay.get('position', 'top'),
                                            'padding': self._text_overlay.get('padding', 20),
                                            'background_opacity': self._text_overlay.get('background_opacity', 0.7),
                                            'color': self._text_color,
                                            'background': self._text_background
                                        }
                                    }
                                    recently_added.append(show_data)
                                break

                # Sort by date added, most recent first
                recently_added.sort(key=lambda x: x['airdate'], reverse=True)
                
                # Update state and attributes
                self._state = len(recently_added)
                self._attributes = {
                    'data': recently_added[:self._max_items],
                    'config': {
                        'include_titles': self._include_titles,
                        'blur_radius': self._blur_radius,
                        'image_opacity': self._image_opacity,
                        'text_overlay': self._text_overlay,
                        'text_color': self._text_color,
                        'text_background': self._text_background
                    }
                }
            
        except Exception as e:
            _LOGGER.error("Error updating Sonarr sensor: %s", str(e))
            self._state = None