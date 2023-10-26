import { Request, Response } from 'express';
import { XMLParser } from 'fast-xml-parser';
import mongoose from 'mongoose';
import { notificationText } from '../../frontendTexts/notifications';
import db from '../../models';
import { returnAuthorizedPayment } from '../../payment/returnPayment';
import logger from '../../services/logger';
import {
    addNewNotification,
    NotificationType,
} from '../notification.controller';

const Payment = db.payment;
const OrderStatus = db.orderStatus;
const Order = db.order;
const Card = db.card;

enum TxnStatuses {
    Init = 0, // Пройдена базовая верификация данных и начат процесс проведения операции
    Declined = 1, // 	Операция отклонена
    Authorized = 2, // Выполнена операция авторизации средств (холдирование)
    Completed = 3, // Подтвержденная операция
    Reconciled = 4, // Полностью завершенная финансовая операция
    Settled = 5, // За данную операцию средства будут выплачены ТСП
    Refunded = 6, // Операция отменена, средства возвращены плательщику
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

const CARD_SAVE = 'CARD_SAVE';

export const paymentWebHook = async (req: Request, res: Response) => {
    const data = req.body as ITransaction;

    // replace "\" to ""
    const stringifyData = JSON.stringify(data).replace(/\\/g, '');

    logger.info(`NEW PAY: ${stringifyData}`);

    if (data.txn_status === TxnStatuses.Authorized) {
        logger.info(
            '!!!: ' + data.txn_status + ' ' + data.cf4 + ' ' + data.cf4 ===
                CARD_SAVE
        );
        if (data.cf4 === CARD_SAVE) {
            // Create card token in db for user
            const card = new Card({
                userId: data.cf5,
                number: data.pan,
                token: data.card_token,
                name: data.card_name,
                bankName: data.issuer_name,
            });

            await card.save();

            logger.info(
                `[paymentWebHook]: Card saved [${card._id} - ${card.userId} - ${card.number} - ${card.token} - ${card.name} - ${card.bankName}]`
            );

            // Just card saving
            const returned = returnAuthorizedPayment({ txnId: data.txn_id });

            if (!returned) {
                logger.error('[paymentWebHook]: Could not return payment');
                return res.status(200).send();
            }
        } else {
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
                userForId: (
                    order.recieverId as mongoose.Types.ObjectId
                ).toString(),
                notificationType: NotificationType.orderUpdate,
            });

            await addNewNotification({
                text: notificationText.paymentSuccess,
                orderId: data.order_id,
                userForId: (
                    order.carrierId as mongoose.Types.ObjectId
                ).toString(),
                notificationType: NotificationType.orderUpdate,
            });
        }
    }

    return res.status(200).send();
};
