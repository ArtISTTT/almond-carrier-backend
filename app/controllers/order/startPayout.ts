import { Request, Response } from 'express';
import db from '../../models';

const Order = db.order;
const OrderStatus = db.orderStatus;

export const startPayout = async (req: Request, res: Response) => {
    const status = await OrderStatus.findOne({
        name: 'awaitingPayout',
    });

    if (!status) {
        return res.status(404).send({ message: 'Status not found' });
    }

    const order = await Order.findByIdAndUpdate(
        { _id: req.body.orderId },
        {
            $set: {
                statusId: status._id,
                payoutInfo: {
                    phoneNumber: req.body.phoneNumber,
                    bank: req.body.bank,
                },
            },
        },
        { new: true, lean: true }
    );

    if (!order) {
        return res.status(404).send({ message: 'Order not found!' });
    }

    global.io.sockets.in(req.body.orderId).emit('new-status');

    return res.status(200).send({ ok: true });
};
