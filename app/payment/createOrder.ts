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
};

export const createOrderForPayment = async ({
    amount,
    orderId,
    productName,
}: ICreateOrderForPayment) => {
    const currency = 643;
    const sector = process.env.PAYGINE_SECTOR_ID as string;
    const password = process.env.PAYGINE_PASSWORD as string;
    const signatureString =
        sector + amount.toString() + currency.toString() + password;
    const md5String = md5(signatureString, {
        encoding: 'UTF-8',
    });
    const signature = Buffer.from(md5String).toString('base64');

    console.log({
        sector,
        reference: orderId,
        amount,
        currency,
        description: productName,
        signature,
    });

    const info = new URLSearchParams();
    info.append('sector', sector);
    info.append('reference', orderId);
    info.append('amount', amount.toString());
    info.append('currency', currency.toString());
    info.append('description', productName);
    info.append('signature', signature);

    try {
        const data = await axios.post(
            process.env.PAYGINE_URI + 'webapi/Register',
            undefined,
            {
                params: {
                    signature,
                    sector,
                    amount,
                    reference: orderId,
                    currency,
                    description: productName,
                },
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            }
        );

        console.log(data);
    } catch (e) {
        console.log(e);
    }
};
