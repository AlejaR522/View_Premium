import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getSession, logout } from "../lib/auth";
import api from "../lib/api";

function SearchIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M21 21l-4.35-4.35m1.85-5.15a7 7 0 11-14 0 7 7 0 0114 0z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    </svg>
  );
}

function ArrowUpRightIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M7 17L17 7m0 0H8m9 0v9" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    </svg>
  );
}

function Avatar({ name, src, size = "h-16 w-16", textSize = "text-xl" }) {
  if (src) return <img alt={name || "Usuario"} className={`${size} rounded-full object-cover`} src={src} />;
  return (
    <div className={`${size} ${textSize} flex items-center justify-center rounded-full bg-black font-semibold text-white`}>
      {(name || "U")[0].toUpperCase()}
    </div>
  );
}

export default function Home() {
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const session = getSession();
    if (!session) { navigate("/"); return; }
    setCurrentUser(session);

    const loadUsers = async () => {
      try {
        const data = await api("/auth/usuarios");
        setUsers(data.filter(u => u.id !== session.id));
      } catch (err) {
        setErrorMessage(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadUsers();
  }, [navigate]);

  const filteredUsers = (() => {
    const query = search.trim().toLowerCase();
    if (!query) return users;
    return users.filter(u =>
      u.nombre?.toLowerCase().includes(query) ||
      u.email?.toLowerCase().includes(query)
    );
  })();

  const handleLogout = () => { logout(); navigate("/"); };

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f3f2ee] px-2 py-2 text-zinc-950 sm:px-3 md:px-4 lg:px-5">
      <section className="relative mx-auto flex min-h-[calc(100vh-16px)] w-full max-w-[1600px] flex-col overflow-hidden rounded-2xl border border-black/10 bg-white shadow-[0_20px_60px_rgba(0,0,0,0.08)] sm:rounded-3xl md:rounded-[40px]">
        <header className="overflow-hidden border-b border-black/10 bg-black text-white">
          <div className="flex flex-col gap-4 px-3 py-4 sm:gap-5 sm:px-5 sm:py-5 md:px-8 md:py-7 lg:px-12">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button type="button" onClick={() => navigate("/me")}
                className="group flex w-full items-center gap-3 rounded-full border border-white/15 bg-white/5 px-2 py-2 pr-3 transition hover:bg-white/10 sm:w-auto sm:pr-4">
                <div className="overflow-hidden rounded-full ring-2 ring-white/15 flex-shrink-0">
                  <Avatar name={currentUser?.nombre} src={currentUser?.avatar_url} size="h-10 w-10 sm:h-11 sm:w-11" textSize="text-sm" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-widest text-white/55">Mi espacio</p>
                  <p className="truncate text-xs font-medium sm:text-sm">{currentUser?.nombre || "Perfil"}</p>
                </div>
              </button>
              <button type="button" onClick={handleLogout}
                className="w-full rounded-full border border-white/15 bg-white px-4 py-2.5 text-xs font-semibold text-black transition hover:bg-zinc-200 sm:w-auto sm:px-5 sm:py-3">
                Cerrar sesión
              </button>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-white/50">Network Directory</p>
              <h1 className="mt-1.5 text-xl font-semibold tracking-tight sm:text-2xl md:text-4xl">Executive Contacts</h1>
            </div>
            <div className="relative">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/50 md:left-5"><SearchIcon /></span>
              <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Buscar por nombre o correo..."
                className="h-12 w-full rounded-full border border-white/10 bg-white/6 pl-11 pr-4 text-xs text-black outline-none placeholder:text-black/45 focus:border-white/30 sm:h-13 sm:pl-12 sm:text-sm md:h-16 md:pl-14 md:text-base" /> 
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <article className="rounded-xl border border-white/10 bg-white/5 px-3 py-3 sm:rounded-2xl sm:px-4 sm:py-4">
                <p className="text-[10px] uppercase tracking-wider text-white/45">Usuarios</p>
                <p className="mt-2 text-lg font-semibold sm:text-2xl">{users.length}</p>
              </article>
              <article className="rounded-xl border border-white/10 bg-white/5 px-3 py-3 sm:rounded-2xl sm:px-4 sm:py-4">
                <p className="text-[10px] uppercase tracking-wider text-white/45">Resultados</p>
                <p className="mt-2 text-lg font-semibold sm:text-2xl">{filteredUsers.length}</p>
              </article>
            </div>
          </div>
        </header>

        <div className="grid gap-4 px-3 py-4 sm:px-5 sm:py-6 md:px-8 md:py-8 lg:grid-cols-[280px_minmax(0,1fr)] lg:px-10 xl:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="space-y-3 lg:order-1">
            <article className="rounded-2xl border border-black/10 bg-[#f7f7f5] p-4 sm:rounded-3xl sm:p-5 md:p-6">
              <p className="text-[10px] uppercase tracking-widest text-zinc-500">Bienvenido</p>
              <h2 className="mt-2.5 text-lg font-semibold text-black">{currentUser?.nombre || "Usuario"}</h2>
              <p className="mt-2.5 text-xs leading-5 text-zinc-600 sm:text-sm sm:leading-6">
                Explora perfiles, revisa datos de contacto y entra al detalle de cada usuario.
              </p>
            </article>
          </aside>

          <section className="space-y-4 lg:order-2">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-zinc-500">Directorio</p>
              <h2 className="mt-1.5 text-lg font-semibold sm:text-xl md:text-3xl">People Overview</h2>
            </div>

            {loading ? (
              <div className="rounded-2xl border border-dashed border-black/15 bg-[#fafaf9] px-4 py-12 text-center text-sm text-zinc-500">Cargando usuarios...</div>
            ) : errorMessage ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-8 text-center text-xs text-red-700">{errorMessage}</div>
            ) : filteredUsers.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-black/15 bg-[#fafaf9] px-4 py-12 text-center text-sm text-zinc-500">No encontramos usuarios con esa búsqueda.</div>
            ) : (
              <div className="grid gap-3 grid-cols-1 sm:gap-4 sm:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3">
                {filteredUsers.map((user, index) => (
                  <button key={user.id} type="button" onClick={() => navigate(`/profile/${user.id}`)}
                    className="group rounded-2xl border border-black/10 bg-white p-4 text-left shadow-[0_8px_20px_rgba(0,0,0,0.04)] transition hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(0,0,0,0.08)] sm:rounded-3xl sm:p-5 md:p-6">
                    <div className="flex items-start justify-between gap-2.5">
                      <div className="flex min-w-0 items-start gap-2.5">
                        <div className="overflow-hidden rounded-full ring-1 ring-black/10 flex-shrink-0">
                          <Avatar name={user.nombre} src={user.avatar_url} size="h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14" textSize="text-xs sm:text-sm" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] uppercase tracking-widest text-zinc-400">Contacto {String(index + 1).padStart(2, "0")}</p>
                          <p className="mt-1 truncate text-sm font-semibold sm:text-base md:text-lg">{user.nombre || "Sin nombre"}</p>
                          <p className="mt-1 truncate text-xs text-zinc-500 sm:text-sm">{user.email || "Sin correo"}</p>
                        </div>
                      </div>
                      <div className="rounded-full border border-black/10 p-2 text-zinc-500 transition group-hover:border-black group-hover:text-black flex-shrink-0">
                        <ArrowUpRightIcon />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}