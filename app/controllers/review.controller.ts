import { Request, Response } from 'express';
import mongoose from 'mongoose';
import db from '../models';
import * as core from 'express-serve-static-core';
import { getOrdersOutput } from '../services/getOrdersOutput';
import { ReviewerType } from '../types/review';

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
    await Review.create({
        orderId: req.body.orderId,
        userReviewerId: req.body.userId,
        userForId: req.body.userForId,
        reviewerType: req.body.reviewerType,
        text: req.body.text,
        rating: req.body.rating,
    });

    return res.status(200).send({
        message: 'Successful review!',
    });
};

// Получение ревью для пользователя + части заказа (товар, дата, прибыль если есть) + От кого (фотка, имя и фамилия)
