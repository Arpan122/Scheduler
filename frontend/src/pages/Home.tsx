import { useAuth } from "../context/AuthContext";

export function Home() {
    const { user } = useAuth();

    return (
        <div className="hero-section">
            <h1 className="page-title">
                Scheduler
            </h1>
            <p>
                {user ? "You have been signed in": "You are not currently signed in"}
            </p>
        </div>
    );
}
