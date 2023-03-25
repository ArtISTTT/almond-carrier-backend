import { getGoogleLozalizedName } from '../helpers/getLocalizedPlace';
import { getOrderPaymentSum } from '../helpers/getOrderPaymentSum';

export const getOrdersOutput = (
    orders: any[],
    language: string,
    addFullInfo?: true
) => {
    return Promise.all(
        orders.map(async order => {
            const fullInfo = addFullInfo
                ? {
                      byCarrierSuggestedChanges:
                          order.byCarrierSuggestedChanges,
                      byReceiverSuggestedChanges:
                          order.byReceiverSuggestedChanges,
                      dealConfirmedByCarrier: order.dealConfirmedByCarrier,
                      dealConfirmedByReceiver: order.dealConfirmedByReceiver,
                      payoutInfo: order.payoutInfo,
                      purchaseItemFiles: order.purchaseItemFiles,
                      totalPaymentAmount:
                          order.payment.rewardAmount !== undefined &&
                          order.payment.productAmount !== undefined
                              ? getOrderPaymentSum({
                                    rewardAmount: order.payment.rewardAmount,
                                    productAmount: order.payment.productAmount,
                                    paymentCPComission:
                                        order.payment.paymentCPComission,
                                    dueCPComission:
                                        order.payment.dueCPComission,
                                    ourDueComission:
                                        order.payment.ourDueComission,
                                })
                              : undefined,
                  }
                : {};

            return {
                ...fullInfo,
                createdDate: order.createdAt,
                status: order.status.name,
                toLocation: order.toLocation
                    ? await getGoogleLozalizedName(
                          order.toLocation_placeId,
                          language
                      )
                    : order.toLocation,
                fromLocation: order.fromLocation
                    ? await getGoogleLozalizedName(
                          order.fromLocation_placeId,
                          language
                      )
                    : order.fromLocation,
                fromLocation_placeId: order.fromLocation_placeId,
                toLocation_placeId: order.toLocation_placeId,
                productName: order.productName,
                productUri: order.productUri,
                productWeight: order.productWeight,
                productDescription: order.productDescription,
                carrierMaxWeight: order.carrierMaxWeight,
                arrivalDate: order.arrivalDate,
                receiver: order.receiver
                    ? {
                          id: order.receiver._id,
                          firstName: order.receiver.firstName,
                          lastName: order.receiver.lastName,
                          rating: order.recieverRating?.averageRating,
                          avatar: order.receiver.avatarImage,
                      }
                    : undefined,
                carrier: order.carrier
                    ? {
                          id: order.carrier._id,
                          firstName: order.carrier.firstName,
                          lastName: order.carrier.lastName,
                          rating: order.carrierRating?.averageRating,
                          avatar: order.carrier.avatarImage,
                      }
                    : undefined,
                creatorId: order.creatorId,
                isPayed: order.payment.isPayed,
                rewardAmount: order.payment.rewardAmount,
                productAmount: order.payment.productAmount,
                id: order._id,
            };
        })
    );
};
