import { Router, Request, Response } from 'express';
import { moderateText } from '../services/moderationService';

const router = Router();

router.post('/text', async (req: Request, res: Response) => {
    try {
        const { text } = req.body;
        if (!text) {
            return res.status(400).json({ error: 'Text is required' });
        }

        const result = await moderateText(text);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
