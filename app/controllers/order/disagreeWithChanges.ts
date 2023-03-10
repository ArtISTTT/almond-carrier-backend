import { Request, Response } from 'express';
import db from '../../models';

const Order = db.order;

export const disagreeWithChanges = async (req: Request, res: Response) => {
    const order = await Order.findById(req.body.orderId);

    if (!order) {
        return res.status(404).send({ message: 'Order not found!' });
    }

    order.byReceiverSuggestedChanges = undefined;
    order.byCarrierSuggestedChanges = undefined;

    await order.save();

    global.io.sockets.in(req.body.orderId).emit('new-status');

    return res.status(200).send({ ok: true });
};
