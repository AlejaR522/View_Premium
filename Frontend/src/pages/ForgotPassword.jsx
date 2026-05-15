import { useState } from "react";
import Input from "../components/Input";
import Button from "../components/Button";
import { Link } from "react-router-dom";

export default function ForgotPassword() {

    const [correo, setCorreo] = useState("");

    const handleSubmit = () => {
        console.log(correo);

        // Aquí después enviaremos el correo al backend
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

                <Input
                    placeholder="Correo electrónico"
                    value={correo}
                    onChange={(e) => setCorreo(e.target.value)}
                />

                <Button
                    text="Enviar enlace"
                    onClick={handleSubmit}
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