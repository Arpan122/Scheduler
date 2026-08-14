import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import { getServerUrl } from "../utils/config";

interface AuthContextType {
    user: any;
    setUser: React.Dispatch<React.SetStateAction<any>>;
    checkAuth: () => Promise<void>;
    showToast: (msg: string) => void;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    setUser: () => {},
    checkAuth: async () => {},
    showToast: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<any>(null);
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    const showToast = (msg: string) => {
        setToastMessage(msg);
        setTimeout(() => {
            setToastMessage((current) => (current === msg ? null : current));
        }, 3500);
    };

    const checkAuth = async () => {
        try {
            const res = await axios.get(
                `${getServerUrl()}/api/validate`,
                { withCredentials: true }
            );
            if (res.data.authenticated === true) {
                setUser(res.data.user);
            } else {
                setUser(null);
            }
        } catch (err) {
            setUser(null);
        }
    };

    useEffect(() => {
        checkAuth();
    }, []);

    return (
        <AuthContext.Provider value={{ user, setUser, checkAuth, showToast }}>
            {children}
            {toastMessage && (
                <div className="toast-notification">
                    <span>{toastMessage}</span>
                </div>
            )}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
