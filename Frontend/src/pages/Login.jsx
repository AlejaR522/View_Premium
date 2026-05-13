import { useState, useEffect } from "react";
import AuthLayout from "../components/AuthLayout";
import AuthForm from "../components/AuthForm";
import { login, getSession, isAdmin } from "../lib/auth";
import { useNavigate } from "react-router-dom";

export default function Login() {
    const [correo, setCorreo] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        const checkUser = () => {
            const session = getSession(); // ya no es async
            if (session) {
                if (isAdmin()) {
                    navigate("/admin");
                } else {
                    navigate("/home");
                }
            }
        };
        checkUser();
    }, []);

    const handleLogin = async () => {
        try {
            const data = await login(correo, password);
            if (isAdmin()) {
                navigate("/admin");
            } else {
                navigate("/home");
            }
        } catch (error) {
            alert(error.message);
        }
    };

    return (
        <AuthLayout>
            <AuthForm
                correo={correo}
                setCorreo={setCorreo}
                password={password}
                setPassword={setPassword}
                onSubmit={handleLogin}
            />
        </AuthLayout>
    );
}