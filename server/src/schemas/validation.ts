import { z } from 'zod';

export const registerSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    username: z.string().min(3, 'Username must be at least 3 characters').max(20, 'Username too long'),
    avatar_url: z.string().optional(),
});

export const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
});

export const createPostSchema = z.object({
    user_id: z.string().uuid('Invalid User ID'),
    caption: z.string().optional(),
    location: z.string().optional(),
});
