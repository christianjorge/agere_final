import React, { createContext, useState, useContext, useEffect } from 'react';
import { auth } from '../config/firebase';
import { getHouseDetails } from '../services/house';
import { House } from '../types/house';

interface HouseContextData {
  currentHouse: House | null;
  setCurrentHouse: (house: House | null) => void;
  loading: boolean;
}

const HouseContext = createContext<HouseContextData>({} as HouseContextData);

export function HouseProvider({ children }: { children: React.ReactNode }) {
  const [currentHouse, setCurrentHouse] = useState<House | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCurrentHouse();
  }, []);

  const loadCurrentHouse = async () => {
    try {
      if (auth.currentUser) {
        const house = await getHouseDetails();
        setCurrentHouse(house);
      }
    } catch (error) {
      console.error('Erro ao carregar casa atual:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <HouseContext.Provider value={{ currentHouse, setCurrentHouse, loading }}>
      {children}
    </HouseContext.Provider>
  );
}

export function useHouse() {
  return useContext(HouseContext);
}