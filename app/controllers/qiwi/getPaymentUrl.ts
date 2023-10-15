import axios from 'axios';
import { createHmac } from 'crypto';
import { ObjectId } from 'mongoose';
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

const getCurrentDatePlusTwoDays = () => {
    const date = new Date();
    date.setDate(date.getDate() + 2);
    return date.toISOString();
};

/**
 * Генерирует HMAC SHA256 подпись для данных.
 */
function generateHMACSignature(params: Params, secretKey: string) {
    const sortedValues = Object.entries(params)
        .sort(([keyA], [keyB]) => keyA.localeCompare(keyB)) // Сортируем по ключам
        .filter(
            ([_, value]) =>
                value !== null && value !== undefined && value !== ''
        )
        .map(([_, value]) => value.toString()); // Приводим все значения к строкам

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
        paymentPaySystemComission: payment.paymentPaySystemComission,
        ourPaymentComission: payment.ourPaymentComission,
    });

    const totalPaymentFee = getFee({
        rewardAmount: payment.rewardAmount,
        productAmount: payment.productAmount,
        paymentPaySystemComission: payment.paymentPaySystemComission,
        ourPaymentComission: payment.ourPaymentComission,
    });

    const data = {
        // amount: orderPaymentSum + '.00',
        // cf2: `${orderPaymentSum - totalPaymentFee}.00; ${
        //                 totalPaymentFee
        // }.00`,
        amount: `${10}.00`,
        callback_url: `${process.env.CALLBACK_URI as string}payment-callback`,
        cf2: '7.00;3.00',
        currency: '643',
        email: user.email,
        merchant_site: process.env.QIWI_MERCHANT_SITE as string,
        opcode: '3',
        order_expire: getCurrentDatePlusTwoDays(),
        order_id: '123456774',
        product_name: order.productName,
        success_url: `${process.env.CALLBACK_URI as string}payment-callback`,
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
};
