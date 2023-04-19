import axios from 'axios';
import { encodeBase64 } from 'bcryptjs';
import md5 from 'md5';

const instance = axios.create({
    baseURL: process.env.PAYGINE_URI,
    headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
    },
});

type ICreateOrderForPayment = {
    amount: number;
    orderId: string;
    productName: string;
    fee: number;
};

export const createOrderForPayment = async ({
    amount,
    fee,
    orderId,
    productName,
}: ICreateOrderForPayment): Promise<string | undefined> => {
    const currency = 643;
    const sector = process.env.PAYGINE_SECTOR_ID as string;
    const password = process.env.PAYGINE_PASSWORD as string;
    const signatureString =
        sector + amount.toString() + currency.toString() + password;
    const md5String = md5(signatureString, {
        encoding: 'UTF-8',
    });
    const signature = Buffer.from(md5String).toString('base64');

    try {
        const data = await axios.post(
            process.env.PAYGINE_URI + 'webapi/Register',
            undefined,
            {
                params: {
                    signature,
                    sector,
                    amount: amount * 100,
                    reference: orderId,
                    currency,
                    description: productName,
                    mode: 1,
                    fee: fee * 100,
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
