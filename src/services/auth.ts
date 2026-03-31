import {
    createUserWithEmailAndPassword,
    sendPasswordResetEmail,
    signInWithEmailAndPassword,
    signOut
} from "firebase/auth";
import { auth } from "./firebase";

export const authService = {
    login: (email: string, pass: string) => signInWithEmailAndPassword(auth, email, pass),
    register: async (email: string, pass: string, name: string) => {
        const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
        const { updateProfile } = await import("firebase/auth");
        await updateProfile(userCredential.user, { displayName: name });

        // Create user document in Firestore
        const { doc, setDoc } = await import("firebase/firestore");
        const { db } = await import("./firebase/config");
        await setDoc(doc(db, "users", userCredential.user.uid), {
            uid: userCredential.user.uid,
            name,
            email,
            role: "customer",
            createdAt: new Date().toISOString()
        });

        return userCredential;
    },
    logout: () => signOut(auth),
    resetPassword: (email: string) => sendPasswordResetEmail(auth, email)
};
