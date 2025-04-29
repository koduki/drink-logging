
import { db } from '@/services/firebase';
import {
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  where,
  Timestamp,
  getDoc,
  QueryConstraint,
  limit,
  startAfter,
  DocumentSnapshot,
  QueryDocumentSnapshot, // Import QueryDocumentSnapshot
} from 'firebase/firestore';
import type { DrinkLog, NewDrinkLogData, DrinkLogDocumentData } from '@/types/drink';
import { collection } from 'firebase/firestore';

const DRINKS_COLLECTION = 'drinks'; // Firestore collection name

/**
 * Adds a new drink log to Firestore.
 * @param drinkData Data for the new drink log (including timestamp as Date).
 * @returns A promise that resolves to the ID of the newly created document.
 */
export const addDrink = async (drinkData: NewDrinkLogData): Promise<string> => {
  try {
    console.log("Adding drink with data:", drinkData); // Log drink data before adding
    // Convert Date to Firestore Timestamp before saving
    const docData: DrinkLogDocumentData = {
      name: drinkData.name,
      brewery: drinkData.brewery,
      type: drinkData.type,
      rating: drinkData.rating,
      comments: drinkData.comments ?? '', // Ensure comments is not undefined
      photoUrl: drinkData.photoUrl ?? null, // Ensure photoUrl is explicitly null if undefined
      isPublic: drinkData.isPublic,
      location: drinkData.location ?? null,
      timestamp: Timestamp.fromDate(drinkData.timestamp), // Convert Date to Timestamp
      aiScore: drinkData.aiScore ?? null,
      // userId: drinkData.userId, // Uncomment if using user ID
    };

    console.log('docData before being sent:', docData);
    const docRef = await addDoc(collection(db, DRINKS_COLLECTION), docData);
    console.log('Drink added with ID: ', docRef.id);
    return docRef.id;
  } catch (error) {
    // Log the error when failing to add a new drink
    console.error('Error adding drink:', error);
    // Throw the original error for better debugging downstream
    if (error instanceof Error) {
      throw new Error(`Failed to add drink log: ${error.message}`);
    }
    throw new Error('Failed to add drink log.');
  }
};

/**
 * Fetches drink logs from Firestore.
 * @param options Optional parameters for filtering, sorting, and pagination.
 * @returns A promise that resolves to an object containing the drinks array and the last visible document for pagination.
 */
export const getDrinks = async (options: {
    sortBy?: 'timestamp' | 'rating';
    sortDirection?: 'asc' | 'desc';
    filterType?: 'all' | 'sake' | 'whiskey' | 'beer' | 'wine';
    // userId?: string; // Uncomment if implementing multi-user support
    resultsPerPage?: number;
    lastVisibleDoc?: QueryDocumentSnapshot | null; // Use QueryDocumentSnapshot
} = {}): Promise<{ drinks: DrinkLog[], lastVisibleDoc: QueryDocumentSnapshot | null }> => { // Return type updated
    const {
        sortBy = 'timestamp',
        sortDirection = 'desc',
        filterType = 'all',
        // userId, // Uncomment if using auth
        resultsPerPage = 9, // Default page size
        lastVisibleDoc = null,
    } = options;

    const constraints: QueryConstraint[] = [];

    // Filtering
    if (filterType !== 'all') {
        constraints.push(where('type', '==', filterType));
    }
    // if (userId) { // Uncomment if using auth
    //   constraints.push(where('userId', '==', userId));
    // } else {
       // Only fetch public drinks if no specific user is requested
       constraints.push(where('isPublic', '==', true));
    // }


    // Sorting
    constraints.push(orderBy(sortBy, sortDirection));

    // Pagination
    if(lastVisibleDoc) {
        constraints.push(startAfter(lastVisibleDoc));
    }
    constraints.push(limit(resultsPerPage));


    const q = query(collection(db, DRINKS_COLLECTION), ...constraints);

    try {
        const querySnapshot = await getDocs(q);
        const drinks: DrinkLog[] = [];
        querySnapshot.forEach((doc) => {
         const data = doc.data() as DrinkLogDocumentData;
            drinks.push({
                id: doc.id,
                ...data,
                // timestamp: data.timestamp, // Keep as Timestamp, type DrinkLog expects Timestamp
            });
        });

        // Get the actual last document snapshot from the query results
        const newLastVisibleDoc = querySnapshot.docs[querySnapshot.docs.length - 1] ?? null;

        console.log(`Fetched ${drinks.length} drinks with options:`, options);
        return { drinks, lastVisibleDoc: newLastVisibleDoc }; // Return QueryDocumentSnapshot
    } catch (err) {
      // Log the specific Firestore error
        console.error('Detailed error fetching drinks:', err);
        // You might see a Firestore error code and message here, possibly with an index creation link.
        // Re-throw the original Firestore error for better debugging in the UI/toast
        if (err instanceof Error) {
          throw err; // Throw the original Firestore error object
        }
        // Fallback if it's not an Error instance
        throw new Error('An unknown error occurred while fetching drink logs.');
    }
};


/**
 * Updates an existing drink log in Firestore.
 * @param id The ID of the drink log document to update.
 * @param updates An object containing the fields to update.
 * @returns A promise that resolves when the update is complete.
 */
export const updateDrink = async (id: string, updates: Partial<DrinkLogDocumentData>): Promise<void> => {
  const drinkDocRef = doc(db, DRINKS_COLLECTION, id);
  try {
    // If timestamp is being updated and it's a Date, convert it
     if (updates.timestamp && updates.timestamp instanceof Date) {
       updates.timestamp = Timestamp.fromDate(updates.timestamp);
     }
    await updateDoc(drinkDocRef, updates);
    console.log('Drink updated successfully:', id);
  } catch (error) {
    // Log the error when failing to update the drink
    console.error('Error updating drink:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to update drink log: ${error.message}`);
    }
    throw new Error('Failed to update drink log.');
  }
};

/**
 * Deletes a drink log from Firestore.
 * @param id The ID of the drink log document to delete.
 * @returns A promise that resolves when the deletion is complete.
 */
export const deleteDrink = async (id: string): Promise<void> => {
  const drinkDocRef = doc(db, DRINKS_COLLECTION, id);
  try {
    await deleteDoc(drinkDocRef);
    console.log('Drink deleted successfully:', id);
    // Note: This does not delete the associated photo from Storage.
    // Implement photo deletion separately if required.
  } catch (error) {
    // Log the error when failing to delete the drink
    console.error('Error deleting drink:', error);
     if (error instanceof Error) {
       throw new Error(`Failed to delete drink log: ${error.message}`);
     }
    throw new Error('Failed to delete drink log.');
  }
};

/**
 * Fetches a single drink log by its ID.
 * @param id The ID of the drink log document.
 * @returns A promise that resolves to the DrinkLog object or null if not found.
 */
export const getDrinkById = async (id: string): Promise<DrinkLog | null> => {
    const drinkDocRef = doc(db, DRINKS_COLLECTION, id);
    try {
        const docSnap = await getDoc(drinkDocRef);
        if (docSnap.exists()) {
             const data = docSnap.data() as DrinkLogDocumentData;
             return {
                 id: docSnap.id,
                 ...data,
                 // timestamp: data.timestamp, // Keep as Timestamp
             };
        } else {
            console.log("No such document!");
            return null;
        }
    } catch (error) {
        // Log the error when failing to fetch the drink by id
        console.error("Error fetching drink by ID:", error);
        if (error instanceof Error) {
          throw new Error(`Failed to fetch drink log by ID: ${error.message}`);
        }
        throw new Error("Failed to fetch drink log by ID.");
    }
};
