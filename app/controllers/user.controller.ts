import bcrypt from 'bcryptjs';
import { Request, Response } from 'express';
import * as core from 'express-serve-static-core';
import mongoose from 'mongoose';
import sharp from 'sharp';
import { uploadFile } from '../aws-s3/uploadFile';
import db from '../models';
import { getFullUri } from '../services/getFullUri';
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
                                $or: [
                                    {
                                        name: 'success',
                                    },
                                ],
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
                ],
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
            $match: {
                $or: [
                    {
                        'status.name': 'success',
                    },
                    {
                        'status.name': 'waitingCarrier',
                    },
                    {
                        'status.name': 'waitingReviever',
                    },
                ],
            },
        },
        { $sort: { createdAt: -1 } },
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

    const completedAsReceiver = await Order.aggregate([
        {
            $match: {
                $and: [
                    {
                        $or: [
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
            $count: 'count',
        },
    ]);

    const completedAsCarrier = await Order.aggregate([
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
            $count: 'count',
        },
    ]);

    const date = new Date();
    date.setMonth(date.getMonth() - 3);

    const ordersInLastThreeMonths = await Order.aggregate([
        {
            $match: {
                $and: [
                    {
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
                                completedDate: {
                                    $gte: date,
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
            $count: 'count',
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
        completedOrdersAsReceiver: completedAsReceiver[0]?.count ?? 0,
        completedOrdersAsCarrier: completedAsCarrier[0]?.count ?? 0,
        rating: rating?.averageRating,
        successOrders: await getOrdersOutput(
            orders,
            req.query.language as string
        ),
        ordersInLastMonth: ordersInLastThreeMonths[0]?.count ?? 0,
        completionRate: 77,
        verifiedByEmail: user.verificated,
        verifiedByPhone: false,
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

    const rating = (
        await Review.aggregate([
            {
                $match: {
                    userForId: new mongoose.Types.ObjectId(
                        req.body.userId as string
                    ),
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
        rating: rating?.averageRating,
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
    let image = sharp(req.file.path);

    return image
        .metadata()
        .then(metadata => {
            if (metadata.width && metadata.width > 280) {
                image = image.resize({ width: 280 });
            }

            if (metadata.height && metadata.height > 280) {
                image = image.resize({ width: 280 });
            }

            return image.toBuffer();
        })
        .then(async data => {
            return await uploadFile(
                req.file.path,
                req.file.filename,
                req,
                res,
                data
            );
        })
        .catch(err => {
            return res.status(500).send({
                message: err,
            });
        });
};
