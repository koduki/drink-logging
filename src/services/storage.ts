
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/services/firebase'; // Import storage instead of db, app
import { v4 as uuidv4 } from 'uuid'; // For generating unique file names

/**
 * Uploads a file to Firebase Storage.
 * @param file The file to upload.
 * @param path The path within the storage bucket (e.g., 'drink_photos').
 * @returns A promise that resolves to the download URL of the uploaded file.
 */
export const uploadFile = async (file: File, path: string): Promise<string> => {
  if (!file) {
    throw new Error('No file provided for upload.');
  }

  const fileExtension = file.name.split('.').pop();
  const fileName = `${uuidv4()}.${fileExtension}`;
    // Use the imported storage instance directly
    const storageRef = ref(storage, `${path}/${fileName}`);


  try {
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    console.log('File uploaded successfully:', downloadURL);
    return downloadURL;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw new Error('Failed to upload file.');
  }
};
