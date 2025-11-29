import axios, { AxiosInstance } from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const NEXUS_BASE_URL = process.env.NEXUS_BASE_URL;
const NEXUS_API_KEY = process.env.NEXUS_API_KEY;

if (!NEXUS_BASE_URL || !NEXUS_API_KEY) {
    console.warn('Warning: Nexus environment variables not configured');
}

export const nexusClient: AxiosInstance = axios.create({
    baseURL: NEXUS_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${NEXUS_API_KEY}`
    },
    timeout: 10000
});

export const nexusConfig = {
    baseUrl: NEXUS_BASE_URL,
    apiKey: NEXUS_API_KEY
};
