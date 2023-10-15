import { COMISSIONS } from './consts';

const {
    OUR_PAYMENT_COMISSION,
    QIWI_PAYMENT_COMISSION,
    QIWI_RUB_PAYMENT_COMISSION,
} = COMISSIONS;

export const getOrderPaymentSum = ({
    productAmount,
    rewardAmount,
}: {
    productAmount: number;
    rewardAmount: number;
}) =>
    Math.ceil(
        (productAmount + rewardAmount) *
            (1 + QIWI_PAYMENT_COMISSION) *
            (1 + OUR_PAYMENT_COMISSION) +
            QIWI_RUB_PAYMENT_COMISSION
    );

export const getFee = ({
    productAmount,
    rewardAmount,
}: {
    productAmount: number;
    rewardAmount: number;
}) =>
    Math.ceil(
        getOrderPaymentSum({
            productAmount,
            rewardAmount,
        }) -
            productAmount -
            rewardAmount
    );

export const getPureSummary = ({
    productAmount,
    rewardAmount,
}: {
    productAmount: number;
    rewardAmount: number;
}) => Math.ceil(productAmount + rewardAmount);
