import { Request, Response } from 'express';
import { notificationText } from '../../frontendTexts/notifications';
import db from '../../models';
import {
    addNewNotification,
    NotificationType,
} from '../notification.controller';

const Order = db.order;
const OrderStatus = db.orderStatus;

export const approveBeforePurchase = async (req: Request, res: Response) => {
    const status = await OrderStatus.findOne({
        name: 'awaitingPurchase',
    });

    if (status == null) {
        return res.status(404).send({ message: 'Status not found' });
    }

    const order = await Order.findByIdAndUpdate(
        { _id: req.body.orderId },
        {
            $set: {
                statusId: status._id,
            },
        },
        { new: true, lean: true }
    );

    if (order == null) {
        return res.status(404).send({ message: 'Order not found!' });
    }

    global.io.sockets.in(req.body.orderId).emit('new-status');

    await addNewNotification({
        text: notificationText.beforePurchaseReviewed,
        orderId: req.body.orderId,
        userForId: String(order.carrierId),
        notificationType: NotificationType.orderUpdate,
    });

    return res.status(200).send({ ok: true });
};
