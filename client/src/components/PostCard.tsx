"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal, ShieldCheck, Smile } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { API_URL } from "@/config";

interface PostProps {
    postId: string;
    username: string;
    avatar: string;
    image: string;
    caption: string;
    likes: number;
    comments: number;
    time: string;
    isSafe?: boolean;
    currentUserId?: string;
    postUserId: string;
    initialIsLiked?: boolean;
    priority?: boolean;
}

export function PostCard({ postId, username, avatar, image, caption, likes: initialLikes, comments: initialComments, time, isSafe = true, currentUserId = "00000000-0000-0000-0000-000000000000", postUserId, initialIsLiked = false, priority = false }: PostProps) {
    const [isLiked, setIsLiked] = useState(initialIsLiked);
    const [likesCount, setLikesCount] = useState(initialLikes);
    const [isSaved, setIsSaved] = useState(false);
    const [comment, setComment] = useState("");
    const [commentsCount, setCommentsCount] = useState(initialComments);
    const [showComments, setShowComments] = useState(false);
    const [postComments, setPostComments] = useState<{ user: string, text: string }[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleLike = async () => {
        // Optimistic Update
        const previousLiked = isLiked;
        const previousCount = likesCount;

        setIsLiked(!isLiked);
        setLikesCount(prev => isLiked ? prev - 1 : prev + 1);

        try {
            await fetch(`${API_URL}/api/posts/${postId}/like`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: currentUserId })
            });
        } catch (err) {
            // Revert on error
            setIsLiked(previousLiked);
            setLikesCount(previousCount);
            console.error(err);
        }
    };

    const handleSave = async () => {
        const prevSaved = isSaved;
        setIsSaved(!isSaved);
        try {
            const res = await fetch(`${API_URL}/api/bookmarks/${postId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: currentUserId })
            });
            if (!res.ok) setIsSaved(prevSaved);
        } catch (e) {
            console.error(e);
            setIsSaved(prevSaved);
        }
    };

    const handleCommentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!comment.trim() || isSubmitting) return;

        setIsSubmitting(true);
        try {
            const sessionStr = localStorage.getItem("supabase_session");
            const token = sessionStr ? JSON.parse(sessionStr).access_token : null;

            const response = await fetch(`${API_URL}/api/comments/${postId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token ? `Bearer ${token}` : ''
                },
                body: JSON.stringify({
                    user_id: currentUserId,
                    text: comment
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                // Handle error (e.g., blocked comment)
                let msg = data.error || "Failed to post comment";
                if (data.details && data.details.category) {
                    msg += `\nReason: ${data.details.category}`;
                    if (data.details.detected_language) {
                        msg += ` (${data.details.detected_language})`;
                    }
                }
                alert(msg);
                if (data.details) {
                    console.log("Moderation details:", data.details);
                }
            } else {
                // Success
                setPostComments([...postComments, { user: "you", text: comment }]);
                setCommentsCount(prev => prev + 1);
                setComment("");
                setShowComments(true);
            }
        } catch (error) {
            console.error("Error posting comment:", error);
            alert("Something went wrong");
        } finally {
            setIsSubmitting(false);
        }
    };

    const toggleComments = async () => {
        if (!showComments && postComments.length === 0 && commentsCount > 0) {
            try {
                const res = await fetch(`${API_URL}/api/comments/${postId}?userId=${currentUserId}`);
                if (res.ok) {
                    const data = await res.json();
                    setPostComments(data.map((c: any) => ({
                        user: c.users?.username || 'user',
                        text: c.text
                    })));
                }
            } catch (err) {
                console.error("Failed to fetch comments", err);
            }
        }
        setShowComments(!showComments);
    };

    return (
        <Card className="w-full max-w-[470px] mx-auto bg-black border-b border-gray-800 rounded-none sm:rounded-md sm:border mb-6">
            <CardHeader className="flex flex-row items-center justify-between p-3">
                <div className="flex items-center gap-3">
                    <Link href={`/profile/${postUserId}`}>
                        <Avatar className="w-8 h-8 cursor-pointer">
                            <AvatarImage src={avatar} />
                            <AvatarFallback>{username[0]}</AvatarFallback>
                        </Avatar>
                    </Link>
                    <div className="flex flex-col">
                        <Link href={`/profile/${postUserId}`} className="font-semibold text-sm text-white cursor-pointer hover:opacity-80 flex items-center gap-1">
                            {username}
                            {isSafe && <ShieldCheck className="w-3 h-3 text-green-500" />}
                        </Link>
                    </div>
                </div>
                <MoreHorizontal className="w-5 h-5 text-white cursor-pointer" />
            </CardHeader>
            <CardContent className="p-0 relative aspect-square bg-gray-900" onDoubleClick={handleLike}>
                <Image src={image} alt="Post" fill className={`object-cover ${isSafe ? '' : 'blur-xl'}`} sizes="(max-width: 470px) 100vw, 470px" priority={priority} unoptimized />
                {!isSafe && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 z-10 p-4 text-center">
                        <ShieldCheck className="w-12 h-12 text-red-500 mb-2" />
                        <h3 className="text-white font-bold text-lg">Sensitive Content</h3>
                        <p className="text-gray-300 text-sm mb-4">This post has been flagged as potential safety violation.</p>
                        <button onClick={(e) => {
                            e.stopPropagation();
                            const img = e.currentTarget.parentElement?.parentElement?.querySelector('img');
                            if (img) img.classList.remove('blur-xl');
                            e.currentTarget.parentElement?.remove();
                        }} className="px-4 py-2 bg-gray-800 rounded-md text-white text-sm hover:bg-gray-700">
                            View Anyway
                        </button>
                    </div>
                )}
            </CardContent>
            <CardFooter className="flex flex-col items-start p-3 gap-2">
                <div className="flex items-center justify-between w-full text-white">
                    <div className="flex items-center gap-4">
                        <button onClick={handleLike} className="focus:outline-none">
                            <Heart className={`w-6 h-6 cursor-pointer transition-colors ${isLiked ? "fill-red-500 text-red-500" : "hover:text-gray-400"}`} />
                        </button>
                        <button onClick={toggleComments} className="focus:outline-none">
                            <MessageCircle className="w-6 h-6 cursor-pointer hover:text-gray-400 transition-colors" />
                        </button>
                        <Send className="w-6 h-6 cursor-pointer hover:text-gray-400 transition-colors" />
                    </div>
                    <button onClick={handleSave} className="focus:outline-none">
                        <Bookmark className={`w-6 h-6 cursor-pointer transition-colors ${isSaved ? "fill-white text-white" : "hover:text-gray-400"}`} />
                    </button>
                </div>
                <div className="font-semibold text-sm text-white">{likesCount.toLocaleString()} likes</div>
                <div className="text-sm text-white">
                    <Link href={`/profile/${postUserId}`} className="font-semibold mr-2 cursor-pointer hover:opacity-80">{username}</Link>
                    {caption.split(/(\s+)/).map((part, index) => {
                        if (part.startsWith('#')) {
                            return <Link key={index} href={`/search?q=${part.slice(1)}`} className="text-blue-400 hover:underline">{part}</Link>;
                        }
                        if (part.startsWith('@')) {
                            return <Link key={index} href={`/search?q=${part.slice(1)}`} className="text-blue-400 hover:underline">{part}</Link>;
                        }
                        return part;
                    })}
                </div>

                <button
                    onClick={toggleComments}
                    className="text-gray-500 text-sm cursor-pointer hover:text-gray-400"
                >
                    View all {commentsCount} comments
                </button>

                {showComments && (
                    <div className="w-full flex flex-col gap-1 mt-1 mb-2">
                        {postComments.map((c, i) => (
                            <div key={i} className="text-sm text-white">
                                <span className="font-semibold mr-2">{c.user}</span>
                                <span>{c.text}</span>
                            </div>
                        ))}
                    </div>
                )}

                <div className="text-gray-500 text-[10px] uppercase">{time}</div>

                <form onSubmit={handleCommentSubmit} className="w-full flex items-center gap-2 mt-2 border-t border-gray-800 pt-3">
                    <Smile className="w-5 h-5 text-white cursor-pointer" />
                    <input
                        type="text"
                        placeholder="Add a comment..."
                        className="bg-transparent text-sm text-white flex-1 focus:outline-none placeholder:text-gray-500"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        disabled={isSubmitting}
                    />
                    {comment.length > 0 && (
                        <button type="submit" disabled={isSubmitting} className="text-blue-500 font-semibold text-sm hover:text-white transition-colors disabled:opacity-50">
                            {isSubmitting ? '...' : 'Post'}
                        </button>
                    )}
                </form>
            </CardFooter>
        </Card>
    );
}
