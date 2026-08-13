import axios from "axios";
import { useEffect, useState } from "react";

export function Home() {
    const [user, setUser] = useState(null);
    
    useEffect(() => {
        axios.get(`http://${import.meta.env.VITE_SERVER_URL}:8000/api/validate`, {withCredentials: true}).then(
            (res) => (res.data.authenticated===true ? setUser(res.data.user) : setUser(null))
        ).catch(
            () => setUser(null)
        );
    }, []);

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
