import axios from 'axios';
import { Request, Response } from 'express';

export const getGoogleLozalizedName = (place_id: string, language: string) =>
    axios
        .get(`https://maps.googleapis.com/maps/api/place/details/json`, {
            headers: {
                'Content-Type': 'application/json',
            },
            withCredentials: true,
            params: {
                place_id: place_id,
                key: 'AIzaSyDTDQ8q7QaBnBfDNHzYTAe7eNt34l-bUis',
                language: language,
                fields: 'formatted_address',
            },
        })
        .then(data => {
            return data.data.result.formatted_address;
        })
        .catch(err => {
            return undefined;
        });
