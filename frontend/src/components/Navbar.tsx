import { Link } from "react-router-dom";
import { FiLogIn, FiLogOut } from "react-icons/fi";
import { useAuth } from "../context/AuthContext";

export function Navbar() {
    const { user } = useAuth();

    const getFrontendUrl = () => {
        const envUrl = import.meta.env.VITE_FRONTEND_URL || 'localhost:3000';
        if (envUrl.startsWith('http://') || envUrl.startsWith('https://')) {
            return envUrl.endsWith('/') ? envUrl.slice(0, -1) : envUrl;
        }
        return `http://${envUrl}`;
    };

    function redir() {
        const redirectUri = `${getFrontendUrl()}/login`;
        const scopes = encodeURIComponent("openid email phone aws.cognito.signin.user.admin");
        window.location.href = `https://${import.meta.env.VITE_COGNITO_DOMAIN}/oauth2/authorize?response_type=code&client_id=${import.meta.env.VITE_COGNITO_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scopes}`;
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