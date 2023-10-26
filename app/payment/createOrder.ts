import axios from 'axios';
import { encodeBase64 } from 'bcryptjs';
import md5 from 'md5';
import { generateHMACSignature } from '../helpers/generateHMACSignature';

const instance = axios.create({
    baseURL: process.env.PAYGINE_URI,
    headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
    },
});

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

    try {
        const data = await axios.post(
            `${process.env.QIWI_POST_PAY_API}`,
            undefined,
            {
                params: {
                    ...initialData,
                    sign,
                },
            }
        );

        if (data.data.txn_status === 3) {
            return true;
        }

        return false;
    } catch (e) {
        console.log(e);

        return false;
    }
};

interface ICreateOrderForPayout {
    amount: number;
    orderId: string;
    productName: string;
    sdRef: string;
}

export const createOrderForPayout = async ({
    amount,
    orderId,
    productName,
    sdRef,
}: ICreateOrderForPayout): Promise<string | undefined> => {
    const currency = 643;
    const resAmount = amount * 100;

    const sector = process.env.PAYGINE_SECTOR_ID as string;
    const password = process.env.PAYGINE_PASSWORD as string;
    const signatureString =
        sector + resAmount.toString() + currency.toString() + password;
    const md5String = md5(signatureString, {
        encoding: 'UTF-8',
    });
    const signature = Buffer.from(md5String).toString('base64');

    try {
        const data = await axios.post(
            `${process.env.PAYGINE_URI}webapi/Register`,
            undefined,
            {
                params: {
                    signature,
                    sector,
                    amount: resAmount,
                    reference: orderId,
                    currency,
                    description: productName,
                    mode: 1,
                    sd_ref: sdRef,
                },
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            }
        );

        return data.data;
    } catch (e) {
        console.log(e);
    }
};
