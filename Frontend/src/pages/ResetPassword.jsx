import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import Input from "../components/Input";
import Button from "../components/Button";
import { resetPassword } from "../lib/auth";

export default function ResetPassword() {
    const { token } = useParams();
    const navigate = useNavigate();

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [mensaje, setMensaje] = useState("");
    const [error, setError] = useState("");
    const [enviando, setEnviando] = useState(false);

const handleSubmit = async () => {

    if (password !== confirmPassword) {
        alert("Las contraseñas no coinciden");
        return;
    }

    try {

        const response = await fetch(
            `http://localhost:5000/api/auth/reset-password/${token}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    password,
                }),
            }
        );

        const data = await response.json();

        if (!response.ok) {
            alert(data.error);
            return;
        }

        alert(data.mensaje);

    } catch (error) {

        console.log(error);

        alert("Error del servidor");
        navigate("/");
    }
};

    return (
        <div className="min-h-screen flex items-center justify-center px-4">

            <div className="w-full max-w-sm space-y-4">

                <h1 className="text-2xl font-bold text-center">
                    Nueva contraseña
                </h1>

                <p className="text-sm text-gray-600 text-center">
                    Ingresa tu nueva contraseña para recuperar el acceso a tu cuenta.
                </p>

                {mensaje && (
                    <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700 text-center">
                        {mensaje}
                    </div>
                )}

                {error && (
                    <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 text-center">
                        {error}
                    </div>
                )}

                {!mensaje && (
                    <>
                        <Input
                            type="password"
                            placeholder="Nueva contraseña"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />

                        <Input
                            type="password"
                            placeholder="Confirmar contraseña"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                        />

                        <Button
                            text={enviando ? "Cambiando..." : "Cambiar contraseña"}
                            onClick={handleSubmit}
                            disabled={enviando}
                        />
                    </>
                )}

                {mensaje && (
                    <Button
                        text="Ir al inicio de sesión"
                        onClick={() => navigate("/")}
                    />
                )}

                {!mensaje && (
                    <div className="text-center">
                        <Link
                            to="/"
                            className="text-sm text-black hover:underline"
                        >
                            Volver al inicio de sesión
                        </Link>
                    </div>
                )}

            </div>

        </div>
    );
}
