import { ApiClient } from 'adminjs';
import axios from 'axios';
import React, { useEffect, useState } from 'react';

const api = new ApiClient();

const LogViewer: React.FC = () => {
    const [logContent, setLogContent] = useState('');

    useEffect(() => {
        const fetchLog = async () => {
            try {
                const response = await api.getDashboard();
                setLogContent(response.data.logs);
            } catch (error) {
                console.error('Failed to fetch the log:', error);
            }
        };

        fetchLog();
        const interval = setInterval(fetchLog, 5000); // обновлять каждые 5 секунд

        return () => clearInterval(interval); // Очистить интервал при размонтировании компонента
    }, []);

    return (
        <div
            style={{
                margin: '24px',
            }}
        >
            <h1 style={{ fontSize: 36, fontWeight: '700', marginBottom: 24 }}>
                Last logs
            </h1>
            <div
                style={{
                    borderRadius: '16px',
                    overflow: 'auto',
                    padding: '24px',
                    maxHeight: '500px',
                    background: '#2a3142',
                    color: '#4e9a06',
                }}
            >
                <pre
                    style={{
                        lineHeight: '24px',
                    }}
                >
                    {logContent}
                </pre>
            </div>
        </div>
    );
};

export default LogViewer;
