
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
 * Asynchronously retrieves the current geographical location using the browser's Geolocation API.
 *
 * @returns A promise that resolves to a Coordinates object containing latitude and longitude.
 * @throws An error if geolocation is not supported or permission is denied.
 */
export const getCurrentLocation = (): Promise<Coordinates> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      return reject(new Error('Geolocation is not supported by your browser.'));
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        console.error("Geolocation error:", error);
        let message = 'Failed to get location.';
        switch(error.code) {
          case error.PERMISSION_DENIED:
            message = "Geolocation permission denied. Please enable it in your browser settings.";
            break;
          case error.POSITION_UNAVAILABLE:
            message = "Location information is unavailable.";
            break;
          case error.TIMEOUT:
            message = "The request to get user location timed out.";
            break;
          default:
             message = `An unknown error occurred (${error.code}).`;
             break;
        }
        reject(new Error(message));
      },
      {
        enableHighAccuracy: true, // Try for better accuracy
        timeout: 10000, // 10 seconds timeout
        maximumAge: 60000 // Use cached position up to 1 minute old
      }
    );
  });
};
