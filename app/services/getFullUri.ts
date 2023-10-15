import { Request } from 'express';

export const getFullUri = (req: Request) =>
    `${req.protocol}://${req.get('host')}`;
