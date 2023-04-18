import axios from 'axios';

export const instance = axios.create({
    baseURL: process.env.PAYGINE_API_URI,
    headers: {
        'Content-Type': 'application/json',
    },
});
