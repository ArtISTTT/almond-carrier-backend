import { COMISSIONS } from './consts';

export const getOrderPaymentSum = ({
    productAmount,
    rewardAmount,
    paymentPaySystemComission,
    ourPaymentComission,
}: {
    productAmount: number;
    rewardAmount: number;
    paymentPaySystemComission: number; // 0.035
    ourPaymentComission: number; // 0.05
}) =>
    Math.ceil(
        (productAmount + rewardAmount) *
            (1 + paymentPaySystemComission) *
            (1 + ourPaymentComission)
    );

export const getFee = ({
    productAmount,
    rewardAmount,
    paymentPaySystemComission,
    ourPaymentComission,
}: {
    productAmount: number;
    rewardAmount: number;
    paymentPaySystemComission: number; // 0.035
    ourPaymentComission: number; // 0.05
}) =>
    Math.ceil(
        getOrderPaymentSum({
            productAmount,
            rewardAmount,
            paymentPaySystemComission,
            ourPaymentComission,
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

// export const getOrderPaymentSum = (info: {
//     productAmount: number;
//     rewardAmount: number;
//     paymentCPComission: number; // 0.035
//     dueCPComission: number; // 0.015
//     ourDueComission: number; // 0.05
// }) => {
//     let result = 0;

//     // Сумма товара + доствки для выплаты продавцу
//     const pureTotal = info.productAmount + info.rewardAmount;

//     const cfOurPayout = 1 / (1 - info.ourDueComission);

//     result =
//         pureTotal * cfOurPayout +
//         pureTotal * (cfOurPayout - 1) * info.dueCPComission;

//     // Коэфициент комиссии при выплате
//     // const cfPayout =
//     //     1 / (1 - (info.payoutCPComission + info.ourPayoutComission));

//     if (
//         pureTotal * (cfOurPayout - 1) * info.dueCPComission <=
//         COMISSIONS.DUE_PAYPUT_CP_COMISSION_NUMBER
//     ) {
//         result =
//             pureTotal * cfOurPayout + COMISSIONS.DUE_PAYPUT_CP_COMISSION_NUMBER;
//     } else {
//         result =
//             pureTotal * cfOurPayout +
//             pureTotal * (cfOurPayout - 1) * info.dueCPComission;
//     }

//     // Коэфициент комиссии при оплате
//     const cfPayment = 1 / (1 - info.paymentCPComission);

//     if (
//         result * (1 / (1 - info.paymentCPComission) - 1) <=
//         COMISSIONS.PAYMENT_CP_COMISSION_NUMBER
//     ) {
//         result = result + COMISSIONS.PAYMENT_CP_COMISSION_NUMBER;
//     } else {
//         result = result * cfPayment;
//     }

//     return Math.ceil(result);
// };

// 1. Создается заказ и оплачивается с комиссией 3.5 15000 -> 14000 (стоил заказ 12000)
// 2. Из суммы которая осталась перечисляем без комиссии Отправителю 14000 > 2000
// 3. Из остатка берется комиссия 1.5 процента или 50р и отправляется платежке 2000 -> 1950
// 4. То что остается перечисляется нам на Расчетный счет 1950 -> 0
