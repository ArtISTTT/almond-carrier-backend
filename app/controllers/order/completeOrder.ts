import { Request, Response } from 'express';
import mongoose from 'mongoose';
import db from '../../models';

const Order = db.order;
const OrderStatus = db.orderStatus;

export const completeOrder = async (req: Request, res: Response) => {
    const status = await OrderStatus.findOne({
        name: 'itemRecieved',
    });

    if (!status) {
        return res.status(404).send({ message: 'Status not found' });
    }

    const order = await Order.findOneAndUpdate(
        {
            $and: [
                { _id: new mongoose.Types.ObjectId(req.body.orderId) },
                { completionCode: req.body.completionCode },
            ],
        },
        {
            $set: {
                statusId: status._id,
                completedDate: new Date(),
            },
        },
        { new: true, lean: true }
    );

    if (!order) {
        return res.status(404).send({ message: 'incorrectCompletionCode' });
    }

    global.io.sockets.in(req.body.orderId).emit('new-status');

    return res.status(200).send({ ok: true });
};
