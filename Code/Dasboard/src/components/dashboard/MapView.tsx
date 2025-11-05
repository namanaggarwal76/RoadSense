import { Card } from "@/components/ui/card";
import { MapPin, Navigation, AlertTriangle } from "lucide-react";
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import { LatLngBounds, Icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useMemo } from 'react';

interface MapViewProps {
  rideData: any[] | null;
}

// Fix for default marker icons in Leaflet with Vite
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Set up default icon
delete (Icon.Default.prototype as any)._getIconUrl;
Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

// Component to fit map bounds to the route
function FitBounds({ bounds }: { bounds: LatLngBounds }) {
  const map = useMap();
  
  useEffect(() => {
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [map, bounds]);
  
  return null;
}

export function MapView({ rideData }: MapViewProps) {
  if (!rideData) {
    return (
      <Card className="h-96 flex items-center justify-center bg-muted/20">
        <div className="text-center text-muted-foreground">
          <MapPin className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>Select a ride to view map</p>
        </div>
      </Card>
    );
  }

  // Prepare route coordinates and calculate bounds
  const routeCoordinates = useMemo(() => {
    return rideData
      .filter(point => point.latitudeNum !== 0 && point.longitudeNum !== 0)
      .map(point => [point.latitudeNum, point.longitudeNum] as [number, number]);
  }, [rideData]);

  // Find start and end points
  const startPoint = routeCoordinates[0];
  const endPoint = routeCoordinates[routeCoordinates.length - 1];

  // Find speed violation points
  const violationPoints = useMemo(() => {
    return rideData
      .filter(point => point.isSpeedViolation && point.latitudeNum !== 0 && point.longitudeNum !== 0)
      .map(point => ({
        position: [point.latitudeNum, point.longitudeNum] as [number, number],
        speed: point.speedNum,
        speedLimit: point.speedLimitNum,
        time: new Date(point.timestampNum).toLocaleTimeString()
      }));
  }, [rideData]);

  // Calculate bounds
  const bounds = useMemo(() => {
    if (routeCoordinates.length === 0) return new LatLngBounds([0, 0], [0, 0]);
    return new LatLngBounds(routeCoordinates);
  }, [routeCoordinates]);

  // Calculate center
  const center = useMemo(() => {
    if (routeCoordinates.length === 0) return [0, 0] as [number, number];
    return [bounds.getCenter().lat, bounds.getCenter().lng] as [number, number];
  }, [bounds, routeCoordinates.length]);

  if (routeCoordinates.length === 0) {
    return (
      <Card className="h-96 flex items-center justify-center bg-muted/20">
        <div className="text-center text-muted-foreground">
          <MapPin className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>No valid GPS coordinates in this ride</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="h-96 p-4">
      <div className="flex items-center gap-2 mb-4">
        <Navigation className="w-5 h-5 text-primary" />
        <h3 className="font-semibold">Route Map</h3>
        <div className="ml-auto flex items-center gap-4 text-sm">
          <span className="text-muted-foreground">
            {routeCoordinates.length} GPS points
          </span>
          {violationPoints.length > 0 && (
            <div className="flex items-center gap-1 text-destructive">
              <AlertTriangle className="w-4 h-4" />
              <span>{violationPoints.length} violations</span>
            </div>
          )}
        </div>
      </div>
      
      <div className="h-80 rounded-lg overflow-hidden border border-border">
        <MapContainer
          center={center}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
        >
          {/* OpenStreetMap Tile Layer - Free and requires no API token */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
          />
          
          {/* Fit bounds to show entire route */}
          <FitBounds bounds={bounds} />
          
          {/* Draw route polyline */}
          <Polyline
            positions={routeCoordinates}
            color="#3b82f6"
            weight={4}
            opacity={0.7}
          />
          
          {/* Start marker */}
          {startPoint && (
            <Marker position={startPoint}>
              <Popup>
                <div className="text-sm">
                  <strong>Start Point</strong><br />
                  Lat: {startPoint[0].toFixed(6)}<br />
                  Lng: {startPoint[1].toFixed(6)}
                </div>
              </Popup>
            </Marker>
          )}
          
          {/* End marker */}
          {endPoint && routeCoordinates.length > 1 && (
            <Marker position={endPoint}>
              <Popup>
                <div className="text-sm">
                  <strong>End Point</strong><br />
                  Lat: {endPoint[0].toFixed(6)}<br />
                  Lng: {endPoint[1].toFixed(6)}
                </div>
              </Popup>
            </Marker>
          )}
          
          {/* Speed violation markers */}
          {violationPoints.map((violation, idx) => (
            <Marker
              key={idx}
              position={violation.position}
              icon={new Icon({
                iconUrl: 'data:image/svg+xml;base64,' + btoa(`
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="red" width="32" height="32">
                    <path d="M12 2L1 21h22L12 2zm0 3.5L19.5 19h-15L12 5.5zM11 10v4h2v-4h-2zm0 5v2h2v-2h-2z"/>
                  </svg>
                `),
                iconSize: [32, 32],
                iconAnchor: [16, 32],
                popupAnchor: [0, -32]
              })}
            >
              <Popup>
                <div className="text-sm">
                  <strong className="text-destructive">Speed Violation</strong><br />
                  Time: {violation.time}<br />
                  Speed: {violation.speed.toFixed(1)} km/h<br />
                  Limit: {violation.speedLimit.toFixed(1)} km/h<br />
                  Over by: {(violation.speed - violation.speedLimit).toFixed(1)} km/h
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </Card>
  );
}