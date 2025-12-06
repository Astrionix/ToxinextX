"use client";

import { API_URL } from "@/config";

import { useEffect, useState } from "react";
import { StoryBar } from "@/components/StoryBar";
import { PostCard } from "@/components/PostCard";

import { Virtuoso } from "react-virtuoso";

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
        let url = `${API_URL}/api/posts`;
        const user = localStorage.getItem("user");
        if (user) {
          const parsedUser = JSON.parse(user);
          // Default to main feed (following + self)
          url += `?user_id=${parsedUser.id}&type=feed`;
        }

        const res = await fetch(url);
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
          <Virtuoso
            useWindowScroll
            data={posts}
            itemContent={(index, post) => (
              <div className="mb-4">
                <PostCard
                  key={post.id}
                  postId={post.id}
                  username={post.users?.username || "Unknown"}
                  avatar={post.users?.avatar_url || `https://i.pravatar.cc/150?u=${post.user_id}`}
                  image={post.image_url}
                  caption={post.caption}
                  likes={post.likes ? post.likes.length : 0}
                  initialIsLiked={post.likes && currentUser ? post.likes.some((l: any) => l.user_id === currentUser.id) : false}
                  comments={0}
                  time={new Date(post.created_at).toLocaleDateString()}
                  isSafe={post.ai_label === 'safe'}
                  postUserId={post.user_id}
                  currentUserId={currentUser?.id}
                  priority={index === 0}
                />
              </div>
            )}
          />
        )}
      </div>
    </div>
  );
}
