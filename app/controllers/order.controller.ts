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
import { convertBoundsToPolygon } from '../helpers/initialize/convertBoundsToPolygon';
import { IBounds } from '../types/geometry';

const User = db.user;
const Order = db.order;
const OrderStatus = db.orderStatus;
const Payment = db.payment;
const Review = db.review;

type IReqCreateOrderAsCarrier = Request<
    core.ParamsDictionary,
    {},
    {
        rewardAmount: number;
        currency: string;
        userId: string;
        fromLocation: string;
        fromLocation_placeId: string;
        fromLocationBounds: IBounds;
        toLocation: string;
        toLocation_placeId: string;
        toLocationBounds: IBounds;
        carrierMaxWeight: number;
        arrivalDate: Date;
    }
>;

export const createOrderAsCarrier = async (
    req: IReqCreateOrderAsCarrier,
    res: Response
) => {
    const status = await OrderStatus.findOne({ name: 'waitingReciever' });

    if (!status) {
        res.status(404).send({ message: 'Status not found' });
        return;
    }

    const payment = new Payment({
        rewardAmount: req.body.rewardAmount,
        currency: req.body.currency,
    });

    payment.save(err => {
        if (err) {
            res.status(500).send({ message: err });
            return;
        }
    });

    await Order.create({
        creatorId: req.body.userId,
        carrierId: req.body.userId,
        statusId: status?._id,
        paymentId: payment._id,
        fromLocation: req.body.fromLocation,
        toLocation: req.body.toLocation,
        fromLocation_placeId: req.body.fromLocation_placeId,
        toLocation_placeId: req.body.toLocation_placeId,
        fromLocationPolygon: {
            type: 'Polygon',
            coordinates: convertBoundsToPolygon(req.body.fromLocationBounds),
        },
        toLocationPolygon: {
            type: 'Polygon',
            coordinates: convertBoundsToPolygon(req.body.toLocationBounds),
        },
        carrierMaxWeight: req.body.carrierMaxWeight,
        arrivalDate: req.body.arrivalDate,
    });

    return res.status(200).send({
        message: 'Order successfully created!',
    });
};

type IReqCreateOrderAsReceiver = Request<
    core.ParamsDictionary,
    {},
    {
        currency: string;
        userId: string;
        toLocation: string;
        toLocation_placeId: string;
        toLocationBounds: IBounds;
        fromLocation?: string;
        fromLocation_placeId?: string;
        fromLocationBounds?: IBounds;
        productName: string;
        productUri?: string;
        rewardAmount: number;
        productAmount: number;
        productWeight: number;
        productDescription: string;
    }
>;

export const createOrderAsReceiver = async (
    req: IReqCreateOrderAsReceiver,
    res: Response
) => {
    const status = await OrderStatus.findOne({ name: 'waitingCarrier' });

    if (!status) {
        res.status(404).send({ message: 'Status not found' });
        return;
    }

    const payment = await Payment.create({
        rewardAmount: req.body.rewardAmount,
        productAmount: req.body.productAmount,
        currency: req.body.currency,
    });

    await Order.create({
        creatorId: req.body.userId,
        recieverId: req.body.userId,
        statusId: status?._id,
        paymentId: payment._id,
        fromLocation: req.body.fromLocation,
        toLocation: req.body.toLocation,
        fromLocation_placeId: req.body.fromLocation_placeId,
        fromLocationPolygon: req.body.fromLocationBounds
            ? {
                  type: 'Polygon',
                  coordinates: convertBoundsToPolygon(
                      req.body.fromLocationBounds
                  ),
              }
            : undefined,
        toLocation_placeId: req.body.toLocation_placeId,
        toLocationPolygon: {
            type: 'Polygon',
            coordinates: convertBoundsToPolygon(req.body.toLocationBounds),
        },
        productName: req.body.productName,
        productUri: req.body.productUri,
        productWeight: req.body.productWeight,
        productDescription: req.body.productDescription,
    });

    return res.status(200).send({
        message: 'Order successfully created!',
    });
};

enum OrderSeachType {
    receivers = 'receivers',
    carriers = 'carriers',
}

type Filter = {
    fromLocation_placeId?: string;
    toLocation_placeId?: string;
    fromLocationBounds: IBounds;
    toLocationBounds: IBounds;
    maxBenefit?: number;
    minBenefit?: number;
    maxWeight?: number;
    maxPrice?: number;
};

type IReqSearchOrders = Request<
    core.ParamsDictionary,
    {},
    {
        userId: string;
        type: OrderSeachType;
        filters: Filter;
        start: number;
        limit: number;
    }
>;

export const searchOrders = async (req: IReqSearchOrders, res: Response) => {
    const ordersList = [];

    // GETTING CARRIERS LIST BY FILTERS

    if (req.body.type === OrderSeachType.carriers) {
        const matchOrderFilters = [
            {
                carrierId: {
                    $exists: true,
                    $ne: new mongoose.Types.ObjectId(req.body.userId),
                },
                recieverId: { $exists: false },
            },
        ]
            .concat(
                req.body.filters.fromLocation_placeId
                    ? ([
                          {
                              $or: [
                                  {
                                      fromLocation_placeId:
                                          req.body.filters.fromLocation_placeId,
                                  },
                                  {
                                      fromLocationPolygon: {
                                          $geoWithin: {
                                              $geometry: {
                                                  type: 'Polygon',
                                                  coordinates:
                                                      convertBoundsToPolygon(
                                                          req.body.filters
                                                              .fromLocationBounds
                                                      ),
                                              },
                                          },
                                      },
                                  },
                              ],
                          },
                      ] as any)
                    : []
            )
            .concat(
                req.body.filters.toLocation_placeId
                    ? ([
                          {
                              $or: [
                                  {
                                      toLocation_placeId:
                                          req.body.filters.toLocation_placeId,
                                  },
                                  {
                                      toLocationPolygon: {
                                          $geoWithin: {
                                              $geometry: {
                                                  type: 'Polygon',
                                                  coordinates:
                                                      convertBoundsToPolygon(
                                                          req.body.filters
                                                              .toLocationBounds
                                                      ),
                                              },
                                          },
                                      },
                                  },
                              ],
                          },
                      ] as any)
                    : []
            )
            .concat(
                req.body.filters.maxWeight
                    ? ([
                          {
                              carrierMaxWeight: {
                                  $lte: req.body.filters.maxWeight,
                              },
                          },
                      ] as any)
                    : []
            );

        const matchPayment: mongoose.FilterQuery<any> = {
            $expr: { $eq: ['$$paymentId', '$_id'] },
        };

        if (req.body.filters.maxBenefit) {
            matchPayment.rewardAmount = {
                $lte: req.body.filters.maxBenefit,
            };
        }

        const orders = await Order.aggregate([
            {
                $match: { $and: matchOrderFilters },
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
                    $and: [
                        {
                            'status.name': {
                                $ne: 'success',
                            },
                        },
                        {
                            'status.name': {
                                $ne: 'cancelled',
                            },
                        },
                    ],
                },
            },
            {
                $skip: req.body.start,
            },
            {
                $limit: req.body.limit,
            },
            {
                $lookup: {
                    from: Payment.collection.name,
                    let: { paymentId: '$paymentId' },
                    pipeline: [
                        {
                            $match: matchPayment,
                        },
                    ],
                    as: 'payment',
                },
            },
            {
                $unwind: '$payment',
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
                $unwind: '$carrier',
            },
            {
                $lookup: {
                    from: Review.collection.name,
                    let: {
                        carrierId: '$carrierId',
                    },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $eq: ['$$carrierId', '$userForId'] },
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
        ]);

        const ordersCount = (
            await Order.aggregate([
                {
                    $match: { $and: matchOrderFilters },
                },
                { $count: 'count' },
            ])
        )[0];

        return res.status(200).send({
            orders: getOrdersOutput(orders),
            count: ordersCount?.count,
        });
    }

    // GETTING RECEIVERS LIST BY FILTERS

    const matchOrderFilters = [
        {
            recieverId: {
                $exists: true,
                $ne: new mongoose.Types.ObjectId(req.body.userId),
            },
            carrierId: { $exists: false },
        },
    ]
        .concat(
            req.body.filters.fromLocation_placeId
                ? ([
                      {
                          fromLocation_placeId:
                              req.body.filters.fromLocation_placeId,
                      },
                  ] as any)
                : []
        )
        .concat(
            req.body.filters.toLocation_placeId
                ? ([{ toLocation: req.body.filters.toLocation_placeId }] as any)
                : []
        )
        .concat(
            req.body.filters.maxWeight
                ? ([
                      {
                          productWeight: {
                              $lte: req.body.filters.maxWeight,
                          },
                      },
                  ] as any)
                : []
        );

    const matchPayment: mongoose.FilterQuery<any> = {
        $expr: { $eq: ['$$paymentId', '$_id'] },
    };

    if (req.body.filters.minBenefit) {
        matchPayment.rewardAmount = {
            $gte: req.body.filters.minBenefit,
        };
    }

    if (req.body.filters.maxPrice) {
        matchPayment.productAmount = {
            $lte: req.body.filters.maxPrice,
        };
    }

    const orders = await Order.aggregate([
        {
            $match: { $and: matchOrderFilters },
        },
        {
            $sort: {
                update_at: -1,
            },
        },
        {
            $skip: req.body.start,
        },
        {
            $limit: req.body.limit,
        },
        {
            $lookup: {
                from: Payment.collection.name,
                let: { paymentId: '$paymentId' },
                pipeline: [
                    {
                        $match: matchPayment,
                    },
                ],
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
            $unwind: '$receiver',
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
                let: {
                    recieverId: '$recieverId',
                },
                pipeline: [
                    {
                        $match: {
                            $expr: { $eq: ['$$recieverId', '$userForId'] },
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

    const ordersCount = (
        await Order.aggregate([
            {
                $match: { $and: matchOrderFilters },
            },
            { $count: 'count' },
        ])
    )[0];

    return res
        .status(200)
        .send({ orders: getOrdersOutput(orders), count: ordersCount?.count });
};

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

    return res.status(200).send({ orders: getOrdersOutput(orders) });
};

export const getOrderById = async (req: Request, res: Response) => {
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

    const outputOrder = getOrdersOutput(orders, true)[0];

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

type IReqSApplyAsCarrier = Request<
    core.ParamsDictionary,
    {},
    {
        userId: string;
        orderId: string;
        fromLocation?: string;
        fromLocation_placeId?: string;
        fromLocationBounds?: IBounds;
        arrivalDate: Date;
    }
>;

export const applyOrderAsCarrier = async (
    req: IReqSApplyAsCarrier,
    res: Response
) => {
    const status = await OrderStatus.findOne({ name: 'inDiscussion' });

    if (!status) {
        return res.status(404).send({ message: 'Status not found!' });
    }

    let fromLocationData =
        req.body.fromLocation && req.body.fromLocationBounds
            ? {
                  fromLocation: req.body.fromLocation,
                  fromLocation_placeId: req.body.fromLocation_placeId,
                  fromLocationPolygon: {
                      type: 'Polygon',
                      coordinates: convertBoundsToPolygon(
                          req.body.fromLocationBounds
                      ),
                  },
              }
            : {};

    const order = await Order.findByIdAndUpdate(
        { _id: req.body.orderId },
        {
            $set: {
                carrierId: req.body.userId,
                ...fromLocationData,
                arrivalDate: req.body.arrivalDate,
                statusId: status._id,
            },
        },
        { new: true, lean: true }
    );

    if (!order) {
        return res.status(404).send({ message: 'Order to apply not found!' });
    }

    global.io.sockets.in(order._id.toString()).emit('new-status');

    await addNewNotification({
        text: notificationText.carrierFound,
        orderId: req.body.orderId,
        userForId: String(order.recieverId),
        notificationType: NotificationType.orderUpdate,
    });

    return res.status(200).send({ orderId: order._id });
};

type IReqSApplyAsReceiver = Request<
    core.ParamsDictionary,
    {},
    {
        userId: string;
        orderId: string;
        productName: string;
        productUri?: string;
        productAmount: number;
        productWeight: number;
        productDescription: string;
    }
>;

export const applyOrderAsReceiver = async (
    req: IReqSApplyAsReceiver,
    res: Response
) => {
    const status = await OrderStatus.findOne({ name: 'inDiscussion' });

    if (!status) {
        return res.status(404).send({ message: 'Status not found!' });
    }

    const order = await Order.findByIdAndUpdate(
        { _id: req.body.orderId },
        {
            $set: {
                recieverId: req.body.userId,
                productName: req.body.productName,
                productUri: req.body.productUri,
                productWeight: req.body.productWeight,
                productDescription: req.body.productDescription,
                statusId: status._id,
            },
        },
        { new: true, lean: true }
    );

    if (!order) {
        return res.status(404).send({ message: 'Order to apply not found!' });
    }

    await Payment.findByIdAndUpdate(
        { _id: order.paymentId },
        {
            $set: {
                productAmount: req.body.productAmount,
            },
        },
        { new: true, lean: true }
    );

    global.io.sockets.in(order._id.toString()).emit('new-status');

    await addNewNotification({
        text: notificationText.recieverFound,
        orderId: req.body.orderId,
        userForId: String(order.carrierId),
        notificationType: NotificationType.orderUpdate,
    });

    return res.status(200).send({ orderId: order._id });
};

export const suggestChangesByCarrier = async (req: Request, res: Response) => {
    const orders = await Order.aggregate([
        {
            $match: {
                $and: [
                    { _id: new mongoose.Types.ObjectId(req.body.orderId) },
                    { byReceiverSuggestedChanges: undefined },
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
                'status.name': 'inDiscussion',
            },
        },
    ]);

    const order = orders[0];

    if (order) {
        if (order.status.name === 'inDiscussion') {
            await Order.findByIdAndUpdate(
                { _id: order._id },
                {
                    $set: {
                        byCarrierSuggestedChanges: req.body.changes,
                    },
                },
                { new: true, lean: true }
            );

            global.io.sockets.in(order._id.toString()).emit('new-status');

            return res.status(200).send({ ok: true });
        }

        const payment = await Payment.findById(order.paymentId);

        if (!payment) {
            return res.status(404).send({ message: 'Payment not found!' });
        }

        await payment.updateOne(
            {
                $set: {
                    productAmount:
                        req.body.changes.productAmount ?? payment.productAmount,
                    rewardAmount:
                        req.body.changes.rewardAmount ?? payment.rewardAmount,
                },
            },
            { new: true, lean: true }
        );

        await Order.findByIdAndUpdate(
            { _id: order._id },
            {
                $set: {
                    arrivalDate:
                        req.body.changes.arrivalDate ?? order.arrivalDate,
                    carrierMaxWeight:
                        req.body.changes.carrierMaxWeight ??
                        order.carrierMaxWeight,
                    fromLocation:
                        req.body.changes.fromLocation ?? order.fromLocation,
                    toLocation:
                        req.body.changes.fromLocation ?? order.toLocation,
                    fromLocation_placeId:
                        req.body.changes.fromLocation_placeId ??
                        order.fromLocation_placeId,
                    fromLocationPolygon: req.body.changes.fromLocationBounds
                        ? {
                              type: 'Polygon',
                              coordinates: convertBoundsToPolygon(
                                  req.body.fromLocationBounds
                              ),
                          }
                        : order.fromLocationPolygon,
                    toLocation_placeId:
                        req.body.changes.toLocation_placeId ??
                        order.toLocation_placeId,
                    toLocationPolygon: req.body.changes.toLocationBounds
                        ? {
                              type: 'Polygon',
                              coordinates: convertBoundsToPolygon(
                                  req.body.toLocationBounds
                              ),
                          }
                        : order.toLocationPolygon,
                    productName:
                        req.body.changes.productName ?? order.productName,
                    productUri: req.body.changes.productUri ?? order.productUri,
                    productDescription:
                        req.body.changes.productDescription ??
                        order.productDescription,
                    productWeight:
                        req.body.changes.productWeight ?? order.productWeight,
                },
            },
            { new: true, lean: true }
        );

        global.io.sockets.in(req.body.orderId).emit('new-status');

        await addNewNotification({
            text: notificationText.newChangesForReview,
            orderId: req.body.orderId,
            userForId: String(order.recieverId),
            notificationType: NotificationType.orderUpdate,
        });

        return res.status(200).send({ ok: true });
    }

    return res.status(401).send({ message: 'Error while updating order!' });
};

export const suggestChangesByReceiver = async (req: Request, res: Response) => {
    const orders = await Order.aggregate([
        {
            $match: {
                $and: [
                    { _id: new mongoose.Types.ObjectId(req.body.orderId) },
                    { byCarrierSuggestedChanges: undefined },
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
                        'status.name': 'inDiscussion',
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
    ]);

    const order = orders[0];

    if (order) {
        if (order.status.name === 'inDiscussion') {
            await Order.findByIdAndUpdate(
                { _id: order._id },
                {
                    $set: {
                        byReceiverSuggestedChanges: req.body.changes,
                        dealConfirmedByCarrier: false,
                        dealConfirmedByReceiver: false,
                    },
                },
                { new: true, lean: true }
            );

            global.io.sockets.in(order._id.toString()).emit('new-status');

            return res.status(200).send({ ok: true });
        }

        const payment = await Payment.findById(order.paymentId);

        if (!payment) {
            return res.status(404).send({ message: 'Payment not found!' });
        }

        await payment.updateOne(
            {
                $set: {
                    productAmount:
                        req.body.changes.productAmount ?? payment.productAmount,
                    rewardAmount:
                        req.body.changes.rewardAmount ?? payment.rewardAmount,
                },
            },
            { new: true, lean: true }
        );

        await Order.findByIdAndUpdate(
            { _id: order._id },
            {
                $set: {
                    arrivalDate:
                        req.body.changes.arrivalDate ?? order.arrivalDate,
                    carrierMaxWeight:
                        req.body.changes.carrierMaxWeight ??
                        order.carrierMaxWeight,
                    fromLocation:
                        req.body.changes.fromLocation ?? order.fromLocation,
                    toLocation:
                        req.body.changes.fromLocation ?? order.toLocation,
                    fromLocation_placeId:
                        req.body.changes.fromLocation_placeId ??
                        order.fromLocation_placeId,
                    fromLocationPolygon: req.body.changes.fromLocationBounds
                        ? {
                              type: 'Polygon',
                              coordinates: convertBoundsToPolygon(
                                  req.body.fromLocationBounds
                              ),
                          }
                        : order.fromLocationPolygon,
                    toLocation_placeId:
                        req.body.changes.toLocation_placeId ??
                        order.toLocation_placeId,
                    toLocationPolygon: req.body.changes.toLocationBounds
                        ? {
                              type: 'Polygon',
                              coordinates: convertBoundsToPolygon(
                                  req.body.toLocationBounds
                              ),
                          }
                        : order.toLocationPolygon,
                    productName:
                        req.body.changes.productName ?? order.productName,
                    productUri: req.body.changes.productUri ?? order.productUri,
                    productDescription:
                        req.body.changes.productDescription ??
                        order.productDescription,
                    productWeight:
                        req.body.changes.productWeight ?? order.productWeight,
                    dealConfirmedByCarrier: false,
                    dealConfirmedByReceiver: false,
                },
            },
            { new: true, lean: true }
        );

        global.io.sockets.in(req.body.orderId).emit('new-status');

        await addNewNotification({
            text: notificationText.newChangesForReview,
            orderId: req.body.orderId,
            userForId: String(order.carrierId),
            notificationType: NotificationType.orderUpdate,
        });

        return res.status(200).send({ ok: true });
    }

    return res.status(401).send({ message: 'Error while updating order!' });
};

export const agreeWithChanges = async (req: Request, res: Response) => {
    const order = await Order.findById(req.body.orderId);

    if (!order) {
        return res.status(404).send({ message: 'Order not found!' });
    }

    const notificationUserForId = order.byReceiverSuggestedChanges
        ? order.recieverId
        : order.carrierId;

    const payment = await Payment.findById(order.paymentId);

    if (!payment) {
        return res.status(404).send({ message: 'Payment not found!' });
    }

    // Inserting changes from suggested to root of Document
    await payment.updateOne(
        {
            $set: {
                productAmount:
                    order.byCarrierSuggestedChanges?.productAmount ??
                    order.byReceiverSuggestedChanges?.productAmount ??
                    payment.productAmount,
                rewardAmount:
                    order.byCarrierSuggestedChanges?.rewardAmount ??
                    order.byReceiverSuggestedChanges?.rewardAmount ??
                    payment.rewardAmount,
            },
        },
        { new: true, lean: true }
    );

    await order.updateOne(
        {
            $set: {
                arrivalDate:
                    order.byCarrierSuggestedChanges?.arrivalDate ??
                    order.byReceiverSuggestedChanges?.arrivalDate ??
                    order.arrivalDate,
                carrierMaxWeight:
                    order.byCarrierSuggestedChanges?.carrierMaxWeight ??
                    order.byReceiverSuggestedChanges?.carrierMaxWeight ??
                    order.carrierMaxWeight,
                fromLocation:
                    order.byCarrierSuggestedChanges?.fromLocation ??
                    order.byReceiverSuggestedChanges?.fromLocation ??
                    order.fromLocation,
                toLocation:
                    order.byCarrierSuggestedChanges?.toLocation ??
                    order.byReceiverSuggestedChanges?.fromLocation ??
                    order.toLocation,
                fromLocation_placeId:
                    order.byCarrierSuggestedChanges?.fromLocation_placeId ??
                    order.byReceiverSuggestedChanges?.fromLocation_placeId ??
                    order.fromLocation_placeId,
                fromLocationPolygon: order.byCarrierSuggestedChanges
                    ?.fromLocationBounds
                    ? {
                          type: 'Polygon',
                          coordinates: convertBoundsToPolygon(
                              order.byCarrierSuggestedChanges.fromLocationBounds
                          ),
                      }
                    : order.byReceiverSuggestedChanges?.fromLocationBounds
                    ? {
                          type: 'Polygon',
                          coordinates: convertBoundsToPolygon(
                              order.byReceiverSuggestedChanges
                                  .fromLocationBounds
                          ),
                      }
                    : order.fromLocationPolygon,
                toLocation_placeId:
                    order.byCarrierSuggestedChanges?.toLocation_placeId ??
                    order.byReceiverSuggestedChanges?.toLocation_placeId ??
                    order.toLocation_placeId,
                toLocationPolygon: order.byCarrierSuggestedChanges
                    ?.toLocationBounds
                    ? {
                          type: 'Polygon',
                          coordinates: convertBoundsToPolygon(
                              order.byCarrierSuggestedChanges.toLocationBounds
                          ),
                      }
                    : order.byReceiverSuggestedChanges?.toLocationBounds
                    ? {
                          type: 'Polygon',
                          coordinates: convertBoundsToPolygon(
                              order.byReceiverSuggestedChanges.toLocationBounds
                          ),
                      }
                    : order.toLocationPolygon,
                productName:
                    order.byCarrierSuggestedChanges?.productName ??
                    order.byReceiverSuggestedChanges?.productName ??
                    order.productName,
                productUri:
                    order.byCarrierSuggestedChanges?.productUri ??
                    order.byReceiverSuggestedChanges?.productUri ??
                    order.productUri,
                productDescription:
                    order.byCarrierSuggestedChanges?.productDescription ??
                    order.byReceiverSuggestedChanges?.productDescription ??
                    order.productDescription,
                productWeight:
                    order.byCarrierSuggestedChanges?.productWeight ??
                    order.byReceiverSuggestedChanges?.productWeight ??
                    order.productWeight,
                byReceiverSuggestedChanges: undefined,
                byCarrierSuggestedChanges: undefined,
            },
        },
        { new: true, lean: true }
    );

    order.byReceiverSuggestedChanges = undefined;
    order.byCarrierSuggestedChanges = undefined;

    await order.save();

    global.io.sockets.in(req.body.orderId).emit('new-status');

    await addNewNotification({
        text: notificationText.changesHasBeenReviewed,
        orderId: req.body.orderId,
        userForId: String(notificationUserForId),
        notificationType: NotificationType.orderUpdate,
    });

    return res.status(200).send({ ok: true });
};

export const disagreeWithChanges = async (req: Request, res: Response) => {
    const order = await Order.findById(req.body.orderId);

    if (!order) {
        return res.status(404).send({ message: 'Order not found!' });
    }

    order.byReceiverSuggestedChanges = undefined;
    order.byCarrierSuggestedChanges = undefined;

    await order.save();

    global.io.sockets.in(order._id.toString()).emit('new-status');

    return res.status(200).send({ ok: true });
};

export const confirmDeal = async (req: Request, res: Response) => {
    const order = await Order.findById(req.body.orderId);

    if (!order) {
        return res.status(404).send({ message: 'Order not found!' });
    }

    const userId = new mongoose.Types.ObjectId(req.body.userId);
    let forUserIdNotification = order.recieverId;

    if (order.recieverId && userId.equals(order.recieverId)) {
        order.dealConfirmedByReceiver = true;
        forUserIdNotification = order.carrierId;
    } else if (order.carrierId && userId.equals(order.carrierId)) {
        order.dealConfirmedByCarrier = true;
    }

    if (order.dealConfirmedByCarrier && order.dealConfirmedByReceiver) {
        const status = await OrderStatus.findOne({ name: 'waitingForPayment' });

        if (!status) {
            return res.status(404).send({ message: 'Status not found!' });
        }

        order.statusId = status._id;
    }

    await order.save();

    await addNewNotification({
        text: notificationText.dealConfirmedByPartner,
        orderId: req.body.orderId,
        userForId: String(forUserIdNotification),
        notificationType: NotificationType.orderUpdate,
    });

    global.io.sockets.in(order._id.toString()).emit('new-status');

    return res.status(200).send({ ok: true });
};

export const confirmPayment = async (req: Request, res: Response) => {
    const status = await OrderStatus.findOne({
        name: 'waitingForPaymentVerification',
    });

    if (!status) {
        return res.status(404).send({ message: 'Status not found' });
    }

    const order = await Order.findByIdAndUpdate(
        { _id: req.body.orderId },
        {
            $set: {
                statusId: status._id,
            },
        },
        { new: true, lean: true }
    );

    if (!order) {
        return res.status(404).send({ message: 'Order not found!' });
    }

    global.io.sockets.in(order._id.toString()).emit('new-status');

    await addNewNotification({
        text: notificationText.paymentVerification,
        orderId: req.body.orderId,
        userForId: String(order.carrierId),
        notificationType: NotificationType.orderUpdate,
    });

    return res.status(200).send({ ok: true });
};

export const completeOrder = async (req: Request, res: Response) => {
    const status = await OrderStatus.findOne({
        name: 'itemRecieved',
    });

    if (!status) {
        return res.status(404).send({ message: 'Status not found' });
    }

    const order = await Order.findByIdAndUpdate(
        { _id: req.body.orderId },
        {
            $set: {
                statusId: status._id,
                completedDate: new Date(),
            },
        },
        { new: true, lean: true }
    );

    if (!order) {
        return res.status(404).send({ message: 'Order not found!' });
    }

    global.io.sockets.in(order._id.toString()).emit('new-status');

    return res.status(200).send({ ok: true });
};

export const cancelOrder = async (req: Request, res: Response) => {
    const status = await OrderStatus.findOne({
        name: 'cancelled',
    });

    if (!status) {
        return res.status(404).send({ message: 'Status not found' });
    }

    const order = await Order.findByIdAndUpdate(
        { _id: req.body.orderId },
        {
            $set: {
                statusId: status._id,
            },
        },
        { new: true, lean: true }
    );

    if (!order) {
        return res.status(404).send({ message: 'Order not found!' });
    }

    global.io.sockets.in(order._id.toString()).emit('new-status');

    return res.status(200).send({ ok: true });
};

/*
    Отказ от заказа для того кто присоединился или для создателя
*/
export const declineOrder = async (req: Request, res: Response) => {
    const order = await Order.findById(req.body.orderId);

    if (!order) {
        return res.status(404).send({ message: 'Order not found!' });
    }

    const isCarrierCreator = order.carrierId?.equals(order.creatorId);

    const status = await OrderStatus.findOne({
        name: isCarrierCreator ? 'waitingReviever' : 'waitingCarrier',
    });

    if (!status) {
        return res.status(404).send({ message: 'Status not found' });
    }

    if (isCarrierCreator) {
        await order.updateOne(
            {
                $set: {
                    statusId: status._id,
                },
                $unset: {
                    recieverId: 1,
                },
            },
            { new: true, lean: true }
        );
    } else {
        await order.updateOne(
            {
                $set: {
                    statusId: status._id,
                },
                $unset: {
                    carrierId: 1,
                },
            },
            { new: true, lean: true }
        );
    }

    order.save();

    await addNewNotification({
        text: notificationText.searchingForANewPartner,
        orderId: req.body.orderId,
        userForId: order.creatorId.toString(),
        notificationType: NotificationType.orderUpdate,
    });

    global.io.sockets.in(order._id.toString()).emit('new-status');

    return res.status(200).send({ ok: true });
};

export const startPayout = async (req: Request, res: Response) => {
    const status = await OrderStatus.findOne({
        name: 'awaitingPayout',
    });

    if (!status) {
        return res.status(404).send({ message: 'Status not found' });
    }

    const order = await Order.findByIdAndUpdate(
        { _id: req.body.orderId },
        {
            $set: {
                statusId: status._id,
                payoutInfo: {
                    phoneNumber: req.body.phoneNumber,
                    bank: req.body.bank,
                },
            },
        },
        { new: true, lean: true }
    );

    if (!order) {
        return res.status(404).send({ message: 'Order not found!' });
    }

    global.io.sockets.in(order._id.toString()).emit('new-status');

    return res.status(200).send({ ok: true });
};
