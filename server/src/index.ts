import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import moderationRoutes from './routes/moderation';
import authRoutes from './routes/auth';
import usersRoutes from './routes/users';
import followsRoutes from './routes/follows';
import commentsRoutes from './routes/comments';
import chatsRoutes from './routes/chats';
import postsRoutes from './routes/posts';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());

// Routes
app.get('/', (req: Request, res: Response) => {
    res.send('SafeGram API is running');
});

app.use('/api/moderate', moderationRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/follows', followsRoutes);
app.use('/api/comments', commentsRoutes);
app.use('/api/chats', chatsRoutes);
app.use('/api/posts', postsRoutes);

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
