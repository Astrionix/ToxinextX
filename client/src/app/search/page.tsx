import { API_URL } from "@/config";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { Search as SearchIcon } from "lucide-react";

export default function SearchPage() {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/users/search?query=${query}`);
            const data = await res.json();
            if (data.results) {
                setResults(data.results);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col w-full max-w-[630px] mx-auto pt-8 px-4">
            <h1 className="text-2xl font-bold text-white mb-6">Search</h1>

            <form onSubmit={handleSearch} className="relative mb-8">
                <SearchIcon className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                <Input
                    type="text"
                    placeholder="Search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="pl-10 bg-gray-900 border-gray-800 text-white h-12 rounded-xl"
                />
            </form>

            <div className="flex flex-col gap-4">
                {loading ? (
                    <div className="text-gray-500 text-center">Searching...</div>
                ) : results.length > 0 ? (
                    results.map((user) => (
                        <Link key={user.id} href={`/profile/${user.id}`}>
                            <div className="flex items-center gap-4 p-3 hover:bg-white/5 rounded-lg transition-colors cursor-pointer">
                                <Avatar className="w-12 h-12">
                                    <AvatarImage src={user.avatar_url} />
                                    <AvatarFallback>{user.username[0]}</AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col">
                                    <span className="font-semibold text-white">{user.username}</span>
                                    <span className="text-gray-400 text-sm">{user.bio || "No bio"}</span>
                                </div>
                            </div>
                        </Link>
                    ))
                ) : (
                    query && <div className="text-gray-500 text-center">No results found.</div>
                )}
            </div>
        </div>
    );
}
