import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { getServerUrl } from "../utils/config";
import {
    FiActivity,
    FiCpu,
    FiHardDrive,
    FiClock,
    FiCheckCircle,
    FiAlertCircle,
    FiRefreshCw,
    FiServer,
    FiPause,
    FiPlay,
} from "react-icons/fi";

export interface HealthMetrics {
    status: string;
    timestamp: string;
    uptime: number;
    process: {
        pid: number;
        nodeVersion: string;
        memory: {
            rssMB: string;
            heapTotalMB: string;
            heapUsedMB: string;
        };
    };
    system: {
        platform: string;
        arch: string;
        freememMB: string;
        totalmemMB: string;
        cpus: number;
        loadavg: number[];
    };
}

export function ServerHealth() {
    const [metrics, setMetrics] = useState<HealthMetrics | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
    const [latency, setLatency] = useState<number | null>(null);

    const fetchHealth = useCallback(async () => {
        setLoading(true);
        const start = performance.now();
        try {
            const res = await axios.get<HealthMetrics>(
                `${getServerUrl()}/api/health`,
                { withCredentials: true }
            );
            
            const end = performance.now();
            setMetrics(res.data);
            setError(null);
            setLatency(Math.round(end - start));
            setLastUpdated(new Date());
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                if (err.response?.status === 401 || err.response?.status === 403) {
                    setError("Unauthorized: Please log in with admin privileges to view server health.");
                } else {
                    setError(`Server Error (${err.response?.status || "Network Error"}): ${err.message}`);
                }
            } else {
                setError(err instanceof Error ? err.message : "Failed to connect to backend server");
            }
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchHealth();
    }, [fetchHealth]);

    useEffect(() => {
        if (!autoRefresh) return;
        const interval = setInterval(() => {
            fetchHealth();
        }, 5000);
        return () => clearInterval(interval);
    }, [autoRefresh, fetchHealth]);

    const formatUptime = (seconds: number) => {
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        const parts = [];
        if (days > 0) parts.push(`${days}d`);
        if (hours > 0 || days > 0) parts.push(`${hours}h`);
        if (mins > 0 || hours > 0 || days > 0) parts.push(`${mins}m`);
        parts.push(`${secs}s`);
        return parts.join(" ");
    };

    const heapUsed = metrics ? parseFloat(metrics.process.memory.heapUsedMB) : 0;
    const heapTotal = metrics ? parseFloat(metrics.process.memory.heapTotalMB) : 1;
    const heapPercent = Math.min(Math.round((heapUsed / heapTotal) * 100), 100);

    const totalMem = metrics ? parseFloat(metrics.system.totalmemMB) : 1;
    const freeMem = metrics ? parseFloat(metrics.system.freememMB) : 0;
    const usedMem = totalMem - freeMem;
    const sysMemPercent = Math.min(Math.round((usedMem / totalMem) * 100), 100);

    return (
        <section className="health-section">
            <div className="health-header">
                <div className="health-title-container">
                    <FiServer className="health-header-icon" />
                    <div>
                        <h2 className="health-title">Backend Health & System Metrics</h2>
                        <p className="health-subtitle">Real-time status of express server and infrastructure</p>
                    </div>
                </div>

                <div className="health-controls">
                    <button
                        type="button"
                        className={`control-btn ${autoRefresh ? "active" : ""}`}
                        onClick={() => setAutoRefresh(!autoRefresh)}
                        title={autoRefresh ? "Pause Auto-refresh" : "Resume Auto-refresh"}
                    >
                        {autoRefresh ? <FiPause /> : <FiPlay />}
                        <span>{autoRefresh ? "Live (5s)" : "Paused"}</span>
                    </button>

                    <button
                        type="button"
                        className="control-btn refresh-btn"
                        onClick={fetchHealth}
                        disabled={loading}
                    >
                        <FiRefreshCw className={loading ? "spin" : ""} />
                        <span>Refresh</span>
                    </button>
                </div>
            </div>

            {error ? (
                <div className="health-card error-card">
                    <div className="card-header">
                        <FiAlertCircle className="status-icon error" />
                        <span className="card-title">Server Connection Failed</span>
                    </div>
                    <p className="error-message">{error}</p>
                    <button type="button" className="retry-btn" onClick={fetchHealth}>
                        Retry Connection
                    </button>
                </div>
            ) : !metrics ? (
                <div className="health-card loading-card">
                    <FiRefreshCw className="spin loading-icon" />
                    <span>Fetching server health metrics...</span>
                </div>
            ) : (
                <div className="metrics-grid">
                    {/* Card 1: Server Status */}
                    <div className="metric-card">
                        <div className="card-top">
                            <div className="status-badge online">
                                <span className="pulse-dot" />
                                <FiCheckCircle className="badge-icon" />
                                <span>ONLINE</span>
                            </div>
                            <FiActivity className="metric-type-icon" />
                        </div>
                        <div className="metric-body">
                            <span className="metric-label">Status & Latency</span>
                            <div className="metric-value">
                                {metrics.status.toUpperCase()}
                                {latency !== null && <span className="sub-value">{latency} ms</span>}
                            </div>
                        </div>
                        <div className="card-footer">
                            <span>Last checked: {lastUpdated ? lastUpdated.toLocaleTimeString() : "Just now"}</span>
                        </div>
                    </div>

                    {/* Card 2: Server Uptime */}
                    <div className="metric-card">
                        <div className="card-top">
                            <span className="card-tag">RUNTIME</span>
                            <FiClock className="metric-type-icon" />
                        </div>
                        <div className="metric-body">
                            <span className="metric-label">Server Uptime</span>
                            <div className="metric-value">{formatUptime(metrics.uptime)}</div>
                        </div>
                        <div className="card-footer">
                            <span>Node {metrics.process.nodeVersion} • PID: {metrics.process.pid}</span>
                        </div>
                    </div>

                    {/* Card 3: Node Memory */}
                    <div className="metric-card">
                        <div className="card-top">
                            <span className="card-tag">MEMORY</span>
                            <FiHardDrive className="metric-type-icon" />
                        </div>
                        <div className="metric-body">
                            <span className="metric-label">Heap Usage</span>
                            <div className="metric-value">
                                {metrics.process.memory.heapUsedMB} MB
                                <span className="sub-value">/ {metrics.process.memory.heapTotalMB} MB</span>
                            </div>
                            <div className="progress-bar-bg">
                                <div
                                    className="progress-bar-fill"
                                    style={{ width: `${heapPercent}%` }}
                                />
                            </div>
                        </div>
                        <div className="card-footer">
                            <span>RSS Memory: {metrics.process.memory.rssMB} MB</span>
                        </div>
                    </div>

                    {/* Card 4: System Info */}
                    <div className="metric-card">
                        <div className="card-top">
                            <span className="card-tag">SYSTEM</span>
                            <FiCpu className="metric-type-icon" />
                        </div>
                        <div className="metric-body">
                            <span className="metric-label">Host OS & Memory</span>
                            <div className="metric-value">
                                {metrics.system.platform} {metrics.system.arch}
                                <span className="sub-value">{metrics.system.cpus} Cores</span>
                            </div>
                            <div className="progress-bar-bg">
                                <div
                                    className="progress-bar-fill sys"
                                    style={{ width: `${sysMemPercent}%` }}
                                />
                            </div>
                        </div>
                        <div className="card-footer">
                            <span>Sys RAM: {(usedMem / 1024).toFixed(1)} GB / {(totalMem / 1024).toFixed(1)} GB used</span>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}
