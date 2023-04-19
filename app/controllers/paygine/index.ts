import { Request, Response } from 'express';
import { XMLParser } from 'fast-xml-parser';
import mongoose from 'mongoose';
import { notificationText } from '../../frontendTexts/notifications';
import db from '../../models';
import {
    addNewNotification,
    NotificationType,
} from '../notification.controller';

const Payment = db.payment;
const OrderStatus = db.orderStatus;
const Order = db.order;

export const paymentWebHook = async (req: Request, res: Response) => {
    const data = req.body;
    console.log(req.body, '--');

    if (data) {
        return res.status(200).send();
    }

    if (data.state[0] === 'APPROVED') {
        await Payment.findOneAndUpdate(
            {
                paymentOrderId: data.order_id[0],
            },
            {
                $set: {
                    isPayed: true,
                    paymentDate: new Date(data.date[0]),
                },
            },
            { new: true, lean: true }
        );

        const status = await OrderStatus.findOne({
            name: 'awaitingBeforePurchaseItemsFiles',
        });

        if (!status) {
            return res.status(200).send();
        }

        const order = await Order.findByIdAndUpdate(
            { _id: data.reference[0] },
            {
                $set: {
                    statusId: status._id,
                },
            },
            { new: true, lean: true }
        );

        if (!order) {
            return res.status(200).send();
        }

        global.io.sockets.in(data.reference[0]).emit('new-status');

        await addNewNotification({
            text: notificationText.paymentSuccess,
            orderId: data.reference[0],
            userForId: (order.recieverId as mongoose.Types.ObjectId).toString(),
            notificationType: NotificationType.orderUpdate,
        });

        await addNewNotification({
            text: notificationText.paymentSuccess,
            orderId: data.reference[0],
            userForId: (order.carrierId as mongoose.Types.ObjectId).toString(),
            notificationType: NotificationType.orderUpdate,
        });
    }

    return res.status(200).send();
};
