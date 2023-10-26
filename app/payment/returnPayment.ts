import axios from 'axios';
import { generateHMACSignature } from '../helpers/generateHMACSignature';

interface ICompleteOrderForPayment {
    txnId: string;
}

export const returnAuthorizedPayment = async ({
    txnId,
}: ICompleteOrderForPayment) => {
    const initialData = {
        opcode: 6,
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

        if (data.data.txn_status === 6) {
            return true;
        }

        return false;
    } catch (e) {
        console.log(e);

        return false;
    }
};
