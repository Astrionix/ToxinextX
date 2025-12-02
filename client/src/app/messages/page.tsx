"use client";

import { API_URL } from "@/config";

import { useEffect, useState, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, ShieldAlert, ShieldCheck } from "lucide-react";

export default function MessagesPage() {
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [chats, setChats] = useState<any[]>([]);
    const [selectedChat, setSelectedChat] = useState<any>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            const user = JSON.parse(storedUser);
            setCurrentUser(user);
            fetchChats(user.id);
        }
    }, []);

    useEffect(() => {
        if (selectedChat) {
            fetchMessages(selectedChat.id);
            // In a real app, subscribe to Supabase Realtime here
        }
    }, [selectedChat]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

    const fetchChats = async (userId: string) => {
        try {
            const res = await fetch(`${API_URL}/api/chats?userId=${userId}`);
            const data = await res.json();
            if (res.ok) setChats(data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchMessages = async (chatId: string) => {
        try {
            const res = await fetch(`${API_URL}/api/chats/${chatId}/messages`);
            const data = await res.json();
            if (res.ok) setMessages(data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedChat || !currentUser) return;

        try {
            const res = await fetch(`${API_URL}/api/chats/${selectedChat.id}/messages`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ sender_id: currentUser.id, text: newMessage }),
            });
            const data = await res.json();

            if (res.ok) {
                setMessages([...messages, data.message]);
                setNewMessage("");
            } else {
                alert(data.error); // Simple error handling
            }
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="flex h-screen bg-black text-white">
            {/* Chat List */}
            <div className="w-full md:w-1/3 border-r border-gray-800 flex flex-col">
                <div className="p-4 border-b border-gray-800 font-bold text-xl flex justify-between items-center">
                    <span>{currentUser?.username}</span>
                    {/* New Chat Button could go here */}
                </div>
                <ScrollArea className="flex-1">
                    {chats.map((chat) => (
                        <div
                            key={chat.id}
                            onClick={() => setSelectedChat(chat)}
                            className={`flex items-center gap-4 p-4 hover:bg-white/5 cursor-pointer transition-colors ${selectedChat?.id === chat.id ? "bg-white/10" : ""}`}
                        >
                            <Avatar className="w-12 h-12">
                                <AvatarImage src={chat.otherUser?.avatar_url} />
                                <AvatarFallback>{chat.otherUser?.username?.[0]}</AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                                <span className="font-semibold">{chat.otherUser?.username}</span>
                                <span className="text-gray-400 text-sm">Active now</span>
                            </div>
                        </div>
                    ))}
                </ScrollArea>
            </div>

            {/* Chat Window */}
            <div className="hidden md:flex flex-col flex-1">
                {selectedChat ? (
                    <>
                        <div className="p-4 border-b border-gray-800 flex items-center gap-4">
                            <Avatar className="w-8 h-8">
                                <AvatarImage src={selectedChat.otherUser?.avatar_url} />
                                <AvatarFallback>{selectedChat.otherUser?.username?.[0]}</AvatarFallback>
                            </Avatar>
                            <span className="font-semibold">{selectedChat.otherUser?.username}</span>
                        </div>

                        <ScrollArea className="flex-1 p-4">
                            <div className="flex flex-col gap-4">
                                {messages.map((msg) => {
                                    const isMe = msg.sender_id === currentUser?.id;
                                    return (
                                        <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                                            <div className={`max-w-[70%] p-3 rounded-2xl ${isMe ? "bg-blue-600 text-white" : "bg-gray-800 text-white"}`}>
                                                <div className="flex items-center gap-2">
                                                    {msg.text}
                                                    {msg.ai_label && msg.ai_label !== 'safe' && (
                                                        <ShieldAlert className="w-3 h-3 text-yellow-300" />
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={scrollRef} />
                            </div>
                        </ScrollArea>

                        <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-800 flex gap-2">
                            <Input
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Message..."
                                className="bg-gray-900 border-gray-700 text-white rounded-full"
                            />
                            <Button type="submit" variant="ghost" className="text-blue-500 font-semibold hover:text-blue-400">
                                Send
                            </Button>
                        </form>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center flex-1 text-center">
                        <div className="w-24 h-24 rounded-full border-2 border-white flex items-center justify-center mb-4">
                            <Send className="w-12 h-12" />
                        </div>
                        <h2 className="text-2xl font-light">Your Messages</h2>
                        <p className="text-gray-400 mt-2">Send private photos and messages to a friend.</p>
                        <Button className="mt-4 bg-blue-500 hover:bg-blue-600">Send Message</Button>
                    </div>
                )}
            </div>
        </div>
    );
}
