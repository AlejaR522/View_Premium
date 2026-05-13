import Input from "./Input";
import Button from "./Button";
import { Link } from "react-router-dom";

export default function AuthForm({
    isRegister,
    nombre,
    setNombre,
    correo,
    setCorreo,
    password,
    setPassword,
    onSubmit,
}) {
    return (
        <div className="w-full max-w-xs sm:max-w-sm md:max-w-md space-y-3 sm:space-y-4">

            {isRegister && (
            <Input
                placeholder="Nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
            />
            )}

            <Input
                placeholder="Correo"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
            />

            <Input
                type="password"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
            />

            <Button
                text={isRegister ? "Crear cuenta" : "Iniciar sesión"}
                onClick={onSubmit}
            />
            <div className="text-center text-xs sm:text-sm mt-4 sm:mt-5 space-y-2">
                {isRegister ? (
                <>
                    <p>¿Ya tienes cuenta?</p>
                    <Link to="/" className="text-black font-semibold hover:underline inline-block">
                        Iniciar sesión
                    </Link>
                </>
                ) : (
                <>
                    <p>¿No tienes cuenta?</p>
                    <Link to="/register" className="text-black font-semibold hover:underline inline-block">
                        Crear cuenta
                    </Link>
                </>
                )}
            </div>
        </div>
    );
}