import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Route, Fuel, Clock, TrendingUp, MapPin, Ship } from "lucide-react";
import { useOptimalRoutesQuery } from "@/hooks/use-marine-weather";
import type { Coordinates, Route as RouteType } from "@/api/types";

interface RouteOptimizerProps {
  currentPosition: Coordinates;
}

export function RouteOptimizer({ currentPosition }: RouteOptimizerProps) {
  const [destination, setDestination] = useState<Coordinates | null>(null);
  const [shipType, setShipType] = useState("cargo");
  const [destinationInput, setDestinationInput] = useState("");

  const routesQuery = useOptimalRoutesQuery(currentPosition, destination, shipType);

  const handleDestinationSubmit = () => {
    // Simple coordinate parsing (lat,lon)
    const coords = destinationInput.split(',').map(s => parseFloat(s.trim()));
    if (coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
      setDestination({ lat: coords[0], lon: coords[1] });
    }
  };

  const getRiskColor = (risk: RouteType["weather_risk"]) => {
    switch (risk) {
      case "low":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "high":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const formatDuration = (hours: number) => {
    const days = Math.floor(hours / 24);
    const remainingHours = Math.floor(hours % 24);
    const minutes = Math.floor((hours % 1) * 60);
    
    if (days > 0) {
      return `${days}d ${remainingHours}h ${minutes}m`;
    }
    return `${remainingHours}h ${minutes}m`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Route className="h-5 w-5 text-blue-500" />
          Route Optimization
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Route Planning Form */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="destination">Destination (lat,lon)</Label>
            <div className="flex gap-2">
              <Input
                id="destination"
                placeholder="e.g., 51.9244, 4.4777"
                value={destinationInput}
                onChange={(e) => setDestinationInput(e.target.value)}
              />
              <Button onClick={handleDestinationSubmit} size="sm">
                <MapPin className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="ship-type">Vessel Type</Label>
            <Select value={shipType} onValueChange={setShipType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cargo">Cargo Ship</SelectItem>
                <SelectItem value="tanker">Tanker</SelectItem>
                <SelectItem value="container">Container Ship</SelectItem>
                <SelectItem value="passenger">Passenger Ship</SelectItem>
                <SelectItem value="fishing">Fishing Vessel</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Current Position Display */}
        <div className="p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2 text-sm">
            <Ship className="h-4 w-4 text-blue-500" />
            <span className="font-medium">Current Position:</span>
            <span>{currentPosition.lat.toFixed(4)}°, {currentPosition.lon.toFixed(4)}°</span>
          </div>
        </div>

        {/* Route Results */}
        {routesQuery.data && routesQuery.data.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-semibold text-sm">Recommended Routes</h4>
            {routesQuery.data.map((route, index) => (
              <div
                key={route.id}
                className={`p-4 rounded-lg border ${
                  index === 0 ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20' : 
                  'border-border bg-background'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h5 className="font-medium flex items-center gap-2">
                      {route.name}
                      {index === 0 && (
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          Recommended
                        </Badge>
                      )}
                    </h5>
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Route className="h-3 w-3" />
                        <span>{route.distance.toFixed(1)} nm</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{formatDuration(route.estimated_duration)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Fuel className="h-3 w-3" />
                        <span>{route.fuel_efficiency}% efficiency</span>
                      </div>
                    </div>
                  </div>
                  <Badge className={getRiskColor(route.weather_risk)}>
                    {route.weather_risk} risk
                  </Badge>
                </div>

                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="text-center p-2 bg-muted/30 rounded">
                    <div className="font-medium text-green-600">Distance</div>
                    <div>{route.distance.toFixed(1)} nm</div>
                  </div>
                  <div className="text-center p-2 bg-muted/30 rounded">
                    <div className="font-medium text-blue-600">Duration</div>
                    <div>{formatDuration(route.estimated_duration)}</div>
                  </div>
                  <div className="text-center p-2 bg-muted/30 rounded">
                    <div className="font-medium text-purple-600">Efficiency</div>
                    <div className="flex items-center justify-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      {route.fuel_efficiency}%
                    </div>
                  </div>
                </div>

                <div className="mt-3 text-xs text-muted-foreground">
                  <span>Waypoints: {route.waypoints.length}</span>
                  <span className="ml-4">Weather conditions considered</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {routesQuery.isLoading && (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="text-sm text-muted-foreground mt-2">Calculating optimal routes...</p>
          </div>
        )}

        {!destination && (
          <div className="text-center py-6 text-muted-foreground">
            <Route className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">Enter a destination to calculate optimal routes</p>
            <p className="text-xs mt-1">AI-powered route optimization considers weather, fuel efficiency, and safety</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
