"use client";

import { useState, useEffect } from "react";
import { Search as SearchIcon, User as UserIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { API_URL } from "@/config";

export default function SearchPage() {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (query.trim().length > 0) {
                performSearch(query);
            } else {
                setResults([]);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [query]);

    const performSearch = async (searchTerm: string) => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/users/search?query=${encodeURIComponent(searchTerm)}`);
            if (res.ok) {
                const data = await res.json();
                setResults(data.results || []);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-[630px] mx-auto pt-4 px-4">
            <div className="relative mb-6">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search"
                    className="pl-10 bg-gray-900 border-gray-800 text-white h-11 rounded-xl"
                />
            </div>

            <div className="flex flex-col gap-4">
                {loading && <div className="text-gray-500 text-center text-sm">Searching...</div>}

                {!loading && query && results.length === 0 && (
                    <div className="text-gray-500 text-center text-sm">No results found.</div>
                )}

                {results.map((user) => (
                    <div
                        key={user.id}
                        onClick={() => router.push(`/profile/${user.id}`)}
                        className="flex items-center justify-between p-2 hover:bg-white/5 rounded-lg cursor-pointer transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <Avatar className="w-12 h-12 border border-gray-800">
                                <AvatarImage src={user.avatar_url} />
                                <AvatarFallback><UserIcon className="w-6 h-6 text-gray-500" /></AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                                <span className="font-semibold text-white text-sm">{user.username}</span>
                                <span className="text-gray-400 text-xs">{user.full_name || user.bio?.substring(0, 30)}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Recent Searches / Suggestions when empty */}
            {!query && results.length === 0 && (
                <div className="mt-4">
                    <h3 className="text-white font-bold mb-4">Explore</h3>
                    <div className="grid grid-cols-3 gap-1">
                        {/* Static Placeholder for explore grid - ideally this would be posts search */}
                        <div className="aspect-square bg-gray-800 relative cursor-pointer hover:bg-gray-700">
                            <img src="https://images.unsplash.com/photo-1518020382113-a7e8fc38eac9?w=300&h=300&fit=crop" className="object-cover w-full h-full" />
                        </div>
                        <div className="aspect-square bg-gray-800 relative cursor-pointer hover:bg-gray-700">
                            <img src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300&h=300&fit=crop" className="object-cover w-full h-full" />
                        </div>
                        <div className="aspect-square bg-gray-800 relative cursor-pointer hover:bg-gray-700">
                            <img src="https://images.unsplash.com/photo-1567653418876-5bb0e566e1c2?w=300&h=300&fit=crop" className="object-cover w-full h-full" />
                        </div>
                        <div className="aspect-square bg-gray-800 relative cursor-pointer hover:bg-gray-700">
                            <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&h=300&fit=crop" className="object-cover w-full h-full" />
                        </div>
                        <div className="aspect-square bg-gray-800 relative cursor-pointer hover:bg-gray-700">
                            <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=300&fit=crop" className="object-cover w-full h-full" />
                        </div>
                        <div className="aspect-square bg-gray-800 relative cursor-pointer hover:bg-gray-700">
                            <img src="https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&h=300&fit=crop" className="object-cover w-full h-full" />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
