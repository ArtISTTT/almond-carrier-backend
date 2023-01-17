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
                name: 'waitingReciever',
            }).save(handleSave('waitingReviever'));

            new Status({
                name: 'waitingCarrier',
            }).save(handleSave('waitingCarrier'));

            new Status({
                name: 'inDiscussion',
            }).save(handleSave('inDiscussion'));
            new Status({
                name: 'waitingForPayment',
            }).save(handleSave('waitingForPayment'));
            new Status({
                name: 'waitingForPaymentVerification',
            }).save(handleSave('waitingForPaymentVerification'));
            new Status({
                name: 'awaitingDelivery',
            }).save(handleSave('awaitingDelivery'));
            new Status({
                name: 'confirmedByCarrier',
            }).save(handleSave('confirmedByCarrier'));
            new Status({
                name: 'confirmedByReciever',
            }).save(handleSave('confirmedByReciever'));
            new Status({
                name: 'success',
            }).save(handleSave('success'));
            new Status({
                name: 'cancelled',
            }).save(handleSave('cancelled'));
        }
    });
};
