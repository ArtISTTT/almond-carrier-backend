import axios, { AxiosInstance } from 'axios';
import fs from 'fs';
import { Agent } from 'https';
import logger from '../services/logger';

export let qiwiInstance: undefined | AxiosInstance;

export const initializeInstance = () => {
    const CSR_PATH = process.env.CSR_PATH as string;

    qiwiInstance = axios.create({
        httpsAgent: new Agent({
            key: fs.readFileSync(CSR_PATH + 'qiwi.key'),
            cert: fs.readFileSync(CSR_PATH + 'qiwi.csr'),
        }),
    });

    logger.info(
        'Initialized qiwi instance ' +
            CSR_PATH +
            'qiwi.key ' +
            CSR_PATH +
            'qiwi.csr'
    );

    return qiwiInstance;
};
