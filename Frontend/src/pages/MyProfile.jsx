import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getSession, logout } from "../lib/auth";
import { updateUser } from "../services/userService";

function ArrowLeftIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M16.862 3.487a2.25 2.25 0 113.182 3.182L8.25 18.463 4.5 19.5l1.037-3.75L16.862 3.487z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  );
}

function CameraIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 8h3l1.5-2h7L17 8h3v10H4V8zm8 7a3 3 0 100-6 3 3 0 000 6z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  );
}

export default function MyProfile() {
  const [user, setUser] = useState(null);
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [descripcionProfesional, setDescripcionProfesional] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const previewObjectUrlRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const session = getSession();
    if (!session) {
      navigate("/");
      return;
    }
    setUser(session);
    setNombre(session.nombre ?? "");
    setCorreo(session.email ?? "");
    setDescripcionProfesional(session.descripcion ?? "");
    setPreviewUrl(session.avatar_url ?? "");
    setLoading(false);
  }, [navigate]);

  useEffect(() => {
    return () => {
      if (previewObjectUrlRef.current) {
        URL.revokeObjectURL(previewObjectUrlRef.current);
      }
    };
  }, []);

  const handleUpdate = async () => {
    if (!user) return;

    const trimmedNombre = nombre.trim();
    const trimmedCorreo = correo.trim();
    const trimmedDescripcion = descripcionProfesional.trim();

    // if (!trimmedNombre || !trimmedCorreo) {
    //   setMessage("Nombre y correo son obligatorios.");
    //   return;
    // }

    setSaving(true);
    setMessage("");

    try {
      // Si hay imagen nueva, conviértela a base64 para enviarla al backend
      let avatar_url = user.avatar_url ?? "";
// reemplaza el bloque de conversión de imagen por este:
      if (file) {
        const compressed = await new Promise((resolve) => {
          const img = new Image();
          const url = URL.createObjectURL(file);
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX = 400;
            const ratio = Math.min(MAX / img.width, MAX / img.height);
            canvas.width = img.width * ratio;
            canvas.height = img.height * ratio;
            canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
            resolve(canvas.toDataURL('image/jpeg', 0.7));
            URL.revokeObjectURL(url);
          };
          img.src = url;
        });
        avatar_url = compressed;
      }

      const updated = await updateUser(user.id, {
        nombre: trimmedNombre,
        email: trimmedCorreo,
        avatar_url,
        descripcion: trimmedDescripcion,
      });

      // Actualizar sesión en localStorage
      const newSession = { ...user, ...updated };
      localStorage.setItem("user", JSON.stringify(newSession));
      setUser(newSession);
      setPreviewUrl(updated.avatar_url ?? "");
      setFile(null);
      setMessage("Perfil actualizado correctamente.");
    } catch (err) {
      setMessage("No se pudo actualizar tu perfil: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleFileChange = (event) => {
    const nextFile = event.target.files?.[0] ?? null;
    if (previewObjectUrlRef.current) {
      URL.revokeObjectURL(previewObjectUrlRef.current);
      previewObjectUrlRef.current = null;
    }
    setFile(nextFile);
    if (nextFile) {
      const objectUrl = URL.createObjectURL(nextFile);
      previewObjectUrlRef.current = objectUrl;
      setPreviewUrl(objectUrl);
    } else {
      setPreviewUrl(user?.avatar_url ?? "");
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f3f2ee] px-2 py-2 sm:px-3 md:px-4">
        <div className="mx-auto max-w-[1600px] rounded-2xl border border-black/10 bg-white p-4 text-center text-sm font-medium text-zinc-500 shadow-[0_20px_60px_rgba(0,0,0,0.08)]">
          Cargando perfil...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f3f2ee] px-2 py-2 text-zinc-950 sm:px-3 md:px-4 lg:px-5">
      <section className="mx-auto min-h-[calc(100vh-16px)] max-w-[1600px] overflow-hidden rounded-2xl border border-black/10 bg-white shadow-[0_20px_60px_rgba(0,0,0,0.08)] sm:rounded-3xl md:rounded-[40px]">
        <header className="border-b border-white/10 bg-black text-white">
          <div className="flex flex-col gap-3 px-3 py-4 sm:gap-4 sm:px-5 sm:py-5 md:gap-4 md:px-8 md:py-7 lg:flex-row lg:items-center lg:justify-between lg:px-12">
            <button type="button" onClick={() => navigate("/home")}
              className="flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-2.5 text-xs font-medium transition hover:bg-white/10 sm:px-4 sm:py-3 sm:text-sm">
              <ArrowLeftIcon /> Volver al directorio
            </button>
            <div className="text-center">
              <p className="text-[10px] uppercase tracking-widest text-white/45 sm:text-[11px]">Personal Area</p>
              <h1 className="mt-1 text-lg font-semibold tracking-tight sm:mt-2 sm:text-xl md:text-3xl">My Profile</h1>
            </div>
            <button type="button" onClick={handleLogout}
              className="rounded-full border border-white/15 bg-white px-4 py-2.5 text-xs font-semibold text-black transition hover:-translate-y-0.5 hover:bg-zinc-200 sm:px-5 sm:py-3 md:text-sm">
              Cerrar sesión
            </button>
          </div>
        </header>

        <div className="grid gap-3 px-3 py-4 sm:gap-4 sm:px-5 sm:py-6 md:gap-5 md:px-8 md:py-8 lg:grid-cols-[360px_minmax(0,1fr)] lg:px-10 lg:py-10 xl:grid-cols-[430px_minmax(0,1fr)]">
          <aside className="space-y-3 sm:space-y-4 md:space-y-5">
            <div className="relative overflow-hidden rounded-2xl bg-black p-3 text-white sm:rounded-3xl sm:p-4 md:p-5">
              <div className="relative">
                <div className="overflow-hidden rounded-2xl bg-zinc-900 sm:rounded-3xl">
                  {previewUrl ? (
                    <img alt={nombre || "Mi avatar"} className="h-64 w-full object-cover sm:h-80 md:h-96 lg:h-[440px]" src={previewUrl} />
                  ) : (
                    <div className="flex h-64 w-full items-center justify-center text-4xl font-semibold text-white sm:h-80 sm:text-5xl md:h-96 lg:h-[440px] lg:text-7xl">
                      {(nombre || "U")[0].toUpperCase()}
                    </div>
                  )}
                </div>
                <label className="mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-2.5 text-xs font-semibold transition hover:bg-white/15 sm:mt-4 sm:px-4 sm:py-3 sm:text-sm">
                  <CameraIcon /> Cambiar fotografía
                  <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                </label>
              </div>
            </div>
          </aside>

          <section className="space-y-4 sm:space-y-5 md:space-y-6">
            <div className="grid gap-3 sm:gap-4 md:gap-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">Nombre completo</label>
                <div className="flex items-center gap-2 rounded-xl border border-black/10 bg-white px-3 py-2.5 sm:rounded-2xl sm:px-4 sm:py-3.5 md:rounded-3xl md:px-5 md:py-4">
                  <input value={nombre} onChange={(e) => setNombre(e.target.value)}
                    className="w-full bg-transparent text-sm font-semibold outline-none sm:text-base md:text-lg" placeholder="Tu nombre" />
                  <span className="rounded-full border border-black/10 p-1.5 text-zinc-500"><EditIcon /></span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">Correo profesional</label>
                <div className="flex items-center gap-2 rounded-xl border border-black/10 bg-white px-3 py-2.5 sm:rounded-2xl sm:px-4 sm:py-3.5 md:rounded-3xl md:px-5 md:py-4">
                  <input type="email" value={correo} onChange={(e) => setCorreo(e.target.value)}
                    className="w-full bg-transparent text-xs outline-none sm:text-sm md:text-base" placeholder="correo@ejemplo.com" />
                  <span className="rounded-full border border-black/10 p-1.5 text-zinc-500"><EditIcon /></span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">Descripción profesional</label>
                <div className="rounded-xl border border-black/10 bg-white px-3 py-2.5 sm:rounded-2xl sm:px-4 sm:py-3.5 md:rounded-3xl md:px-5 md:py-4">
                  <textarea value={descripcionProfesional} onChange={(e) => setDescripcionProfesional(e.target.value)}
                    rows={6} className="w-full resize-none bg-transparent text-xs leading-6 outline-none sm:text-sm md:text-base"
                    placeholder="Escribe un resumen de tu perfil profesional..." />
                </div>
              </div>
            </div>

            {message && (
              <p className={`rounded-xl px-3 py-2.5 text-xs font-medium sm:rounded-2xl sm:px-4 sm:py-3 md:text-sm ${
                message.includes("correctamente") ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border border-red-200 bg-red-50 text-red-700"}`}>
                {message}
              </p>
            )}

            <button type="button" onClick={handleUpdate} disabled={saving}
              className="w-full rounded-full bg-black px-4 py-2.5 text-xs font-semibold text-white transition hover:-translate-y-0.5 hover:bg-zinc-800 disabled:opacity-70 sm:w-auto sm:px-5 sm:py-3 md:px-7 md:py-4 md:text-sm">
              {saving ? "Guardando cambios..." : "Guardar cambios"}
            </button>
          </section>
        </div>
      </section>
    </main>
  );
}