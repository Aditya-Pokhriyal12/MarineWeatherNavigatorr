export interface Coordinates {
  lat: number;
  lon: number;
}

export interface GeocodingResponse {
  name: string;
  local_names?: Record<string, string>;
  lat: number;
  lon: number;
  country: string;
  state?: string;
}

export interface WeatherCondition {
  id: number;
  main: string;
  description: string;
  icon: string;
}

export interface WeatherData {
  coord: Coordinates;
  weather: WeatherCondition[];
  main: {
    temp: number;
    feels_like: number;
    temp_min: number;
    temp_max: number;
    pressure: number;
    humidity: number;
  };
  wind: {
    speed: number;
    deg: number;
  };
  sys: {
    sunrise: number;
    sunset: number;
    country: string;
  };
  name: string;
  dt: number;
}

export interface ForecastData {
  list: Array<{
    dt: number;
    main: WeatherData["main"];
    weather: WeatherData["weather"];
    wind: WeatherData["wind"];
    dt_txt: string;
  }>;
  city: {
    name: string;
    country: string;
    sunrise: number;
    sunset: number;
  };
}

// Maritime-specific types
export interface MarineWeatherData {
  coord: Coordinates;
  weather: WeatherCondition[];
  main: WeatherData["main"];
  wind: WeatherData["wind"];
  marine: {
    wave_height: number;
    wave_direction: number;
    wave_period: number;
    swell_height: number;
    swell_direction: number;
    swell_period: number;
    sea_surface_temperature: number;
    visibility: number;
    sea_state: number; // 0-9 scale
    tide_height: number;
    current_speed: number;
    current_direction: number;
  };
  sys: WeatherData["sys"];
  name: string;
  dt: number;
}


export interface Ship {
  id: string;
  name: string;
  type: 'cargo' | 'tanker' | 'container' | 'passenger' | 'fishing' | 'naval';
  coordinates: Coordinates;
  heading: number;
  speed: number;
  destination?: string;
  eta?: string;
  draft: number;
  length: number;
  beam: number;
}

export interface Route {
  id: string;
  name: string;
  waypoints: Coordinates[];
  distance: number;
  estimated_duration: number;
  weather_risk: 'low' | 'medium' | 'high';
  fuel_efficiency: number;
}

export interface MaritimeAlert {
  id: string;
  type: 'storm' | 'fog' | 'ice' | 'navigation' | 'security';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  area: {
    coordinates: Coordinates[];
  };
  valid_from: string;
  valid_until: string;
  issued_by: string;
}
