import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { verifyEmail } from "../lib/auth";

export default function VerifyEmail() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [mensaje, setMensaje] = useState("Verificando tu cuenta...");
  const [error, setError] = useState("");

  useEffect(() => {
    const confirmEmail = async () => {
      try {
        await verifyEmail(token);
        navigate("/?verified=true", { replace: true });
      } catch (err) {
        setError(err.message);
        setMensaje("");
      }
    };

    confirmEmail();
  }, [navigate, token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-bold">Verificacion de cuenta</h1>
        {mensaje && <p className="text-zinc-500">{mensaje}</p>}
        {error && <p className="text-red-600 text-sm">{error}</p>}
        {error && (
          <button
            onClick={() => navigate("/")}
            className="rounded-full bg-black text-white px-6 py-2 text-sm"
          >
            Ir al login
          </button>
        )}
      </div>
    </div>
  );
}
