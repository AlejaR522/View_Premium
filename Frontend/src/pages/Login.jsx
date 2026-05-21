import { useState, useEffect } from "react";
import AuthLayout from "../components/AuthLayout";
import AuthForm from "../components/AuthForm";
import { login, getSession, isAdmin } from "../lib/auth";
import { useNavigate } from "react-router-dom";

export default function Login() {
    const [correo, setCorreo] = useState("");
    const [password, setPassword] = useState("");
    const [verificado, setVerificado] = useState(false);
    const [error, setError] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        // Detecta si viene del link de verificación de email
        const params = new URLSearchParams(window.location.search);
        if (params.get('verified') === 'true') {
            setVerificado(true);
        }

        const checkUser = () => {
            const session = getSession();
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
        setError("");
        try {
            await login(correo, password);
            if (isAdmin()) {
                navigate("/admin");
            } else {
                navigate("/home");
            }
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <AuthLayout>
            {/* Mensaje de verificación exitosa */}
            {verificado && (
                <div className="w-full max-w-xs sm:max-w-sm md:max-w-md mb-4 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700 text-center">
                    ¡Cuenta verificada! Ya puedes iniciar sesión.
                </div>
            )}

            {/* Mensaje de error */}
            {error && (
                <div className="w-full max-w-xs sm:max-w-sm md:max-w-md mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 text-center">
                    {error}
                </div>
            )}

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