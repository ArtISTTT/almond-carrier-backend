import { Request, Response } from 'express';
import mongoose from 'mongoose';
import db from '../../models';
import { getOrdersOutput } from '../../services/getOrdersOutput';

const User = db.user;
const Order = db.order;
const OrderStatus = db.orderStatus;
const Payment = db.payment;
const Review = db.review;

interface IPayout {
    id: string;
    completedDate: Date;
    productName: string;
    rewardAmount: number;
    bank: string;
    phoneNumber: string;
    status: string;
}

const getPayoutsOutput = (orders: any[]): IPayout[] =>
    orders.map(order => ({
        id: order._id,
        completedDate: order.completedDate,
        productName: order.productName,
        rewardAmount: order.payment.rewardAmount,
        bank: order.payoutInfo.bank,
        phoneNumber: order.payoutInfo.phoneNumber,
        status: order.status.name,
    }));

export const getPayouts = async (req: Request, res: Response) => {
    const payouts = await Order.aggregate([
        {
            $match: {
                carrierId: {
                    $eq: new mongoose.Types.ObjectId(req.body.userId),
                },
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
            $match: {
                $or: [
                    {
                        'status.name': 'success',
                    },
                    {
                        'status.name': 'awaitingPayout',
                    },
                ],
            },
        },
        {
            $project: {
                _id: 1,
                productName: 1,
                completedDate: 1,
                payoutInfo: 1,
                payment: 1,
                status: 1,
            },
        },
    ]);

    return res.status(200).send({
        payouts: getPayoutsOutput(payouts),
    });
};
