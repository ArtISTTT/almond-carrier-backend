import { Request } from 'express';

export const getFullUri = (req: Request) => {
    return req.protocol + '://' + req.get('host');
};
