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

    const order = new Order({
        carrierId: req.body.userId,
        statusId: status?._id,
        paymentId: payment._id,
        fromLocation: req.body.fromLocation,
        toLocation: req.body.toLocation,
        carrierMaxWeight: req.body.carrierMaxWeight,
        arrivalDate: req.body.arrivalDate,
    });

    order.save(err => {
        if (err) {
            res.status(500).send({ message: err });
            return;
        }
    });

    res.status(200).send({
        message: 'Order successfully created!',
        order: {
            id: order._id,
            carrierId: order.carrierId,
            status: status.name,
            rewardAmount: payment.rewardAmount,
            currency: payment.currency,
            fromLocation: order.fromLocation,
            toLocation: order.toLocation,
            carrierMaxWeight: order.carrierMaxWeight,
            arrivalDate: order.arrivalDate,
        },
    });
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
