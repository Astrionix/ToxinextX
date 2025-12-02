"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function MyProfileRedirect() {
    const router = useRouter();

    useEffect(() => {
        const userStr = localStorage.getItem("user");
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                if (user && user.id) {
                    router.push(`/profile/${user.id}`);
                } else {
                    router.push("/login");
                }
            } catch (e) {
                console.error("Failed to parse user from local storage", e);
                router.push("/login");
            }
        } else {
            router.push("/login");
        }
    }, [router]);

    return (
        <div className="flex items-center justify-center min-h-screen bg-black text-white">
            <p>Redirecting to your profile...</p>
        </div>
    );
}
