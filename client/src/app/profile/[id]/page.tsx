"use client";

import { API_URL } from "@/config";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Grid, Bookmark, UserSquare2, MoreHorizontal, Ban } from "lucide-react";
import Image from "next/image";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function ProfilePage() {
    const { id } = useParams();
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isFollowing, setIsFollowing] = useState(false);
    const [isBlocked, setIsBlocked] = useState(false);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [editForm, setEditForm] = useState({ full_name: "", username: "", bio: "", avatar_url: "" });
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            setCurrentUser(JSON.parse(storedUser));
        }
    }, []);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                // If we have a currentUser, pass it to check blocks
                const query = currentUser ? `?requesterId=${currentUser.id}` : '';
                const res = await fetch(`${API_URL}/api/users/${id}${query}`);

                if (res.status === 404) {
                    setUser(null); // Not found (or blocked by them)
                    setLoading(false);
                    return;
                }

                const data = await res.json();
                if (res.ok) {
                    setUser(data);
                    setPosts(data.posts || []);
                    setIsBlocked(data.isBlocked || false);
                    setEditForm({
                        full_name: data.full_name || "",
                        username: data.username || "",
                        bio: data.bio || "",
                        avatar_url: data.avatar_url || ""
                    });
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchProfile();
    }, [id, currentUser?.id]); // Re-run when currentUser is loaded

    useEffect(() => {
        if (currentUser && id && currentUser.id !== id && !isBlocked) {
            const checkFollow = async () => {
                try {
                    const res = await fetch(`${API_URL}/api/follows/check?follower_id=${currentUser.id}&following_id=${id}`);
                    const data = await res.json();
                    setIsFollowing(data.isFollowing);
                } catch (err) {
                    console.error(err);
                }
            };
            checkFollow();
        }
    }, [currentUser, id, isBlocked]);

    const handleFollow = async () => {
        if (!currentUser) return;

        try {
            if (isFollowing) {
                await fetch(`${API_URL}/api/follows/remove`, {
                    method: "DELETE",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ follower_id: currentUser.id, following_id: id }),
                });
                setIsFollowing(false);
            } else {
                await fetch(`${API_URL}/api/follows/add`, {
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

    const handleBlock = async () => {
        if (!currentUser) return;
        try {
            const endpoint = isBlocked ? '/api/users/unblock' : '/api/users/block';
            const res = await fetch(`${API_URL}${endpoint}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ blocker_id: currentUser.id, blocked_id: id }),
            });

            if (res.ok) {
                setIsBlocked(!isBlocked);
                if (!isBlocked) {
                    setIsFollowing(false); // Unfollow if blocking
                }
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleUpdateProfile = async () => {
        try {
            const res = await fetch(`${API_URL}/api/users/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(editForm),
            });
            const data = await res.json();
            if (res.ok) {
                setUser(data);
                // Update local storage if it's the current user
                if (currentUser.id === id) {
                    const updatedUser = { ...currentUser, ...data };
                    localStorage.setItem("user", JSON.stringify(updatedUser));
                    setCurrentUser(updatedUser);
                }
                setIsEditing(false);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleMessage = async () => {
        if (!currentUser || !id) return;
        try {
            const res = await fetch(`${API_URL}/api/chats/create`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ user1_id: currentUser.id, user2_id: id })
            });
            const data = await res.json();
            if (res.ok) {
                router.push(`/messages?chatId=${data.chat_id}`);
            } else {
                console.error(data.error);
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
                    <AvatarImage src={user.avatar_url} loading="eager" /> {/* Added loading eager as safe default for LCP candidate */}
                    <AvatarFallback>{user.username[0]}</AvatarFallback>
                </Avatar>

                <div className="flex flex-col gap-4 w-full md:w-auto">
                    <div className="flex flex-col md:flex-row items-center gap-4">
                        <h2 className="text-xl font-normal text-white">{user.username}</h2>
                        {currentUser && currentUser.id !== user.id && (
                            <div className="flex gap-2 items-center">
                                {isBlocked ? (
                                    <Button
                                        onClick={handleBlock}
                                        variant="destructive"
                                        size="sm"
                                    >
                                        Unblock
                                    </Button>
                                ) : (
                                    <>
                                        <Button
                                            onClick={handleFollow}
                                            className={isFollowing ? "bg-gray-800 text-white hover:bg-gray-700" : "bg-blue-500 text-white hover:bg-blue-600"}
                                            size="sm"
                                        >
                                            {isFollowing ? "Following" : "Follow"}
                                        </Button>
                                        <Button
                                            onClick={handleMessage}
                                            variant="secondary"
                                            size="sm"
                                        >
                                            Message
                                        </Button>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <MoreHorizontal className="w-5 h-5 text-white" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent className="bg-gray-900 border-gray-800 text-white">
                                                <DropdownMenuItem onClick={handleBlock} className="text-red-500 cursor-pointer">
                                                    <Ban className="w-4 h-4 mr-2" /> Block
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </>
                                )}
                            </div>
                        )}
                        {currentUser && currentUser.id === user.id && (
                            <Dialog open={isEditing} onOpenChange={setIsEditing}>
                                <DialogTrigger asChild>
                                    <Button variant="secondary" size="sm">Edit Profile</Button>
                                </DialogTrigger>
                                <DialogContent className="bg-black text-white border-gray-800">
                                    <DialogHeader>
                                        <DialogTitle>Edit Profile</DialogTitle>
                                    </DialogHeader>
                                    <div className="flex flex-col gap-4 py-4">
                                        <div className="flex flex-col gap-2">
                                            <label className="text-sm font-medium">Full Name</label>
                                            <Input
                                                value={editForm.full_name}
                                                onChange={(e) => setEditForm(prev => ({ ...prev, full_name: e.target.value }))}
                                                className="bg-gray-900 border-gray-800"
                                            />
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <label className="text-sm font-medium">Username</label>
                                            <Input
                                                value={editForm.username}
                                                onChange={(e) => setEditForm(prev => ({ ...prev, username: e.target.value }))}
                                                className="bg-gray-900 border-gray-800"
                                            />
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <label className="text-sm font-medium">Bio</label>
                                            <Textarea
                                                value={editForm.bio}
                                                onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                                                className="bg-gray-900 border-gray-800"
                                            />
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <label className="text-sm font-medium">Avatar URL</label>
                                            <Input
                                                value={editForm.avatar_url}
                                                onChange={(e) => setEditForm(prev => ({ ...prev, avatar_url: e.target.value }))}
                                                className="bg-gray-900 border-gray-800"
                                                placeholder="https://..."
                                            />
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button variant="secondary" onClick={() => setIsEditing(false)}>Cancel</Button>
                                        <Button onClick={handleUpdateProfile} className="bg-blue-500 hover:bg-blue-600">Save</Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
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

            {/* Blocked View */}
            {isBlocked ? (
                <div className="border-t border-gray-800 py-12 text-center text-gray-500">
                    <p className="font-semibold text-lg">You have blocked this user.</p>
                    <p>You can't see their posts or message them.</p>
                </div>
            ) : (
                <>
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
                                    sizes="(max-width: 768px) 33vw, 300px"
                                    unoptimized
                                />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold gap-4">
                                    {/* Likes/Comments count could go here */}
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
