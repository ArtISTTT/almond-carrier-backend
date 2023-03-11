import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { notificationText } from '../../frontendTexts/notifications';
import db from '../../models';
import {
    addNewNotification,
    NotificationType,
} from './../notification.controller';

const Order = db.order;
const OrderStatus = db.orderStatus;

export const confirmDeal = async (req: Request, res: Response) => {
    const order = await Order.findById(req.body.orderId);

    if (!order) {
        return res.status(404).send({ message: 'Order not found!' });
    }

    const userId = new mongoose.Types.ObjectId(req.body.userId);
    let forUserIdNotification = order.recieverId;

    if (order.recieverId && userId.equals(order.recieverId)) {
        order.dealConfirmedByReceiver = true;
        forUserIdNotification = order.carrierId;
    } else if (order.carrierId && userId.equals(order.carrierId)) {
        order.dealConfirmedByCarrier = true;
    }

    if (order.dealConfirmedByCarrier && order.dealConfirmedByReceiver) {
        const status = await OrderStatus.findOne({ name: 'waitingForPayment' });

        if (!status) {
            return res.status(404).send({ message: 'Status not found!' });
        }

        order.statusId = status._id;
    }

    await order.save();

    await addNewNotification({
        text: notificationText.dealConfirmedByPartner,
        orderId: req.body.orderId,
        userForId: String(forUserIdNotification),
        notificationType: NotificationType.orderUpdate,
    });

    global.io.sockets.in(req.body.orderId).emit('new-status');

    return res.status(200).send({ ok: true });
};
