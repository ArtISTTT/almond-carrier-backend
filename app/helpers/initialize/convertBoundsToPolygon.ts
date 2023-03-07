import { IBounds, IPolygon } from '../../types/geometry';

export const convertBoundsToPolygon = (bounds: IBounds): IPolygon => {
    return [
        [
            [bounds.northeast.lng, bounds.northeast.lat],
            [bounds.northeast.lng, bounds.southwest.lat],
            [bounds.southwest.lng, bounds.southwest.lat],
            [bounds.southwest.lng, bounds.northeast.lat],
            [bounds.northeast.lng, bounds.northeast.lat],
        ],
    ];
};
