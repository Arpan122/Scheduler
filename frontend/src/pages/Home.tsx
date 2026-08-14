import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { getServerUrl } from "../utils/config";

export function Home() {
    const { user } = useAuth();
    const [serverConnected, setServerConnected] = useState<boolean | null>(null);

    useEffect(() => {
        const checkServer = async () => {
            try {
                const res = await axios.get(`${getServerUrl()}/api/ping`, { timeout: 5000 });
                if (res.status === 200 && res.data?.status === "ok") {
                    setServerConnected(true);
                } else {
                    setServerConnected(false);
                }
            } catch (err) {
                setServerConnected(false);
            }
        };

        checkServer();
    }, []);

    return (
        <div className="hero-section">
            <h1 className="page-title">
                Scheduler
            </h1>
            <p>
                {user ? "You have been signed in": "You are not currently signed in"}
            </p>
            <p className="server-status">
                Server status: {serverConnected === null ? "Checking connection..." : serverConnected ? "Connected" : "Disconnected"}
            </p>
        </div>
    );
}
