import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Plus, Loader2 } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { API_URL } from "@/config";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

export function StoryBar() {
    const [stories, setStories] = useState<any[]>([]);
    const [user, setUser] = useState<any>(null);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [viewingStory, setViewingStory] = useState<any>(null);

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (storedUser) setUser(JSON.parse(storedUser));

        fetchStories();
    }, []);

    const fetchStories = async () => {
        try {
            const res = await fetch(`${API_URL}/api/stories`);
            if (res.ok) {
                const data = await res.json();
                setStories(data);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.[0] || !user) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append("image", e.target.files[0]);
        formData.append("user_id", user.id);

        try {
            const res = await fetch(`${API_URL}/api/stories`, {
                method: "POST",
                body: formData
            });

            if (res.ok) {
                // Refresh stories
                fetchStories();
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="w-full py-4 bg-black border-b border-gray-800 mb-4">
            <ScrollArea className="w-full whitespace-nowrap">
                <div className="flex w-max gap-4 px-4 items-center">
                    {/* Your Story */}
                    <div className="flex flex-col items-center gap-1 cursor-pointer group" onClick={() => fileInputRef.current?.click()}>
                        <div className="relative">
                            <div className="w-[74px] h-[74px] flex items-center justify-center">
                                <Avatar className={`w-[70px] h-[70px] border-2 border-black ${isUploading && 'opacity-50'}`}>
                                    <AvatarImage src={user?.avatar_url || "https://github.com/shadcn.png"} />
                                    <AvatarFallback>ME</AvatarFallback>
                                </Avatar>
                                {isUploading && (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                                    </div>
                                )}
                            </div>
                            {!isUploading && (
                                <div className="absolute bottom-0 right-1 bg-blue-500 rounded-full p-[2px] border-[2px] border-black">
                                    <Plus className="w-3 h-3 text-white" />
                                </div>
                            )}
                        </div>
                        <span className="text-xs text-gray-400">Your story</span>
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={handleFileSelect}
                        />
                    </div>

                    {/* Stories */}
                    {stories.map((story) => (
                        <div key={story.id} className="flex flex-col items-center gap-1 cursor-pointer group" onClick={() => setViewingStory(story)}>
                            <div className="p-[2px] bg-gradient-to-tr from-yellow-400 via-red-500 to-fuchsia-600 rounded-full group-hover:scale-105 transition-transform duration-200 ease-out">
                                <div className="p-[2px] bg-black rounded-full">
                                    <Avatar className="w-[66px] h-[66px] border-2 border-black">
                                        <AvatarImage src={story.image} alt={story.username} />
                                        <AvatarFallback>{story.username[0]}</AvatarFallback>
                                    </Avatar>
                                </div>
                            </div>
                            <span className="text-xs text-gray-200 truncate w-20 text-center">{story.username}</span>
                        </div>
                    ))}
                </div>
                <ScrollBar orientation="horizontal" className="invisible" />
            </ScrollArea>

            {viewingStory && (
                <Dialog open={!!viewingStory} onOpenChange={() => setViewingStory(null)}>
                    <DialogContent className="bg-black border-none p-0 h-[80vh] w-[45vh] max-w-none rounded-lg overflow-hidden flex items-center justify-center">
                        <DialogTitle className="sr-only">Story by {viewingStory.username}</DialogTitle>
                        {/* Simple Story Viewer */}
                        <div className="relative w-full h-full">
                            <img
                                src={viewingStory.stories[0].image_url}
                                className="w-full h-full object-cover"
                                alt="Story"
                            />
                            <div className="absolute top-4 left-4 flex items-center gap-2">
                                <Avatar className="w-8 h-8 border border-white/50">
                                    <AvatarImage src={viewingStory.image} />
                                </Avatar>
                                <span className="text-white font-semibold drop-shadow-md">{viewingStory.username}</span>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}
