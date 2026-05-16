import { useState } from "react";
import { useParams } from "react-router-dom";

import Input from "../components/Input";
import Button from "../components/Button";

export default function ResetPassword() {

    const { token } = useParams();

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const handleSubmit = () => {

        if (password !== confirmPassword) {
            alert("Las contraseñas no coinciden");
            return;
        }

        console.log({
            token,
            password
        });

        // Aquí después enviaremos la nueva contraseña al backend
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
                    text="Cambiar contraseña"
                    onClick={handleSubmit}
                />

            </div>

        </div>
    );
}