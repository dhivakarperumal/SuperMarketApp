import { useState, useRef, useCallback, memo, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  Dimensions,
  FlatList,
  ActivityIndicator,
  Image,
  StyleSheet,
  ViewToken,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Share,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Video, ResizeMode } from "expo-av";
import {
  Heart,
  MessageCircle,
  Share2,
  ShoppingBag,
  Volume2,
  VolumeX,
  Play,
  X,
  Send,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useReels, Reel, ReelComment } from "../../../src/hooks/useReels";
import Toast from "react-native-toast-message";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const TAB_BAR_HEIGHT = 80;
const VIDEO_HEIGHT = SCREEN_HEIGHT - TAB_BAR_HEIGHT;

// Separate component for each reel item
const ReelItem = memo(({
  item,
  isActive,
  isMuted,
  onToggleMute,
  onLike,
  onShare,
  onProductTap,
  onCommentTap,
}: {
  item: Reel;
  isActive: boolean;
  isMuted: boolean;
  onToggleMute: () => void;
  onLike: (id: string) => void;
  onShare: (reel: Reel) => void;
  onProductTap: (id: string) => void;
  onCommentTap: (reel: Reel) => void;
}) => {
  const videoRef = useRef<Video>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const togglePlayPause = () => {
    setIsPaused(!isPaused);
  };

  // Validate video URL
  const isValidVideoUrl = (url: string | undefined): boolean => {
    if (!url) return false;
    const trimmedUrl = url.trim();
    return /^(https?:\/\/|file:\/\/|content:\/\/)/i.test(trimmedUrl);
  };

  const validVideoUrl = isValidVideoUrl(item.videoUrl);
  const shouldPlay = isActive && !isPaused;

  useEffect(() => {
    setIsPaused(false);
    setIsLoading(true);
    setHasError(false);
  }, [item.id, item.videoUrl]);

  useEffect(() => {
    if (!validVideoUrl || hasError || !videoRef.current) return;

    const syncPlayback = async () => {
      try {
        if (shouldPlay) {
          await videoRef.current?.playAsync();
        } else {
          await videoRef.current?.pauseAsync();
        }
      } catch (error) {
        console.log("Playback sync error:", error);
      }
    };

    syncPlayback();
  }, [validVideoUrl, shouldPlay, hasError]);
  return (
    <View style={styles.reelContainer}>
      {/* Video */}
      <Pressable onPress={togglePlayPause} style={styles.videoContainer}>
        {validVideoUrl && !hasError ? (
          <>
            <Video
              ref={videoRef}
              source={{ uri: item.videoUrl?.trim() }}
              style={styles.video}
              resizeMode={ResizeMode.COVER}
              isLooping
              isMuted={isMuted}
              shouldPlay={shouldPlay}
              onLoadStart={() => setIsLoading(true)}
              onLoad={() => {
                setIsLoading(false);
                if (shouldPlay) {
                  videoRef.current?.playAsync().catch(() => null);
                }
              }}
              onError={(error) => {
                console.log("Video error:", error);
                setHasError(true);
                setIsLoading(false);
              }}
            />
            {/* Loading indicator */}
            {isLoading && isActive && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color="#fff" />
              </View>
            )}
          </>
        ) : item.thumbnailUrl ? (
          <Image
            source={{ uri: item.thumbnailUrl }}
            style={styles.video}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.video, styles.placeholderVideo]}>
            <Play size={60} color="#fff" />
            <Text style={styles.noVideoText}>No video available</Text>
          </View>
        )}

        {/* Play/Pause indicator */}
        {isPaused && isActive && !isLoading && (
          <View style={styles.pauseOverlay}>
            <View style={styles.playButton}>
              <Play size={40} color="#fff" fill="#fff" />
            </View>
          </View>
        )}
      </Pressable>

      {/* Gradient overlay for text */}
      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.8)"]}
        style={styles.gradient}
        pointerEvents="none"
      />

      {/* Right side actions */}
      <View style={styles.actionsContainer}>
        {/* Profile */}
        <Pressable style={styles.actionButton}>
          <View style={styles.profileImage}>
            {item.authorAvatar ? (
              <Image
                source={{ uri: item.authorAvatar }}
                style={styles.profileImageInner}
              />
            ) : (
              <View style={styles.profilePlaceholder}>
                <Text style={styles.profilePlaceholderText}>
                  {item.authorName?.charAt(0) || "D"}
                </Text>
              </View>
            )}
          </View>
        </Pressable>

        {/* Like */}
        <Pressable
          style={styles.actionButton}
          onPress={() => onLike(item.id)}
        >
          <Heart
            size={28}
            color={item.isLiked ? "#EF4444" : "#fff"}
            fill={item.isLiked ? "#EF4444" : "transparent"}
            strokeWidth={2}
          />
          <Text style={styles.actionText}>
            {item.likesCount > 0 ? formatCount(item.likesCount) : "Like"}
          </Text>
        </Pressable>

        {/* Comment */}
        <Pressable
          style={styles.actionButton}
          onPress={() => onCommentTap(item)}
        >
          <MessageCircle size={28} color="#fff" />
          <Text style={styles.actionText}>
            {item.commentsCount > 0 ? formatCount(item.commentsCount) : "0"}
          </Text>
        </Pressable>

        {/* Share */}
        <Pressable
          style={styles.actionButton}
          onPress={() => onShare(item)}
        >
          <Share2 size={28} color="#fff" />
          <Text style={styles.actionText}>Share</Text>
        </Pressable>

        {/* Mute/Unmute */}
        <Pressable style={styles.actionButton} onPress={onToggleMute}>
          {isMuted ? (
            <VolumeX size={24} color="#fff" />
          ) : (
            <Volume2 size={24} color="#fff" />
          )}
        </Pressable>
      </View>

      {/* Bottom content */}
      <View style={styles.bottomContent}>
        {/* Author info */}
        <View style={styles.authorRow}>
          <Text style={styles.authorName}>@{item.authorName || "dhivadeva"}</Text>
          {item.isVerified && (
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedText}>✓</Text>
            </View>
          )}
        </View>

        {/* Caption */}
        {item.caption && (
          <Text style={styles.caption} numberOfLines={2}>
            {item.caption}
          </Text>
        )}

        {/* Product tag */}
        {item.productId && (
          <Pressable
            style={styles.productTag}
            onPress={() => onProductTap(item.productId!)}
          >
            <ShoppingBag size={16} color="#fff" />
            <Text style={styles.productTagText}>
              {item.productName || "View Product"}
            </Text>
            {item.productPrice && (
              <Text style={styles.productPrice}>₹{item.productPrice}</Text>
            )}
          </Pressable>
        )}

        {/* Hashtags */}
        {item.hashtags && item.hashtags.length > 0 && (
          <Text style={styles.hashtags}>
            {item.hashtags.map((tag) => `#${tag}`).join(" ")}
          </Text>
        )}
      </View>
    </View>
  );
});

const formatCount = (count: number): string => {
  if (count >= 1000000) {
    return (count / 1000000).toFixed(1) + "M";
  }
  if (count >= 1000) {
    return (count / 1000).toFixed(1) + "K";
  }
  return count.toString();
};

const formatCommentDate = (createdAt: any) => {
  if (!createdAt) return "";
  const date = createdAt?.toDate?.() || new Date(createdAt?.seconds * 1000) || new Date();
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
};

export default function ReelsScreen() {
  const { reels, loading, likeReel, incrementView, addComment, getComments } = useReels();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const insets = useSafeAreaInsets();

  // Comments Modal State
  const [showComments, setShowComments] = useState(false);
  const [selectedReel, setSelectedReel] = useState<Reel | null>(null);
  const [comments, setComments] = useState<ReelComment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loadingComments, setLoadingComments] = useState(false);
  const [sendingComment, setSendingComment] = useState(false);

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        const newIndex = viewableItems[0].index;
        setActiveIndex(newIndex);
        // Increment view count for the new active reel
        const activeReel = viewableItems[0].item as Reel;
        if (activeReel?.id) {
          incrementView(activeReel.id);
        }
      }
    },
    [incrementView]
  );

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const handleLike = async (reelId: string) => {
    try {
      await likeReel(reelId);
    } catch (error) {
      console.error("Failed to like reel:", error);
    }
  };

  const handleShare = async (reel: Reel) => {
    try {
      const shareMessage = `🎬 Check out this reel from Dhiva Deva!\n\n${reel.caption || ""}\n\n📹 Watch: ${reel.videoUrl || ""}`;

      await Share.share({
        message: shareMessage,
        title: "Share Reel",
        url: reel.videoUrl, // iOS will use this
      });
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  const handleProductTap = (productId: string) => {
    if (productId) {
      router.push(`/(customer)/product/${productId}`);
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const handleCommentTap = async (reel: Reel) => {
    setSelectedReel(reel);
    setShowComments(true);
    setLoadingComments(true);

    try {
      const fetchedComments = await getComments(reel.id);
      setComments(fetchedComments);
    } catch (error) {
      console.error("Error fetching comments:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to load comments",
      });
    } finally {
      setLoadingComments(false);
    }
  };

  const handleSendComment = async () => {
    if (!selectedReel || !newComment.trim()) return;

    setSendingComment(true);
    try {
      await addComment(selectedReel.id, newComment.trim());
      setNewComment("");

      // Refresh comments
      const fetchedComments = await getComments(selectedReel.id);
      setComments(fetchedComments);

      Toast.show({
        type: "success",
        text1: "Comment Added",
      });
    } catch (error) {
      console.error("Error adding comment:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to add comment",
      });
    } finally {
      setSendingComment(false);
    }
  };

  const closeComments = () => {
    setShowComments(false);
    setSelectedReel(null);
    setComments([]);
    setNewComment("");
  };

  const renderReel = useCallback(({ item, index }: { item: Reel; index: number }) => {
    return (
      <ReelItem
        item={item}
        isActive={index === activeIndex}
        isMuted={isMuted}
        onToggleMute={toggleMute}
        onLike={handleLike}
        onShare={handleShare}
        onProductTap={handleProductTap}
        onCommentTap={handleCommentTap}
      />
    );
  }, [activeIndex, isMuted]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1D5A34" />
        <Text style={styles.loadingText}>Loading reels...</Text>
      </View>
    );
  }

  if (reels.length === 0) {
    return (
      <SafeAreaView style={styles.emptyContainer} edges={["top"]}>
        <View style={styles.emptyContent}>
          <View style={styles.emptyIcon}>
            <Play size={48} color="#9CA3AF" />
          </View>
          <Text style={styles.emptyTitle}>No Reels Yet</Text>
          <Text style={styles.emptySubtitle}>
            Check back later for exciting videos and product showcases!
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={reels}
        renderItem={renderReel}
        keyExtractor={(item) => item.id}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={VIDEO_HEIGHT}
        snapToAlignment="start"
        decelerationRate="fast"
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        getItemLayout={(_, index) => ({
          length: VIDEO_HEIGHT,
          offset: VIDEO_HEIGHT * index,
          index,
        })}
        removeClippedSubviews={false}
        maxToRenderPerBatch={2}
        windowSize={3}
        initialNumToRender={1}
      />

      {/* Header */}
      <SafeAreaView style={styles.header} edges={["top"]}>
        <Text style={styles.headerTitle}>Reels</Text>
      </SafeAreaView>

      {/* Comments Modal */}
      <Modal
        visible={showComments}
        animationType="slide"
        transparent={true}
        onRequestClose={closeComments}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalContainer}
        >
          <Pressable style={styles.modalOverlay} onPress={closeComments} />

          <View style={[styles.commentsSheet, { paddingBottom: insets.bottom }]}>
            {/* Header */}
            <View style={styles.commentsHeader}>
              <Text style={styles.commentsTitle}>
                Comments {selectedReel?.commentsCount ? `(${selectedReel.commentsCount})` : ""}
              </Text>
              <Pressable onPress={closeComments} style={styles.closeButton}>
                <X size={24} color="#374151" />
              </Pressable>
            </View>

            {/* Comments List */}
            {loadingComments ? (
              <View style={styles.commentsLoading}>
                <ActivityIndicator size="large" color="#1D5A34" />
              </View>
            ) : comments.length === 0 ? (
              <View style={styles.noComments}>
                <MessageCircle size={48} color="#D1D5DB" />
                <Text style={styles.noCommentsText}>No comments yet</Text>
                <Text style={styles.noCommentsSubtext}>Be the first to comment!</Text>
              </View>
            ) : (
              <FlatList
                data={comments}
                keyExtractor={(item) => item.id}
                style={styles.commentsList}
                renderItem={({ item }) => (
                  <View style={styles.commentItem}>
                    <View style={styles.commentAvatar}>
                      {item.userAvatar ? (
                        <Image source={{ uri: item.userAvatar }} style={styles.commentAvatarImage} />
                      ) : (
                        <View style={styles.commentAvatarPlaceholder}>
                          <Text style={styles.commentAvatarText}>
                            {(item.userName || "U")[0].toUpperCase()}
                          </Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.commentContent}>
                      <View style={styles.commentHeader}>
                        <Text style={styles.commentUserName}>{item.userName || "User"}</Text>
                        <Text style={styles.commentTime}>{formatCommentDate(item.createdAt)}</Text>
                      </View>
                      <Text style={styles.commentText}>{item.comment}</Text>
                    </View>
                  </View>
                )}
              />
            )}

            {/* Comment Input */}
            <View style={styles.commentInputContainer}>
              <TextInput
                style={styles.commentInput}
                placeholder="Add a comment..."
                placeholderTextColor="#9CA3AF"
                value={newComment}
                onChangeText={setNewComment}
                multiline
                maxLength={500}
              />
              <Pressable
                onPress={handleSendComment}
                disabled={sendingComment || !newComment.trim()}
                style={[
                  styles.sendButton,
                  (!newComment.trim() || sendingComment) && styles.sendButtonDisabled,
                ]}
              >
                {sendingComment ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Send size={20} color="#fff" />
                )}
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    color: "#fff",
    marginTop: 16,
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  emptyContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 24,
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  reelContainer: {
    width: SCREEN_WIDTH,
    height: VIDEO_HEIGHT,
    backgroundColor: "#000",
  },
  videoContainer: {
    flex: 1,
  },
  video: {
    width: "100%",
    height: "100%",
  },
  placeholderVideo: {
    backgroundColor: "#1a1a1a",
    alignItems: "center",
    justifyContent: "center",
  },
  noVideoText: {
    color: "#666",
    marginTop: 12,
    fontSize: 14,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  pauseOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  playButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  gradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 300,
  },
  actionsContainer: {
    position: "absolute",
    right: 12,
    bottom: 120,
    alignItems: "center",
  },
  actionButton: {
    alignItems: "center",
    marginBottom: 20,
  },
  actionText: {
    color: "#fff",
    fontSize: 12,
    marginTop: 4,
    fontWeight: "600",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  profileImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: "#fff",
    marginBottom: 4,
    overflow: "hidden",
  },
  profileImageInner: {
    width: "100%",
    height: "100%",
  },
  profilePlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#1D5A34",
    alignItems: "center",
    justifyContent: "center",
  },
  profilePlaceholderText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  bottomContent: {
    position: "absolute",
    bottom: 20,
    left: 16,
    right: 70,
  },
  authorRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  authorName: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  verifiedBadge: {
    marginLeft: 6,
    backgroundColor: "#3B82F6",
    borderRadius: 10,
    width: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  verifiedText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
  },
  caption: {
    color: "#fff",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  productTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(79, 173, 33, 0.9)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: "flex-start",
    marginBottom: 8,
  },
  productTagText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
    marginLeft: 6,
  },
  productPrice: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "bold",
    marginLeft: 8,
    backgroundColor: "rgba(0,0,0,0.3)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  hashtags: {
    color: "#fff",
    fontSize: 13,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  // Comments Modal Styles
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  commentsSheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: SCREEN_HEIGHT * 0.7,
    minHeight: SCREEN_HEIGHT * 0.5,
  },
  commentsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  commentsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1F2937",
  },
  closeButton: {
    padding: 4,
  },
  commentsLoading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  noComments: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  noCommentsText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6B7280",
    marginTop: 12,
  },
  noCommentsSubtext: {
    fontSize: 14,
    color: "#9CA3AF",
    marginTop: 4,
  },
  commentsList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  commentItem: {
    flexDirection: "row",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  commentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: "hidden",
    marginRight: 12,
  },
  commentAvatarImage: {
    width: "100%",
    height: "100%",
  },
  commentAvatarPlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#1D5A34",
    alignItems: "center",
    justifyContent: "center",
  },
  commentAvatarText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  commentUserName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
  },
  commentTime: {
    fontSize: 12,
    color: "#9CA3AF",
    marginLeft: 8,
  },
  commentText: {
    fontSize: 14,
    color: "#4B5563",
    lineHeight: 20,
  },
  commentInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    backgroundColor: "#fff",
  },
  commentInput: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: "#1F2937",
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#1D5A34",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: "#D1D5DB",
  },
});
