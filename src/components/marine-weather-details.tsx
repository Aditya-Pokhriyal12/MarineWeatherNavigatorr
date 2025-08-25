import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Waves, Navigation, Thermometer, Eye, Anchor, Wind } from "lucide-react";
import type { MarineWeatherData } from "@/api/types";

interface MarineWeatherDetailsProps {
  data: MarineWeatherData;
}

export function MarineWeatherDetails({ data }: MarineWeatherDetailsProps) {
  const { marine } = data;

  const getSeaStateDescription = (state: number) => {
    const descriptions = [
      "Calm (glassy)", "Calm (rippled)", "Smooth", "Slight", 
      "Moderate", "Rough", "Very rough", "High", "Very high", "Phenomenal"
    ];
    return descriptions[state] || "Unknown";
  };

  const getWindDirection = (degree: number) => {
    const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
    const index = Math.round(((degree %= 360) < 0 ? degree + 360 : degree) / 45) % 8;
    return directions[index];
  };

  const marineDetails = [
    {
      title: "Wave Height",
      value: `${marine.wave_height.toFixed(1)}m`,
      subtitle: `${getWindDirection(marine.wave_direction)} (${marine.wave_direction.toFixed(0)}°)`,
      icon: Waves,
      color: "text-blue-500",
    },
    {
      title: "Sea Surface Temp",
      value: `${marine.sea_surface_temperature.toFixed(1)}°C`,
      subtitle: `Swell: ${marine.swell_height.toFixed(1)}m`,
      icon: Thermometer,
      color: "text-cyan-500",
    },
    {
      title: "Visibility",
      value: `${marine.visibility.toFixed(1)} km`,
      subtitle: `Sea State: ${marine.sea_state}`,
      icon: Eye,
      color: "text-yellow-500",
    },
    {
      title: "Wave Period",
      value: `${marine.wave_period.toFixed(1)}s`,
      subtitle: `Swell: ${marine.swell_period.toFixed(1)}s`,
      icon: Navigation,
      color: "text-green-500",
    },
    {
      title: "Tide Height",
      value: `${marine.tide_height > 0 ? '+' : ''}${marine.tide_height.toFixed(2)}m`,
      subtitle: marine.tide_height > 0 ? "High Tide" : "Low Tide",
      icon: Anchor,
      color: "text-indigo-500",
    },
    {
      title: "Current",
      value: `${marine.current_speed.toFixed(1)} kts`,
      subtitle: `${getWindDirection(marine.current_direction)} (${marine.current_direction.toFixed(0)}°)`,
      icon: Wind,
      color: "text-purple-500",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Waves className="h-5 w-5 text-blue-500" />
          Marine Conditions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {marineDetails.map((detail) => (
            <div
              key={detail.title}
              className="flex items-start gap-3 rounded-lg border p-4 bg-gradient-to-br from-background to-muted/20"
            >
              <detail.icon className={`h-5 w-5 mt-0.5 ${detail.color}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium leading-none">
                  {detail.title}
                </p>
                <p className="text-lg font-bold mt-1">{detail.value}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {detail.subtitle}
                </p>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-4 p-3 rounded-lg bg-muted/50">
          <p className="text-sm font-medium mb-1">Sea State</p>
          <p className="text-sm text-muted-foreground">
            {getSeaStateDescription(marine.sea_state)} - Scale {marine.sea_state}/9
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
