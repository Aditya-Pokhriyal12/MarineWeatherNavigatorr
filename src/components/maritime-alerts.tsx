import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Alert, AlertDescription } from "./ui/alert";
import { AlertTriangle, Cloud, Navigation, Shield, Snowflake } from "lucide-react";
import type { MaritimeAlert } from "@/api/types";

interface MaritimeAlertsProps {
  alerts: MaritimeAlert[];
}

export function MaritimeAlerts({ alerts }: MaritimeAlertsProps) {
  const getAlertIcon = (type: MaritimeAlert["type"]) => {
    switch (type) {
      case "storm":
        return AlertTriangle;
      case "fog":
        return Cloud;
      case "navigation":
        return Navigation;
      case "security":
        return Shield;
      case "ice":
        return Snowflake;
      default:
        return AlertTriangle;
    }
  };

  const getAlertColor = (severity: MaritimeAlert["severity"]) => {
    switch (severity) {
      case "critical":
        return "border-red-500 bg-red-50 dark:bg-red-950/20";
      case "high":
        return "border-orange-500 bg-orange-50 dark:bg-orange-950/20";
      case "medium":
        return "border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20";
      case "low":
        return "border-blue-500 bg-blue-50 dark:bg-blue-950/20";
      default:
        return "border-gray-500 bg-gray-50 dark:bg-gray-950/20";
    }
  };

  const getSeverityText = (severity: MaritimeAlert["severity"]) => {
    return severity.charAt(0).toUpperCase() + severity.slice(1);
  };

  if (alerts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-green-500" />
            Maritime Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <Shield className="h-12 w-12 text-green-500 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              No active maritime alerts in your area
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              All clear for navigation
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          Maritime Alerts ({alerts.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {alerts.map((alert) => {
          const Icon = getAlertIcon(alert.type);
          return (
            <Alert
              key={alert.id}
              className={`${getAlertColor(alert.severity)} border-l-4`}
            >
              <Icon className="h-4 w-4" />
              <AlertDescription>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold">{alert.title}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        alert.severity === 'critical' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                        alert.severity === 'high' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' :
                        alert.severity === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                        'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                      }`}>
                        {getSeverityText(alert.severity)}
                      </span>
                    </div>
                    <p className="text-sm mb-2">{alert.description}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>Issued by: {alert.issued_by}</span>
                      <span>
                        Valid until: {new Date(alert.valid_until).toLocaleDateString()} {new Date(alert.valid_until).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          );
        })}
      </CardContent>
    </Card>
  );
}
