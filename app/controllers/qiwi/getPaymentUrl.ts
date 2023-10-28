import axios from 'axios';
import { createHmac } from 'crypto';
import moment from 'moment';
import { ObjectId } from 'mongoose';
import { agendaInstance } from '../../db/agenda';
import { getFee, getOrderPaymentSum } from '../../helpers/getOrderPaymentSum';
import { IOrder, OrderModel } from '../../models/order.model';
import { IPayment } from '../../models/payment.model';
import { IUser } from '../../models/user.model';
import logger from '../../services/logger';

interface Params {
    amount: string;
    cf2: string;
    currency: string;
    email: string;
    merchant_site: string;
    merchant_uid: string;
    opcode: string;
    order_id: string;
    success_url: string;
    product_name: string;
}

// Get redirect link
const MAX_REDIRECTS = 5;

const requestConfig = {
    maxRedirects: MAX_REDIRECTS, // Define how many redirects axios should follow
};

const getRedirectedUrl = async (
    startUrl: string
): Promise<string | undefined> => {
    try {
        const response = await axios.get(startUrl, requestConfig);
        return response.request.res.responseUrl;
    } catch (error) {
        logger.error(
            '[getRedirectedUrl]: Error while trying to find payment redirect url: ',
            error
        );
        return undefined;
    }
};

const getCurrentDatePlusTwoDays = (): {
    date: Date;
    stringDate: string;
} => {
    const now = moment();

    const date = now.add(2, 'days').toDate();

    return { date, stringDate: date.toISOString() };
};

const getCurrentDatePlusSixHours = (): {
    date: Date;
    stringDate: string;
} => {
    const now = moment();

    const date = now.add(6, 'hours').toDate();

    return { date, stringDate: date.toISOString() };
};

/**
 * Генерирует HMAC SHA256 подпись для данных.
 */
function generateHMACSignature(params: Params | any, secretKey: string) {
    logger.info('[generateHMACSignature]: params: ', params);
    const sortedValues = Object.entries(params)
        .sort(([keyA], [keyB]) => keyA.localeCompare(keyB)) // Сортируем по ключам
        .filter(
            ([_, value]) =>
                value !== null && value !== undefined && value !== ''
        )
        .map(([_, value]) => (value as any).toString()); // Приводим все значения к строкам

    // Объединяем значения с использованием разделителя '|'
    const dataToSign = sortedValues.join('|');

    // Создаем HMAC подпись
    const hmac = createHmac('sha256', secretKey);
    hmac.update(dataToSign);
    return hmac.digest('hex');
}

export const getPaymentUrl = async (
    order: IOrder,
    payment: IPayment & { _id: ObjectId },
    user: IUser
) => {
    if (!payment.productAmount || !order.productName) {
        return;
    }

    const orderPaymentSum = getOrderPaymentSum({
        rewardAmount: payment.rewardAmount,
        productAmount: payment.productAmount,
    });

    const totalPaymentFee = getFee({
        rewardAmount: payment.rewardAmount,
        productAmount: payment.productAmount,
    });

    const paymentExpire = getCurrentDatePlusSixHours();

    agendaInstance.schedule('in 6 hours', 'cancelOrder', {
        orderId: order._id,
    });

    const data = {
        // amount: orderPaymentSum + '.00',
        // cf2: `${orderPaymentSum - totalPaymentFee}.00; ${
        //                                 totalPaymentFee
        // }.00`,
        amount: `${10}.00`,
        callback_url: `${process.env.CALLBACK_URI as string}payment-callback`,
        cf2: '7.00;3.00',
        currency: '643',
        email: user.email,
        merchant_site: process.env.QIWI_MERCHANT_SITE as string,
        merchant_uid: user._id,
        opcode: '3',
        order_expire: paymentExpire.stringDate,
        order_id: order._id,
        product_name: order.productName,
        success_url: `https://friendlycarrier.com/order/${order._id}`,
    };

    const signature = generateHMACSignature(
        data,
        process.env.QIWI_SECRET_KEY as string
    );

    const urlParams = new URLSearchParams({
        ...data,
        sign: signature,
    });

    const url = `${`${process.env.QIWI_PAY_API}paypage/initial?`}${urlParams.toString()}`;

    const paymentUrl = await getRedirectedUrl(url);

    return { paymentUrl, paymentExpire: paymentExpire.date };
};

const generateRandom12DigitsId = () => {
    const id = Math.floor(Math.random() * 1000000000000);

    return id;
};

export const getCardSaveUrl = async (user: IUser) => {
    try {
        const paymentExpire = getCurrentDatePlusSixHours();

        const data = {
            amount: `10.00`,
            callback_url: `${
                process.env.CALLBACK_URI as string
            }payment-callback`,
            cf2: '7.00;3.00',
            cf4: 'CARD_SAVE',
            cf5: String(user._id),
            currency: '643',
            email: user.email,
            merchant_site: process.env.QIWI_MERCHANT_SITE as string,
            merchant_uid: String(user._id),
            opcode: '3',
            order_expire: paymentExpire.stringDate,
            order_id: generateRandom12DigitsId().toString(),
            success_url: `https://friendlycarrier.com/payouts`,
        };

        const signature = generateHMACSignature(
            data,
            process.env.QIWI_SECRET_KEY as string
        );

        const urlParams = new URLSearchParams({
            ...data,
            sign: signature,
        });

        const url = `${`${process.env.QIWI_PAY_API}paypage/initial?`}${urlParams.toString()}`;

        const paymentUrl = await getRedirectedUrl(url);

        return paymentUrl;
    } catch (error) {
        logger.error(
            '[getCardSaveUrl]: Error while trying to get card save url: ',
            error
        );

        return undefined;
    }
};
