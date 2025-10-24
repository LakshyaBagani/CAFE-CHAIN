import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

interface Location {
  id: number;
  name: string;
  location: string;
}

interface LocationContextType {
  selectedLocation: Location | null;
  setSelectedLocation: (location: Location | null) => void;
  userHasSelected: boolean;
  setUserHasSelected: (hasSelected: boolean) => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
};

interface LocationProviderProps {
  children: ReactNode;
}

export const LocationProvider: React.FC<LocationProviderProps> = ({ children }) => {
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [userHasSelected, setUserHasSelected] = useState<boolean>(false);

  // Load selected location from localStorage on mount
  useEffect(() => {
    const savedLocation = localStorage.getItem('selectedLocation');
    const hasUserSelected = localStorage.getItem('userHasSelected') === 'true';
    
    if (savedLocation) {
      try {
        setSelectedLocation(JSON.parse(savedLocation));
        setUserHasSelected(hasUserSelected);
      } catch (error) {
        console.error('Error parsing saved location:', error);
        localStorage.removeItem('selectedLocation');
        localStorage.removeItem('userHasSelected');
      }
    }
  }, []);

  // Save selected location to localStorage whenever it changes
  useEffect(() => {
    if (selectedLocation) {
      localStorage.setItem('selectedLocation', JSON.stringify(selectedLocation));
    } else {
      localStorage.removeItem('selectedLocation');
    }
  }, [selectedLocation]);

  // Save user selection flag
  useEffect(() => {
    localStorage.setItem('userHasSelected', userHasSelected.toString());
  }, [userHasSelected]);

  const value = {
    selectedLocation,
    setSelectedLocation,
    userHasSelected,
    setUserHasSelected,
  };

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
};
