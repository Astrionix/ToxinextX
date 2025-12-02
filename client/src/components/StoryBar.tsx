import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

const stories = [
    { id: 1, username: "alex_dev", image: "https://i.pravatar.cc/150?u=1" },
    { id: 2, username: "sarah_design", image: "https://i.pravatar.cc/150?u=2" },
    { id: 3, username: "mike_ai", image: "https://i.pravatar.cc/150?u=3" },
    { id: 4, username: "lisa_travel", image: "https://i.pravatar.cc/150?u=4" },
    { id: 5, username: "john_tech", image: "https://i.pravatar.cc/150?u=5" },
    { id: 6, username: "emma_art", image: "https://i.pravatar.cc/150?u=6" },
    { id: 7, username: "david_code", image: "https://i.pravatar.cc/150?u=7" },
    { id: 8, username: "sophia_ux", image: "https://i.pravatar.cc/150?u=8" },
];

export function StoryBar() {
    return (
        <div className="w-full py-6 border-b border-gray-800 bg-black mb-4">
            <ScrollArea className="w-full whitespace-nowrap">
                <div className="flex w-max space-x-4 px-4">
                    {stories.map((story) => (
                        <div key={story.id} className="flex flex-col items-center gap-2 cursor-pointer group">
                            <div className="p-[3px] bg-gradient-to-tr from-yellow-400 via-red-500 to-fuchsia-600 rounded-full group-hover:scale-105 transition-transform">
                                <div className="p-[3px] bg-black rounded-full">
                                    <Avatar className="w-16 h-16 border-2 border-black">
                                        <AvatarImage src={story.image} alt={story.username} />
                                        <AvatarFallback>{story.username[0]}</AvatarFallback>
                                    </Avatar>
                                </div>
                            </div>
                            <span className="text-xs text-white truncate w-16 text-center">{story.username}</span>
                        </div>
                    ))}
                </div>
                <ScrollBar orientation="horizontal" />
            </ScrollArea>
        </div>
    );
}
