import { Link, redirect } from "react-router-dom";
import { FiLogIn, FiLogOut } from "react-icons/fi";
import {  useEffect, useState } from "react";

import axios from "axios";

export function Navbar() {
    const [user, setUser] = useState(null);

    function redir () {
        window.location.href = "https://us-east-2zwqsbahy3.auth.us-east-2.amazoncognito.com/login/continue?client_id=20k5o3nal6jitv8fb77l9s16lm&redirect_uri=http%3A%2F%2Flocalhost%3A8000%2Fapi%2Flogin&response_type=code&scope=email+openid+phone";
    }

    useEffect(() => {
        axios.get("http://localhost:8000/api/validate", {withCredentials: true}).then(
            (res) => (res.data.authenticated===true ? setUser(res.data.user) : setUser(null))
        ).catch(
            () => setUser(null)
        );
    }, []);

    async function handleLogout() {
        try {
            window.location.href = "http://localhost:8000/api/logout";
            setUser(null);
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