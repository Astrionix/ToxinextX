"use client";

import { useState, useRef, useEffect } from "react";
import { Heart, MessageCircle, Send, MoreHorizontal, Volume2, VolumeX } from "lucide-react";

const reelsData = [
    {
        id: 1,
        url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
        username: "bunny_official",
        description: "Big Buck Bunny tells the story of a giant rabbit with a heart bigger than himself. 🐰❤️ #animation #bunny",
        likes: 1200000,
        comments: 45000,
    },
    {
        id: 2,
        url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
        username: "dream_works",
        description: "The first open movie from Blender Foundation. 🐘💭 #blender #3d",
        likes: 890000,
        comments: 12000,
    },
    {
        id: 3,
        url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
        username: "tech_insider",
        description: "Chromecast: For Bigger Blazes. 🔥 #tech #google",
        likes: 560000,
        comments: 8000,
    },
    {
        id: 4,
        url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
        username: "travel_diaries",
        description: "Escape to the unknown. 🌍✈️ #travel #adventure",
        likes: 2300000,
        comments: 67000,
    },
    {
        id: 5,
        url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
        username: "fun_times",
        description: "Just having some fun! 🤪 #fun #weekend",
        likes: 120000,
        comments: 2000,
    },
    {
        id: 6,
        url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
        username: "joy_ride",
        description: "Life is a joyride. 🚗💨 #drive #life",
        likes: 450000,
        comments: 5000,
    },
    {
        id: 7,
        url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
        username: "meltdown_king",
        description: "Sometimes you just melt. 🫠 #mood #funny",
        likes: 89000,
        comments: 1200,
    },
    {
        id: 8,
        url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
        username: "sintel_movie",
        description: "Sintel - Third Open Movie by Blender Foundation. 🐉🗡️ #fantasy #movie",
        likes: 3400000,
        comments: 120000,
    },
];

export default function ReelsPage() {
    return (
        <div className="h-screen w-full flex justify-center bg-black overflow-y-scroll snap-y snap-mandatory scrollbar-hide">
            <div className="w-full max-w-[400px] h-full">
                {reelsData.map((reel) => (
                    <ReelItem key={reel.id} reel={reel} />
                ))}
            </div>
        </div>
    );
}

function ReelItem({ reel }: { reel: any }) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isMuted, setIsMuted] = useState(true);
    const [isPlaying, setIsPlaying] = useState(true);
    const [isLiked, setIsLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(reel.likes);
    const [commentCount, setCommentCount] = useState(reel.comments);

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

    const handleLike = () => {
        if (isLiked) {
            setLikeCount((prev: number) => prev - 1);
        } else {
            setLikeCount((prev: number) => prev + 1);
        }
        setIsLiked(!isLiked);
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
                                <img src={`https://i.pravatar.cc/150?u=${reel.username}`} alt="avatar" className="w-full h-full object-cover" />
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

                        <button className="flex flex-col items-center gap-1 group">
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
                            <img src={`https://i.pravatar.cc/150?u=${reel.username}`} alt="music" className="w-full h-full object-cover" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
