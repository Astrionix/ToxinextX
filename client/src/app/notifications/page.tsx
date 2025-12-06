"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, UserPlus, Bell } from "lucide-react";
import { useEffect, useState } from "react";
import { API_URL } from "@/config";
import { supabase } from "@/lib/supabase";

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchNotifications = async () => {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (!user.id) return;

        try {
            const res = await fetch(`${API_URL}/api/notifications/${user.id}`);
            const data = await res.json();

            if (Array.isArray(data)) {
                const mapped = data.map(n => ({
                    id: n.id,
                    type: n.type,
                    user: {
                        username: n.sender?.username || 'Unknown',
                        avatar: n.sender?.avatar_url || ''
                    },
                    content: n.message,
                    time: new Date(n.created_at).toLocaleDateString(),
                    postImage: null,
                    isRead: n.is_read
                }));
                setNotifications(mapped);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();

        // Real-time subscription
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (!user.id) return;

        const channel = supabase
            .channel('notifications')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${user.id}`
                },
                (payload) => {
                    console.log('New notification:', payload);
                    // Reload fully to get sender details (which are joined in backend)
                    // Optimization: Could fetch just single item or trust payload if we had sender info
                    fetchNotifications();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    if (loading) {
        return <div className="text-white text-center pt-20">Loading...</div>;
    }
    return (
        <div className="w-full max-w-[630px] mx-auto pt-8 px-4">
            <h1 className="text-2xl font-bold text-white mb-6">Notifications</h1>

            {notifications.length === 0 && (
                <div className="flex flex-col items-center justify-center p-10 text-gray-500">
                    <Bell className="w-12 h-12 mb-4 opacity-50" />
                    <p>No notifications yet</p>
                </div>
            )}

            <div className="flex flex-col gap-4">
                {/* All Notifications List */}
                {notifications.map((notification) => (
                    <NotificationItem key={notification.id} item={notification} />
                ))}

            </div>
        </div>
    );
}

function NotificationItem({ item }: { item: any }) {
    return (
        <div className="flex items-center justify-between p-3 hover:bg-white/5 rounded-xl transition-colors cursor-pointer group">
            <div className="flex items-center gap-4">
                <div className="relative">
                    <Avatar className="w-12 h-12 border border-gray-800">
                        <AvatarImage src={item.user.avatar} />
                        <AvatarFallback>{item.user.username[0]}</AvatarFallback>
                    </Avatar>
                    {/* Icon Badge */}
                    <div className={`absolute -bottom-1 -right-1 p-1 rounded-full border-2 border-black ${item.type === 'like' ? 'bg-red-500' :
                        item.type === 'comment' ? 'bg-blue-500' :
                            'bg-purple-500'
                        }`}>
                        {item.type === 'like' && <Heart className="w-3 h-3 text-white fill-white" />}
                        {item.type === 'comment' && <MessageCircle className="w-3 h-3 text-white fill-white" />}
                        {item.type === 'follow' && <UserPlus className="w-3 h-3 text-white" />}
                    </div>
                </div>

                <div className="flex flex-col">
                    <span className="text-sm text-white">
                        <span className="font-bold">{item.user.username}</span> {item.content}
                    </span>
                    <span className="text-xs text-gray-500">{item.time}</span>
                </div>
            </div>

            {/* Action / Preview */}
            <div className="ml-4">
                {item.type === 'follow' ? (
                    <Button
                        size="sm"
                        variant={item.following ? "secondary" : "default"}
                        className={item.following ? "bg-gray-800 text-white hover:bg-gray-700" : "bg-blue-500 hover:bg-blue-600"}
                    >
                        {item.following ? "Following" : "Follow Back"}
                    </Button>
                ) : (
                    item.postImage && (
                        <div className="w-11 h-11 rounded-md overflow-hidden border border-gray-800">
                            <img src={item.postImage} alt="Post" className="w-full h-full object-cover" />
                        </div>
                    )
                )}
            </div>
        </div>
    );
}
