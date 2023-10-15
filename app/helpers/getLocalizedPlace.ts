import axios from 'axios';
import { Request, Response } from 'express';

export const getGoogleLozalizedName = async (
    place_id: string,
    language: string
) =>
    await axios
        .get('https://maps.googleapis.com/maps/api/place/details/json', {
            headers: {
                'Content-Type': 'application/json',
            },
            withCredentials: true,
            params: {
                place_id,
                key: 'AIzaSyDTDQ8q7QaBnBfDNHzYTAe7eNt34l-bUis',
                language,
                fields: 'formatted_address',
            },
        })
        .then(data => data.data.result.formatted_address)
        .catch(err => undefined);
