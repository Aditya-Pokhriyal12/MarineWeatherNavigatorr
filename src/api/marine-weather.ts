import { API_CONFIG } from "./config";
import type {
  MarineWeatherData,
  Coordinates,
  Route,
  MaritimeAlert,
} from "./types";

class MarineWeatherAPI {
  private createUrl(endpoint: string, params: Record<string, string | number>) {
    const searchParams = new URLSearchParams({
      appid: API_CONFIG.API_KEY,
      ...params,
    });
    return `${endpoint}?${searchParams.toString()}`;
  }

  private async fetchData<T>(url: string): Promise<T> {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Marine Weather API Error: ${response.statusText}`);
    }

    return response.json();
  }

  async getMarineWeather({ lat, lon }: Coordinates): Promise<MarineWeatherData> {
    try {
      const weatherUrl = this.createUrl(`${API_CONFIG.BASE_URL}/weather`, {
        lat: lat.toString(),
        lon: lon.toString(),
        units: "metric",
      });
      
      const weatherData = await this.fetchData<any>(weatherUrl);
      
      const [noaaData] = await Promise.allSettled([
        this.fetchNOAAMarineData({ lat, lon })
      ]);

      const marineData: MarineWeatherData = {
        ...weatherData,
        marine: this.combineMarineData(weatherData, noaaData, { lat, lon }),
      };

      return marineData;
    } catch (error) {
      console.warn('Failed to fetch real marine weather, falling back to simulated data:', error);
      return this.getSimulatedMarineWeather({ lat, lon });
    }
  }


  private async fetchNOAAMarineData({ lat, lon }: Coordinates) {
    try {
      const response = await fetch(`${API_CONFIG.NOAA_MARINE}/${lat},${lon}`);
      if (!response.ok) throw new Error('NOAA API unavailable');
      
      const pointData = await response.json();
      if (pointData.properties?.forecast) {
        const forecastResponse = await fetch(pointData.properties.forecast);
        return await forecastResponse.json();
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  private combineMarineData(weatherData: any, noaaResult: any, coordinates: Coordinates) {
    const noaa = noaaResult.status === 'fulfilled' ? noaaResult.value : null;

    const windSpeed = weatherData.wind?.speed || 0;
    const estimatedWaveHeight = Math.max(0.1, Math.pow(windSpeed / 3.6, 2) / 10);

    const beaufortScale = this.windSpeedToBeaufort(windSpeed);
    const seaState = Math.min(6, Math.floor(beaufortScale / 2));

    return {
      wave_height: this.extractWaveHeight(noaa) || estimatedWaveHeight,
      wave_direction: weatherData.wind?.deg || Math.random() * 360,
      wave_period: this.calculateWavePeriod(estimatedWaveHeight),
      swell_height: estimatedWaveHeight * 0.7,
      swell_direction: (weatherData.wind?.deg || 0) + 15,
      swell_period: this.calculateWavePeriod(estimatedWaveHeight) * 1.5,
      sea_surface_temperature: this.estimateSST(weatherData.main.temp, coordinates.lat),
      visibility: this.calculateVisibility(weatherData),
      sea_state: seaState,
      tide_height: this.estimateTideHeight(coordinates.lat, coordinates.lon),
      current_speed: this.estimateCurrentSpeed(windSpeed, coordinates.lat),
      current_direction: weatherData.wind?.deg || Math.random() * 360,
    };
  }

  private windSpeedToBeaufort(windSpeedMs: number): number {
    const windSpeedKnots = windSpeedMs * 1.944;
    if (windSpeedKnots < 1) return 0;
    if (windSpeedKnots < 4) return 1;
    if (windSpeedKnots < 7) return 2;
    if (windSpeedKnots < 11) return 3;
    if (windSpeedKnots < 16) return 4;
    if (windSpeedKnots < 22) return 5;
    if (windSpeedKnots < 28) return 6;
    if (windSpeedKnots < 34) return 7;
    if (windSpeedKnots < 41) return 8;
    if (windSpeedKnots < 48) return 9;
    if (windSpeedKnots < 56) return 10;
    if (windSpeedKnots < 64) return 11;
    return 12;
  }

  private calculateWavePeriod(waveHeight: number): number {
    return Math.max(2, 3.86 * Math.sqrt(waveHeight));
  }

  private estimateSST(airTemp: number, lat: number): number {
    const latitudeFactor = Math.cos(lat * Math.PI / 180);
    return airTemp + (latitudeFactor * 2) - 1;
  }

  private calculateVisibility(weatherData: any): number {
    if (weatherData.visibility) {
      return weatherData.visibility / 1000;
    }
    
    const weather = weatherData.weather?.[0]?.main?.toLowerCase() || '';
    if (weather.includes('fog') || weather.includes('mist')) return 2;
    if (weather.includes('rain') || weather.includes('snow')) return 8;
    if (weather.includes('cloud')) return 15;
    return 25;
  }

  private estimateTideHeight(lat: number, lon: number): number {
    const time = Date.now();
    const tidalCycle = 12.42 * 60 * 60 * 1000;
    
    const locationFactor = Math.sin(lat * Math.PI / 180) * Math.cos(lon * Math.PI / 180);
    const phase = (time % tidalCycle) / tidalCycle * 2 * Math.PI;
    const baseAmplitude = 2 + Math.abs(locationFactor);
    
    return Math.sin(phase) * baseAmplitude;
  }

  private estimateCurrentSpeed(windSpeed: number, lat: number): number {
    const windFactor = windSpeed * 0.025;
    const latitudeFactor = Math.abs(Math.sin(lat * Math.PI / 180));
    return Math.max(0.1, windFactor * (1 + latitudeFactor));
  }

  private extractWaveHeight(noaa: any): number | null {
    if (noaa?.properties?.periods) {
      for (const period of noaa.properties.periods) {
        if (period.detailedForecast?.includes('wave')) {
          const match = period.detailedForecast.match(/(\d+(?:\.\d+)?)\s*(?:to\s*(\d+(?:\.\d+)?)\s*)?(?:foot|feet|ft|meter|metres|m)/i);
          if (match) {
            const height = parseFloat(match[1]);
            return match[0].includes('foot') || match[0].includes('ft') ? height * 0.3048 : height;
          }
        }
      }
    }
    return null;
  }

  private async getSimulatedMarineWeather({ lat, lon }: Coordinates): Promise<MarineWeatherData> {
    const weatherUrl = this.createUrl(`${API_CONFIG.BASE_URL}/weather`, {
      lat: lat.toString(),
      lon: lon.toString(),
      units: "metric",
    });
    
    const weatherData = await this.fetchData<any>(weatherUrl);
    
    return {
      ...weatherData,
      marine: {
        wave_height: Math.random() * 4 + 0.5,
        wave_direction: Math.random() * 360,
        wave_period: Math.random() * 8 + 4,
        swell_height: Math.random() * 3 + 0.3,
        swell_direction: Math.random() * 360,
        swell_period: Math.random() * 10 + 8,
        sea_surface_temperature: weatherData.main.temp + Math.random() * 4 - 2,
        visibility: Math.random() * 20 + 5,
        sea_state: Math.floor(Math.random() * 6),
        tide_height: Math.sin(Date.now() / 1000000) * 2,
        current_speed: Math.random() * 2,
        current_direction: Math.random() * 360,
      },
    };
  }


  async getMaritimeAlerts({ lat, lon }: Coordinates): Promise<MaritimeAlert[]> {
    const alerts: MaritimeAlert[] = [];
    
    if (Math.random() > 0.7) {
      alerts.push({
        id: "alert-1",
        type: "storm",
        severity: "medium",
        title: "Small Craft Advisory",
        description: "Winds 15-25 knots with gusts to 30 knots expected",
        area: {
          coordinates: [
            { lat: lat - 1, lon: lon - 1 },
            { lat: lat + 1, lon: lon + 1 },
          ],
        },
        valid_from: new Date().toISOString(),
        valid_until: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        issued_by: "Maritime Weather Service",
      });
    }

    if (Math.random() > 0.8) {
      alerts.push({
        id: "alert-2",
        type: "fog",
        severity: "low",
        title: "Dense Fog Warning",
        description: "Visibility reduced to less than 1 nautical mile",
        area: {
          coordinates: [
            { lat: lat - 0.5, lon: lon - 0.5 },
            { lat: lat + 0.5, lon: lon + 0.5 },
          ],
        },
        valid_from: new Date().toISOString(),
        valid_until: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
        issued_by: "Coast Guard",
      });
    }

    return alerts;
  }


  async getOptimalRoutes(
    from: Coordinates,
    to: Coordinates,
    shipType: string = "cargo"
  ): Promise<Route[]> {
    try {
      const midpoint = { 
        lat: (from.lat + to.lat) / 2, 
        lon: (from.lon + to.lon) / 2 
      };

      const [originWeather, destWeather, midpointWeather] = await Promise.allSettled([
        this.getMarineWeather(from),
        this.getMarineWeather(to),
        this.getMarineWeather(midpoint)
      ]);

      const routes: Route[] = [
        await this.generateDirectRoute(from, to, originWeather, destWeather, shipType),
        await this.generateWeatherOptimizedRoute(from, to, midpoint, originWeather, destWeather, midpointWeather, shipType),
        await this.generateCoastalRoute(from, to, originWeather, destWeather, shipType)
      ];

      return routes.sort((a, b) => {
        const scoreA = this.calculateRouteScore(a);
        const scoreB = this.calculateRouteScore(b);
        return scoreB - scoreA;
      });

    } catch (error) {
      console.warn('Failed to get weather data for route optimization, using fallback:', error);
      return this.getFallbackRoutes(from, to);
    }
  }

  private async generateDirectRoute(
    from: Coordinates, 
    to: Coordinates, 
    originWeather: any, 
    destWeather: any,
    shipType: string
  ): Promise<Route> {
    const distance = this.calculateDistance(from, to);
    const avgWeatherRisk = this.calculateWeatherRisk(originWeather, destWeather);
    const avgWindSpeed = this.getAverageWindSpeed(originWeather, destWeather);
    
    const baseSpeed = this.getShipBaseSpeed(shipType);
    const speedAdjustment = this.calculateSpeedAdjustment(avgWindSpeed, avgWeatherRisk);
    const adjustedSpeed = baseSpeed * speedAdjustment;

    return {
      id: "route-1",
      name: "Direct Route",
      waypoints: [from, to],
      distance,
      estimated_duration: this.calculateDuration(from, to, adjustedSpeed),
      weather_risk: avgWeatherRisk,
      fuel_efficiency: this.calculateFuelEfficiency(adjustedSpeed, avgWeatherRisk),
    };
  }

  private async generateWeatherOptimizedRoute(
    from: Coordinates, 
    to: Coordinates, 
    midpoint: Coordinates,
    originWeather: any, 
    destWeather: any, 
    midpointWeather: any,
    shipType: string
  ): Promise<Route> {
    const weatherConditions = [originWeather, midpointWeather, destWeather];
    const bestWeatherOffset = this.findBestWeatherOffset(weatherConditions);
    
    const optimizedMidpoint = {
      lat: midpoint.lat + bestWeatherOffset.lat,
      lon: midpoint.lon + bestWeatherOffset.lon
    };

    const totalDistance = 
      this.calculateDistance(from, optimizedMidpoint) + 
      this.calculateDistance(optimizedMidpoint, to);

    const avgWeatherRisk = this.calculateAverageWeatherRisk(weatherConditions);
    const avgWindSpeed = this.getAverageWindSpeedFromConditions(weatherConditions);
    
    const baseSpeed = this.getShipBaseSpeed(shipType) * 1.05;
    const speedAdjustment = this.calculateSpeedAdjustment(avgWindSpeed, avgWeatherRisk);
    const adjustedSpeed = baseSpeed * speedAdjustment;

    return {
      id: "route-2",
      name: "Weather Optimized Route",
      waypoints: [from, optimizedMidpoint, to],
      distance: totalDistance,
      estimated_duration: totalDistance / adjustedSpeed,
      weather_risk: avgWeatherRisk,
      fuel_efficiency: this.calculateFuelEfficiency(adjustedSpeed, avgWeatherRisk, 1.05),
    };
  }

  private async generateCoastalRoute(
    from: Coordinates, 
    to: Coordinates, 
    originWeather: any, 
    destWeather: any,
    shipType: string
  ): Promise<Route> {
    const coastalWaypoints = [
      from,
      { lat: from.lat + 0.2, lon: from.lon + 0.3 },
      { lat: to.lat - 0.2, lon: to.lon - 0.3 },
      to,
    ];

    let totalDistance = 0;
    for (let i = 0; i < coastalWaypoints.length - 1; i++) {
      totalDistance += this.calculateDistance(coastalWaypoints[i], coastalWaypoints[i + 1]);
    }

    const avgWindSpeed = this.getAverageWindSpeed(originWeather, destWeather);
    
    const baseSpeed = this.getShipBaseSpeed(shipType) * 0.8;
    const speedAdjustment = this.calculateSpeedAdjustment(avgWindSpeed, "low");
    const adjustedSpeed = baseSpeed * speedAdjustment;

    return {
      id: "route-3",
      name: "Coastal Route",
      waypoints: coastalWaypoints,
      distance: totalDistance,
      estimated_duration: totalDistance / adjustedSpeed,
      weather_risk: "low",
      fuel_efficiency: this.calculateFuelEfficiency(adjustedSpeed, "low", 0.95),
    };
  }

  private calculateWeatherRisk(weather1: any, weather2: any): "low" | "medium" | "high" {
    const w1 = weather1.status === 'fulfilled' ? weather1.value : null;
    const w2 = weather2.status === 'fulfilled' ? weather2.value : null;

    if (!w1 || !w2) return "medium";

    const avgWindSpeed = ((w1.wind?.speed || 0) + (w2.wind?.speed || 0)) / 2;
    const avgWaveHeight = ((w1.marine?.wave_height || 1) + (w2.marine?.wave_height || 1)) / 2;
    
    if (avgWindSpeed > 15 || avgWaveHeight > 3) return "high";
    if (avgWindSpeed > 10 || avgWaveHeight > 2) return "medium";
    return "low";
  }

  private getAverageWindSpeed(weather1: any, weather2: any): number {
    const w1 = weather1.status === 'fulfilled' ? weather1.value : null;
    const w2 = weather2.status === 'fulfilled' ? weather2.value : null;

    const speed1 = w1?.wind?.speed || 5;
    const speed2 = w2?.wind?.speed || 5;
    return (speed1 + speed2) / 2;
  }

  private calculateSpeedAdjustment(windSpeed: number, weatherRisk: string): number {
    let adjustment = 1.0;
    
    if (windSpeed > 20) adjustment *= 0.7;
    else if (windSpeed > 15) adjustment *= 0.8;
    else if (windSpeed > 10) adjustment *= 0.9;
    else if (windSpeed < 5) adjustment *= 1.1;
    
    if (weatherRisk === "high") adjustment *= 0.8;
    else if (weatherRisk === "medium") adjustment *= 0.9;
    else adjustment *= 1.05;
    
    return Math.max(0.5, Math.min(1.3, adjustment));
  }

  private calculateFuelEfficiency(speed: number, weatherRisk: string, bonus: number = 1.0): number {
    let efficiency = 85;
    
    if (speed >= 12 && speed <= 16) efficiency += 10;
    else if (speed < 10 || speed > 20) efficiency -= 15;
    else efficiency -= 5;
    
    if (weatherRisk === "low") efficiency += 5;
    else if (weatherRisk === "high") efficiency -= 10;
    
    return Math.max(50, Math.min(100, efficiency * bonus));
  }

  private findBestWeatherOffset(weatherConditions: any[]): { lat: number; lon: number } {
    const avgWindDir = weatherConditions.reduce((sum, w) => {
      const weather = w.status === 'fulfilled' ? w.value : null;
      return sum + (weather?.wind?.deg || 180);
    }, 0) / weatherConditions.length;

    const offsetAngle = (avgWindDir + 90) * Math.PI / 180;
    return {
      lat: Math.cos(offsetAngle) * 0.5,
      lon: Math.sin(offsetAngle) * 0.5
    };
  }

  private calculateAverageWeatherRisk(weatherConditions: any[]): "low" | "medium" | "high" {
    const risks = weatherConditions.map(w => {
      const weather = w.status === 'fulfilled' ? w.value : null;
      if (!weather) return 1; // medium risk
      
      const windSpeed = weather.wind?.speed || 0;
      const waveHeight = weather.marine?.wave_height || 1;
      
      if (windSpeed > 15 || waveHeight > 3) return 2;
      if (windSpeed > 10 || waveHeight > 2) return 1;
      return 0;
    });

    const avgRisk = risks.reduce((sum: number, risk) => sum + risk, 0) / risks.length;
    if (avgRisk >= 1.5) return "high";
    if (avgRisk >= 0.5) return "medium";
    return "low";
  }

  private getAverageWindSpeedFromConditions(weatherConditions: any[]): number {
    const speeds = weatherConditions.map(w => {
      const weather = w.status === 'fulfilled' ? w.value : null;
      return weather?.wind?.speed || 5;
    });
    return speeds.reduce((sum, speed) => sum + speed, 0) / speeds.length;
  }

  private calculateRouteScore(route: Route): number {
    let score = route.fuel_efficiency;
    
    if (route.weather_risk === "high") score -= 20;
    else if (route.weather_risk === "medium") score -= 10;
    
    const durationPenalty = Math.min(15, route.estimated_duration * 0.5);
    score -= durationPenalty;
    
    return score;
  }

  private getFallbackRoutes(from: Coordinates, to: Coordinates): Route[] {
    const distance = this.calculateDistance(from, to);
    
    return [
      {
        id: "route-1",
        name: "Direct Route",
        waypoints: [from, to],
        distance,
        estimated_duration: this.calculateDuration(from, to, 15),
        weather_risk: "medium",
        fuel_efficiency: 85,
      },
      {
        id: "route-2",
        name: "Weather Optimized Route",
        waypoints: [
          from,
          { lat: (from.lat + to.lat) / 2 + 0.5, lon: (from.lon + to.lon) / 2 },
          to,
        ],
        distance: distance * 1.1,
        estimated_duration: this.calculateDuration(from, to, 16),
        weather_risk: "low",
        fuel_efficiency: 92,
      },
      {
        id: "route-3",
        name: "Coastal Route",
        waypoints: [
          from,
          { lat: from.lat + 0.2, lon: from.lon + 0.3 },
          { lat: to.lat - 0.2, lon: to.lon - 0.3 },
          to,
        ],
        distance: distance * 1.2,
        estimated_duration: this.calculateDuration(from, to, 12),
        weather_risk: "low",
        fuel_efficiency: 78,
      },
    ];
  }

  private calculateDistance(from: Coordinates, to: Coordinates): number {
    const R = 6371;
    const dLat = this.toRad(to.lat - from.lat);
    const dLon = this.toRad(to.lon - from.lon);
    const lat1 = this.toRad(from.lat);
    const lat2 = this.toRad(to.lat);

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    return R * c * 0.539957;
  }

  private calculateDuration(from: Coordinates, to: Coordinates, speed: number): number {
    const distance = this.calculateDistance(from, to);
    return distance / speed;
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  private getShipBaseSpeed(shipType: string): number {
    const shipSpeeds: Record<string, number> = {
      'cargo': 14,
      'tanker': 13,
      'container': 18,
      'passenger': 20,
      'fishing': 10,
      'naval': 25
    };
    
    return shipSpeeds[shipType] || 15;
  }
}

export const marineWeatherAPI = new MarineWeatherAPI();
