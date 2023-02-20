import { Request, Response } from 'express';
import db from '../models';
import * as core from 'express-serve-static-core';
import bcrypt from 'bcryptjs';
import { getFullUri } from '../services/getFullUri';
import mongoose from 'mongoose';
import { getOrdersOutput } from '../services/getOrdersOutput';

export const allAccess = (req: Request, res: Response) => {
    res.status(200).send('Public Content.');
};

const BRYPTO_KEY = process.env.BCRYPTO_KEY;

const User = db.user;
const Image = db.image;
const Order = db.order;
const OrderStatus = db.orderStatus;
const Payment = db.payment;
const Review = db.review;

export const getUserProfile = async (req: Request, res: Response) => {
    const { userId } = req.query;

    const user = (
        await User.aggregate([
            {
                $match: {
                    _id: { $eq: new mongoose.Types.ObjectId(userId as string) },
                },
            },
            {
                $lookup: {
                    from: OrderStatus.collection.name,
                    let: {},
                    pipeline: [
                        {
                            $match: {
                                name: 'success',
                            },
                        },
                    ],
                    as: 'successStatus',
                },
            },
            {
                $unwind: '$successStatus',
            },
        ])
    )[0];

    const rating = (
        await Review.aggregate([
            {
                $match: {
                    userForId: new mongoose.Types.ObjectId(userId as string),
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
        ])
    )[0];

    if (!user) {
        return res.status(404).send({ message: 'User Not found.' });
    }

    const orders = await Order.aggregate([
        {
            $match: {
                $and: [
                    {
                        $or: [
                            {
                                carrierId: {
                                    $eq: new mongoose.Types.ObjectId(
                                        userId as string
                                    ),
                                },
                            },
                            {
                                recieverId: {
                                    $eq: new mongoose.Types.ObjectId(
                                        userId as string
                                    ),
                                },
                            },
                        ],
                    },
                    {
                        $expr: {
                            $eq: [user.successStatus._id, '$statusId'],
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
    ]);

    res.status(200).send({
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        gender: user.gender,
        dateOfBirth: user.dateOfBirth,
        avatar: user.avatarImage,
        completedOrders: orders.length,
        completedOrdersAsReceiver: 12,
        completedOrdersAsCarrier: 4,
        rating: rating.averageRating,
        successOrders: getOrdersOutput(orders),
        ordersInLastMonth: 3,
        completionRate: 77,
        verifiedByEmail: true,
        verifiedByPhone: true,
        fromLocation: 'Moscow',
    });
};

export const userBoard = async (req: Request, res: Response) => {
    const user = (
        await User.aggregate([
            {
                $match: {
                    _id: { $eq: new mongoose.Types.ObjectId(req.body.userId) },
                },
            },
            {
                $lookup: {
                    from: OrderStatus.collection.name,
                    let: {},
                    pipeline: [
                        {
                            $match: {
                                name: 'success',
                            },
                        },
                    ],
                    as: 'successStatus',
                },
            },
            {
                $unwind: '$successStatus',
            },
            {
                $lookup: {
                    from: Order.collection.name,
                    let: {
                        userId: '$_id',
                        successStatus: '$successStatus',
                    },
                    pipeline: [
                        {
                            $match: {
                                $and: [
                                    {
                                        $or: [
                                            {
                                                $expr: {
                                                    $eq: [
                                                        '$$userId',
                                                        '$carrierId',
                                                    ],
                                                },
                                            },
                                            {
                                                $expr: {
                                                    $eq: [
                                                        '$$userId',
                                                        '$recieverId',
                                                    ],
                                                },
                                            },
                                        ],
                                    },
                                    {
                                        $expr: {
                                            $eq: [
                                                '$$successStatus._id',
                                                '$statusId',
                                            ],
                                        },
                                    },
                                ],
                            },
                        },
                    ],
                    as: 'successOrders',
                },
            },
        ])
    )[0];

    if (!user) {
        return res.status(404).send({ message: 'User Not found.' });
    }

    res.status(200).send({
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        gender: user.gender,
        phoneNumber: user.phoneNumber,
        dateOfBirth: user.dateOfBirth,
        avatar: user.avatarImage,
        completedOrders: user.successOrders.length,
    });
};

type IReqUpdateUser = Request<
    core.ParamsDictionary,
    {},
    {
        firstName: string;
        lastName: string;
        dateOfBirth: Date;
        gender: string;
        phoneNumber: string;
        userId: string;
    }
>;

export const updateUserInfo = async (req: IReqUpdateUser, res: Response) => {
    const user = await User.findByIdAndUpdate(
        { _id: req.body.userId },
        {
            $set: {
                firstName: req.body.firstName,
                lastName: req.body.lastName,
                dateOfBirth: req.body.dateOfBirth,
                gender: req.body.gender,
                phoneNumber: req.body.phoneNumber,
            },
        },
        { new: true, lean: true }
    );

    if (!user) {
        return res.status(404).send({ message: 'User Not found.' });
    }

    return res.status(200).send({
        user: {
            id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            gender: user.gender,
            phoneNumber: user.phoneNumber,
            dateOfBirth: user.dateOfBirth,
            avatar: user.avatarImage,
        },
    });
};

type IReqUpdateUserPassword = Request<
    core.ParamsDictionary,
    {},
    {
        oldPassword: string;
        newPassword: string;
        userId: string;
    }
>;

export const updateUserPassword = async (
    req: IReqUpdateUserPassword,
    res: Response
) => {
    const user = await User.findById({ _id: req.body.userId });

    if (!user) {
        return res.status(404).send({
            message: 'User Not found!',
        });
    }

    const isValidOldPassword = bcrypt.compareSync(
        req.body.oldPassword,
        user.password
    );

    if (!isValidOldPassword) {
        return res.status(404).send({ message: 'Old password is not valid' });
    }

    const newPasswordHash = bcrypt.hashSync(
        req.body.newPassword,
        Number(BRYPTO_KEY)
    );

    await User.updateOne(
        { _id: req.body.userId },
        {
            $set: {
                password: newPasswordHash,
            },
        },
        { new: true }
    );

    return res.status(200).send({ ok: true });
};

export const adminBoard = (req: Request, res: Response) => {
    res.status(200).send('Admin Content.');
};

export const moderatorBoard = (req: Request, res: Response) => {
    res.status(200).send('Moderator Content.');
};

export const updateAvatar = async (req: Request, res: Response) => {
    if (req.file === undefined) return res.send('you must select a file.');

    const imageUri = `${getFullUri(req)}/${req.file.path}`;

    await User.updateOne(
        { _id: req.body.userId },
        {
            $set: {
                avatarImage: imageUri,
            },
        },
        { new: true }
    );

    res.status(200).send({
        message: 'Avatar successfully updated',
        avatar: imageUri,
    });
};
