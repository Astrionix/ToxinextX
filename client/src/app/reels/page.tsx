"use client";

import { useState, useRef, useEffect } from "react";
import { Heart, MessageCircle, Send, MoreHorizontal, Volume2, VolumeX, Plus, Loader2, X } from "lucide-react";
import { API_URL } from "@/config";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogHeader } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";

export default function ReelsPage() {
    const [reels, setReels] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploadOpen, setUploadOpen] = useState(false);
    const [currentUser, setCurrentUser] = useState<any>(null);

    useEffect(() => {
        const user = localStorage.getItem("user");
        if (user) setCurrentUser(JSON.parse(user));
    }, []);

    const fetchReels = async () => {
        try {
            const user = localStorage.getItem("user");
            const userId = user ? JSON.parse(user).id : '';
            const res = await fetch(`${API_URL}/api/reels?userId=${userId}`);
            if (res.ok) {
                const data = await res.json();
                const mapped = data.map((r: any) => ({
                    id: r.id,
                    url: r.video_url,
                    username: r.users?.username || "Unknown",
                    description: r.description,
                    likes: r.likes_count,
                    comments: r.comments_count,
                    user_avatar: r.users?.avatar_url,
                    is_liked: r.is_liked
                }));
                setReels(mapped);
            }
        } catch (err) {
            console.error("Failed to fetch reels", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReels();
    }, []);

    return (
        <div className="h-screen w-full flex justify-center bg-black overflow-y-scroll snap-y snap-mandatory scrollbar-hide relative">
            <UploadReelDialog open={uploadOpen} onOpenChange={setUploadOpen} onUploaded={fetchReels} />

            {reels.length === 0 && !loading && (
                <div className="flex flex-col items-center justify-center p-10 text-gray-500 h-full">
                    <p>No reels yet. Be the first!</p>
                    <Button onClick={() => setUploadOpen(true)} className="mt-4 bg-white text-black hover:bg-gray-200">
                        Upload Reel
                    </Button>
                </div>
            )}

            <div className="w-full max-w-[400px] h-full">
                {reels.map((reel) => (
                    <ReelItem key={reel.id} reel={reel} currentUser={currentUser} />
                ))}
            </div>

            {/* Floating Upload Button */}
            <div className="absolute top-4 right-4 z-50">
                <Button onClick={() => setUploadOpen(true)} size="icon" className="rounded-full bg-transparent hover:bg-gray-800 text-white border border-gray-600">
                    <Plus className="w-6 h-6" />
                </Button>
            </div>
        </div>
    );
}

function UploadReelDialog({ open, onOpenChange, onUploaded }: { open: boolean, onOpenChange: (open: boolean) => void, onUploaded: () => void }) {
    const [file, setFile] = useState<File | null>(null);
    const [description, setDescription] = useState("");
    const [uploading, setUploading] = useState(false);

    const handleUpload = async () => {
        if (!file) return;
        setUploading(true);

        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const formData = new FormData();
            formData.append('video', file);
            formData.append('user_id', user.id);
            formData.append('description', description);

            const res = await fetch(`${API_URL}/api/reels`, {
                method: 'POST',
                body: formData
            });

            if (res.ok) {
                onOpenChange(false);
                setFile(null);
                setDescription("");
                onUploaded();
            } else {
                alert("Upload failed");
            }
        } catch (e) {
            console.error(e);
        } finally {
            setUploading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-gray-900 border border-gray-800 text-white max-w-md">
                <DialogTitle className="text-xl font-bold mb-4">Upload Reel</DialogTitle>
                <div className="space-y-4">
                    <input
                        type="file"
                        accept="video/*"
                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                        className="w-full bg-black border border-gray-700 p-2 rounded text-sm"
                    />
                    <textarea
                        placeholder="Description..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full bg-black border border-gray-700 p-2 rounded h-24 text-sm resize-none"
                    />
                    <Button onClick={handleUpload} disabled={!file || uploading} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                        {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                        {uploading ? "Uploading..." : "Post Reel"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

function ReelItem({ reel, currentUser }: { reel: any, currentUser: any }) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isMuted, setIsMuted] = useState(true);
    const [isPlaying, setIsPlaying] = useState(true);
    const [isLiked, setIsLiked] = useState(reel.is_liked);
    const [likeCount, setLikeCount] = useState(reel.likes);
    const [commentCount, setCommentCount] = useState(reel.comments);
    const [showComments, setShowComments] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        videoRef.current?.play().catch(() => { });
                        setIsPlaying(true);
                    } else {
                        videoRef.current?.pause();
                        setIsPlaying(false);
                    }
                });
            },
            { threshold: 0.6 }
        );

        if (videoRef.current) {
            observer.observe(videoRef.current);
        }

        return () => {
            if (videoRef.current) {
                observer.unobserve(videoRef.current);
            }
        };
    }, []);

    const togglePlay = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const toggleMute = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (videoRef.current) {
            videoRef.current.muted = !isMuted;
            setIsMuted(!isMuted);
        }
    };

    const handleLike = async () => {
        if (!currentUser) return;

        // Optimistic
        const prev = isLiked;
        const prevCount = likeCount;

        setIsLiked(!isLiked);
        setLikeCount((prev: number) => isLiked ? prev - 1 : prev + 1);

        try {
            const res = await fetch(`${API_URL}/api/reels/${reel.id}/like`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: currentUser.id })
            });
            if (!res.ok) {
                // Revert
                setIsLiked(prev);
                setLikeCount(prevCount);
            }
        } catch (e) {
            console.error(e);
            setIsLiked(prev);
            setLikeCount(prevCount);
        }
    };

    const formatCount = (count: number) => {
        if (count >= 1000000) return (count / 1000000).toFixed(1) + 'M';
        if (count >= 1000) return (count / 1000).toFixed(1) + 'K';
        return count.toString();
    };

    return (
        <div className="relative w-full h-screen snap-start flex items-center justify-center bg-gray-900 border-b border-gray-800">
            <video
                ref={videoRef}
                src={reel.url}
                className="w-full h-full object-cover cursor-pointer"
                loop
                muted={isMuted}
                playsInline
                onClick={togglePlay}
                onDoubleClick={handleLike}
            />

            {/* Comments Dialog */}
            <CommentsDialog
                open={showComments}
                onOpenChange={setShowComments}
                reelId={reel.id}
                currentUser={currentUser}
            />

            {/* Overlay Controls */}
            <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 bg-gradient-to-b from-black/20 via-transparent to-black/60">
                <div className="flex justify-end pt-4">
                    <button onClick={toggleMute} className="pointer-events-auto p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition">
                        {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                    </button>
                </div>

                <div className="flex items-end justify-between pb-12">
                    <div className="flex-1 pr-4">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 rounded-full bg-gray-500 overflow-hidden">
                                <img src={reel.user_avatar || `https://i.pravatar.cc/150?u=${reel.username}`} alt="avatar" className="w-full h-full object-cover" />
                            </div>
                            <span className="font-bold text-white text-sm">{reel.username}</span>
                            <button className="text-xs font-semibold border border-white/50 px-2 py-1 rounded text-white pointer-events-auto hover:bg-white/20">Follow</button>
                        </div>
                        <p className="text-white text-sm line-clamp-2">{reel.description}</p>
                    </div>

                    <div className="flex flex-col gap-4 items-center pointer-events-auto">
                        <button onClick={handleLike} className="flex flex-col items-center gap-1 group">
                            <div className="p-2 rounded-full hover:bg-white/10 transition">
                                <Heart size={28} className={`transition-transform group-hover:scale-110 ${isLiked ? 'fill-red-500 text-red-500' : 'text-white'}`} />
                            </div>
                            <span className="text-white text-xs font-medium">{formatCount(likeCount)}</span>
                        </button>

                        <button onClick={() => setShowComments(true)} className="flex flex-col items-center gap-1 group">
                            <div className="p-2 rounded-full hover:bg-white/10 transition">
                                <MessageCircle size={28} className="text-white group-hover:scale-110 transition-transform" />
                            </div>
                            <span className="text-white text-xs font-medium">{formatCount(commentCount)}</span>
                        </button>

                        <button className="flex flex-col items-center gap-1 group">
                            <div className="p-2 rounded-full hover:bg-white/10 transition">
                                <Send size={28} className="text-white group-hover:scale-110 transition-transform" />
                            </div>
                        </button>

                        <button className="flex flex-col items-center gap-1 group">
                            <div className="p-2 rounded-full hover:bg-white/10 transition">
                                <MoreHorizontal size={28} className="text-white group-hover:scale-110 transition-transform" />
                            </div>
                        </button>

                        <div className="w-8 h-8 rounded-md border-2 border-white overflow-hidden mt-2 animate-spin-slow">
                            <img src={reel.user_avatar || `https://i.pravatar.cc/150?u=${reel.username}`} alt="music" className="w-full h-full object-cover" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function CommentsDialog({ open, onOpenChange, reelId, currentUser }: { open: boolean, onOpenChange: any, reelId: string, currentUser: any }) {
    const [comments, setComments] = useState<any[]>([]);
    const [text, setText] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open) {
            fetchComments();
        }
    }, [open]);

    const fetchComments = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/reels/${reelId}/comments`);
            if (res.ok) {
                setComments(await res.json());
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const postComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!text.trim() || !currentUser) return;

        const tempId = Date.now();
        const optimisticComment = {
            id: tempId,
            text,
            users: { username: currentUser.username, avatar_url: currentUser.avatar_url }
        };

        setComments([...comments, optimisticComment]);
        setText("");

        try {
            await fetch(`${API_URL}/api/reels/${reelId}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: currentUser.id, text: text })
            });
            fetchComments(); // Refresh for real ID
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-gray-900 border border-gray-800 text-white max-w-md h-[50vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Comments</DialogTitle>
                </DialogHeader>
                <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                    {loading ? <div className="text-center text-sm text-gray-500">Loading...</div> :
                        comments.length === 0 ? <div className="text-center text-sm text-gray-500">No comments yet.</div> :
                            comments.map((c) => (
                                <div key={c.id} className="flex gap-3">
                                    <Avatar className="w-8 h-8">
                                        <AvatarImage src={c.users?.avatar_url} />
                                        <AvatarFallback>{c.users?.username?.[0]}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col">
                                        <span className="font-bold text-xs text-gray-300">{c.users?.username}</span>
                                        <span className="text-sm">{c.text}</span>
                                    </div>
                                </div>
                            ))}
                </div>
                <form onSubmit={postComment} className="flex gap-2 pt-2 border-t border-gray-800">
                    <Input
                        value={text}
                        onChange={e => setText(e.target.value)}
                        placeholder="Add a comment..."
                        className="bg-black border-gray-700"
                    />
                    <Button type="submit" size="sm">Post</Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
