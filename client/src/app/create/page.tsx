"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Image as ImageIcon, Loader2, Upload } from "lucide-react";

export default function CreatePost() {
    const router = useRouter();
    const [caption, setCaption] = useState("");
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string>("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
        }
    };

    const handleShare = async () => {
        if (!imageFile) {
            setError("Please select an image to upload.");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const userStr = localStorage.getItem("user");
            const sessionStr = localStorage.getItem("supabase_session");

            if (!userStr || !sessionStr) throw new Error("Not logged in");
            const user = JSON.parse(userStr);
            const session = JSON.parse(sessionStr);

            const formData = new FormData();
            formData.append("user_id", user.id);
            formData.append("caption", caption);
            formData.append("location", "Unknown");
            formData.append("image", imageFile);

            const res = await fetch("http://localhost:5000/api/posts", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${session.access_token}`
                },
                body: formData, // No Content-Type header needed, browser sets it
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to create post");
            }

            router.push("/");
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-black text-white p-4">
            <Card className="w-full max-w-lg bg-black border border-gray-800">
                <CardHeader className="border-b border-gray-800">
                    <CardTitle className="text-center font-semibold">Create new post</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                    {/* Image Preview / Input */}
                    <div className="flex flex-col items-center justify-center w-full aspect-square bg-gray-900 rounded-md border-2 border-dashed border-gray-700 relative overflow-hidden group">
                        {previewUrl ? (
                            <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                            <div className="flex flex-col items-center text-gray-500">
                                <ImageIcon className="w-12 h-12 mb-2" />
                                <p>Select from computer</p>
                            </div>
                        )}

                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/50">
                            <Button variant="secondary" className="pointer-events-none">
                                <Upload className="mr-2 h-4 w-4" /> Change Image
                            </Button>
                        </div>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                    </div>

                    <Textarea
                        placeholder="Write a caption..."
                        value={caption}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCaption(e.target.value)}
                        className="bg-gray-900 border-gray-700 text-white min-h-[100px]"
                    />

                    {error && <p className="text-red-500 text-sm">{error}</p>}

                    <Button
                        onClick={handleShare}
                        className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold"
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Sharing...
                            </>
                        ) : (
                            "Share"
                        )}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
