import { Router } from 'express';
import fs from 'fs';
import path from 'path';

const dashboardHandler = async () => {
    const logPath = path.join(__dirname, '../../..', 'server.log');
    const content = await fs.promises.readFile(logPath, 'utf-8');

    return { logs: content };
};

export default dashboardHandler;
