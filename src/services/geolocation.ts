/**
 * Represents a geographical location with latitude and longitude coordinates.
 */
export interface Coordinates {
  /**
   * The latitude of the location.
   */
  latitude: number;
  /**
   * The longitude of the location.
   */
  longitude: number;
}

/**
 * Asynchronously retrieves the current geographical location.
 *
 * @returns A promise that resolves to a Coordinates object containing latitude and longitude.
 */
export async function getCurrentLocation(): Promise<Coordinates> {
  // TODO: Implement this by calling an API.
  return {
    latitude: 34.0522,
    longitude: -118.2437,
  };
}
