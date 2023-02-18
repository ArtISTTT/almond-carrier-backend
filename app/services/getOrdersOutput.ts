export const getOrdersOutput = (orders: any[], addFullInfo?: true) => {
    return orders.map(order => {
        const fullInfo = addFullInfo
            ? {
                  byCarrierSuggestedChanges: order.byCarrierSuggestedChanges,
                  byReceiverSuggestedChanges: order.byReceiverSuggestedChanges,
                  dealConfirmedByCarrier: order.dealConfirmedByCarrier,
                  dealConfirmedByReceiver: order.dealConfirmedByReceiver,
              }
            : {};

        return {
            ...fullInfo,
            status: order.status.name,
            toLocation: order.toLocation,
            fromLocation: order.fromLocation,
            fromLocation_placeId: order.fromLocation_placeId,
            toLocation_placeId: order.toLocation_placeId,
            productName: order.productName,
            productWeight: order.productWeight,
            productDescription: order.productDescription,
            carrierMaxWeight: order.carrierMaxWeight,
            arrivalDate: order.arrivalDate,
            receiver: order.receiver
                ? {
                      id: order.receiver._id,
                      firstName: order.receiver.firstName,
                      lastName: order.receiver.lastName,
                  }
                : undefined,
            carrier: order.carrier
                ? {
                      id: order.carrier._id,
                      firstName: order.carrier.firstName,
                      lastName: order.carrier.lastName,
                  }
                : undefined,
            isPayed: order.payment.isPayed,
            rewardAmount: order.payment.rewardAmount,
            productAmount: order.payment.productAmount,
            id: order._id,
        };
    });
};
