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

    if (order == null) {
        return res.status(404).send({ message: 'Order not found!' });
    }

    const payment = await Payment.findById(order.paymentId);

    if (
        payment == null ||
        !payment.paymentOperationId ||
        !payment.paymentOrderId
    ) {
        return res.status(404).send({ message: 'paymentNotFound' });
    }

    if (!payment.txnId) {
        return res.status(404).send({ message: 'paymentNotCompleted' });
    }

    const paymentCompleted = await completeOrderForPayment({
        txnId: payment.txnId,
    });

    if (!paymentCompleted) {
        return res.status(404).send({ message: 'couldNotCompletePayment' });
    }

    const status = await OrderStatus.findOne({
        name: 'awaitingDelivery',
    });

    if (status == null) {
        return res.status(404).send({ message: 'Status not found' });
    }

    order.statusId = status._id;
    payment.txnStatus = 3;

    await payment.save();
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
