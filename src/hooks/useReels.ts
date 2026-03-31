import { collection, deleteDoc, doc, onSnapshot, orderBy, query, updateDoc, increment, addDoc, getDocs, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "../services/firebase/config";

export interface Reel {
    id: string;
    title?: string;
    videoUrl?: string;
    thumbnailUrl?: string;
    productId?: string;
    productName?: string;
    productPrice?: number;
    isActive?: boolean;
    isVerified?: boolean;
    views?: number;
    createdAt?: any;
    caption?: string;
    authorId?: string;
    authorName?: string;
    authorAvatar?: string;
    hashtags?: string[];
    likes?: number;
    likesCount?: number;
    commentsCount?: number;
    isLiked?: boolean;
}

export interface ReelComment {
    id: string;
    reelId: string;
    author?: string;
    authorId?: string;
    userName?: string;
    userAvatar?: string;
    text?: string;
    comment?: string;
    createdAt: any;
}

// Hook for admin reel management
export const useReelsAdmin = () => {
    const [reels, setReels] = useState<Reel[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(collection(db, "reels"), orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs
                .map((d) => {
                    const raw = d.data() as any;
                    return {
                        id: d.id,
                        ...raw,
                        videoUrl: typeof raw.videoUrl === "string" ? raw.videoUrl.trim() : undefined,
                        thumbnailUrl: typeof raw.thumbnailUrl === "string" ? raw.thumbnailUrl.trim() : raw.thumbnailUrl,
                        likesCount: Number(raw.likesCount ?? raw.likes ?? 0),
                        commentsCount: Number(raw.commentsCount ?? 0),
                        isLiked: Boolean(raw.isLiked ?? false),
                    } as Reel;
                })
                .filter((reel) => reel.isActive !== false);
            setReels(data);
            setLoading(false);
        }, () => setLoading(false));
        return unsubscribe;
    }, []);

    const deleteReel = async (id: string) => {
        await deleteDoc(doc(db, "reels", id));
    };

    const toggleReel = async (id: string, isActive: boolean) => {
        await updateDoc(doc(db, "reels", id), { isActive });
    };

    const incrementView = async (id: string) => {
        try {
            await updateDoc(doc(db, "reels", id), {
                views: increment(1)
            });
        } catch (error) {
            console.error("Error incrementing view:", error);
        }
    };

    const likeReel = async (id: string) => {
        try {
            await updateDoc(doc(db, "reels", id), {
                likes: increment(1),
                likesCount: increment(1)
            });
        } catch (error) {
            console.error("Error liking reel:", error);
        }
    };

    const addComment = async (reelId: string, text: string, author: string = "Anonymous") => {
        try {
            await addDoc(collection(db, "reel_comments"), {
                reelId,
                text,
                comment: text,
                author,
                userName: author,
                createdAt: new Date()
            });
            await updateDoc(doc(db, "reels", reelId), {
                commentsCount: increment(1)
            });
        } catch (error) {
            console.error("Error adding comment:", error);
        }
    };

    const getComments = async (reelId: string): Promise<ReelComment[]> => {
        try {
            const q = query(
                collection(db, "reel_comments"),
                where("reelId", "==", reelId),
                orderBy("createdAt", "desc")
            );
            const snapshot = await getDocs(q);
            return snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as ReelComment[];
        } catch (error) {
            console.error("Error fetching comments:", error);
            return [];
        }
    };

    return { reels, loading, deleteReel, toggleReel, incrementView, likeReel, addComment, getComments };
};

// Alias for backwards compatibility
export const useReels = useReelsAdmin;
