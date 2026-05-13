import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { logout } from "../lib/auth";
import api from "../lib/api";

function ArrowLeftIcon() {
  return <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /></svg>;
}
function MailIcon() {
  return <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24"><path d="M4 6h16v12H4V6zm0 1l8 6 8-6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" /></svg>;
}

export default function Profile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const loadUser = async () => {
      try {
        const data = await api(`/auth/usuarios/${id}`);
        setUser(data);
      } catch (err) {
        setErrorMessage("No se pudo cargar este perfil.");
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, [id]);

  const handleLogout = () => { logout(); navigate("/"); };

  return (
    <main className="min-h-screen bg-[#f3f2ee] px-2 py-2 text-zinc-950 sm:px-3 md:px-4 lg:px-5">
      <section className="mx-auto min-h-[calc(100vh-16px)] max-w-[1600px] overflow-hidden rounded-2xl border border-black/10 bg-white shadow-[0_20px_60px_rgba(0,0,0,0.08)] sm:rounded-3xl md:rounded-[40px]">
        <header className="border-b border-white/10 bg-black text-white">
          <div className="flex flex-col gap-3 px-3 py-4 sm:px-5 sm:py-5 md:px-8 md:py-7 lg:flex-row lg:items-center lg:justify-between lg:px-12">
            <button type="button" onClick={() => navigate("/home")}
              className="flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-2.5 text-xs font-medium transition hover:bg-white/10 sm:px-4 sm:py-3 sm:text-sm">
              <ArrowLeftIcon /> Volver
            </button>
            <div className="text-center">
              <p className="text-[10px] uppercase tracking-widest text-white/45">Public Profile</p>
              <h1 className="mt-1 truncate text-lg font-semibold sm:text-xl md:text-3xl">{user?.nombre || "Perfil"}</h1>
            </div>
            <button type="button" onClick={handleLogout}
              className="rounded-full border border-white/15 bg-white px-4 py-2.5 text-xs font-semibold text-black transition hover:bg-zinc-200 sm:px-5 sm:py-3 md:text-sm">
              Cerrar sesión
            </button>
          </div>
        </header>

        <div className="px-3 py-4 sm:px-5 sm:py-6 md:px-8 md:py-8 lg:px-12 lg:py-10">
          {loading ? (
            <div className="rounded-2xl border border-dashed border-black/15 bg-[#fafaf9] px-4 py-12 text-center text-sm text-zinc-500">Cargando usuario...</div>
          ) : errorMessage ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-8 text-center text-xs text-red-700">{errorMessage}</div>
          ) : (
            <div className="grid gap-4 sm:gap-5 lg:grid-cols-[480px_minmax(0,1fr)] lg:gap-6">
              <aside>
                <div className="overflow-hidden rounded-2xl bg-black sm:rounded-3xl">
                  {user?.avatar_url ? (
                    <img alt={user.nombre} className="h-80 w-full object-cover sm:h-96 md:h-[480px] lg:h-[520px]" src={user.avatar_url} />
                  ) : (
                    <div className="flex h-80 w-full items-center justify-center text-5xl font-semibold text-white sm:h-96 md:h-[480px] lg:h-[520px]">
                      {(user?.nombre || "U")[0].toUpperCase()}
                    </div>
                  )}
                </div>
              </aside>

              <section className="flex flex-col gap-4">
                <div className="rounded-2xl border border-black/10 bg-[#fbfbfa] p-4 sm:rounded-3xl sm:p-6">
                  <p className="text-[10px] uppercase tracking-widest text-zinc-500">Executive Profile</p>
                  <h2 className="mt-2 text-xl font-semibold sm:text-2xl md:text-3xl">{user?.nombre || "Sin nombre"}</h2>
                </div>

                <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-[0_8px_20px_rgba(0,0,0,0.04)] sm:rounded-3xl sm:p-6">
                  <p className="text-[10px] uppercase tracking-widest text-zinc-500">Contact Information</p>
                  <div className="mt-4 flex items-center gap-3 rounded-xl border border-black/10 bg-[#f7f7f5] px-3 py-3 sm:rounded-2xl sm:px-4 sm:py-4">
                    <div className="rounded-full bg-black p-2 text-white flex-shrink-0"><MailIcon /></div>
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase tracking-wider text-zinc-400">Correo</p>
                      <p className="truncate pt-1 text-xs font-medium text-zinc-700 sm:text-sm">{user?.email || "Sin correo"}</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-black/10 bg-[#f7f7f5] p-4 sm:rounded-3xl sm:p-6">
                  <p className="text-[10px] uppercase tracking-widest text-zinc-500">Professional Summary</p>
                  <p className="mt-3 whitespace-pre-wrap text-xs leading-6 text-zinc-700 sm:text-sm">
                    {user?.descripcion || "Este usuario aún no ha agregado una descripción profesional."}
                  </p>
                </div>
              </section>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}