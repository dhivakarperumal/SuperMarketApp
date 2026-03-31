import AsyncStorage from "@react-native-async-storage/async-storage";
import {
    createUserWithEmailAndPassword,
    GoogleAuthProvider,
    onAuthStateChanged,
    signInWithCredential,
    signInWithEmailAndPassword,
    signOut,
    updateProfile,
    User,
} from "firebase/auth";
import React, { createContext, useContext, useEffect, useState } from "react";
import { auth } from "../services/firebase/config";

interface AuthContextType {
    user: User | null;
    userProfile: any | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    role: string | null;
    signIn: (email: string, password: string) => Promise<void>;
    signUp: (email: string, password: string, name: string, phone?: string) => Promise<void>;
    signInWithGoogle: (idToken?: string) => Promise<void>;
    login: (role: string) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [userProfile, setUserProfile] = useState<any | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [role, setRole] = useState<string | null>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            setUser(firebaseUser);
            if (firebaseUser) {
                const savedRole = await AsyncStorage.getItem("userRole");
                setRole(savedRole || "customer");
                setUserProfile({
                    displayName: firebaseUser.displayName || "Admin User",
                    email: firebaseUser.email,
                });
            } else {
                setRole(null);
                setUserProfile(null);
            }
            setIsLoading(false);
        });

        return unsubscribe;
    }, []);

    const login = async (newRole: string) => {
        await AsyncStorage.setItem("userRole", newRole);
        setRole(newRole);
    };

    const signUp = async (email: string, password: string, name: string, phone?: string) => {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            await updateProfile(userCredential.user, { displayName: name });

            const profile = {
                displayName: name,
                email: userCredential.user.email,
                phone: phone || "",
            };

            setUserProfile(profile);
            await AsyncStorage.setItem("userRole", "customer");
            setRole("customer");
        } catch (error: any) {
            throw new Error(error.message || "Failed to create account");
        }
    };

    const signIn = async (email: string, password: string) => {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const defaultRole = userCredential.user.email?.includes("admin") ? "admin" : "customer";
            await AsyncStorage.setItem("userRole", defaultRole);
            setRole(defaultRole);
        } catch (error: any) {
            throw new Error(error.message || "Failed to sign in");
        }
    };

    const signInWithGoogle = async (idToken?: string) => {
        try {
            // If idToken is provided, use it
            if (idToken) {
                const credential = GoogleAuthProvider.credential(idToken);
                await signInWithCredential(auth, credential);
            }
            // Note: For a production app, you would integrate with @react-native-google-signin/google-signin
            // or use Expo's authentication APIs
            
            // For now, this is a placeholder for Google sign-in
            // Set default role for Google sign-in users
            await AsyncStorage.setItem("userRole", "customer");
            setRole("customer");
        } catch (error: any) {
            throw new Error(error.message || "Failed to sign in with Google");
        }
    };

    const logout = async () => {
        // Clear local state immediately
        setUser(null);
        setUserProfile(null);
        setRole(null);
        
        // Clear AsyncStorage
        await AsyncStorage.removeItem("userRole");
        
        // Sign out from Firebase
        await signOut(auth);
    };

    return (
        <AuthContext.Provider value={{
            user,
            userProfile,
            isLoading,
            isAuthenticated: !!user,
            role,
            signIn,
            signUp,
            signInWithGoogle,
            login,
            logout
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};
