"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { LogOut, User, Lock, Bell, HelpCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { API_URL } from "@/config";

export default function SettingsPage() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [isPrivate, setIsPrivate] = useState(false);

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            const parsed = JSON.parse(storedUser);
            setUser(parsed);
            // Mock fetching current privacy setting
            // In real app: fetch(`${API_URL}/api/users/${parsed.id}/settings`)
            setIsPrivate(parsed.is_private || false);
        } else {
            router.push("/login");
        }
    }, [router]);

    const handleLogout = () => {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        router.push("/login");
    };

    const togglePrivacy = async () => {
        const newState = !isPrivate;
        setIsPrivate(newState);

        // Mock update
        if (user) {
            const updatedUser = { ...user, is_private: newState };
            localStorage.setItem("user", JSON.stringify(updatedUser));
            setUser(updatedUser);

            // In real app: await fetch(...) to update DB
            try {
                await fetch(`${API_URL}/api/users/${user.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...updatedUser, is_private: newState })
                });
            } catch (e) {
                console.error(e);
            }
        }
    };

    return (
        <div className="w-full max-w-[630px] mx-auto pt-8 px-4">
            <h1 className="text-2xl font-bold text-white mb-8">Settings</h1>

            <div className="flex flex-col gap-2">
                <h2 className="text-gray-400 text-sm font-semibold uppercase tracking-wider mb-2 ml-2">Account</h2>

                <div className="bg-gray-900 rounded-xl overflow-hidden">
                    <div onClick={() => router.push(`/profile/${user?.id}`)} className="flex items-center gap-4 p-4 hover:bg-gray-800 cursor-pointer transition-colors border-b border-gray-800">
                        <User className="text-white w-6 h-6" />
                        <span className="text-white font-medium flex-1">Edit Profile</span>
                    </div>

                    <div className="flex items-center justify-between p-4 border-b border-gray-800">
                        <div className="flex items-center gap-4">
                            <Lock className="text-white w-6 h-6" />
                            <div className="flex flex-col">
                                <span className="text-white font-medium">Private Account</span>
                                <span className="text-gray-400 text-xs">Only approved followers can see your posts</span>
                            </div>
                        </div>
                        <div
                            onClick={togglePrivacy}
                            className={`w-12 h-7 rounded-full p-1 cursor-pointer transition-colors ${isPrivate ? 'bg-blue-500' : 'bg-gray-600'}`}
                        >
                            <div className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform ${isPrivate ? 'translate-x-5' : 'translate-x-0'}`} />
                        </div>
                    </div>

                    <div className="flex items-center gap-4 p-4 hover:bg-gray-800 cursor-pointer transition-colors border-b border-gray-800">
                        <Bell className="text-white w-6 h-6" />
                        <span className="text-white font-medium flex-1">Notifications</span>
                    </div>
                </div>

                <h2 className="text-gray-400 text-sm font-semibold uppercase tracking-wider mb-2 ml-2 mt-6">More</h2>

                <div className="bg-gray-900 rounded-xl overflow-hidden">
                    <div className="flex items-center gap-4 p-4 hover:bg-gray-800 cursor-pointer transition-colors border-b border-gray-800">
                        <HelpCircle className="text-white w-6 h-6" />
                        <span className="text-white font-medium flex-1">Help & Support</span>
                    </div>

                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-4 p-4 hover:bg-red-500/10 cursor-pointer transition-colors"
                    >
                        <LogOut className="text-red-500 w-6 h-6" />
                        <span className="text-red-500 font-medium flex-1 text-left">Log Out</span>
                    </button>
                </div>
            </div>

            <div className="mt-12 text-center text-gray-500 text-xs">
                <p>SafeGram v1.0.0</p>
                <p>Made with ❤️ by Agent</p>
            </div>
        </div>
    );
}
