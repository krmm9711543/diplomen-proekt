export const getApiUrl = (path: string) => {
    // Dynamically determine the hostname to avoid localhost vs 127.0.0.1 mismatches
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    const port = '3001';
    
    // Ensure path starts with /
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    
    return `${protocol}//${hostname}:${port}${cleanPath}`;
};

export const getWsUrl = () => {
    const hostname = window.location.hostname;
    const port = '3001';
    return `ws://${hostname}:${port}`;
};
