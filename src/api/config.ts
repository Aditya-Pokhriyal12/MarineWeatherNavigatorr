export const API_CONFIG = {
  BASE_URL: "https://api.openweathermap.org/data/2.5",
  GEO: "https://api.openweathermap.org/geo/1.0",
  MARINE_URL: "https://api.openweathermap.org/data/2.5",
  NOAA_MARINE: "https://api.weather.gov/points",
  API_KEY: import.meta.env.VITE_OPENWEATHER_API_KEY,
  DEFAULT_PARAMS: {
    units: "metric",
    appid: import.meta.env.VITE_OPENWEATHER_API_KEY,
  },
  MARINE_PARAMS: {
    units: "metric",
    appid: import.meta.env.VITE_OPENWEATHER_API_KEY,
  },
};
