import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { notificationText } from '../../frontendTexts/notifications';
import { getOrderPaymentSum } from '../../helpers/getOrderPaymentSum';
import db from '../../models';
import { createOrderForPayment } from '../../payment/createOrder';
import {
    addNewNotification,
    NotificationType,
} from './../notification.controller';

const Order = db.order;
const Payment = db.payment;
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
        const payment = await Payment.findById(order.paymentId);

        if (!status || !payment) {
            return res
                .status(404)
                .send({ message: 'Status/Payment not found!' });
        }

        order.statusId = status._id;

        // creating payment order

        const orderAmount = getOrderPaymentSum({
            rewardAmount: payment.rewardAmount as number,
            productAmount: payment.productAmount as number,
            paymentCPComission: payment.paymentCPComission,
            dueCPComission: payment.dueCPComission,
            ourDueComission: payment.ourDueComission,
        });

        const paymentOrderId = await createOrderForPayment({
            amount: orderAmount,
            orderId: req.body.orderId as string,
            productName: order.productName,
        });
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
