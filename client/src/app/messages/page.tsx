"use client";

import { API_URL } from "@/config";
import { useEffect, useState, useRef, Suspense } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, ShieldAlert, Sparkles } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useSearchParams } from "next/navigation";

// Force dynamic rendering just in case, though Suspense should handle it
export const dynamic = "force-dynamic";

function MessagesContent() {
    const searchParams = useSearchParams();
    const initialChatId = searchParams.get('chatId');

    const [currentUser, setCurrentUser] = useState<any>(null);
    const [chats, setChats] = useState<any[]>([]);
    const [selectedChat, setSelectedChat] = useState<any>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
    const typingTimeoutRef = useRef<any>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Initial load handling
    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            const user = JSON.parse(storedUser);
            setCurrentUser(user);
            fetchChats(user.id).then((loadedChats: any[]) => {
                // If query param exists, auto-select that chat
                if (initialChatId && loadedChats) {
                    const target = loadedChats.find((c: any) => c.id === initialChatId);
                    if (target) setSelectedChat(target);
                }
            });
        }
    }, [initialChatId]); // Depend on initialChatId so deep links work properly

    useEffect(() => {
        if (selectedChat) {
            fetchMessages(selectedChat.id);
            setSuggestions([]);

            const channel = supabase
                .channel(`chat:${selectedChat.id}`)
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'messages',
                        filter: `chat_id=eq.${selectedChat.id}`
                    },
                    (payload) => {
                        setMessages((current) => {
                            if (current.some(msg => msg.id === payload.new.id)) return current;
                            return [...current, payload.new];
                        });
                    }
                )
                .on('broadcast', { event: 'typing' }, (payload) => {
                    const { username, user_id } = payload.payload;
                    if (user_id !== currentUser?.id) {
                        setTypingUsers((prev) => {
                            const newSet = new Set(prev);
                            newSet.add(username);
                            return newSet;
                        });
                        setTimeout(() => {
                            setTypingUsers((prev) => {
                                const newSet = new Set(prev);
                                newSet.delete(username);
                                return newSet;
                            });
                        }, 3000);
                    }
                })
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
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
            if (res.ok) {
                setChats(data);
                return data; // Return data for chaining
            }
        } catch (err) {
            console.error(err);
        }
        return [];
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

    const handleSendMessage = async (e?: React.FormEvent, textOverride?: string) => {
        if (e) e.preventDefault();
        const textToSend = textOverride || newMessage;

        if (!textToSend.trim() || !selectedChat || !currentUser) return;

        try {
            const tempId = Date.now().toString();
            const tempMsg = {
                id: tempId,
                text: textToSend,
                sender_id: currentUser.id,
                created_at: new Date().toISOString(),
                ai_label: 'pending'
            };
            setMessages(prev => [...prev, tempMsg]);
            if (!textOverride) setNewMessage("");
            setSuggestions([]);

            const res = await fetch(`${API_URL}/api/chats/${selectedChat.id}/messages`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ sender_id: currentUser.id, text: textToSend }),
            });
            const data = await res.json();

            if (res.ok) {
                setMessages(prev => prev.map(m => m.id === tempId ? data.message : m));
            } else {
                alert(data.error);
                setMessages(prev => prev.filter(m => m.id !== tempId));
            }
        } catch (err) {
            console.error(err);
        }
    };

    const generateSmartReplies = async () => {
        if (!selectedChat || !currentUser) return;
        setIsGenerating(true);
        try {
            const res = await fetch(`${API_URL}/api/chats/${selectedChat.id}/smart-reply`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: currentUser.id })
            });
            const data = await res.json();
            if (data.suggestions) setSuggestions(data.suggestions);
        } catch (err) {
            console.error(err);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="flex h-screen bg-black text-white">
            <div className="w-full md:w-1/3 border-r border-gray-800 flex flex-col">
                <div className="p-4 border-b border-gray-800 font-bold text-xl flex justify-between items-center">
                    <span>{currentUser?.username}</span>
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

            <div className="hidden md:flex flex-col flex-1">
                {selectedChat ? (
                    <>
                        <div className="p-4 border-b border-gray-800 flex items-center gap-4">
                            <Avatar className="w-8 h-8">
                                <AvatarImage src={selectedChat.otherUser?.avatar_url} />
                                <AvatarFallback>{selectedChat.otherUser?.username?.[0]}</AvatarFallback>
                            </Avatar>
                            <span className="font-semibold">{selectedChat.otherUser?.username}</span>
                            {typingUsers.size > 0 && <span className="text-xs text-blue-400 animate-pulse">Typing...</span>}
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

                        <div className="p-4 border-t border-gray-800 flex flex-col gap-2">
                            {suggestions.length > 0 && (
                                <div className="flex gap-2 mb-2 overflow-x-auto">
                                    {suggestions.map((s, i) => (
                                        <button
                                            key={i}
                                            onClick={() => handleSendMessage(undefined, s)}
                                            className="px-3 py-1 bg-blue-500/20 text-blue-400 text-sm rounded-full hover:bg-blue-500/30 whitespace-nowrap transition-colors"
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            )}

                            <form onSubmit={handleSendMessage} className="flex gap-2 items-center">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={generateSmartReplies}
                                    disabled={isGenerating}
                                    className={isGenerating ? "animate-pulse" : ""}
                                    title="Generate AI Replies"
                                >
                                    <Sparkles className={`w-5 h-5 ${isGenerating ? "text-purple-400" : "text-gray-400 hover:text-purple-400"}`} />
                                </Button>
                                <Input
                                    value={newMessage}
                                    onChange={(e) => {
                                        setNewMessage(e.target.value);
                                        if (!typingTimeoutRef.current && currentUser) {
                                            const channel = supabase.channel(`chat:${selectedChat.id}`);
                                            channel.send({
                                                type: 'broadcast',
                                                event: 'typing',
                                                payload: { user_id: currentUser.id, username: currentUser.username }
                                            });
                                            typingTimeoutRef.current = setTimeout(() => {
                                                typingTimeoutRef.current = null;
                                            }, 2000);
                                        }
                                    }}
                                    placeholder="Message..."
                                    className="bg-gray-900 border-gray-700 text-white rounded-full flex-1"
                                />
                                <Button type="submit" variant="ghost" className="text-blue-500 font-semibold hover:text-blue-400">
                                    Send
                                </Button>
                            </form>
                        </div>
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

export default function MessagesPage() {
    return (
        <Suspense fallback={<div className="h-screen w-full flex items-center justify-center bg-black text-white">Loading messages...</div>}>
            <MessagesContent />
        </Suspense>
    );
}
