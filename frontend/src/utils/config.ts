export const getServerUrl = (): string => {
    const envUrl = import.meta.env.VITE_SERVER_URL || "localhost:8000";
    if (envUrl.startsWith("http://") || envUrl.startsWith("https://")) {
        return envUrl.endsWith("/") ? envUrl.slice(0, -1) : envUrl;
    }
    return `http://${envUrl}`;
};
