import axios from 'axios';
import { Request, Response } from 'express';

export const getGoogleLozalizedName = (req: Request, res: Response) =>
    axios
        .get(`https://maps.googleapis.com/maps/api/place/details/json`, {
            headers: {
                'Content-Type': 'application/json',
            },
            withCredentials: true,
            params: {
                place_id: req.query.place_id,
                key: 'AIzaSyDTDQ8q7QaBnBfDNHzYTAe7eNt34l-bUis',
                language: req.query.language,
                fields: 'formatted_address',
            },
        })
        .then(data => {
            return res.status(200).send({
                address: data.data.result.formatted_address,
            });
        })
        .catch(err => {
            return res.status(500).send();
        });
