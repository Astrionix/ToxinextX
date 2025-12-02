"use client";

import Link from 'next/link';
import { Home, Search, Compass, Clapperboard, MessageCircle, Heart, PlusSquare, User, Menu, Settings, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function Sidebar() {
    const router = useRouter();

    const handleLogout = () => {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        router.push('/login');
    };

    return (
        <div className="hidden md:flex flex-col w-64 h-screen bg-black border-r border-gray-800 fixed left-0 top-0 p-4 z-50">
            <div className="mb-8 px-4 py-4">
                <h1 className="text-2xl font-bold text-white font-serif tracking-wide">SafeGram</h1>
            </div>

            <nav className="flex-1 flex flex-col gap-2">
                <NavItem href="/" icon={<Home size={28} />} label="Home" />
                <NavItem href="/search" icon={<Search size={28} />} label="Search" />
                <NavItem href="/explore" icon={<Compass size={28} />} label="Explore" />
                <NavItem href="/reels" icon={<Clapperboard size={28} />} label="Reels" />
                <NavItem href="/messages" icon={<MessageCircle size={28} />} label="Messages" />
                <NavItem href="/notifications" icon={<Heart size={28} />} label="Notifications" />
                <NavItem href="/create" icon={<PlusSquare size={28} />} label="Create" />
                <NavItem href="/profile" icon={<User size={28} />} label="Profile" />
            </nav>

            <div className="mt-auto flex flex-col gap-2">
                <NavItem href="/settings" icon={<Settings size={28} />} label="Settings" />
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-4 p-3 rounded-lg hover:bg-white/10 transition-colors text-white group w-full text-left"
                >
                    <div className="group-hover:scale-105 transition-transform">
                        <LogOut size={28} />
                    </div>
                    <span className="text-base font-medium">Log out</span>
                </button>
            </div>
        </div>
    );
}

function NavItem({ href, icon, label }: { href: string, icon: React.ReactNode, label: string }) {
    return (
        <Link href={href} className="flex items-center gap-4 p-3 rounded-lg hover:bg-white/10 transition-colors text-white group">
            <div className="group-hover:scale-105 transition-transform">
                {icon}
            </div>
            <span className="text-base font-medium">{label}</span>
        </Link>
    );
}
