import { Request, Response } from 'express';
import mongoose from 'mongoose';
import db from '../../models';
import { getOrdersOutput } from '../../services/getOrdersOutput';

const User = db.user;
const Order = db.order;
const OrderStatus = db.orderStatus;
const Payment = db.payment;
const Review = db.review;

export const getMyOrders = async (req: Request, res: Response) => {
    const orders = await Order.aggregate([
        {
            $match: {
                $or: [
                    {
                        carrierId: {
                            $eq: new mongoose.Types.ObjectId(req.body.userId),
                        },
                    },
                    {
                        recieverId: {
                            $eq: new mongoose.Types.ObjectId(req.body.userId),
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
                from: OrderStatus.collection.name,
                localField: 'statusId',
                foreignField: '_id',
                as: 'status',
            },
        },
        {
            $unwind: '$status',
        },
        {
            $lookup: {
                from: Review.collection.name,
                let: { carrierId: '$carrierId' },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $eq: ['$$carrierId', '$userForId'],
                            },
                        },
                    },
                    {
                        $group: {
                            _id: null,
                            averageRating: {
                                $avg: '$rating',
                            },
                        },
                    },
                ],
                as: 'carrierRating',
            },
        },
        {
            $unwind: {
                path: '$carrierRating',
                preserveNullAndEmptyArrays: true,
            },
        },
        {
            $lookup: {
                from: Review.collection.name,
                let: { recieverId: '$recieverId' },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $eq: ['$$recieverId', '$userForId'],
                            },
                        },
                    },
                    {
                        $group: {
                            _id: null,
                            averageRating: {
                                $avg: '$rating',
                            },
                        },
                    },
                ],
                as: 'recieverRating',
            },
        },
        {
            $unwind: {
                path: '$recieverRating',
                preserveNullAndEmptyArrays: true,
            },
        },
    ]);

    return res.status(200).send({
        orders: await getOrdersOutput(orders, req.query.language as string),
    });
};
