import { useEffect, useState } from "react";
import { jsPDF } from "jspdf";
import { useNavigate } from "react-router-dom";
import { getSession, logout } from "../lib/auth";
import api from "../lib/api";

function ArrowLeftIcon() {
  return <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" /></svg>;
}
function DownloadIcon() {
  return <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24"><path d="M12 3v11m0 0l-4-4m4 4l4-4M5 21h14" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /></svg>;
}
function PlusIcon() {
  return <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24"><path d="M12 5v14m-7-7h14" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /></svg>;
}
function EditIcon() {
  return <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24"><path d="M16.862 3.487a2.25 2.25 0 113.182 3.182L8.25 18.463 4.5 19.5l1.037-3.75L16.862 3.487z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" /></svg>;
}
function TrashIcon() {
  return <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /></svg>;
}

const EMPTY_CLIENTE = { nombre: "", email: "", telefono: "", direccion: "", empresa: "", notas: "" };

export default function Admin() {
  const [tab, setTab] = useState("usuarios"); // "usuarios" | "clientes"

  // Usuarios
  const [usuarios, setUsuarios] = useState([]);
  const [loadingUsuarios, setLoadingUsuarios] = useState(true);
  const [downloadingPdf, setDownloadingPdf] = useState({});

  // Clientes
  const [clientes, setClientes] = useState([]);
  const [loadingClientes, setLoadingClientes] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingCliente, setEditingCliente] = useState(null);
  const [formCliente, setFormCliente] = useState(EMPTY_CLIENTE);
  const [savingCliente, setSavingCliente] = useState(false);
  const [deletingCliente, setDeletingCliente] = useState({});

  const navigate = useNavigate();

  useEffect(() => {
    const session = getSession();
    if (!session || session.rol !== "admin") { navigate("/home"); return; }
    getUsuarios();
  }, []);

  useEffect(() => {
    if (tab === "clientes" && clientes.length === 0) getClientes();
  }, [tab]);

  //  Usuarios 
  const getUsuarios = async () => {
    setLoadingUsuarios(true);
    try {
      const session = getSession();
      const data = await api("/auth/usuarios");
      setUsuarios(data.filter(u => u.id !== session.id));
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingUsuarios(false);
    }
  };

  const handleGeneratePdf = async (user) => {
    setDownloadingPdf(prev => ({ ...prev, [user.id]: true }));
    try {
      const doc = new jsPDF({ unit: "mm", format: "a4" });
      const marginX = 18;
      let currentY = 24;
      const lineWidth = 174;
      const splitText = (label, value) =>
        doc.splitTextToSize(`${label}: ${value?.trim() || "Sin información"}`, lineWidth);

      doc.setFillColor(0, 0, 0);
      doc.roundedRect(12, 12, 186, 38, 6, 6, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.text("Reporte de Usuario", marginX, 28);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(`Generado: ${new Date().toLocaleString("es-CO")}`, marginX, 36);

      currentY = 62;
      doc.setTextColor(20, 20, 20);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text(user.nombre || "Sin nombre", marginX, currentY);

      currentY += 10;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      const lines = [
        ...splitText("Correo", user.email),
        ...splitText("Rol", user.rol),
        ...splitText("Descripción", user.descripcion),
      ];
      doc.text(lines, marginX, currentY);
      currentY += lines.length * 6 + 6;
      doc.setDrawColor(220, 220, 220);
      doc.line(marginX, currentY, 192, currentY);
      currentY += 12;
      doc.setFont("helvetica", "italic");
      doc.setFontSize(10);
      doc.text("Documento generado desde el panel administrador.", marginX, currentY);

      const safeName = (user.nombre || "usuario").replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "_");
      doc.save(`reporte_${safeName}.pdf`);
    } finally {
      setDownloadingPdf(prev => ({ ...prev, [user.id]: false }));
    }
  };

  // Clientes 
  const getClientes = async () => {
    setLoadingClientes(true);
    try {
      const data = await api("/clientes");
      setClientes(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingClientes(false);
    }
  };

  const handleOpenForm = (cliente = null) => {
    setEditingCliente(cliente);
    setFormCliente(cliente ? { ...cliente } : EMPTY_CLIENTE);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingCliente(null);
    setFormCliente(EMPTY_CLIENTE);
  };

  const handleSaveCliente = async () => {
    if (!formCliente.nombre || !formCliente.email) {
      alert("Nombre y email son obligatorios");
      return;
    }
    setSavingCliente(true);
    try {
      if (editingCliente) {
        const updated = await api(`/clientes/${editingCliente._id}`, {
          method: "PUT",
          body: JSON.stringify(formCliente),
        });
        setClientes(prev => prev.map(c => c._id === editingCliente._id ? updated : c));
      } else {
        const created = await api("/clientes", {
          method: "POST",
          body: JSON.stringify(formCliente),
        });
        setClientes(prev => [created, ...prev]);
      }
      handleCloseForm();
    } catch (err) {
      alert(err.message);
    } finally {
      setSavingCliente(false);
    }
  };

  const handleDeleteCliente = async (id) => {
    if (!confirm("¿Eliminar este cliente?")) return;
    setDeletingCliente(prev => ({ ...prev, [id]: true }));
    try {
      await api(`/clientes/${id}`, { method: "DELETE" });
      setClientes(prev => prev.filter(c => c._id !== id));
    } catch (err) {
      alert(err.message);
    } finally {
      setDeletingCliente(prev => ({ ...prev, [id]: false }));
    }
  };

  const handleLogout = () => { logout(); navigate("/"); };

  return (
    <main className="min-h-screen bg-[#f3f2ee] px-2 py-2 text-zinc-950 sm:px-3 md:px-4 lg:px-5">
      <section className="mx-auto min-h-[calc(100vh-16px)] max-w-[1600px] overflow-hidden rounded-2xl border border-black/10 bg-white shadow-[0_20px_60px_rgba(0,0,0,0.08)] sm:rounded-3xl md:rounded-[40px]">

        {/* Header */}
        <header className="border-b border-black/10 bg-black text-white">
          <div className="flex flex-col gap-3 px-3 py-4 sm:gap-4 sm:px-5 sm:py-5 md:px-8 md:py-7 lg:flex-row lg:items-center lg:justify-between lg:px-12">
            <button onClick={() => navigate("/home")}
              className="flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-2.5 text-xs font-medium transition hover:bg-white/10 sm:px-4 sm:py-3 sm:text-sm">
              <ArrowLeftIcon /> Volver
            </button>
            <div className="text-center">
              <p className="text-[10px] uppercase tracking-widest text-white/45">Control Panel</p>
              <h1 className="mt-1 text-lg font-semibold sm:text-xl md:text-3xl">Panel Admin</h1>
            </div>
            <button onClick={handleLogout}
              className="rounded-full border border-white/15 bg-white px-4 py-2.5 text-xs font-semibold text-black transition hover:bg-zinc-200 sm:px-5 sm:py-3 md:text-sm">
              Cerrar sesión
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-t border-white/10 px-3 sm:px-5 md:px-8 lg:px-12">
            <button onClick={() => setTab("usuarios")}
              className={`px-4 py-3 text-xs font-semibold transition sm:px-6 sm:text-sm ${tab === "usuarios" ? "border-b-2 border-white text-white" : "text-white/45 hover:text-white/70"}`}>
              Usuarios
            </button>
            <button onClick={() => setTab("clientes")}
              className={`px-4 py-3 text-xs font-semibold transition sm:px-6 sm:text-sm ${tab === "clientes" ? "border-b-2 border-white text-white" : "text-white/45 hover:text-white/70"}`}>
              Clientes
            </button>
          </div>
        </header>

        <div className="px-3 py-4 sm:px-5 sm:py-6 md:px-8 md:py-8 lg:px-12">

          {/* ── TAB USUARIOS ── */}
          {tab === "usuarios" && (
            <>
              <div className="mb-4 sm:mb-6">
                <p className="text-[10px] uppercase tracking-widest text-zinc-500">Directorio</p>
                <h2 className="mt-1.5 text-lg font-semibold sm:text-xl md:text-2xl">Usuarios del Sistema</h2>
              </div>

              {loadingUsuarios ? (
                <div className="rounded-2xl border border-dashed border-black/15 bg-[#fafaf9] px-4 py-12 text-center text-sm text-zinc-500">Cargando usuarios...</div>
              ) : usuarios.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-black/15 bg-[#fafaf9] px-4 py-12 text-center text-sm text-zinc-500">No hay usuarios registrados</div>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  {usuarios.map((user, index) => (
                    <div key={user.id} className="rounded-2xl border border-black/10 bg-white p-4 shadow-[0_8px_20px_rgba(0,0,0,0.04)] sm:rounded-3xl sm:p-5 md:p-6">
                      <div className="space-y-3">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                          <div>
                            <p className="text-[10px] uppercase tracking-widest text-zinc-400">Usuario {String(index + 1).padStart(2, "0")}</p>
                            <p className="mt-1 text-sm font-semibold sm:text-base md:text-lg">{user.nombre || "Sin nombre"}</p>
                          </div>
                          <button onClick={() => handleGeneratePdf(user)} disabled={downloadingPdf[user.id]}
                            className="flex items-center justify-center gap-2 rounded-full bg-black px-3 py-2 text-xs font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-70 sm:px-4 sm:text-sm">
                            <DownloadIcon />
                            {downloadingPdf[user.id] ? "Generando..." : "Generar PDF"}
                          </button>
                        </div>
                        <div className="grid gap-3 lg:grid-cols-2">
                          <div className="rounded-lg border border-black/10 bg-[#f7f7f5] p-2.5 sm:rounded-xl sm:p-3">
                            <p className="text-[10px] uppercase tracking-wider text-zinc-500">Correo</p>
                            <p className="mt-0.5 truncate text-xs font-medium text-zinc-700 sm:text-sm">{user.email || "Sin correo"}</p>
                          </div>
                          <div className="rounded-lg border border-black/10 bg-[#f7f7f5] p-2.5 sm:rounded-xl sm:p-3">
                            <p className="text-[10px] uppercase tracking-wider text-zinc-500">Rol</p>
                            <p className="mt-0.5 truncate text-xs font-medium text-zinc-700 sm:text-sm">{user.rol || "user"}</p>
                          </div>
                        </div>
                        <div className="rounded-lg border border-black/10 bg-[#f7f7f5] p-2.5 sm:rounded-xl sm:p-3">
                          <p className="text-[10px] uppercase tracking-wider text-zinc-500">Descripción</p>
                          <p className="mt-1 whitespace-pre-wrap text-xs leading-6 text-zinc-700 sm:text-sm">{user.descripcion || "Sin descripción."}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ── TAB CLIENTES ── */}
          {tab === "clientes" && (
            <>
              <div className="mb-4 flex items-center justify-between sm:mb-6">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-zinc-500">MongoDB</p>
                  <h2 className="mt-1.5 text-lg font-semibold sm:text-xl md:text-2xl">Registro de Clientes</h2>
                </div>
                <button onClick={() => handleOpenForm()}
                  className="flex items-center gap-2 rounded-full bg-black px-3 py-2 text-xs font-semibold text-white transition hover:bg-zinc-800 sm:px-4 sm:py-2.5 sm:text-sm">
                  <PlusIcon /> Nuevo cliente
                </button>
              </div>

              {/* Formulario crear/editar */}
              {showForm && (
                <div className="mb-6 rounded-2xl border border-black/10 bg-[#fafaf9] p-4 sm:rounded-3xl sm:p-5 md:p-6">
                  <h3 className="mb-4 text-sm font-semibold sm:text-base">
                    {editingCliente ? "Editar cliente" : "Nuevo cliente"}
                  </h3>
                  <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                    {[
                      { key: "nombre", label: "Nombre *", type: "text" },
                      { key: "email", label: "Email *", type: "email" },
                      { key: "telefono", label: "Teléfono", type: "text" },
                      { key: "empresa", label: "Empresa", type: "text" },
                      { key: "direccion", label: "Dirección", type: "text" },
                    ].map(({ key, label, type }) => (
                      <div key={key} className="space-y-1">
                        <label className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">{label}</label>
                        <input type={type} value={formCliente[key]} onChange={e => setFormCliente(prev => ({ ...prev, [key]: e.target.value }))}
                          className="w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-xs outline-none focus:border-black sm:text-sm" />
                      </div>
                    ))}
                    <div className="space-y-1 sm:col-span-2 md:col-span-3">
                      <label className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">Notas</label>
                      <textarea value={formCliente.notas} onChange={e => setFormCliente(prev => ({ ...prev, notas: e.target.value }))}
                        rows={3} className="w-full resize-none rounded-xl border border-black/10 bg-white px-3 py-2.5 text-xs outline-none focus:border-black sm:text-sm" />
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button onClick={handleSaveCliente} disabled={savingCliente}
                      className="rounded-full bg-black px-4 py-2 text-xs font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-70 sm:px-5 sm:text-sm">
                      {savingCliente ? "Guardando..." : editingCliente ? "Guardar cambios" : "Crear cliente"}
                    </button>
                    <button onClick={handleCloseForm}
                      className="rounded-full border border-black/10 px-4 py-2 text-xs font-semibold transition hover:bg-zinc-100 sm:px-5 sm:text-sm">
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              {loadingClientes ? (
                <div className="rounded-2xl border border-dashed border-black/15 bg-[#fafaf9] px-4 py-12 text-center text-sm text-zinc-500">Cargando clientes...</div>
              ) : clientes.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-black/15 bg-[#fafaf9] px-4 py-12 text-center text-sm text-zinc-500">No hay clientes registrados. ¡Crea el primero!</div>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  {clientes.map((cliente, index) => (
                    <div key={cliente._id} className="rounded-2xl border border-black/10 bg-white p-4 shadow-[0_8px_20px_rgba(0,0,0,0.04)] sm:rounded-3xl sm:p-5">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-[10px] uppercase tracking-widest text-zinc-400">Cliente {String(index + 1).padStart(2, "0")}</p>
                          <p className="mt-1 text-sm font-semibold sm:text-base">{cliente.nombre}</p>
                          {cliente.empresa && <p className="text-xs text-zinc-500">{cliente.empresa}</p>}
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => handleOpenForm(cliente)}
                            className="flex items-center gap-1.5 rounded-full border border-black/10 px-3 py-1.5 text-xs font-semibold transition hover:bg-zinc-100">
                            <EditIcon /> Editar
                          </button>
                          <button onClick={() => handleDeleteCliente(cliente._id)} disabled={deletingCliente[cliente._id]}
                            className="flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-100 disabled:opacity-70">
                            <TrashIcon /> {deletingCliente[cliente._id] ? "..." : "Eliminar"}
                          </button>
                        </div>
                      </div>
                      <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {cliente.email && (
                          <div className="rounded-lg border border-black/10 bg-[#f7f7f5] p-2.5">
                            <p className="text-[10px] uppercase tracking-wider text-zinc-500">Email</p>
                            <p className="mt-0.5 truncate text-xs text-zinc-700">{cliente.email}</p>
                          </div>
                        )}
                        {cliente.telefono && (
                          <div className="rounded-lg border border-black/10 bg-[#f7f7f5] p-2.5">
                            <p className="text-[10px] uppercase tracking-wider text-zinc-500">Teléfono</p>
                            <p className="mt-0.5 text-xs text-zinc-700">{cliente.telefono}</p>
                          </div>
                        )}
                        {cliente.direccion && (
                          <div className="rounded-lg border border-black/10 bg-[#f7f7f5] p-2.5">
                            <p className="text-[10px] uppercase tracking-wider text-zinc-500">Dirección</p>
                            <p className="mt-0.5 text-xs text-zinc-700">{cliente.direccion}</p>
                          </div>
                        )}
                        {cliente.notas && (
                          <div className="rounded-lg border border-black/10 bg-[#f7f7f5] p-2.5 sm:col-span-2 lg:col-span-3">
                            <p className="text-[10px] uppercase tracking-wider text-zinc-500">Notas</p>
                            <p className="mt-0.5 text-xs text-zinc-700">{cliente.notas}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </main>
  );
}