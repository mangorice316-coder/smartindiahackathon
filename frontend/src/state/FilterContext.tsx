import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { FilterConditions } from '../types';

export interface FilterContextState {
  filterConditions: FilterConditions;
  setFilterConditions: React.Dispatch<React.SetStateAction<FilterConditions>>;
  resetFilters: () => void;
  isFilterActive: boolean;
}

export const DEFAULT_FILTER_CONDITIONS: FilterConditions = {
  region: 'ALL',
  district: 'ALL',
  riskLevel: 'ALL',
  minRainfall: 0,
  minSlope: 0,
  soilSaturation: 'ALL',
  sensorStatus: 'ALL',
  timeRange: '24h',
  searchQuery: '',
};

const FilterContext = createContext<FilterContextState | undefined>(undefined);

export const FilterProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [filterConditions, setFilterConditions] = useState<FilterConditions>(DEFAULT_FILTER_CONDITIONS);

  const resetFilters = useCallback(() => {
    setFilterConditions(DEFAULT_FILTER_CONDITIONS);
  }, []);

  const isFilterActive =
    filterConditions.region !== 'ALL' ||
    filterConditions.district !== 'ALL' ||
    filterConditions.riskLevel !== 'ALL' ||
    filterConditions.minRainfall > 0 ||
    filterConditions.minSlope > 0 ||
    filterConditions.soilSaturation !== 'ALL' ||
    filterConditions.sensorStatus !== 'ALL' ||
    Boolean(filterConditions.searchQuery);

  return (
    <FilterContext.Provider
      value={{
        filterConditions,
        setFilterConditions,
        resetFilters,
        isFilterActive,
      }}
    >
      {children}
    </FilterContext.Provider>
  );
};

export const useFilters = (): FilterContextState => {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error('useFilters must be used within a FilterProvider');
  }
  return context;
};
