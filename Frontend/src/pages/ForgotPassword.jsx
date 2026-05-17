import { useState } from "react";
import Input from "../components/Input";
import Button from "../components/Button";
import { Link } from "react-router-dom";
import { forgotPassword } from "../lib/auth";

export default function ForgotPassword() {
    const [correo, setCorreo] = useState("");
    const [mensaje, setMensaje] = useState("");
    const [error, setError] = useState("");
    const [enviando, setEnviando] = useState(false);

    const handleSubmit = async () => {
        if (enviando) return;

        setMensaje("");
        setError("");
        setEnviando(true);

        try {
            const data = await forgotPassword(correo);
            setMensaje(data.mensaje);
        } catch (err) {
            setError(err.message);
        } finally {
            setEnviando(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4">

            <div className="w-full max-w-sm space-y-4">

                <h1 className="text-2xl font-bold text-center">
                    Recuperar contraseña
                </h1>

                <p className="text-sm text-gray-600 text-center">
                    Ingresa el correo asociado a tu cuenta y te enviaremos un enlace para recuperar tu contraseña.
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

                <Input
                    placeholder="Correo electrónico"
                    value={correo}
                    onChange={(e) => setCorreo(e.target.value)}
                />

                <Button
                    text={enviando ? "Enviando..." : "Enviar enlace"}
                    onClick={handleSubmit}
                    disabled={enviando}
                />

                <div className="text-center">
                    <Link
                        to="/"
                        className="text-sm text-black hover:underline"
                    >
                        Volver al inicio de sesión
                    </Link>
                </div>

            </div>

        </div>
    );
}
