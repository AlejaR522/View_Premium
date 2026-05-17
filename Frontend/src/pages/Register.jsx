import { useState } from "react";
import AuthLayout from "../components/AuthLayout";
import AuthForm from "../components/AuthForm";
import { register } from "../lib/auth";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [correoError, setCorreoError] = useState("");
  const [exito, setExito] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async () => {
    if (enviando) return;

    setMensaje("");
    setCorreoError("");
    setEnviando(true);

    try {
      await register(nombre, correo, password);
      setExito(true);
      setMensaje("Te enviamos un correo de verificación. Revísalo antes de iniciar sesión.");
    } catch (error) {
      setExito(false);
      if (error.message.toLowerCase().includes("correo")) {
        setCorreoError(error.message);
      } else {
        setMensaje(error.message);
      }
    } finally {
      setEnviando(false);
    }
  };

  return (
    <AuthLayout>
      {mensaje && (
        <div className={`w-full max-w-xs sm:max-w-sm md:max-w-md mb-4 rounded-xl px-4 py-3 text-sm text-center border ${
          exito
            ? "bg-emerald-50 border-emerald-200 text-emerald-700"
            : "bg-red-50 border-red-200 text-red-700"
        }`}>
          {mensaje}
        </div>
      )}

      {!exito && (
        <AuthForm
          isRegister
          nombre={nombre}
          setNombre={setNombre}
          correo={correo}
          setCorreo={setCorreo}
          correoError={correoError}
          password={password}
          setPassword={setPassword}
          onSubmit={handleRegister}
          submitText={enviando ? "Enviando..." : "Crear cuenta"}
          disabled={enviando}
        />
      )}

      {exito && (
        <button
          onClick={() => navigate("/")}
          className="mt-4 rounded-full bg-black px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800"
        >
          Ir al inicio de sesión
        </button>
      )}
    </AuthLayout>
  );
}
