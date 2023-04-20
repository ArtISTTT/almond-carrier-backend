import { Request, Response } from 'express';
import { notificationText } from '../../frontendTexts/notifications';
import db from '../../models';
import { completeOrderForPayment } from '../../payment/createOrder';
import {
    addNewNotification,
    NotificationType,
} from '../notification.controller';

const Order = db.order;
const OrderStatus = db.orderStatus;
const Payment = db.payment;

export const approvePurchase = async (req: Request, res: Response) => {
    const order = await Order.findById(req.body.orderId);

    if (!order) {
        return res.status(404).send({ message: 'Order not found!' });
    }

    const payment = await Payment.findById(order.paymentId);

    if (!payment || !payment.sdRef || !payment.paymentOperationId) {
        return res.status(404).send({ message: 'paymentNotFound' });
    }

    const paymentCompleted = await completeOrderForPayment({
        paymentOperationId: payment.paymentOperationId,
        sdRef: payment.sdRef,
    });

    if (!paymentCompleted) {
        return res.status(404).send({ message: 'couldNotCompletePayment' });
    }

    const status = await OrderStatus.findOne({
        name: 'awaitingDelivery',
    });

    if (!status) {
        return res.status(404).send({ message: 'Status not found' });
    }

    order.statusId = status._id;

    await order.save();

    global.io.sockets.in(req.body.orderId).emit('new-status');

    await addNewNotification({
        text: notificationText.purchaseReviewed,
        orderId: req.body.orderId,
        userForId: String(order.carrierId),
        notificationType: NotificationType.orderUpdate,
    });

    return res.status(200).send({ ok: true });
};
