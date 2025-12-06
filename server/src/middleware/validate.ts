import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

export const validate = (schema: ZodSchema<any>) => (req: Request, res: Response, next: NextFunction) => {
    try {
        schema.parse(req.body);
        next();
    } catch (error: any) {
        if (error && error.errors && Array.isArray(error.errors)) {
            return res.status(400).json({
                error: error.errors[0].message,
                details: error.errors
            });
        }
        return res.status(400).json({ error: 'Invalid request data' });
    }
};
