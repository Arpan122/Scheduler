import axios from "axios";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getServerUrl } from "../utils/config";

export function Logout() {
    const { checkAuth, showToast } = useAuth();
    const nav = useNavigate();

    useEffect(() => {
        const doLogout = async () => {
            try {
                await axios.post(
                    `${getServerUrl()}/api/logout`,
                    {},
                    { withCredentials: true }
                );
                await checkAuth();
                showToast("Successfully logged out!");
            } catch (err) {
                console.error("Logout error:", err);
            } finally {
                nav("/", { replace: true });
            }
        };

        doLogout();
    }, [nav, checkAuth]);

    return <h4>Logging out...</h4>;
}