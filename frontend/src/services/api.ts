import axios, { AxiosInstance } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const apiClient: AxiosInstance = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 10000,
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('oria_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('oria_token');
            localStorage.removeItem('oria_user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

interface SignupData {
    email: string;
    password: string;
    username?: string;
    name?: string;
    pin?: string;
}

interface LoginData {
    email: string;
    password: string;
}

// Auth API
export const authAPI = {
    signup: (data: SignupData) => apiClient.post('/auth/signup', data),
    login: (data: LoginData) => apiClient.post('/auth/login', data),
    logout: () => apiClient.post('/auth/logout'),
};

// Nexus API - Blockchain authentication
export interface NexusAccountData {
    username: string;
    password: string;
    pin: string;
}

export interface NexusLoginData {
    username: string;
    password: string;
    pin?: string;
}

export const nexusAPI = {
    // Create Nexus blockchain account (sigchain)
    createAccount: (data: NexusAccountData) =>
        apiClient.post('/nexus/create-account', data),

    // Login to Nexus and get session token
    login: (data: NexusLoginData) =>
        apiClient.post('/nexus/login', data),

    // Logout from Nexus
    logout: (session: string) =>
        apiClient.post('/nexus/logout', { session }),

    // Get Nexus node status
    getStatus: () =>
        apiClient.get('/nexus/status'),

    // Get user's Nexus profile
    getProfile: (session: string) =>
        apiClient.get('/nexus/profile', { params: { session } })
};

// Asset interfaces
interface CreateAssetData {
    name: string;
    data: Record<string, any>;
    pin?: string;
    session: string;
    format?: 'JSON' | 'raw' | 'basic' | 'readonly';
}

interface UpdateAssetData {
    address?: string;
    name?: string;
    data: Record<string, any>;
    pin?: string;
    session: string;
}

interface NexusTransferAssetData {
    address?: string;
    name?: string;
    recipient: string;
    pin?: string;
    session: string;
    expires?: number;
}

interface ListAssetsParams {
    session: string;
    page?: number;
    limit?: number;
    sort?: string;
    order?: 'asc' | 'desc';
}

// Assets API - Nexus blockchain integration
export const assetsAPI = {
    // Create a new asset on Nexus blockchain
    create: (data: CreateAssetData) =>
        apiClient.post('/assets/create', data),

    // Update an existing asset
    update: (data: UpdateAssetData) =>
        apiClient.put('/assets/update', data),

    // Transfer asset to another user
    transfer: (data: NexusTransferAssetData) =>
        apiClient.post('/assets/transfer', data),

    // Get asset by address or name
    get: (addressOrName: string) =>
        apiClient.get(`/assets/${addressOrName}`),

    // List all assets for current user
    list: (params: ListAssetsParams) =>
        apiClient.get('/assets/list', { params }),

    // Get asset history
    getHistory: (addressOrName: string, page?: number, limit?: number) =>
        apiClient.get(`/assets/${addressOrName}/history`, {
            params: { page, limit }
        }),

    // Get transaction details
    getTransaction: (hash: string) =>
        apiClient.get(`/assets/tx/${hash}`),

    // Get operation status
    getOperationStatus: (operationId: string) =>
        apiClient.get(`/assets/operation/${operationId}`),
};

// Upload API (for simple file uploads without blockchain)
export const uploadAPI = {
    uploadAudio: (file: File) => {
        const formData = new FormData();
        formData.append('audio', file);
        return apiClient.post('/upload/audio', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            timeout: 120000
        });
    },

    uploadCover: (file: File) => {
        const formData = new FormData();
        formData.append('cover', file);
        return apiClient.post('/upload/cover', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            timeout: 60000
        });
    },

    uploadAssetFiles: (audioFile: File, coverFile?: File) => {
        const formData = new FormData();
        formData.append('audio', audioFile);
        if (coverFile) {
            formData.append('cover', coverFile);
        }
        return apiClient.post('/upload/asset', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            timeout: 180000
        });
    },

    deleteFile: (path: string) => apiClient.delete(`/upload/${path}`)
};

// Mint API - Full asset creation with blockchain registration
export interface MintAssetData {
    audioFile: File;
    coverFile?: File;
    title: string;
    artist: string;
    description?: string;
    genre?: string;
    price: string;
    isLimited?: boolean;
    limitedSupply?: string;
    userId: string;
    nexusSession: string;
    nexusPin?: string;
}

export interface TransferAssetData {
    assetId: string;
    userId: string;
    recipientUsername: string;
    nexusSession: string;
    nexusPin?: string;
}

export const mintAPI = {
    // Discover all public assets (marketplace)
    discover: (limit?: number, offset?: number) =>
        apiClient.get('/mint/discover', { params: { limit, offset } }),

    // Get trending assets for home page
    trending: (limit?: number) =>
        apiClient.get('/mint/trending', { params: { limit } }),

    // Mint new asset (upload + register on Nexus blockchain)
    mint: (data: MintAssetData) => {
        const formData = new FormData();
        formData.append('audio', data.audioFile);
        if (data.coverFile) {
            formData.append('cover', data.coverFile);
        }
        formData.append('title', data.title);
        formData.append('artist', data.artist);
        formData.append('description', data.description || '');
        formData.append('genre', data.genre || '');
        formData.append('price', data.price);
        formData.append('isLimited', String(data.isLimited || false));
        formData.append('limitedSupply', data.limitedSupply || '0');
        formData.append('userId', data.userId);
        formData.append('nexusSession', data.nexusSession);
        if (data.nexusPin) {
            formData.append('nexusPin', data.nexusPin);
        }

        return apiClient.post('/mint', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            timeout: 300000 // 5 minutes for full mint process
        });
    },

    // Get user's assets
    getMyAssets: (userId: string) =>
        apiClient.get('/mint/my-assets', { params: { userId } }),

    // Get single asset with blockchain verification
    getAsset: (assetId: string) =>
        apiClient.get(`/mint/asset/${assetId}`),

    // Verify asset exists on blockchain
    verify: (addressOrName: string) =>
        apiClient.get(`/mint/verify/${addressOrName}`),

    // Confirm asset registration on blockchain
    confirmRegistration: (assetId: string) =>
        apiClient.post(`/mint/confirm/${assetId}`),

    // Transfer asset to another user
    transfer: (data: TransferAssetData) =>
        apiClient.post('/mint/transfer', data),

    // Confirm transfer completion
    confirmTransfer: (transferId: string) =>
        apiClient.post(`/mint/transfer/confirm/${transferId}`),

    // Retry failed registration
    retry: (assetId: string, nexusSession: string, nexusPin?: string) =>
        apiClient.post(`/mint/retry/${assetId}`, { nexusSession, nexusPin }),

    // Get transfer history for an asset
    getTransferHistory: (assetId: string) =>
        apiClient.get(`/mint/transfers/${assetId}`)
};

export default apiClient;
