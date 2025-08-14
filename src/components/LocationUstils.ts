import {
  Country,
  State,
  City,
  ICountry,
  IState,
  ICity,
} from "country-state-city";

export interface LocationOption {
  value: string;
  label: string;
}

/**
 * Get all countries formatted for dropdown
 */
export const getCountries = (): LocationOption[] => {
  return Country.getAllCountries().map((country: ICountry) => ({
    value: country.isoCode,
    label: country.name,
  }));
};

/**
 * Get states for a specific country
 * @param countryCode ISO country code
 */
export const getStates = (countryCode: string): LocationOption[] => {
  if (!countryCode) {
    return [];
  }
  return State.getStatesOfCountry(countryCode).map((state: IState) => ({
    value: state.isoCode,
    label: state.name,
  }));
};

/**
 * Get cities for a specific state and country
 * @param countryCode ISO country code
 * @param stateCode ISO state code
 */
export const getCities = (
  countryCode: string,
  stateCode: string
): LocationOption[] => {
  if (!countryCode || !stateCode) {
    return [];
  }
  return City.getCitiesOfState(countryCode, stateCode).map((city: ICity) => ({
    value: city.name,
    label: city.name,
  }));
};

/**
 * Get country name from country code
 * @param countryCode ISO country code
 */
export const getCountryName = (countryCode: string): string => {
  const country = Country.getCountryByCode(countryCode);
  return country ? country.name : "";
};

/**
 * Get state name from state code
 * @param countryCode ISO country code
 * @param stateCode ISO state code
 */
export const getStateName = (
  countryCode: string,
  stateCode: string
): string => {
  const state = State.getStateByCodeAndCountry(stateCode, countryCode);
  return state ? state.name : "";
};
