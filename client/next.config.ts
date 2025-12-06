import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'i.pravatar.cc',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'pixabay.com',
      },
      {
        protocol: 'https',
        hostname: 'cdn.pixabay.com',
      },
      {
        protocol: 'https',
        hostname: 'qftnpusgdlsdtggzgwnk.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'hncthbgujarcnprmguyh.supabase.co',
      },
    ],
  },
  // reactCompiler: true, // Commenting out as it might cause issues if not fully supported yet or if user said No (I said No in prompt but config has it true?)
  // Actually the config has it true, so I'll leave it or remove if I suspect issues.
  // The user prompt was "Would you like to use React Compiler? » No / Yes". I sent newline which is usually No.
  // But the file content shows `reactCompiler: true`. Maybe I misread the default or the tool output.
  // I will keep it if it's there, but if I encounter errors I'll remove it.
};

export default nextConfig;
