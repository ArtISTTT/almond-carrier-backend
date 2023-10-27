import axios, { AxiosInstance } from 'axios';
import fs from 'fs';
import { Agent } from 'https';

export let qiwiInstance: undefined | AxiosInstance;

export const initializeInstance = () => {
    const CSR_PATH = process.env.CSR_PATH as string;

    qiwiInstance = axios.create({
        httpsAgent: new Agent({
            key: fs.readFileSync(CSR_PATH + 'qiwi.key'),
            cert: fs.readFileSync(CSR_PATH + 'qiwi.csr'),
        }),
    });

    return qiwiInstance;
};
