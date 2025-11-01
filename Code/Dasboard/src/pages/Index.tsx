import { useState } from "react";
import { useFleet } from "@/contexts/FleetContext";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { MapView } from "@/components/dashboard/MapView";
import { SpeedChart } from "@/components/dashboard/SpeedChart";
import { AccelerationXChart } from "@/components/dashboard/AccelerationXChart";
import { AccelerationYChart } from "@/components/dashboard/AccelerationYChart";
import { AccelerationZChart } from "@/components/dashboard/AccelerationZChart";
import { WarningsList } from "@/components/dashboard/WarningsList";
import { Button } from "@/components/ui/button";
import { RefreshCw, AlertCircle, Wifi, WifiOff, BarChart3, Calculator } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useMemo } from "react";
import { computeSafetyScore, defaultSettings, type Row, type Settings } from "@/lib/safety";
import { subscribeToSafetySettings } from "@/services/firebaseApi";
import { useNavigate } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";

const Index = () => {
  const [analysisMode, setAnalysisMode] = useState<'raw' | 'score'>('raw');
  
  const {
    state,
    selectUser,
    selectRide,
    refreshUsers,
    refreshRides,
    refreshRideData,
    hasUsers,
    hasRides,
    hasRideData,
    isAnyLoading,
    hasAnyError
  } = useFleet();

  // Extract current selections and data
  const { selectedUserId, selectedRideId, rideData, isConnected } = state;

  // Handle user selection
  const handleUserSelect = (userId: string) => {
    selectUser(userId);
  };

  // Handle ride selection
  const handleRideSelect = (rideId: string) => {
    selectRide(rideId);
  };

  // Handle refresh actions
  const handleRefresh = () => {
    if (!selectedUserId) {
      refreshUsers();
    } else if (!selectedRideId) {
      refreshRides();
    } else {
      refreshRideData();
    }
  };

  const navigate = useNavigate();

  // Map Firebase ParsedRideDataPoint -> safety Row shape
  const safetyRows: Row[] = useMemo(() => {
    if (!rideData || !rideData.length) return [];
    const DEG2RAD = Math.PI / 180;
    return rideData.map((p) => ({
      timestamp: p.timestamp,
      accel_x: p.accXNum, // already in m/s^2
      accel_y: p.accYNum,
      accel_z: p.accZNum,
      angular_x: p.gyroXNum * DEG2RAD, // convert deg/s -> rad/s
      angular_y: p.gyroYNum * DEG2RAD,
      angular_z: p.gyroZNum * DEG2RAD,
      latitude: p.latitudeNum,
      longitude: p.longitudeNum,
      speed: p.speedNum,
      speed_limit: Number.isFinite(p.speedLimitNum) ? p.speedLimitNum : null,
      warnings: Array.isArray((p as any).warningsArr) ? (p as any).warningsArr as string[] : [],
    }));
  }, [rideData]);

  const [globalSettings, setGlobalSettings] = useState<Settings>(defaultSettings);
  // Subscribe to global safety settings
  useMemo(() => {
    const unsub = subscribeToSafetySettings((s) => {
      setGlobalSettings(s ?? defaultSettings);
    });
    return () => { unsub && unsub(); };
  }, []);

  const scoreOutput = useMemo(() => {
    if (!safetyRows.length) return null;
    return computeSafetyScore(safetyRows, globalSettings);
  }, [safetyRows, globalSettings]);

  const renderStars = (stars: number) => {
    const full = Math.floor(stars);
    const half = stars - full >= 0.5;
    const out: string[] = [];
    for (let i = 0; i < full; i++) out.push("★");
    if (half) out.push("☆");
    while (out.length < 5) out.push("✩");
    return <span className="text-yellow-500 tracking-wider">{out.join(" ")}</span>;
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Fixed Sidebar */}
      <div className="fixed left-0 top-0 h-screen z-10">
        <Sidebar 
          selectedUser={selectedUserId}
          selectedRide={selectedRideId}
          onUserSelect={handleUserSelect}
          onRideSelect={handleRideSelect}
        />
      </div>
      
      {/* Main Dashboard with left margin to account for fixed sidebar */}
      <div className="flex-1 ml-80 p-6 overflow-auto">
        {!selectedUserId || !selectedRideId ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Fleet Management Dashboard
              </h2>
              <p className="text-muted-foreground">
                {!hasUsers && isAnyLoading 
                  ? "Loading users from Firebase..."
                  : !hasUsers
                  ? "No users found. Please check your Firebase configuration."
                  : !selectedUserId
                  ? "Select a user from the sidebar to view their rides"
                  : !hasRides && isAnyLoading
                  ? "Loading rides..."
                  : !hasRides
                  ? "No rides found for this user"
                  : "Select a ride to view tracking data"
                }
              </p>
              
              {/* Connection status indicator */}
              <div className="flex items-center justify-center gap-2 text-sm">
                {isConnected ? (
                  <>
                    <Wifi className="h-4 w-4 text-green-500" />
                    <span className="text-green-500">Connected to Firebase</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="h-4 w-4 text-red-500" />
                    <span className="text-red-500">Disconnected from Firebase</span>
                  </>
                )}
              </div>
              
              {/* Refresh button */}
              {!isAnyLoading && (
                <Button 
                  onClick={handleRefresh}
                  variant="outline"
                  className="mt-4"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Data
                </Button>
              )}

              {/* Demo button removed as requested */}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Error alerts */}
            {hasAnyError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {state.usersError || state.ridesError || state.rideDataError}
                </AlertDescription>
              </Alert>
            )}
            
            {/* Header */}
            <div className="bg-card rounded-lg p-4 border border-border">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold">
                    Ride Analysis: {selectedRideId}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    User: {selectedUserId} • {rideData?.length || 0} data points
                    {isAnyLoading && " • Loading..."}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <ThemeToggle />
                  {/* Analysis Mode Toggle */}
                  <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                  <Button
                    variant={analysisMode === 'raw' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setAnalysisMode('raw')}
                    className="h-8 px-3"
                  >
                    <BarChart3 className="w-4 h-4 mr-1" />
                    Raw Data
                  </Button>
                  <Button
                    variant={analysisMode === 'score' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setAnalysisMode('score')}
                    className="h-8 px-3"
                  >
                    <Calculator className="w-4 h-4 mr-1" />
                    Score Calculation
                  </Button>
                  </div>
                </div>
              </div>
            </div>
            
            {analysisMode === 'raw' ? (
              <>
                {/* Top Row - Map and Warnings */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">
                    <MapView rideData={rideData} />
                  </div>
                  <div>
                    <WarningsList rideData={rideData} />
                  </div>
                </div>
                
                {/* 2x2 Charts: Speed + 3 axes acceleration */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <SpeedChart rideData={rideData} />
                  <AccelerationXChart rideData={rideData} />
                  <AccelerationYChart rideData={rideData} />
                  <AccelerationZChart rideData={rideData} />
                </div>
              </>
            ) : (
              /* Score Calculation View */
              <div className="bg-card rounded-lg border border-border p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold">Ride Safety Score</h3>
                </div>
                {!scoreOutput ? (
                  <div className="text-sm text-muted-foreground">No data available to compute score.</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-1 space-y-2">
                      <div className="text-4xl font-extrabold">{scoreOutput.score.toFixed(1)}<span className="text-xl font-semibold text-muted-foreground">/100</span></div>
                      <div className="text-lg">{renderStars(scoreOutput.stars)} <span className="text-sm text-muted-foreground">({scoreOutput.stars}★)</span></div>
                      <div className="text-xs text-muted-foreground">Good Driving: {(scoreOutput.breakdown.good_ratio * 100).toFixed(1)}%</div>
                    </div>
                    <div className="md:col-span-2 grid grid-cols-2 gap-4 text-sm">
                      <div className="bg-muted/30 p-3 rounded">
                        <div className="text-muted-foreground text-xs">Negative Effect</div>
                        <div className="font-semibold">{scoreOutput.breakdown.neg_effect.toFixed(2)}</div>
                      </div>
                      <div className="bg-muted/30 p-3 rounded">
                        <div className="text-muted-foreground text-xs">Positive Bonus</div>
                        <div className="font-semibold">{scoreOutput.breakdown.positive_bonus.toFixed(2)}</div>
                      </div>
                      {/* Bump penalty removed; maneuver quality is measured via Bad Handling counts */}
                      {scoreOutput.breakdown.overspeed_magnitude_avg !== undefined && (
                        <div className="bg-muted/30 p-3 rounded">
                          <div className="text-muted-foreground text-xs">Avg Overspeed Magnitude</div>
                          <div className="font-semibold">{(scoreOutput.breakdown.overspeed_magnitude_avg * 100).toFixed(1)}%</div>
                        </div>
                      )}
                    </div>
                    <div className="md:col-span-3">
                      <h4 className="font-semibold mb-2">Event Counts</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
                        {Object.entries(scoreOutput.breakdown.counts).map(([k, v]) => (
                          <div key={k} className="bg-muted/30 p-2 rounded flex items-center justify-between"><span>{k}</span><span className="font-semibold">{v}</span></div>
                        ))}
                      </div>
                      {scoreOutput.notes.length > 0 && (
                        <ul className="mt-3 list-disc list-inside text-xs text-muted-foreground">
                          {scoreOutput.notes.map((n) => (
                            <li key={n}>{n}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
