import { Link } from "react-router-dom";
import { FiLogIn, FiLogOut } from "react-icons/fi";
import { useAuth } from "../context/AuthContext";

export function Navbar() {
    const { user } = useAuth();

    const getFrontendUrl = () => {
        const envUrl = import.meta.env.VITE_FRONTEND_URL;
        if (!envUrl) return window.location.origin;
        if (envUrl.startsWith("http://") || envUrl.startsWith("https://")) return envUrl;
        return `${window.location.protocol}//${envUrl}`;
    };

    function redir() {
        const redirectUri = `${getFrontendUrl()}/login`;
        window.location.href = `https://${import.meta.env.VITE_COGNITO_DOMAIN}/oauth2/authorize?response_type=code&client_id=${import.meta.env.VITE_COGNITO_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}`;
    }

    async function handleLogout() {
        try {
            const logoutUri = `${getFrontendUrl()}/logout`;
            window.location.href = `https://${import.meta.env.VITE_COGNITO_DOMAIN}/logout?client_id=${import.meta.env.VITE_COGNITO_CLIENT_ID}&logout_uri=${encodeURIComponent(logoutUri)}`;
        } catch (err) {
            console.error('Logout failed:', err);
        }
    }

    return (
        <nav className="navbar">
            <Link to="/" className="navbar-title-link">
                <h1 className="navbar-title">
                    Scheduler
                </h1>
            </Link>
            <div className="navbar-right">
                {user ? (
                    <button onClick={handleLogout} type="button" className="navbar-login-btn">
                        <FiLogOut className="navbar-btn-icon" aria-hidden="true" />
                        <span>Log Out</span>
                    </button>
                ) : (
                    <button onClick={redir} type="button" className="navbar-login-btn">
                        <FiLogIn className="navbar-btn-icon" aria-hidden="true" />
                        <span>Log In</span>
                    </button>
                )}
            </div>
        </nav>
    );
}