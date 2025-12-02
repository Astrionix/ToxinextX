"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Grid, Bookmark, UserSquare2 } from "lucide-react";
import Image from "next/image";

export default function ProfilePage() {
    const { id } = useParams();
    const [user, setUser] = useState<any>(null);
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isFollowing, setIsFollowing] = useState(false);
    const [currentUser, setCurrentUser] = useState<any>(null);

    useEffect(() => {
        // Get current user from local storage (simplified)
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            setCurrentUser(JSON.parse(storedUser));
        }

        const fetchProfile = async () => {
            try {
                const res = await fetch(`http://localhost:5000/api/users/${id}`);
                const data = await res.json();
                if (res.ok) {
                    setUser(data);
                    setPosts(data.posts || []);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [id]);

    useEffect(() => {
        if (currentUser && id && currentUser.id !== id) {
            const checkFollow = async () => {
                try {
                    const res = await fetch(`http://localhost:5000/api/follows/check?follower_id=${currentUser.id}&following_id=${id}`);
                    const data = await res.json();
                    setIsFollowing(data.isFollowing);
                } catch (err) {
                    console.error(err);
                }
            };
            checkFollow();
        }
    }, [currentUser, id]);

    const handleFollow = async () => {
        if (!currentUser) return;

        try {
            if (isFollowing) {
                await fetch("http://localhost:5000/api/follows/remove", {
                    method: "DELETE",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ follower_id: currentUser.id, following_id: id }),
                });
                setIsFollowing(false);
            } else {
                await fetch("http://localhost:5000/api/follows/add", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ follower_id: currentUser.id, following_id: id }),
                });
                setIsFollowing(true);
            }
        } catch (err) {
            console.error(err);
        }
    };

    if (loading) return <div className="text-white text-center mt-10">Loading...</div>;
    if (!user) return <div className="text-white text-center mt-10">User not found</div>;

    return (
        <div className="flex flex-col w-full max-w-[935px] mx-auto pt-8 px-4">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-12">
                <Avatar className="w-32 h-32 md:w-40 md:h-40 border-2 border-gray-800">
                    <AvatarImage src={user.avatar_url} />
                    <AvatarFallback>{user.username[0]}</AvatarFallback>
                </Avatar>

                <div className="flex flex-col gap-4 w-full md:w-auto">
                    <div className="flex flex-col md:flex-row items-center gap-4">
                        <h2 className="text-xl font-normal text-white">{user.username}</h2>
                        {currentUser && currentUser.id !== user.id && (
                            <div className="flex gap-2">
                                <Button
                                    onClick={handleFollow}
                                    className={isFollowing ? "bg-gray-800 text-white hover:bg-gray-700" : "bg-blue-500 text-white hover:bg-blue-600"}
                                    size="sm"
                                >
                                    {isFollowing ? "Following" : "Follow"}
                                </Button>
                                <Button variant="secondary" size="sm">Message</Button>
                            </div>
                        )}
                        {currentUser && currentUser.id === user.id && (
                            <Button variant="secondary" size="sm">Edit Profile</Button>
                        )}
                    </div>

                    <div className="flex justify-center md:justify-start gap-8 text-white">
                        <span><strong>{posts.length}</strong> posts</span>
                        <span><strong>{user.followersCount || 0}</strong> followers</span>
                        <span><strong>{user.followingCount || 0}</strong> following</span>
                    </div>

                    <div className="text-center md:text-left">
                        <div className="font-semibold text-white">{user.full_name}</div>
                        <div className="text-white whitespace-pre-wrap">{user.bio}</div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-t border-gray-800 flex justify-center gap-12 mb-4">
                <div className="flex items-center gap-2 py-4 border-t border-white text-white text-xs font-semibold tracking-widest uppercase cursor-pointer">
                    <Grid size={12} /> Posts
                </div>
                <div className="flex items-center gap-2 py-4 text-gray-500 text-xs font-semibold tracking-widest uppercase cursor-pointer hover:text-white transition-colors">
                    <Bookmark size={12} /> Saved
                </div>
                <div className="flex items-center gap-2 py-4 text-gray-500 text-xs font-semibold tracking-widest uppercase cursor-pointer hover:text-white transition-colors">
                    <UserSquare2 size={12} /> Tagged
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-3 gap-1 md:gap-4">
                {posts.map((post) => (
                    <div key={post.id} className="relative aspect-square bg-gray-900 group cursor-pointer">
                        <Image
                            src={post.image_url}
                            alt="Post"
                            fill
                            className="object-cover"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold gap-4">
                            {/* Likes/Comments count could go here */}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
