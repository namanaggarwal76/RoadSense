// React Context for Firebase data management
import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import {
  getUsers,
  getUserRides,
  getRideData,
  subscribeToUsers,
  subscribeToUserRides,
  subscribeToRideData,
  type ParsedRideDataPoint,
  type FirebaseError
} from '../services/firebaseApi';

// State interfaces
interface FleetState {
  // Data
  users: string[];
  userRides: string[];
  rideData: ParsedRideDataPoint[] | null;
  
  // Selection state
  selectedUserId: string | null;
  selectedRideId: string | null;
  
  // Loading states
  usersLoading: boolean;
  ridesLoading: boolean;
  rideDataLoading: boolean;
  
  // Error states
  usersError: string | null;
  ridesError: string | null;
  rideDataError: string | null;
  
  // Connection state
  isConnected: boolean;
}

// Action types
type FleetAction =
  | { type: 'SET_USERS_LOADING'; payload: boolean }
  | { type: 'SET_USERS'; payload: string[] }
  | { type: 'SET_USERS_ERROR'; payload: string | null }
  
  | { type: 'SET_RIDES_LOADING'; payload: boolean }
  | { type: 'SET_USER_RIDES'; payload: string[] }
  | { type: 'SET_RIDES_ERROR'; payload: string | null }
  
  | { type: 'SET_RIDE_DATA_LOADING'; payload: boolean }
  | { type: 'SET_RIDE_DATA'; payload: ParsedRideDataPoint[] | null }
  | { type: 'SET_RIDE_DATA_ERROR'; payload: string | null }
  
  | { type: 'SELECT_USER'; payload: string | null }
  | { type: 'SELECT_RIDE'; payload: string | null }
  
  | { type: 'SET_CONNECTION_STATUS'; payload: boolean }
  | { type: 'RESET_STATE' };

// Initial state
const initialState: FleetState = {
  users: [],
  userRides: [],
  rideData: null,
  
  selectedUserId: null,
  selectedRideId: null,
  
  usersLoading: false,
  ridesLoading: false,
  rideDataLoading: false,
  
  usersError: null,
  ridesError: null,
  rideDataError: null,
  
  isConnected: false,
};

// Reducer function
const fleetReducer = (state: FleetState, action: FleetAction): FleetState => {
  switch (action.type) {
    case 'SET_USERS_LOADING':
      return { ...state, usersLoading: action.payload };
      
    case 'SET_USERS':
      return { 
        ...state, 
        users: action.payload, 
        usersLoading: false, 
        usersError: null,
        isConnected: true
      };
      
    case 'SET_USERS_ERROR':
      return { 
        ...state, 
        usersError: action.payload, 
        usersLoading: false,
        isConnected: false
      };
      
    case 'SET_RIDES_LOADING':
      return { ...state, ridesLoading: action.payload };
      
    case 'SET_USER_RIDES':
      return { 
        ...state, 
        userRides: action.payload, 
        ridesLoading: false, 
        ridesError: null 
      };
      
    case 'SET_RIDES_ERROR':
      return { 
        ...state, 
        ridesError: action.payload, 
        ridesLoading: false 
      };
      
    case 'SET_RIDE_DATA_LOADING':
      return { ...state, rideDataLoading: action.payload };
      
    case 'SET_RIDE_DATA':
      return { 
        ...state, 
        rideData: action.payload, 
        rideDataLoading: false, 
        rideDataError: null 
      };
      
    case 'SET_RIDE_DATA_ERROR':
      return { 
        ...state, 
        rideDataError: action.payload, 
        rideDataLoading: false 
      };
      
    case 'SELECT_USER':
      return { 
        ...state, 
        selectedUserId: action.payload,
        selectedRideId: null, // Reset ride selection when user changes
        userRides: [],
        rideData: null,
        ridesError: null,
        rideDataError: null
      };
      
    case 'SELECT_RIDE':
      return { 
        ...state, 
        selectedRideId: action.payload,
        rideData: null,
        rideDataError: null
      };
      
    case 'SET_CONNECTION_STATUS':
      return { ...state, isConnected: action.payload };
      
    case 'RESET_STATE':
      return initialState;
      
    default:
      return state;
  }
};

// Context interfaces
interface FleetContextType {
  // State
  state: FleetState;
  
  // Actions
  selectUser: (userId: string | null) => void;
  selectRide: (rideId: string | null) => void;
  refreshUsers: () => Promise<void>;
  refreshRides: () => Promise<void>;
  refreshRideData: () => Promise<void>;
  resetState: () => void;
  
  // Computed values
  hasUsers: boolean;
  hasRides: boolean;
  hasRideData: boolean;
  isAnyLoading: boolean;
  hasAnyError: boolean;
}

// Create context
const FleetContext = createContext<FleetContextType | undefined>(undefined);

// Provider component props
interface FleetProviderProps {
  children: React.ReactNode;
  enableRealTime?: boolean; // Option to disable real-time updates
}

// Provider component
export const FleetProvider: React.FC<FleetProviderProps> = ({ 
  children, 
  enableRealTime = true
}) => {
  const [state, dispatch] = useReducer(fleetReducer, initialState);

  // Unsubscribe functions for real-time listeners
  const unsubscribeRefs = React.useRef<{
    users?: () => void;
    rides?: () => void;
    rideData?: () => void;
  }>({});

  // Select user action
  const selectUser = useCallback((userId: string | null) => {
    dispatch({ type: 'SELECT_USER', payload: userId });
  }, []);

  // Select ride action
  const selectRide = useCallback((rideId: string | null) => {
    dispatch({ type: 'SELECT_RIDE', payload: rideId });
  }, []);

  // Refresh users manually
  const refreshUsers = useCallback(async () => {
    dispatch({ type: 'SET_USERS_LOADING', payload: true });
    try {
      const users = await getUsers();
      dispatch({ type: 'SET_USERS', payload: users });
    } catch (error) {
      const errorMessage = (error as FirebaseError).message || 'Unknown error';
      dispatch({ type: 'SET_USERS_ERROR', payload: errorMessage });
    }
  }, []);

  // Refresh rides manually
  const refreshRides = useCallback(async () => {
    if (!state.selectedUserId) return;
    
    dispatch({ type: 'SET_RIDES_LOADING', payload: true });
    try {
      const rides = await getUserRides(state.selectedUserId);
      dispatch({ type: 'SET_USER_RIDES', payload: rides });
    } catch (error) {
      const errorMessage = (error as FirebaseError).message || 'Unknown error';
      dispatch({ type: 'SET_RIDES_ERROR', payload: errorMessage });
    }
  }, [state.selectedUserId]);

  // Refresh ride data manually
  const refreshRideData = useCallback(async () => {
    if (!state.selectedUserId || !state.selectedRideId) return;
    
    dispatch({ type: 'SET_RIDE_DATA_LOADING', payload: true });
    try {
      const rideData = await getRideData(state.selectedUserId, state.selectedRideId);
      dispatch({ type: 'SET_RIDE_DATA', payload: rideData });
    } catch (error) {
      const errorMessage = (error as FirebaseError).message || 'Unknown error';
      dispatch({ type: 'SET_RIDE_DATA_ERROR', payload: errorMessage });
    }
  }, [state.selectedUserId, state.selectedRideId]);

  // Reset state action
  const resetState = useCallback(() => {
    // Clean up subscriptions
    Object.values(unsubscribeRefs.current).forEach(unsub => unsub?.());
    unsubscribeRefs.current = {};
    
    dispatch({ type: 'RESET_STATE' });
  }, []);

  // Set up users subscription
  useEffect(() => {
    if (!enableRealTime) {
      refreshUsers();
      return;
    }

    dispatch({ type: 'SET_USERS_LOADING', payload: true });
    
    const unsubscribe = subscribeToUsers((users) => {
      dispatch({ type: 'SET_USERS', payload: users });
    });
    
    unsubscribeRefs.current.users = unsubscribe;

    return () => {
      unsubscribe();
      delete unsubscribeRefs.current.users;
    };
  }, [enableRealTime, refreshUsers]);

  // Set up rides subscription when user is selected
  useEffect(() => {
    // Clean up previous rides subscription
    if (unsubscribeRefs.current.rides) {
      unsubscribeRefs.current.rides();
      delete unsubscribeRefs.current.rides;
    }

    if (!state.selectedUserId) {
      return;
    }

    if (!enableRealTime) {
      refreshRides();
      return;
    }

    dispatch({ type: 'SET_RIDES_LOADING', payload: true });
    
    const unsubscribe = subscribeToUserRides(state.selectedUserId, (rides) => {
      dispatch({ type: 'SET_USER_RIDES', payload: rides });
    });
    
    unsubscribeRefs.current.rides = unsubscribe;

    return () => {
      unsubscribe();
      delete unsubscribeRefs.current.rides;
    };
  }, [state.selectedUserId, enableRealTime, refreshRides]);

  // Set up ride data subscription when ride is selected
  useEffect(() => {
    // Clean up previous ride data subscription
    if (unsubscribeRefs.current.rideData) {
      unsubscribeRefs.current.rideData();
      delete unsubscribeRefs.current.rideData;
    }

    if (!state.selectedUserId || !state.selectedRideId) {
      return;
    }

    if (!enableRealTime) {
      refreshRideData();
      return;
    }

    dispatch({ type: 'SET_RIDE_DATA_LOADING', payload: true });
    
    const unsubscribe = subscribeToRideData(
      state.selectedUserId, 
      state.selectedRideId, 
      (rideData) => {
        dispatch({ type: 'SET_RIDE_DATA', payload: rideData });
      }
    );
    
    unsubscribeRefs.current.rideData = unsubscribe;

    return () => {
      unsubscribe();
      delete unsubscribeRefs.current.rideData;
    };
  }, [state.selectedUserId, state.selectedRideId, enableRealTime, refreshRideData]);

  // Clean up all subscriptions on unmount
  useEffect(() => {
    return () => {
      Object.values(unsubscribeRefs.current).forEach(unsub => unsub?.());
    };
  }, []);

  // Computed values
  const hasUsers = state.users.length > 0;
  const hasRides = state.userRides.length > 0;
  const hasRideData = state.rideData !== null && state.rideData.length > 0;
  const isAnyLoading = state.usersLoading || state.ridesLoading || state.rideDataLoading;
  const hasAnyError = Boolean(state.usersError || state.ridesError || state.rideDataError);

  const contextValue: FleetContextType = {
    state,
    selectUser,
    selectRide,
    refreshUsers,
    refreshRides,
    refreshRideData,
    resetState,
    hasUsers,
    hasRides,
    hasRideData,
    isAnyLoading,
    hasAnyError,
  };

  return (
    <FleetContext.Provider value={contextValue}>
      {children}
    </FleetContext.Provider>
  );
};

// Custom hook to use the context
export const useFleet = (): FleetContextType => {
  const context = useContext(FleetContext);
  if (context === undefined) {
    throw new Error('useFleet must be used within a FleetProvider');
  }
  return context;
};

// Export types
export type { FleetState, FleetAction, FleetContextType };