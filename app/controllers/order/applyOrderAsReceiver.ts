import { Request, Response } from 'express';
import * as core from 'express-serve-static-core';
import { notificationText } from '../../frontendTexts/notifications';
import db from '../../models';
import {
    addNewNotification,
    NotificationType,
} from '../notification.controller';

const Order = db.order;
const OrderStatus = db.orderStatus;
const Payment = db.payment;

type IReqSApplyAsReceiver = Request<
    core.ParamsDictionary,
    {},
    {
        userId: string;
        orderId: string;
        productName: string;
        productUri?: string;
        productAmount: number;
        productWeight: number;
        productDescription: string;
    }
>;

export const applyOrderAsReceiver = async (
    req: IReqSApplyAsReceiver,
    res: Response
) => {
    const status = await OrderStatus.findOne({ name: 'inDiscussion' });

    if (status == null) {
        return res.status(404).send({ message: 'Status not found!' });
    }

    const order = await Order.findByIdAndUpdate(
        { _id: req.body.orderId },
        {
            $set: {
                recieverId: req.body.userId,
                productName: req.body.productName,
                productUri: req.body.productUri,
                productWeight: req.body.productWeight,
                productDescription: req.body.productDescription,
                statusId: status._id,
            },
        },
        { new: true, lean: true }
    );

    if (order == null) {
        return res.status(404).send({ message: 'Order to apply not found!' });
    }

    await Payment.findByIdAndUpdate(
        { _id: order.paymentId },
        {
            $set: {
                productAmount: req.body.productAmount,
            },
        },
        { new: true, lean: true }
    );

    global.io.sockets.in(req.body.orderId).emit('new-status');

    await addNewNotification({
        text: notificationText.recieverFound,
        orderId: req.body.orderId,
        userForId: String(order.carrierId),
        notificationType: NotificationType.orderUpdate,
    });

    return res.status(200).send({ orderId: order._id });
};
