import { Request, Response } from 'express';
import mongoose from 'mongoose';
import db from '../models';
import * as core from 'express-serve-static-core';
import { getOrdersOutput } from '../services/getOrdersOutput';

const User = db.user;
const Order = db.order;
const OrderStatus = db.orderStatus;
const Payment = db.payment;

type IReqCreateOrderAsCarrier = Request<
    core.ParamsDictionary,
    {},
    {
        rewardAmount: number;
        currency: string;
        userId: string;
        fromLocation: string;
        fromLocation_placeId: string;
        toLocation: string;
        toLocation_placeId: string;
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
        carrierId: req.body.userId,
        statusId: status?._id,
        paymentId: payment._id,
        fromLocation: req.body.fromLocation,
        toLocation: req.body.toLocation,
        fromLocation_placeId: req.body.fromLocation_placeId,
        toLocation_placeId: req.body.toLocation_placeId,
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
        fromLocation?: string;
        fromLocation_placeId?: string;
        productName: string;
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
        recieverId: req.body.userId,
        statusId: status?._id,
        paymentId: payment._id,
        fromLocation: req.body.fromLocation,
        toLocation: req.body.toLocation,
        fromLocation_placeId: req.body.fromLocation_placeId,
        toLocation_placeId: req.body.toLocation_placeId,
        productName: req.body.productName,
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
    fromLocation?: string;
    toLocation?: string;
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
                req.body.filters.fromLocation
                    ? ([{ fromLocation: req.body.filters.fromLocation }] as any)
                    : []
            )
            .concat(
                req.body.filters.toLocation
                    ? ([{ toLocation: req.body.filters.toLocation }] as any)
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

        return res.status(200).send({ orders: getOrdersOutput(orders) });
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
            req.body.filters.fromLocation
                ? ([{ fromLocation: req.body.filters.fromLocation }] as any)
                : []
        )
        .concat(
            req.body.filters.toLocation
                ? ([{ toLocation: req.body.filters.toLocation }] as any)
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
    ]);

    return res.status(200).send({ orders: getOrdersOutput(orders) });
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

    return res.status(200).send({ order: getOrdersOutput(orders, true)[0] });
};

type IReqSApplyAsCarrier = Request<
    core.ParamsDictionary,
    {},
    {
        userId: string;
        orderId: string;
        fromLocation?: string;
        fromLocation_placeId?: string;
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

    let fromLocationData = req.body.fromLocation
        ? {
              fromLocation: req.body.fromLocation,
              fromLocation_placeId: req.body.fromLocation_placeId,
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

    return res.status(200).send({ orderId: order._id });
};

type IReqSApplyAsReceiver = Request<
    core.ParamsDictionary,
    {},
    {
        userId: string;
        orderId: string;
        productName: string;
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

    global.io.sockets.in(order._id.toString()).emit('new-status');

    await Payment.findByIdAndUpdate(
        { _id: order.paymentId },
        {
            $set: {
                productAmount: req.body.productAmount,
            },
        },
        { new: true, lean: true }
    );

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
                    toLocation_placeId:
                        req.body.changes.toLocation_placeId ??
                        order.toLocation_placeId,
                    productName:
                        req.body.changes.productName ?? order.productName,
                    productDescription:
                        req.body.changes.productDescription ??
                        order.productDescription,
                    productWeight:
                        req.body.changes.productWeight ?? order.productWeight,
                },
            },
            { new: true, lean: true }
        );

        global.io.sockets.in(order._id.toString()).emit('new-status');

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
                    toLocation_placeId:
                        req.body.changes.toLocation_placeId ??
                        order.toLocation_placeId,
                    productName:
                        req.body.changes.productName ?? order.productName,
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

        global.io.sockets.in(order._id.toString()).emit('new-status');

        return res.status(200).send({ ok: true });
    }

    return res.status(401).send({ message: 'Error while updating order!' });
};

export const agreeWithChanges = async (req: Request, res: Response) => {
    const order = await Order.findById(req.body.orderId);

    if (!order) {
        return res.status(404).send({ message: 'Order not found!' });
    }

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
                toLocation_placeId:
                    order.byCarrierSuggestedChanges?.toLocation_placeId ??
                    order.byReceiverSuggestedChanges?.toLocation_placeId ??
                    order.toLocation_placeId,
                productName:
                    order.byCarrierSuggestedChanges?.productName ??
                    order.byReceiverSuggestedChanges?.productName ??
                    order.productName,
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

    global.io.sockets.in(order._id.toString()).emit('new-status');

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

    if (order.recieverId && userId.equals(order.recieverId)) {
        order.dealConfirmedByReceiver = true;
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

    global.io.sockets.in(order._id.toString()).emit('new-status');

    return res.status(200).send({ ok: true });
};

export const confirmPayment = async (req: Request, res: Response) => {
    const status = await OrderStatus.findOne({
        name: 'awaitingDelivery',
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

    await Order.findByIdAndUpdate(
        { _id: order?.paymentId },
        {
            $set: {
                isPayed: true,
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

export const completeOrder = async (req: Request, res: Response) => {
    const status = await OrderStatus.findOne({
        name: 'success',
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
