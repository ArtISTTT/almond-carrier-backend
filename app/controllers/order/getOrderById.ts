import { Request, Response } from 'express';
import mongoose from 'mongoose';
import db from '../../models';
import { getOrdersOutput } from '../../services/getOrdersOutput';
import logger from '../../services/logger';

const User = db.user;
const Order = db.order;
const OrderStatus = db.orderStatus;
const Payment = db.payment;
const Review = db.review;

export const getOrderById = async (req: Request, res: Response) => {
    logger.info('GETTING ORDER BY ID');
    const orders = await Order.aggregate([
        {
            $match: {
                $and: [
                    {
                        $or: [
                            {
                                carrierId: {
                                    $eq: new mongoose.Types.ObjectId(
                                        req.body.userId
                                    ),
                                },
                            },
                            {
                                recieverId: {
                                    $eq: new mongoose.Types.ObjectId(
                                        req.body.userId
                                    ),
                                },
                            },
                        ],
                    },
                    {
                        _id: {
                            $eq: new mongoose.Types.ObjectId(
                                req.query.orderId as string
                            ),
                        },
                    },
                ],
            },
        },
        {
            $lookup: {
                from: Payment.collection.name,
                localField: 'paymentId',
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
                localField: 'recieverId',
                foreignField: '_id',
                as: 'receiver',
            },
        },
        {
            $unwind: {
                path: '$receiver',
                preserveNullAndEmptyArrays: true,
            },
        },
        {
            $lookup: {
                from: User.collection.name,
                localField: 'carrierId',
                foreignField: '_id',
                as: 'carrier',
            },
        },
        {
            $unwind: {
                path: '$carrier',
                preserveNullAndEmptyArrays: true,
            },
        },
        {
            $lookup: {
                from: Review.collection.name,
                let: { carrierId: '$carrierId', recieverId: '$recieverId' },
                pipeline: [
                    {
                        $match: {
                            $and: [
                                {
                                    $or: [
                                        {
                                            $expr: {
                                                $eq: [
                                                    '$$carrierId',
                                                    '$userForId',
                                                ],
                                            },
                                        },
                                        {
                                            $expr: {
                                                $eq: [
                                                    '$$recieverId',
                                                    '$userForId',
                                                ],
                                            },
                                        },
                                    ],
                                },
                                {
                                    orderId: {
                                        $eq: new mongoose.Types.ObjectId(
                                            req.query.orderId as string
                                        ),
                                    },
                                },
                            ],
                        },
                    },
                ],
                as: 'reviews',
            },
        },
        {
            $lookup: {
                from: OrderStatus.collection.name,
                localField: 'statusId',
                foreignField: '_id',
                as: 'status',
            },
        },
        {
            $unwind: '$status',
        },
    ]);

    if (orders.length === 0) {
        res.status(404).send({ message: 'Order not found!' });
    }

    const outputOrder = (
        await getOrdersOutput(orders, req.query.language as string, true)
    )[0];

    return res.status(200).send({
        order: {
            ...outputOrder,
            myReview: orders[0].reviews?.find(
                (review: any) =>
                    String(review.userReviewerId) === req.body.userId
            ),
            partnerReview: orders[0].reviews?.find(
                (review: any) => String(review.userForId) === req.body.userId
            ),
        },
    });
};
