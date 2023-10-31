import axios, { AxiosError, AxiosInstance, AxiosResponse } from 'axios';
import { encodeBase64 } from 'bcryptjs';
import fs from 'fs';
import { Agent } from 'https';
import md5 from 'md5';
import { generateHMACSignature } from '../helpers/generateHMACSignature';
import { getFee, getOrderPaymentSum } from '../helpers/getOrderPaymentSum';
import { ICard } from '../models/card.model';
import { IOrder } from '../models/order.model';
import { IPayment } from '../models/payment.model';
import logger from '../services/logger';
import { initializeInstance, qiwiInstance } from './qiwiInstance';

interface ICompleteOrderForPayment {
    txnId: string;
}

export const completeOrderForPayment = async ({
    txnId,
}: ICompleteOrderForPayment) => {
    const initialData = {
        opcode: 5,
        merchant_site: process.env.QIWI_MERCHANT_SITE,
        txn_id: txnId,
    };

    const sign = generateHMACSignature(
        initialData,
        process.env.QIWI_SECRET_KEY as string
    );

    if (!qiwiInstance) {
        initializeInstance();
    }

    try {
        const data = await axios.post(`${process.env.QIWI_POST_PAY_API}`, {
            ...initialData,
            sign,
        });

        logger.info(
            'Completed authorized payment data: ' + JSON.stringify(data.data)
        );

        if (data.data.txn_status === 3) {
            return true;
        }

        return false;
    } catch (e: any) {
        const response = (e as AxiosError).response as AxiosResponse;
        logger.error(
            'Could not complete payment error: ' + 'data: ' + response.data,
            'status: ' + response.status,
            'headers: ' + response.headers
        );

        return false;
    }
};

interface ICreateOrderForPayout {
    order: IOrder;
    payment: IPayment;
    card: ICard;
}

export const createOrderForPayout = async ({
    order,
    payment,
    card,
}: ICreateOrderForPayout): Promise<boolean> => {
    if (!payment.productAmount || !order.productName || !payment.txnId) {
        return false;
    }

    const orderPaymentSum = getOrderPaymentSum({
        rewardAmount: payment.rewardAmount,
        productAmount: payment.productAmount,
    });

    const totalPaymentFee = getFee({
        rewardAmount: payment.rewardAmount,
        productAmount: payment.productAmount,
    });

    const initialData = {
        opcode: 20,
        merchant_site: process.env.QIWI_MERCHANT_SITE,
        txn_id: payment.txnId,
        currency: '643',
        card_token: card.token,
        order_id: order._id,
        amount: orderPaymentSum - totalPaymentFee + '.00',
    };

    const sign = generateHMACSignature(
        initialData,
        process.env.QIWI_SECRET_KEY as string
    );

    if (!qiwiInstance) {
        initializeInstance();
    }

    try {
        const data = await axios.post(`${process.env.QIWI_POST_PAY_API}`, {
            ...initialData,
            sign,
        });

        logger.info('PAYOUT RETURN DATA: ', data.data);

        if (data.data.txn_status === 3) {
            return true;
        }

        return false;
    } catch (e) {
        console.log(e);

        return false;
    }
};
