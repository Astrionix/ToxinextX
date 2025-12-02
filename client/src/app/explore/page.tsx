"use client";

import Image from "next/image";
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog";
import { PostCard } from "@/components/PostCard";
import { Heart, MessageCircle } from "lucide-react";

const explorePosts = [
    { id: 1, image: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=500&h=500&fit=crop", likes: 120, comments: 45, username: "model_jane", caption: "Studio vibes ✨" },
    { id: 2, image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=500&h=500&fit=crop", likes: 892, comments: 23, username: "nature_lover", caption: "Nature is amazing 🌿" },
    { id: 3, image: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=500&h=500&fit=crop", likes: 3500, comments: 120, username: "tech_guru", caption: "Future is here 🤖" },
    { id: 4, image: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=500&h=500&fit=crop", likes: 1240, comments: 45, username: "dev_life", caption: "Coding all night 💻" },
    { id: 5, image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&h=500&fit=crop", likes: 450, comments: 12, username: "fashion_icon", caption: "OOTD 👗" },
    { id: 6, image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&h=500&fit=crop", likes: 670, comments: 34, username: "portrait_master", caption: "Eyes tell a story 👀" },
    { id: 7, image: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=500&h=500&fit=crop", likes: 230, comments: 8, username: "travel_bug", caption: "Wanderlust ✈️" },
    { id: 8, image: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=500&h=500&fit=crop", likes: 890, comments: 56, username: "city_lights", caption: "Night life 🌃" },
    { id: 9, image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500&h=500&fit=crop", likes: 1500, comments: 100, username: "smile_always", caption: "Keep smiling 😊" },
    { id: 10, image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500&h=500&fit=crop", likes: 320, comments: 15, username: "dog_lover", caption: "My best friend 🐶" },
    { id: 11, image: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=500&h=500&fit=crop", likes: 410, comments: 22, username: "art_soul", caption: "Creating magic 🎨" },
    { id: 12, image: "https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=500&h=500&fit=crop", likes: 560, comments: 30, username: "coffee_addict", caption: "Morning brew ☕" },
    { id: 13, image: "https://images.unsplash.com/photo-1488161628813-99c97485b48a?w=500&h=500&fit=crop", likes: 780, comments: 40, username: "skater_boy", caption: "Skate or die 🛹" },
    { id: 14, image: "https://images.unsplash.com/photo-1503023345310-bd7c1de61c7d?w=500&h=500&fit=crop", likes: 920, comments: 50, username: "music_life", caption: "Feel the beat 🎵" },
    { id: 15, image: "https://images.unsplash.com/photo-1492633423870-43d1cd2775eb?w=500&h=500&fit=crop", likes: 1100, comments: 60, username: "sunset_chaser", caption: "Golden hour 🌅" },
];

export default function ExplorePage() {
    return (
        <div className="w-full max-w-6xl mx-auto py-8 px-4">
            <h1 className="text-2xl font-bold text-white mb-6">Explore</h1>
            <div className="grid grid-cols-3 gap-1 md:gap-4">
                {explorePosts.map((post) => (
                    <Dialog key={post.id}>
                        <DialogTrigger asChild>
                            <div className="relative aspect-square group cursor-pointer overflow-hidden rounded-sm">
                                <Image
                                    src={post.image}
                                    alt={`Explore post ${post.id}`}
                                    fill
                                    className="object-cover transition-transform duration-300 group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-6 text-white font-bold">
                                    <div className="flex items-center gap-2">
                                        <Heart className="fill-white" />
                                        <span>{post.likes}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <MessageCircle className="fill-white" />
                                        <span>{post.comments}</span>
                                    </div>
                                </div>
                            </div>
                        </DialogTrigger>
                        <DialogContent className="bg-black border-gray-800 p-0 max-w-3xl w-full overflow-hidden flex flex-col md:flex-row h-[80vh] md:h-[600px]">
                            <DialogTitle className="sr-only">Post by {post.username}</DialogTitle>
                            <div className="relative w-full md:w-1/2 h-1/2 md:h-full bg-gray-900">
                                <Image
                                    src={post.image}
                                    alt={`Post by ${post.username}`}
                                    fill
                                    className="object-cover"
                                />
                            </div>
                            <div className="w-full md:w-1/2 h-1/2 md:h-full overflow-y-auto">
                                <PostCard
                                    postId="11111111-1111-1111-1111-111111111111"
                                    currentUserId="22222222-2222-2222-2222-222222222222"
                                    username={post.username}
                                    avatar={`https://i.pravatar.cc/150?u=${post.username}`}
                                    image={post.image}
                                    caption={post.caption}
                                    likes={post.likes}
                                    comments={post.comments}
                                    time="2 HOURS AGO"
                                    postUserId="00000000-0000-0000-0000-000000000000" // Dummy ID for explore
                                />
                            </div>
                        </DialogContent>
                    </Dialog>
                ))}
            </div>
        </div>
    );
}
