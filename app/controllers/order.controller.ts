import { Request, Response } from 'express';
import mongoose from 'mongoose';
import db from '../models';
import * as core from 'express-serve-static-core';

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
        toLocation: string;
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
        fromLocation?: string;
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

    if (req.body.type === OrderSeachType.carriers) {
        const andFiltersArray = [
            { carrierId: { $exists: true, $ne: req.body.userId } },
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

        for await (const order of Order.find({
            recieverId: { $exists: false },
            $and: andFiltersArray,
        })) {
            const status = await OrderStatus.findById(order.statusId);

            if (!status) {
                return res.status(404).send({ message: 'Status not found!' });
            }

            const payment = await Payment.findById(order.paymentId);

            if (!payment) {
                return res.status(404).send({ message: 'Payment not found!' });
            }

            if (
                req.body.filters.maxBenefit &&
                req.body.filters.maxBenefit > (payment.rewardAmount as number)
            ) {
                continue;
            }

            const item = {
                status: status.name,
                toLocation: order.toLocation,
                fromLocation: order.fromLocation,
                productName: order.productName,
                rewardAmount: payment.rewardAmount,
                productAmount: payment.productAmount,
                productWeight: order.productWeight,
                productDescription: order.productDescription,
                carrierMaxWeight: order.carrierMaxWeight,
                arrivalDate: order.arrivalDate,
                isPayed: payment.isPayed,
                id: order._id,
            };
            ordersList.push(item);
        }
    } else {
        const andFiltersArray = [
            { recieverId: { $exists: true, $ne: req.body.userId } },
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

        for await (const order of Order.find({
            carrierId: { $exists: false },
            $and: andFiltersArray,
        })) {
            const status = await OrderStatus.findById(order.statusId);

            if (!status) {
                return res.status(404).send({ message: 'Status not found!' });
            }

            const payment = await Payment.findById(order.paymentId);

            if (!payment) {
                return res.status(404).send({ message: 'Payment not found!' });
            }

            if (
                req.body.filters.minBenefit &&
                req.body.filters.minBenefit < (payment.rewardAmount as number)
            ) {
                continue;
            }

            if (
                req.body.filters.maxPrice &&
                req.body.filters.maxPrice < (payment.productAmount as number)
            ) {
                continue;
            }

            const item = {
                status: status.name,
                toLocation: order.toLocation,
                fromLocation: order.fromLocation,
                productName: order.productName,
                rewardAmount: payment.rewardAmount,
                productAmount: payment.productAmount,
                productWeight: order.productWeight,
                productDescription: order.productDescription,
                carrierMaxWeight: order.carrierMaxWeight,
                arrivalDate: order.arrivalDate,
                isPayed: payment.isPayed,
                id: order._id,
            };
            ordersList.push(item);
        }
    }

    return res.status(200).send({ orders: ordersList });
};

export const getMyOrders = async (req: Request, res: Response) => {
    const ordersList = [];

    for await (const order of Order.find({
        $or: [{ carrierId: req.body.userId }, { recieverId: req.body.userId }],
    })) {
        const status = await OrderStatus.findById(order.statusId);

        if (!status) {
            return res.status(404).send({ message: 'Status not found!' });
        }

        const payment = await Payment.findById(order.paymentId);

        if (!payment) {
            return res.status(404).send({ message: 'Payment not found!' });
        }

        const item = {
            status: status.name,
            toLocation: order.toLocation,
            fromLocation: order.fromLocation,
            productName: order.productName,
            rewardAmount: payment.rewardAmount,
            productAmount: payment.productAmount,
            productWeight: order.productWeight,
            productDescription: order.productDescription,
            carrierMaxWeight: order.carrierMaxWeight,
            arrivalDate: order.arrivalDate,
            isPayed: payment.isPayed,
            id: order._id,
        };
        ordersList.push(item);
    }

    return res.status(200).send({ orders: ordersList });
};
