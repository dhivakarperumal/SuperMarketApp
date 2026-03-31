import { getDownloadURL, getStorage, ref, uploadBytes } from "firebase/storage";
import app from "./firebase";

export const storage = getStorage(app);

export const uploadImage = async (path: string, uri: string) => {
    const response = await fetch(uri);
    const blob = await response.blob();
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, blob);
    return getDownloadURL(storageRef);
};
