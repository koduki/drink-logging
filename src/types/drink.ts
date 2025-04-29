
import type { Timestamp } from 'firebase/firestore';
import type { Coordinates } from '@/services/geolocation';
import type { ScoreDrinkDetailsOutput } from '@/ai/flows/score-drink-details';

/**
 * Represents a drink log entry.
 */
export interface DrinkLog {
  id: string; // Firestore document ID
  name: string;
  brewery: string;
  type: 'sake' | 'whiskey' | 'beer' | 'wine';
  rating: number;
  comments?: string;
  photoUrl?: string | null; // URL from Firebase Storage
  isPublic: boolean;
  location?: Coordinates | null;
  timestamp: Timestamp; // Firestore Timestamp
  aiScore?: ScoreDrinkDetailsOutput | null;
  // Add userId if implementing multi-user support with authentication
  userId?: string;
}

/**
* Represents the data structure for creating a new drink log
* (omitting id and using Date for timestamp initially).
*/
export type NewDrinkLogData = Omit<DrinkLog, 'id' | 'timestamp'> & {
  timestamp: Date; // Use JS Date for initial creation
  photoFile?: File | null; // Optional file for upload
};

/**
 * Represents the data structure stored in Firestore
 * (using Firestore Timestamp).
 */
export type DrinkLogDocumentData = Omit<DrinkLog, 'id'>;
