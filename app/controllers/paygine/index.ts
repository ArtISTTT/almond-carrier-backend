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
    const data = req.body.operation;
    console.log('NEW PAY: ', req.body.operation);

    if (!data) {
        return res.status(200).send();
    }

    const paymentForPayStage = await Payment.findOne({
        paymentOrderId: data.order_id[0],
    });

    if (paymentForPayStage != null && data.order_state[0] === 'AUTHORIZED') {
        paymentForPayStage.isPayed = true;
        paymentForPayStage.paymentDate = new Date(data.date[0]);
        paymentForPayStage.paymentOperationId = data.id[0];

        await paymentForPayStage.save();

        const status = await OrderStatus.findOne({
            name: 'awaitingBeforePurchaseItemsFiles',
        });

        if (status == null) {
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

        if (order == null) {
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
    } else {
        const paymentForPayoutStage = await Payment.findOne({
            payoutOrderId: data.order_id[0],
        });

        if (
            paymentForPayoutStage != null &&
            data.order_state[0] === 'COMPLETED'
        ) {
            paymentForPayoutStage.isPayedOut = true;
            paymentForPayoutStage.payOutDate = new Date(data.date[0]);
            paymentForPayoutStage.payOutOperationId = data.id[0];

            await paymentForPayoutStage.save();

            const status = await OrderStatus.findOne({
                name: 'success',
            });

            if (status == null) {
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

            if (order == null) {
                return res.status(200).send();
            }

            global.io.sockets.in(data.reference[0]).emit('new-status');

            await addNewNotification({
                text: notificationText.payoutSuccess,
                orderId: data.reference[0],
                userForId: (
                    order.carrierId as mongoose.Types.ObjectId
                ).toString(),
                notificationType: NotificationType.orderUpdate,
            });
        }
    }

    return res.status(200).send();
};
