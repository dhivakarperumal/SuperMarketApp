import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { app } from "./config";

// Initialize Firebase Storage
const storage = getStorage(app);

/**
 * Upload an image to Firebase Storage
 * @param uri - Local file URI
 * @param folder - Folder path in storage (e.g., "receipt-logos", "products")
 * @param onProgress - Optional progress callback (0-100)
 * @returns Download URL of the uploaded image
 */
export async function uploadImage(
  uri: string,
  folder: string = "images",
  onProgress?: (progress: number) => void
): Promise<string> {
  try {
    // Fetch the file as blob
    const response = await fetch(uri);
    const blob = await response.blob();

    // Generate unique filename
    const filename = `${folder}/${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
    const storageRef = ref(storage, filename);

    // Upload with progress tracking
    return new Promise((resolve, reject) => {
      const uploadTask = uploadBytesResumable(storageRef, blob);

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          onProgress?.(Math.round(progress));
        },
        (error) => {
          console.error("[Storage] Upload error:", error);
          reject(new Error(`Failed to upload image: ${error.message}`));
        },
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(downloadURL);
          } catch (error: any) {
            reject(new Error(`Failed to get download URL: ${error.message}`));
          }
        }
      );
    });
  } catch (error: any) {
    console.error("[Storage] Upload image error:", error);
    throw new Error(`Failed to upload image: ${error.message}`);
  }
}

/**
 * Upload a video to Firebase Storage
 * @param uri - Local file URI
 * @param folder - Folder path in storage (e.g., "reels", "videos")
 * @param onProgress - Optional progress callback (0-100)
 * @returns Download URL of the uploaded video
 */
export async function uploadVideo(
  uri: string,
  folder: string = "videos",
  onProgress?: (progress: number) => void
): Promise<string> {
  try {
    // Fetch the file as blob
    const response = await fetch(uri);
    const blob = await response.blob();

    // Generate unique filename
    const extension = uri.split(".").pop() || "mp4";
    const filename = `${folder}/${Date.now()}_${Math.random().toString(36).substring(7)}.${extension}`;
    const storageRef = ref(storage, filename);

    // Upload with progress tracking
    return new Promise((resolve, reject) => {
      const uploadTask = uploadBytesResumable(storageRef, blob);

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          onProgress?.(Math.round(progress));
        },
        (error) => {
          console.error("[Storage] Video upload error:", error);
          reject(new Error(`Failed to upload video: ${error.message}`));
        },
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(downloadURL);
          } catch (error: any) {
            reject(new Error(`Failed to get download URL: ${error.message}`));
          }
        }
      );
    });
  } catch (error: any) {
    console.error("[Storage] Upload video error:", error);
    throw new Error(`Failed to upload video: ${error.message}`);
  }
}

/**
 * Upload any file to Firebase Storage
 * @param uri - Local file URI
 * @param path - Full path in storage including filename
 * @param onProgress - Optional progress callback (0-100)
 * @returns Download URL of the uploaded file
 */
export async function uploadFile(
  uri: string,
  path: string,
  onProgress?: (progress: number) => void
): Promise<string> {
  try {
    const response = await fetch(uri);
    const blob = await response.blob();
    const storageRef = ref(storage, path);

    return new Promise((resolve, reject) => {
      const uploadTask = uploadBytesResumable(storageRef, blob);

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          onProgress?.(Math.round(progress));
        },
        (error) => {
          reject(new Error(`Failed to upload file: ${error.message}`));
        },
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(downloadURL);
          } catch (error: any) {
            reject(new Error(`Failed to get download URL: ${error.message}`));
          }
        }
      );
    });
  } catch (error: any) {
    console.error("[Storage] Upload file error:", error);
    throw new Error(`Failed to upload file: ${error.message}`);
  }
}

export { storage };
