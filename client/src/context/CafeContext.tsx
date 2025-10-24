import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

interface Cafe {
  id: number;
  name: string;
  location: string;
}

interface CafeContextType {
  selectedCafe: Cafe | null;
  setSelectedCafe: (cafe: Cafe | null) => void;
  userHasSelectedCafe: boolean;
  setUserHasSelectedCafe: (hasSelected: boolean) => void;
  isInitialized: boolean;
}

const CafeContext = createContext<CafeContextType | undefined>(undefined);

export const useCafe = () => {
  const context = useContext(CafeContext);
  if (context === undefined) {
    throw new Error('useCafe must be used within a CafeProvider');
  }
  return context;
};

interface CafeProviderProps {
  children: ReactNode;
}

export const CafeProvider: React.FC<CafeProviderProps> = ({ children }) => {
  const [selectedCafe, setSelectedCafe] = useState<Cafe | null>(null);
  const [userHasSelectedCafe, setUserHasSelectedCafe] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  // Load cafe state from localStorage on mount
  useEffect(() => {
    const savedCafe = localStorage.getItem('selectedCafe');
    const hasUserSelected = localStorage.getItem('userHasSelectedCafe') === 'true';
    
    if (savedCafe) {
      try {
        setSelectedCafe(JSON.parse(savedCafe));
        setUserHasSelectedCafe(hasUserSelected);
      } catch (error) {
        console.error('Error parsing saved cafe:', error);
        localStorage.removeItem('selectedCafe');
        localStorage.removeItem('userHasSelectedCafe');
      }
    }
    setIsInitialized(true);
  }, []);

  // Save cafe state to localStorage whenever it changes
  useEffect(() => {
    if (selectedCafe) {
      localStorage.setItem('selectedCafe', JSON.stringify(selectedCafe));
    } else {
      localStorage.removeItem('selectedCafe');
    }
  }, [selectedCafe]);

  // Save user selection flag
  useEffect(() => {
    localStorage.setItem('userHasSelectedCafe', userHasSelectedCafe.toString());
  }, [userHasSelectedCafe]);

  const value = {
    selectedCafe,
    setSelectedCafe,
    userHasSelectedCafe,
    setUserHasSelectedCafe,
    isInitialized,
  };

  return (
    <CafeContext.Provider value={value}>
      {children}
    </CafeContext.Provider>
  );
};
