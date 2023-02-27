import { Request, Response } from 'express';
import mongoose from 'mongoose';
import db from '../models';
import * as core from 'express-serve-static-core';
import { getOrdersOutput } from '../services/getOrdersOutput';
import {
    NotificationType,
    addNewNotification,
} from './notification.controller';
import { notificationText } from '../frontendTexts/notifications';
import { BaseRecord } from 'adminjs';

const User = db.user;
const Order = db.order;
const OrderStatus = db.orderStatus;
const Payment = db.payment;
const Review = db.review;

export const confirmPaymentByAdmin = async (record: BaseRecord) => {
    const status = await OrderStatus.findOne({
        name: 'awaitingDelivery',
    });

    if (!status) {
        return;
    }

    await record.update({
        statusId: status._id,
    });

    await record.populated.paymentId.update({
        isPayed: true,
    });

    await record.populated.paymentId.save();
    await record.save();

    global.io.sockets.in(record.params._id).emit('new-status');

    await addNewNotification({
        text: notificationText.paymentSuccess,
        orderId: record.params._id,
        userForId: String(record.params._id),
        notificationType: NotificationType.orderUpdate,
    });
};
