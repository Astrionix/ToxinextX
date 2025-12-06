"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog";
import { PostCard } from "@/components/PostCard";
import { Heart, MessageCircle, Loader2 } from "lucide-react";
import { API_URL } from "@/config";

export default function ExplorePage() {
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<any>(null);

    useEffect(() => {
        const userStr = localStorage.getItem("user");
        if (userStr) {
            setCurrentUser(JSON.parse(userStr));
        }
    }, []);

    useEffect(() => {
        const fetchExplorePosts = async () => {
            try {
                let url = `${API_URL}/api/posts?type=explore`;
                if (currentUser) {
                    url += `&user_id=${currentUser.id}`;
                }
                const res = await fetch(url);
                if (res.ok) {
                    const data = await res.json();
                    setPosts(data);
                }
            } catch (err) {
                console.error("Failed to load explore posts", err);
            } finally {
                setLoading(false);
            }
        };
        fetchExplorePosts();
    }, [currentUser?.id]);

    return (
        <div className="w-full max-w-6xl mx-auto py-8 px-4">
            <h1 className="text-2xl font-bold text-white mb-6">Explore</h1>

            {loading ? (
                <div className="flex justify-center mt-20">
                    <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
                </div>
            ) : posts.length === 0 ? (
                <div className="text-gray-500 text-center mt-20">No explore posts available.</div>
            ) : (
                <div className="grid grid-cols-3 gap-1 md:gap-4">
                    {posts.map((post) => (
                        <Dialog key={post.id}>
                            <DialogTrigger asChild>
                                <div className="relative aspect-square group cursor-pointer overflow-hidden rounded-sm bg-gray-900">
                                    <Image
                                        src={post.image_url}
                                        alt={`Explore post`}
                                        fill
                                        className="object-cover transition-transform duration-300 group-hover:scale-110"
                                        sizes="(max-width: 768px) 33vw, 400px"
                                        unoptimized
                                    />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-6 text-white font-bold">
                                        <div className="flex items-center gap-2">
                                            <Heart className="fill-white" />
                                            <span>{post.likes ? post.likes.length : 0}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <MessageCircle className="fill-white" />
                                            <span>0</span>
                                        </div>
                                    </div>
                                </div>
                            </DialogTrigger>
                            <DialogContent className="bg-black border-gray-800 p-0 max-w-3xl w-full overflow-hidden flex flex-col md:flex-row h-[80vh] md:h-[600px]">
                                <DialogTitle className="sr-only">Post by {post.users?.username}</DialogTitle>
                                <div className="relative w-full md:w-1/2 h-1/2 md:h-full bg-gray-900">
                                    <Image
                                        src={post.image_url}
                                        alt={`Post`}
                                        fill
                                        className="object-cover"
                                        unoptimized
                                    />
                                </div>
                                <div className="w-full md:w-1/2 h-1/2 md:h-full overflow-y-auto">
                                    <PostCard
                                        postId={post.id}
                                        currentUserId={currentUser?.id}
                                        username={post.users?.username || "Unknown"}
                                        avatar={post.users?.avatar_url || "https://github.com/shadcn.png"}
                                        image={post.image_url}
                                        caption={post.caption}
                                        likes={post.likes ? post.likes.length : 0}
                                        initialIsLiked={post.likes && currentUser ? post.likes.some((l: any) => l.user_id === currentUser.id) : false}
                                        comments={0}
                                        time={new Date(post.created_at).toLocaleDateString()}
                                        isSafe={post.ai_label === 'safe'}
                                        postUserId={post.user_id}
                                    />
                                </div>
                            </DialogContent>
                        </Dialog>
                    ))}
                </div>
            )}
        </div>
    );
}
