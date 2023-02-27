import db from '../../models';

const Status = db.orderStatus;

const handleSave = (name: string) => {
    return (err: any) => {
        if (err) {
            console.log('error', err);
        }

        console.log(`added ${name} to status collection`);
    };
};

export const initializeOrderStatuses = () => {
    Status.estimatedDocumentCount((err: any, count: any) => {
        if (!err && count === 0) {
            new Status({
                // Заказ отменен
                name: 'cancelled',
            }).save(handleSave('cancelled'));

            new Status({
                // Ожидание отклика от получятеля
                name: 'waitingReciever',
            }).save(handleSave('waitingReviever'));

            new Status({
                // Ожидание отклика от доставщика
                name: 'waitingCarrier',
            }).save(handleSave('waitingCarrier'));

            new Status({
                // В обсуждении деталей
                name: 'inDiscussion',
            }).save(handleSave('inDiscussion'));

            new Status({
                // В ожидании оплаты от получателя
                name: 'waitingForPayment',
            }).save(handleSave('waitingForPayment'));

            new Status({
                // В ожидании ПОДТВЕРЖДЕНИЯ ОТ АДМИНА оплаты от получателя
                name: 'waitingForPaymentVerification',
            }).save(handleSave('waitingForPaymentVerification'));

            new Status({
                // В процессе доставки
                name: 'awaitingDelivery',
            }).save(handleSave('awaitingDelivery'));

            new Status({
                // Товар получен получателем (передан отправителем) В этот момент показывается окно для ввода данных выплаты
                // Для Получателя ВСЕ ЧТО ДАЛЬШЕ - SUCCESS. Тк предмет получен
                name: 'itemRecieved',
            }).save(handleSave('itemRecieved'));

            new Status({
                // Ожидание выплаты от Админа
                name: 'awaitingPayout',
            }).save(handleSave('awaitingPayout'));

            new Status({
                // После выплаты от АДМИНА - заказ полностью завершен
                name: 'success',
            }).save(handleSave('success'));
        }
    });
};
