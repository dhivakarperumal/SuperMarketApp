import * as FileSystem from "expo-file-system";

interface ProcessImageOptions {
    maxWidth?: number;
    quality?: number;
    maxSizeKB?: number;
}

export const processImageForFirestore = async (
    uri: string,
    options: ProcessImageOptions = {}
): Promise<string> => {
    try {
        const base64 = await FileSystem.readAsStringAsync(uri, {
            encoding: FileSystem.EncodingType.Base64,
        });
        const mimeType = uri.endsWith(".png") ? "image/png" : "image/jpeg";
        return `data:${mimeType};base64,${base64}`;
    } catch (error) {
        console.error("Error processing image:", error);
        throw error;
    }
};
