import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { notificationText } from '../../frontendTexts/notifications';
import db from '../../models';
import logger from '../../services/logger';
import {
    addNewNotification,
    NotificationType,
} from '../notification.controller';
import { getPaymentUrl } from '../qiwi/getPaymentUrl';

const Order = db.order;
const Payment = db.payment;
const OrderStatus = db.orderStatus;
const User = db.user;

export const confirmDeal = async (req: Request, res: Response) => {
    const order = await Order.findById(req.body.orderId);

    if (order == null) {
        return res.status(404).send({ message: 'Order not found!' });
    }

    const userId = new mongoose.Types.ObjectId(req.body.userId);
    let forUserIdNotification = order.recieverId;

    if (order.recieverId != null && userId.equals(order.recieverId)) {
        order.dealConfirmedByReceiver = true;
        forUserIdNotification = order.carrierId;
    } else if (order.carrierId != null && userId.equals(order.carrierId)) {
        order.dealConfirmedByCarrier = true;
    }

    if (order.dealConfirmedByCarrier && order.dealConfirmedByReceiver) {
        const status = await OrderStatus.findOne({ name: 'waitingForPayment' });
        const payment = await Payment.findById(order.paymentId);
        const receiver = await User.findById(order.recieverId);

        if (payment == null || receiver == null || status == null) {
            logger.error('[confirmDeal]: Status/Payment/Receiver not found');

            return res
                .status(404)
                .send({ message: 'Status/Payment/receiver not found!' });
        }

        order.statusId = status._id;

        const paymentUrl = await getPaymentUrl(order, payment, receiver);

        if (paymentUrl) {
            payment.paymentUrl = paymentUrl;
        }

        await payment.save();
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
