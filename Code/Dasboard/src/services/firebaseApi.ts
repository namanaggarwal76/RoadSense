// Firebase API abstraction layer for fleet management data
// Follows Firebase Realtime Database Schema for Two-Wheeler-Event-Detection
// Base DB URL: https://wheeler-event-detection-default-rtdb.asia-southeast1.firebasedatabase.app
import { database } from '../config/firebaseConfig.js';
import { ref, get, onValue, off, set } from 'firebase/database';
import type { Settings } from '@/lib/safety';

export interface RideDataPoint {
  timestamp: string; // Datetime string format "2025-10-03 14:25:30.123" from CSV
  acc_x: string; // Acceleration X as string from CSV (in g)
  acc_y: string; // Acceleration Y as string from CSV (in g)
  acc_z: string; // Acceleration Z as string from CSV (in g)
  gyro_x: string; // Gyroscope X as string from CSV
  gyro_y: string; // Gyroscope Y as string from CSV
  gyro_z: string; // Gyroscope Z as string from CSV
  latitude: string; // Latitude as string from CSV
  longitude: string; // Longitude as string from CSV
  speed: string; // Speed as string from CSV
  speed_limit: string; // Speed limit as string from CSV
  warning?: string; // Optional: CSV-provided warning name(s) (e.g., "Overspeeding" or comma/pipe-separated)
  lstm_prediction?: string; // Optional: LSTM model label: straight | stop | left | right | bump
}

export interface ParsedRideDataPoint extends RideDataPoint {
  timestampNum: number;
  latitudeNum: number;
  longitudeNum: number;
  speedNum: number;
  speedLimitNum: number;
  accXNum: number;
  accYNum: number;
  accZNum: number;
  gyroXNum: number;
  gyroYNum: number;
  gyroZNum: number;
  isSpeedViolation: boolean;
  totalAcceleration: number;
  warningsArr?: string[]; // Parsed warnings from CSV (source of truth for UI and scoring)
}

// Rider control structure for ride management
export interface RideStatus {
  is_active: boolean;
  start_timestamp: number; // ms since epoch, int
  calculate_model: boolean;
  end_ride_signal?: boolean;
}

export interface RiderControl {
  ride_status: RideStatus;
}

// Complete ride structure
export interface Ride {
  rider_control: RiderControl;
  raw_data: RideDataPoint[];
}

// User structure with legacy and new ride-scoped data
export interface User {
  rider_control?: RiderControl; // Legacy control flags
  rides: Record<string, Ride>; // Preferred ride-scoped structure
}

export interface FirebaseError {
  code: string;
  message: string;
}

// -------------- Global Safety Settings (stored in Firebase) --------------
export const SAFETY_SETTINGS_PATH = 'settings/safety';

export const getSafetySettings = async (): Promise<Settings | null> => {
  const settingsRef = ref(database, SAFETY_SETTINGS_PATH);
  const snapshot = await get(settingsRef);
  if (snapshot.exists()) return snapshot.val() as Settings;
  return null;
};

export const setSafetySettings = async (settings: Settings): Promise<void> => {
  const settingsRef = ref(database, SAFETY_SETTINGS_PATH);
  await set(settingsRef, settings);
};

export const subscribeToSafetySettings = (
  callback: (settings: Settings | null) => void
): (() => void) => {
  const settingsRef = ref(database, SAFETY_SETTINGS_PATH);
  const unsubscribe = onValue(settingsRef, (snapshot) => {
    if (snapshot.exists()) callback(snapshot.val() as Settings);
    else callback(null);
  }, () => callback(null));
  return () => off(settingsRef, 'value', unsubscribe);
};

/**
 * Parse timestamp from new format "2025-10-03 14:25:30.123" to milliseconds
 * @param timestamp - Timestamp string in format "YYYY-MM-DD HH:MM:SS.mmm"
 * @returns Timestamp in milliseconds since epoch
 */
export const parseTimestamp = (timestamp: string): number => {
  // Handle new format: "2025-10-03 14:25:30.123"
  if (timestamp.includes('-') && timestamp.includes(':')) {
    // Replace space with 'T' to make it ISO compatible and add 'Z' for UTC
    const isoString = timestamp.replace(' ', 'T') + 'Z';
    const date = new Date(isoString);
    return date.getTime();
  }
  
  // Fallback: handle old numeric format (milliseconds or seconds)
  const parsed = parseFloat(timestamp);
  
  // If timestamp is in seconds, convert to milliseconds
  if (parsed < 1e12) {
    return Math.floor(parsed * 1000);
  }
  
  // Already in milliseconds
  return Math.floor(parsed);
};

/**
 * Parse a single ride data point from string values to appropriate types
 * Converts accelerometer values from g-force to m/s²
 * Handles timestamp format: "2025-10-03 14:25:30.123"
 */
export const parseRideDataPoint = (point: RideDataPoint): ParsedRideDataPoint => {
  // Parse new timestamp format: "2025-10-03 14:25:30.123"
  const timestampNum = parseTimestamp(point.timestamp);
  const latitudeNum = parseFloat(point.latitude);
  const longitudeNum = parseFloat(point.longitude);
  const speedNum = parseFloat(point.speed);
  const speedLimitNum = parseFloat(point.speed_limit);
  // acc_* values are uploaded as strings in units of g. Convert to m/s^2.
  const G = 9.80665;
  const accXNum = parseFloat(point.acc_x) * G;
  const accYNum = parseFloat(point.acc_y) * G;
  const accZNum = parseFloat(point.acc_z) * G;
  const gyroXNum = parseFloat(point.gyro_x);
  const gyroYNum = parseFloat(point.gyro_y);
  const gyroZNum = parseFloat(point.gyro_z);
  // Parse warnings field if present; support comma- or pipe-separated lists
  const warningsRaw = (point as any).warning ?? (point as any).warnings ?? '';
  const warningsArr = typeof warningsRaw === 'string' && warningsRaw.trim().length
    ? warningsRaw
        .split(/[|,]/)
        .map((s:string)=>s.trim())
        .filter(Boolean)
        .filter((s:string)=> !/^(none|null|n\/a|na|no\s*warnings?|nil)$/i.test(s))
    : undefined;
  // Images removed: decodedImage intentionally omitted

  return {
    ...point,
    timestampNum,
    latitudeNum,
    longitudeNum,
    speedNum,
    speedLimitNum,
    accXNum,
    accYNum,
    accZNum,
    gyroXNum,
    gyroYNum,
    gyroZNum,
    isSpeedViolation: speedNum > speedLimitNum,
    totalAcceleration: Math.sqrt(
      Math.pow(accXNum, 2) + 
      Math.pow(accYNum, 2) + 
      Math.pow(accZNum, 2)
    ),
    warningsArr,
      // images removed from schema
  };
};

/**
 * Get all user IDs from Firebase
 * Reads from: GET /users.json
 * @returns Promise<string[]> Array of user IDs
 */
export const getUsers = async (): Promise<string[]> => {
  try {
    const usersRef = ref(database, 'users');
    const snapshot = await get(usersRef);
    
    if (snapshot.exists()) {
      const users = snapshot.val() as Record<string, User>;
      return Object.keys(users);
    }
    
    return [];
  } catch (error) {
    throw new Error(`Failed to fetch users: ${(error as FirebaseError).message}`);
  }
};

/**
 * Get all ride IDs for a specific user
 * Reads from: GET /users/{user_id}/rides.json
 * Purpose: list existing rides and compute next numeric ride_id
 * @param userId - The user ID to fetch rides for
 * @returns Promise<string[]> Array of ride IDs
 */
export const getUserRides = async (userId: string): Promise<string[]> => {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const ridesRef = ref(database, `users/${userId}/rides`);
    const snapshot = await get(ridesRef);
    
    if (snapshot.exists()) {
      const rides = snapshot.val() as Record<string, Ride>;
      return Object.keys(rides);
    }
    
    return [];
  } catch (error) {
    throw new Error(`Failed to fetch rides for user ${userId}: ${(error as FirebaseError).message}`);
  }
};

/**
 * Get the next available ride ID for a user
 * Based on existing ride numbering pattern
 * @param userId - The user ID
 * @returns Promise<string> Next ride ID
 */
export const getNextRideId = async (userId: string): Promise<string> => {
  try {
    const existingRides = await getUserRides(userId);
    
    // Extract numeric IDs and find the highest
    const numericIds = existingRides
      .map(rideId => {
        const match = rideId.match(/(\d+)$/);
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter(num => !isNaN(num));
    
    const nextId = numericIds.length > 0 ? Math.max(...numericIds) + 1 : 0;
    return nextId.toString();
  } catch (error) {
    throw new Error(`Failed to get next ride ID: ${(error as FirebaseError).message}`);
  }
};

/**
 * Get ride data for a specific user and ride
 * Reads from: GET /users/{user_id}/rides/{ride_id}/raw_data.json
 * Data is stored as JSON array from CSV upload
 * @param userId - The user ID
 * @param rideId - The ride ID
 * @returns Promise<ParsedRideDataPoint[] | null> Array of parsed ride data points or null if not found
 */
export const getRideData = async (userId: string, rideId: string): Promise<ParsedRideDataPoint[] | null> => {
  try {
    if (!userId || !rideId) {
      throw new Error('Both user ID and ride ID are required');
    }

    // Try ride-scoped path first (preferred)
    const rideDataRef = ref(database, `users/${userId}/rides/${rideId}/raw_data`);
    const snapshot = await get(rideDataRef);
    
    if (snapshot.exists()) {
      const rideData = snapshot.val() as RideDataPoint[];
      
      // Ensure it's an array and parse each data point
      if (Array.isArray(rideData)) {
        return rideData.map(parseRideDataPoint);
      } else {
        return null;
      }
    }
    
    return null;
  } catch (error) {
    throw new Error(`Failed to fetch ride data: ${(error as FirebaseError).message}`);
  }
};

/**
 * Get ride control information for a specific ride
 * Reads from multiple paths with fallbacks as per schema:
 * 1. GET /users/{user_id}/rides/{ride_id}/rider_control/ride_status.json (preferred)
 * @param userId - The user ID
 * @param rideId - The ride ID
 * @returns Promise<RiderControl | null> Ride control data or null if not found
 */
export const getRideControl = async (userId: string, rideId: string): Promise<RiderControl | null> => {
  try {
    if (!userId || !rideId) {
      throw new Error('Both user ID and ride ID are required');
    }

    // Try ride-scoped path first (preferred)
    const rideControlRef = ref(database, `users/${userId}/rides/${rideId}/rider_control`);
    const snapshot = await get(rideControlRef);
    
    if (snapshot.exists()) {
      return snapshot.val() as RiderControl;
    }
    
    return null;
  } catch (error) {
    throw new Error(`Failed to fetch ride control: ${(error as FirebaseError).message}`);
  }
};

/**
 * Get control flags for a ride (corresponds to get_control_flags_for_ride)
 * @param userId - The user ID
 * @param rideId - The ride ID
 * @returns Promise<RideStatus | null> Ride status or null if not found
 */
export const getControlFlagsForRide = async (userId: string, rideId: string): Promise<RideStatus | null> => {
  try {
    const riderControl = await getRideControl(userId, rideId);
    return riderControl?.ride_status || null;
  } catch (error) {
    throw new Error(`Failed to fetch control flags: ${(error as FirebaseError).message}`);
  }
};

// Image storage and upload functions removed (images are no longer part of the schema)
// Data upload functions removed - this is a read-only dashboard application

/**
 * Set up real-time listener for users
 * @param callback - Function to call when users data changes
 * @returns Function to unsubscribe from the listener
 */
export const subscribeToUsers = (callback: (users: string[]) => void): (() => void) => {
  const usersRef = ref(database, 'users');
  
  const unsubscribe = onValue(usersRef, (snapshot) => {
    if (snapshot.exists()) {
      const users = snapshot.val() as Record<string, User>;
      callback(Object.keys(users));
    } else {
      callback([]);
    }
  }, (error) => {
    callback([]);
  });

  // Return unsubscribe function
  return () => off(usersRef, 'value', unsubscribe);
};

/**
 * Set up real-time listener for user rides
 * @param userId - The user ID to listen to
 * @param callback - Function to call when rides data changes
 * @returns Function to unsubscribe from the listener
 */
export const subscribeToUserRides = (userId: string, callback: (rides: string[]) => void): (() => void) => {
  if (!userId) {
    callback([]);
    return () => {};
  }

  const ridesRef = ref(database, `users/${userId}/rides`);
  
  const unsubscribe = onValue(ridesRef, (snapshot) => {
    if (snapshot.exists()) {
      const rides = snapshot.val() as Record<string, Ride>;
      callback(Object.keys(rides));
    } else {
      callback([]);
    }
  }, (error) => {
    callback([]);
  });

  // Return unsubscribe function
  return () => off(ridesRef, 'value', unsubscribe);
};

/**
 * Set up real-time listener for ride data
 * @param userId - The user ID
 * @param rideId - The ride ID
 * @param callback - Function to call when ride data changes
 * @returns Function to unsubscribe from the listener
 */
export const subscribeToRideData = (
  userId: string, 
  rideId: string, 
  callback: (rideData: ParsedRideDataPoint[] | null) => void
): (() => void) => {
  if (!userId || !rideId) {
    callback(null);
    return () => {};
  }

  const rideDataRef = ref(database, `users/${userId}/rides/${rideId}/raw_data`);
  
  const unsubscribe = onValue(rideDataRef, async (snapshot) => {
    if (snapshot.exists()) {
      const rideData = snapshot.val() as RideDataPoint[];
      
      if (Array.isArray(rideData)) {
          // Parse all data points. Images are not fetched.
          const parsedData = rideData.map((point) => parseRideDataPoint(point));
          callback(parsedData);
        } else {
          callback(null);
        }
    } else {
      callback(null);
    }
  }, (error) => {
    callback(null);
  });

  // Return unsubscribe function
  return () => off(rideDataRef, 'value', unsubscribe);
};

/**
 * Helper function to format Firebase error messages in a user-friendly way
 * @param error - The error to format
 * @returns Formatted error message
 */
export const formatFirebaseError = (error: any): string => {
  if (error?.code) {
    switch (error.code) {
      case 'permission-denied':
        return 'Access denied. Please check your permissions.';
      case 'unavailable':
        return 'Firebase service is temporarily unavailable. Please try again later.';
      case 'network-request-failed':
        return 'Network error. Please check your internet connection.';
      case 'timeout':
        return 'Request timed out. Please try again.';
      case 'cancelled':
        return 'Firebase operation was cancelled.';
      case 'deadline-exceeded':
        return 'Firebase operation timed out.';
      default:
        return `Firebase error: ${error.message}`;
    }
  }
  return error?.message || 'An unknown error occurred';
};