import { getGoogleLozalizedName } from '../helpers/getLocalizedPlace';
import { getFee, getOrderPaymentSum } from '../helpers/getOrderPaymentSum';

export const getOrdersOutput = async (
    orders: any[],
    language: string,
    addFullInfo?: true
) =>
    await Promise.all(
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
                      beforePurchaseItemFiles: order.beforePurchaseItemFiles,
                      paymentOrderId: order.payment.paymentOrderId,
                      paymentOperationId: order.payment.paymentOperationId,
                      payoutOrderId: order.payment.payoutOrderId,
                      sdRef: order.payment.sdRef,
                      paymentUrl: order.payment.paymentUrl,
                      totalPaymentAmount:
                          order.payment.rewardAmount !== undefined &&
                          order.payment.productAmount !== undefined
                              ? getOrderPaymentSum({
                                    rewardAmount: order.payment.rewardAmount,
                                    productAmount: order.payment.productAmount,
                                    paymentPaySystemComission:
                                        order.payment.paymentPaySystemComission,
                                    ourPaymentComission:
                                        order.payment.ourPaymentComission,
                                })
                              : undefined,
                      totalPaymentFee:
                          order.payment.rewardAmount !== undefined &&
                          order.payment.productAmount !== undefined
                              ? getFee({
                                    rewardAmount: order.payment.rewardAmount,
                                    productAmount: order.payment.productAmount,
                                    paymentPaySystemComission:
                                        order.payment.paymentPaySystemComission,
                                    ourPaymentComission:
                                        order.payment.ourPaymentComission,
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
