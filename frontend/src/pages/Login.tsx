import axios from "axios";
import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getServerUrl } from "../utils/config";

export function Login() {
    const { checkAuth, showToast } = useAuth();
    const [searchParams] = useSearchParams();
    const nav = useNavigate();

    const code = searchParams.get("code");

    useEffect(() => {
        const sendReq = async () => {
            if (!code) {
                nav("/", { replace: true });
                return;
            }

            try {
                await axios.post(
                    `${getServerUrl()}/api/login`,
                    { code: code },
                    { withCredentials: true }
                );
                await checkAuth();
                showToast("Successfully logged in!");
            } catch (err) {
                console.error("Login error or duplicate code:", err);
            } finally {
                nav("/", { replace: true });
            }
        };

        sendReq();
    }, [code, nav, checkAuth]);

    
    return (
        <div style={{
            position: "fixed", top: 0, left: 0, right: 0, bottom: 0, 
            backgroundColor: "rgba(0,0,0,0.5)", display: "flex", 
            justifyContent: "center", alignItems: "center", zIndex: 10000
        }}>
            <div style={{
                backgroundColor: "var(--surface)", padding: "2rem", 
                borderRadius: "12px", border: "1px solid var(--border)", 
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                maxWidth: "400px", textAlign: "center"
            }}>
                <h3 style={{ color: "var(--text)", marginTop: 0 }}>Processing Login</h3>
                <p style={{ color: "var(--text)" }}>
                    Please wait while your login request is being processed...
                </p>
                <div style={{ marginTop: "1.5rem", display: "flex", justifyContent: "center" }}>
                    <div className="spin" style={{
                        width: "40px",
                        height: "40px",
                        border: "4px solid rgba(74, 222, 128, 0.2)",
                        borderTop: "4px solid #4ade80",
                        borderRadius: "50%"
                    }} />
                </div>
            </div>
        </div>
    );
}