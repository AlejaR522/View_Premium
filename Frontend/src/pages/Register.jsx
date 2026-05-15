import { useState } from "react";
import AuthLayout from "../components/AuthLayout";
import AuthForm from "../components/AuthForm";
import { register } from "../lib/auth";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleRegister = async () => {
    try {
      await register(nombre, correo, password);
      alert("Usuario creado correctamente 💙");
      navigate("/"); // va al login
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <AuthLayout>
      <AuthForm
        isRegister
        nombre={nombre}
        setNombre={setNombre}
        correo={correo}
        setCorreo={setCorreo}
        password={password}
        setPassword={setPassword}
        onSubmit={handleRegister}
      />
    </AuthLayout>
  );
}