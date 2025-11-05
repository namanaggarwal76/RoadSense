import { useEffect, useState } from "react";
import { useFleet } from "@/contexts/FleetContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Users, 
  Route, 
  Calendar, 
  RefreshCw, 
  Wifi, 
  WifiOff, 
  AlertCircle,
  Database,
  Settings as SettingsIcon
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useNavigate } from "react-router-dom";

interface SidebarProps {
  selectedUser: string | null;
  selectedRide: string | null;
  onUserSelect: (userId: string) => void;
  onRideSelect: (rideId: string) => void;
}

export function Sidebar({ 
  selectedUser, 
  selectedRide, 
  onUserSelect, 
  onRideSelect 
}: SidebarProps) {
  const {
    state,
    refreshUsers,
    refreshRides,
    hasUsers,
    hasRides,
    isAnyLoading
  } = useFleet();

  const { 
    users, 
    userRides, 
    usersLoading, 
    ridesLoading, 
    usersError, 
    ridesError, 
    isConnected 
  } = state;

  const navigate = useNavigate();

  // Calculate total rides across all users
  const totalRides = users.length; // This is a simplified count - in real implementation you'd sum all rides

  return (
    <div className="w-80 h-screen bg-card border-r border-border p-6 flex flex-col">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Route className="w-6 h-6 text-primary" />
          Fleet Manager
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Real-time rider tracking dashboard
        </p>
      </div>

  <div className="space-y-6">
        {/* User Selection */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-sm">Select User</h3>
            </div>
            {usersError && (
              <Button
                onClick={refreshUsers}
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0"
              >
                <RefreshCw className="h-3 w-3" />
              </Button>
            )}
          </div>
          
          {usersError && (
            <Alert variant="destructive" className="mb-3">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                {usersError}
              </AlertDescription>
            </Alert>
          )}
          
          {usersLoading ? (
            <Skeleton className="h-10 w-full" />
          ) : (
            <Select value={selectedUser || ""} onValueChange={onUserSelect}>
              <SelectTrigger>
                <SelectValue placeholder={
                  hasUsers ? "Choose a user ID" : "No users available"
                } />
              </SelectTrigger>
              <SelectContent>
                {users.map((userId) => (
                  <SelectItem key={userId} value={userId}>
                    {userId}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </Card>

        {/* Ride Selection */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-sm">Select Ride</h3>
            </div>
            {ridesError && selectedUser && (
              <Button
                onClick={refreshRides}
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0"
              >
                <RefreshCw className="h-3 w-3" />
              </Button>
            )}
          </div>
          
          {ridesError && (
            <Alert variant="destructive" className="mb-3">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                {ridesError}
              </AlertDescription>
            </Alert>
          )}
          
          {ridesLoading ? (
            <Skeleton className="h-10 w-full" />
          ) : (
            <Select 
              value={selectedRide || ""} 
              onValueChange={onRideSelect}
              disabled={!selectedUser || !hasRides}
            >
              <SelectTrigger>
                <SelectValue placeholder={
                  !selectedUser 
                    ? "Select user first"
                    : ridesLoading
                    ? "Loading rides..."
                    : hasRides
                    ? "Choose a ride ID"
                    : "No rides available"
                } />
              </SelectTrigger>
              <SelectContent>
                {userRides.map((rideId) => (
                  <SelectItem key={rideId} value={rideId}>
                    {rideId}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </Card>

        {/* Settings Page Link */}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SettingsIcon className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-sm">Safety Settings</h3>
            </div>
            <Button size="sm" onClick={() => navigate('/safety')}>
              Open
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Configure risk categories and weights.
          </p>
        </Card>

        {/* Status */}
        {selectedUser && selectedRide && (
          <Card className="p-4 bg-primary/5 border-primary/20">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium text-primary">Active Session</div>
              <div className="flex items-center gap-1">
                {isConnected ? (
                  <Wifi className="h-3 w-3 text-green-500" />
                ) : (
                  <WifiOff className="h-3 w-3 text-red-500" />
                )}
              </div>
            </div>
            <div className="text-xs text-muted-foreground space-y-1">
              <div>User: {selectedUser}</div>
              <div>Ride: {selectedRide}</div>
              <div className="flex items-center gap-1 mt-2">
                <Database className="h-3 w-3" />
                <span>Firebase {isConnected ? 'Connected' : 'Disconnected'}</span>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Stats */}
      <div className="mt-auto pt-6 border-t border-border">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-primary">
              {usersLoading ? (
                <Skeleton className="h-8 w-12 mx-auto" />
              ) : (
                users.length
              )}
            </div>
            <div className="text-xs text-muted-foreground">Total Users</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-primary">
              {ridesLoading && selectedUser ? (
                <Skeleton className="h-8 w-12 mx-auto" />
              ) : (
                userRides.length
              )}
            </div>
            <div className="text-xs text-muted-foreground">
              {selectedUser ? 'User Rides' : 'Select User'}
            </div>
          </div>
        </div>
        
        {/* Connection status */}
        <div className="mt-4 text-center">
          <div className={`text-xs flex items-center justify-center gap-1 ${
            isConnected ? 'text-green-500' : 'text-red-500'
          }`}>
            {isConnected ? (
              <>
                <Wifi className="h-3 w-3" />
                <span>Real-time Active</span>
              </>
            ) : (
              <>
                <WifiOff className="h-3 w-3" />
                <span>Offline Mode</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}