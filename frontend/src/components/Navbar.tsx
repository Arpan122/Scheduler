import { Link, useNavigate } from "react-router-dom";
import { FiLogIn, FiLogOut } from "react-icons/fi";
import { useAuth } from "../context/AuthContext";

export function Navbar() {
    const { user } = useAuth();
    const nav = useNavigate();

    function redir() {
        window.location.href = "https://us-east-2zwqsbahy3.auth.us-east-2.amazoncognito.com/login?client_id=20k5o3nal6jitv8fb77l9s16lm&redirect_uri=http://localhost:3000/login&response_type=code&scope=email+openid+phone";
    }

    async function handleLogout() {
        try {
            nav("/logout", {replace: true})
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