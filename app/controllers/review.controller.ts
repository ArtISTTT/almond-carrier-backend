import { Request, Response } from 'express';
import * as core from 'express-serve-static-core';
import mongoose from 'mongoose';
import { notificationText } from '../frontendTexts/notifications';
import db from '../models';
import { ReviewerType } from '../types/review';
import {
    addNewNotification,
    NotificationType,
} from './notification.controller';

const User = db.user;
const Order = db.order;
const OrderStatus = db.orderStatus;
const Payment = db.payment;
const Review = db.review;

// Создание ревью

type IReqCreateOrderAsReceiver = Request<
    core.ParamsDictionary,
    {},
    {
        userId: string;
        orderId: string;
        userForId: string;
        reviewerType: ReviewerType;
        text: string;
        rating: number;
    }
>;

export const sendReview = async (
    req: IReqCreateOrderAsReceiver,
    res: Response
) => {
    try {
        await Review.create({
            orderId: req.body.orderId,
            userReviewerId: req.body.userId,
            userForId: req.body.userForId,
            reviewerType: req.body.reviewerType,
            text: req.body.text,
            rating: req.body.rating,
        });

        await addNewNotification({
            text: notificationText.newReview,
            orderId: req.body.orderId,
            userForId: req.body.userForId,
            notificationType: NotificationType.orderUpdate,
        });

        return res.status(200).send({
            message: 'Successful review!',
        });
    } catch (e) {
        console.log(e);

        return res.status(500).send({
            message: 'Failed',
        });
    }
};

// Получение ревью для пользователя + части заказа (товар, дата, прибыль если есть) + От кого (фотка, имя и фамилия)

export const getUserReviews = async (
    req: IReqCreateOrderAsReceiver,
    res: Response
) => {
    try {
        const { userId } = req.query;

        const reviews = await Review.aggregate([
            {
                $match: {
                    userForId: {
                        $eq: new mongoose.Types.ObjectId(userId as string),
                    },
                },
            },
            {
                $lookup: {
                    from: Order.collection.name,
                    localField: 'orderId',
                    foreignField: '_id',
                    as: 'order',
                },
            },
            {
                $unwind: '$order',
            },
            {
                $lookup: {
                    from: Payment.collection.name,
                    localField: 'order.paymentId',
                    foreignField: '_id',
                    as: 'payment',
                },
            },
            {
                $unwind: '$payment',
            },
            {
                $lookup: {
                    from: User.collection.name,
                    localField: 'userReviewerId',
                    foreignField: '_id',
                    as: 'userReviewer',
                },
            },
            {
                $unwind: '$userReviewer',
            },
            { $sort: { 'order.completedDate': -1 } },
            {
                $project: {
                    reviewerType: 1,
                    text: 1,
                    rating: 1,
                    'order.completedDate': 1,
                    'order.productName': 1,
                    'payment.rewardAmount': 1,
                    'payment.currency': 1,
                    'userReviewer.firstName': 1,
                    'userReviewer.lastName': 1,
                    'userReviewer.avatarImage': 1,
                },
            },
        ]);

        return res.status(200).send({
            reviews,
        });
    } catch (e) {
        console.log(e);

        return res.status(500).send({
            message: 'Failed',
        });
    }
};
