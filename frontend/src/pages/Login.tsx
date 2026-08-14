import axios from "axios";
import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

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
                    `http://${import.meta.env.VITE_SERVER_URL}/api/login`,
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
        <div>
            <h4>Processing login request</h4>
        </div>
    );
}