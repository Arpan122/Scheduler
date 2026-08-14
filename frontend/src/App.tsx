import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Navbar } from "./components/Navbar";
import { Home } from "./pages/Home";
import { Admin } from "./pages/Admin";
import { Login } from "./pages/Login";
import { Logout } from "./pages/Logout";
import { AuthProvider } from "./context/AuthContext";


function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Navbar />
                <main className="main-content">
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/admin" element={<Admin />} />
                        <Route path="/login" element={<Login />}/>
                        <Route path="/logout" element={<Logout />}/>
                    </Routes>
                </main>
            </BrowserRouter>
        </AuthProvider>
    );
}

export default App;

