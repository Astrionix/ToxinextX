"use client";

import { useEffect, useState } from "react";
import { StoryBar } from "@/components/StoryBar";
import { PostCard } from "@/components/PostCard";

export default function Home() {
  const [posts, setPosts] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      setCurrentUser(JSON.parse(userStr));
    }

    const fetchPosts = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/posts");
        const data = await res.json();
        if (res.ok) {
          setPosts(data);
        }
      } catch (err) {
        console.error("Failed to fetch posts", err);
      }
    };

    fetchPosts();
  }, []);

  return (
    <div className="flex flex-col items-center w-full max-w-[630px] mx-auto pt-4 md:pt-8 px-0 md:px-4">
      <StoryBar />
      <div className="w-full flex flex-col gap-2">
        {posts.length === 0 ? (
          <div className="text-white text-center mt-10">No posts yet. Be the first to create one!</div>
        ) : (
          posts.map((post) => (
            <PostCard
              key={post.id}
              postId={post.id}
              username={post.users?.username || "Unknown"}
              avatar={post.users?.avatar_url || `https://i.pravatar.cc/150?u=${post.user_id}`}
              image={post.image_url}
              caption={post.caption}
              likes={0} // TODO: Fetch real likes
              comments={0} // TODO: Fetch real comments count
              time={new Date(post.created_at).toLocaleDateString()}
              isSafe={post.ai_label === 'safe'}
              postUserId={post.user_id}
              currentUserId={currentUser?.id}
            />
          ))
        )}
      </div>
    </div>
  );
}
