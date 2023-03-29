import { Request, Response } from 'express';
import { generateRandomCodeAsString } from '../../helpers/initialize/generateRandomCode';
import { sendCompletionCodeEmail } from '../../mailService/completionCode';
import db from '../../models';

const Order = db.order;
const OrderStatus = db.orderStatus;
const User = db.user;

export const sendCompletionCode = async (req: Request, res: Response) => {
    const code = generateRandomCodeAsString(6);

    const order = await Order.findByIdAndUpdate(
        {
            _id: req.body.orderId,
        },
        {
            $set: {
                completionCode: code,
            },
        },
        { new: true, lean: true }
    );

    const user = await User.findById(req.body.userId);

    if (!order || !user) {
        return res.status(404).send({ message: 'orderIsNotFound' });
    }

    sendCompletionCodeEmail(code, user.email);

    return res.status(200).send({ ok: true });
};
