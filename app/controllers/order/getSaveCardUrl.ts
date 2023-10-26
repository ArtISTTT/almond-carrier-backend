import { Request, Response } from 'express';
import db from '../../models';
import logger from '../../services/logger';
import { getCardSaveUrl } from '../qiwi/getPaymentUrl';

const User = db.user;

export const getSaveCardUrl = async (req: Request, res: Response) => {
    const userId = req.body.userId;

    const user = await User.findById(userId);

    if (!user) {
        logger.error(`getMyOrders: User ${userId} not found!`);
        return res.status(404).send({ message: 'userNotFound' });
    }

    const url = getCardSaveUrl(user);

    return res.status(200).send({
        url,
    });
};
