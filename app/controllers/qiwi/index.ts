import { Request, Response } from 'express';
import { XMLParser } from 'fast-xml-parser';
import mongoose from 'mongoose';
import { notificationText } from '../../frontendTexts/notifications';
import db from '../../models';
import logger from '../../services/logger';
import {
    addNewNotification,
    NotificationType,
} from '../notification.controller';

const Payment = db.payment;
const OrderStatus = db.orderStatus;
const Order = db.order;

enum TxnStatuses {
    Init = 0, // Пройдена базовая верификация данных и начат процесс проведения операции
    Declined = 1, // 	Операция отклонена
    Authorized = 2, // Выполнена операция авторизации средств (холдирование)
    Completed = 3, // Подтвержденная операция
    Reconciled = 4, // Полностью завершенная финансовая операция
    Settled = 5, // За данную операцию средства будут выплачены ТСП
}

interface ITransaction {
    txn_id: string;
    pan: string;
    card_name: string;
    issuer_name: string;
    issuer_country: string;
    email: string;
    country: string;
    city: string;
    region: string;
    address: string;
    phone: string;
    cf1: string;
    cf2: string;
    cf3: string;
    cf4: string;
    cf5: string;
    product_name: string;
    card_token: string;
    ip: string;
    eci: string;
    order_id: string;
    txn_status: TxnStatuses;
    txn_date: Date;
    txn_type: string;
    error_code: string;
    amount: string;
    currency: string;
    sign: string;
}

export const paymentWebHook = async (req: Request, res: Response) => {
    const data = req.body as ITransaction;
    console.log('NEW PAY: ', req.params, req.body);
    logger.info(`NEW PAY: ${JSON.stringify(data)}`);

    if (data.txn_status === TxnStatuses.Authorized) {
        const payment = await Payment.findOne({
            paymentOrderId: data.order_id[0],
        });

        if (payment == null) {
            logger.error('[paymentWebHook]: Payment not found');
            return res.status(200).send();
        }

        payment.isPayed = true;
        payment.paymentDate = new Date(data.txn_date);
        payment.paymentOperationId = data.txn_id;
        payment.txnId = data.txn_id;
        payment.sign = data.sign;

        await payment.save();

        const status = await OrderStatus.findOne({
            name: 'awaitingBeforePurchaseItemsFiles',
        });

        if (status == null) {
            return res.status(200).send();
        }

        const order = await Order.findByIdAndUpdate(
            { _id: data.order_id },
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

        global.io.sockets.in(data.order_id).emit('new-status');

        await addNewNotification({
            text: notificationText.paymentSuccess,
            orderId: data.order_id,
            userForId: (order.recieverId as mongoose.Types.ObjectId).toString(),
            notificationType: NotificationType.orderUpdate,
        });

        await addNewNotification({
            text: notificationText.paymentSuccess,
            orderId: data.order_id,
            userForId: (order.carrierId as mongoose.Types.ObjectId).toString(),
            notificationType: NotificationType.orderUpdate,
        });
    }

    // if (!data) {
    //     return res.status(200).send();
    // }

    // const paymentForPayStage = await Payment.findOne({
    //     paymentOrderId: data.order_id[0],
    // });

    // if (paymentForPayStage && data.order_state[0] === 'AUTHORIZED') {
    //     paymentForPayStage.isPayed = true;
    //     paymentForPayStage.paymentDate = new Date(data.date[0]);
    //     paymentForPayStage.paymentOperationId = data.id[0];

    //     await paymentForPayStage.save();

    //     const status = await OrderStatus.findOne({
    //         name: 'awaitingBeforePurchaseItemsFiles',
    //     });

    //     if (!status) {
    //         return res.status(200).send();
    //     }

    //     const order = await Order.findByIdAndUpdate(
    //         { _id: data.reference[0] },
    //         {
    //             $set: {
    //                 statusId: status._id,
    //             },
    //         },
    //         { new: true, lean: true }
    //     );

    //     if (!order) {
    //         return res.status(200).send();
    //     }

    //     global.io.sockets.in(data.reference[0]).emit('new-status');

    //     await addNewNotification({
    //         text: notificationText.paymentSuccess,
    //         orderId: data.reference[0],
    //         userForId: (order.recieverId as mongoose.Types.ObjectId).toString(),
    //         notificationType: NotificationType.orderUpdate,
    //     });

    //     await addNewNotification({
    //         text: notificationText.paymentSuccess,
    //         orderId: data.reference[0],
    //         userForId: (order.carrierId as mongoose.Types.ObjectId).toString(),
    //         notificationType: NotificationType.orderUpdate,
    //     });
    // } else {
    //     const paymentForPayoutStage = await Payment.findOne({
    //         payoutOrderId: data.order_id[0],
    //     });

    //     if (paymentForPayoutStage && data.order_state[0] === 'COMPLETED') {
    //         paymentForPayoutStage.isPayedOut = true;
    //         paymentForPayoutStage.payOutDate = new Date(data.date[0]);
    //         paymentForPayoutStage.payOutOperationId = data.id[0];

    //         await paymentForPayoutStage.save();

    //         const status = await OrderStatus.findOne({
    //             name: 'success',
    //         });

    //         if (!status) {
    //             return res.status(200).send();
    //         }

    //         const order = await Order.findByIdAndUpdate(
    //             { _id: data.reference[0] },
    //             {
    //                 $set: {
    //                     statusId: status._id,
    //                 },
    //             },
    //             { new: true, lean: true }
    //         );

    //         if (!order) {
    //             return res.status(200).send();
    //         }

    //         global.io.sockets.in(data.reference[0]).emit('new-status');

    //         await addNewNotification({
    //             text: notificationText.payoutSuccess,
    //             orderId: data.reference[0],
    //             userForId: (
    //                 order.carrierId as mongoose.Types.ObjectId
    //             ).toString(),
    //             notificationType: NotificationType.orderUpdate,
    //         });
    //     }
    // }

    return res.status(200).send();
};
