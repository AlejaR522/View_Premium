import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getSession, logout } from "../lib/auth";
import { updateUser } from "../services/userService";
import api from "../lib/api";

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
  const [perfilBgColor, setPerfilBgColor] = useState("#000000");
  const [cedula, setCedula] = useState("");
  const [telefono, setTelefono] = useState("");
  const [direccion, setDireccion] = useState("");
  const [rutFile, setRutFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [premiumSaving, setPremiumSaving] = useState(false);
  const [message, setMessage] = useState("");
  const previewObjectUrlRef = useRef(null);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [premiumData, setPremiumData] = useState(null);
  const [premiumLoading, setPremiumLoading] = useState(false);
  const [premiumEditing, setPremiumEditing] = useState(false);

  const [showFacturaModal, setShowFacturaModal] = useState(false);
  const [facturaUrl, setFacturaUrl] = useState("");
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
    setPerfilBgColor(session.perfil_bg_color ?? "#000000");
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
        ...(user.es_premium ? { perfil_bg_color: perfilBgColor } : {}),
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

  const fileToDataUrl = (nextFile) => new Promise((resolve, reject) => {
    if (!nextFile) {
      resolve(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(nextFile);
  });

  const isPremiumActive = Boolean(user?.es_premium) && (!user?.premium_until || new Date(user.premium_until).getTime() > Date.now());

  const sanitizeNumericInput = (value) => value.replace(/[^0-9]/g, "");

  const downloadBase64Pdf = (base64Data, filename) => {
    const cleanedData = base64Data.includes(",") ? base64Data.split(",")[1] : base64Data;
    const binary = atob(cleanedData);
    const bytes = new Uint8Array(binary.length);

    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }

    const blob = new Blob([bytes], { type: "application/pdf" });
    const anchor = document.createElement("a");
    anchor.href = URL.createObjectURL(blob);
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(anchor.href);
  };

  const populatePremiumForm = (source = null) => {
    const detail = source || {};
    setCedula(detail.cedula || "");
    setTelefono(detail.telefono || "");
    setDireccion(detail.direccion || "");
    setPerfilBgColor(detail.perfil_bg_color || user?.perfil_bg_color || "#000000");
    setRutFile(null);
  };

  const openPremiumModal = async () => {
    setPremiumEditing(false);
    setMessage("");

    if (!isPremiumActive) {
      populatePremiumForm();
      setShowPremiumModal(true);
      return;
    }

    setPremiumLoading(true);
    try {
      const data = await api("/premium/mis-datos");
      setPremiumData(data);
      populatePremiumForm(data);
      setShowPremiumModal(true);
    } catch (err) {
      setMessage("No se pudo cargar los datos premium: " + err.message);
      setShowPremiumModal(true);
    } finally {
      setPremiumLoading(false);
    }
  };

  const handleActivatePremium = async () => {
    if (!user || premiumSaving) return;

    setPremiumSaving(true);
    setMessage("");

    try {
      const rut_pdf_data = await fileToDataUrl(rutFile);

      if (!cedula || !telefono || !direccion || !rut_pdf_data) {
        setMessage("La cédula, el teléfono, la dirección y el RUT son obligatorios.");
        return;
      }

      const data = await api("/premium/activar", {
        method: "POST",
        body: JSON.stringify({
          cedula,
          telefono,
          direccion,
          rut_pdf_data,
          perfil_bg_color: perfilBgColor,
        }),
      });

      const newSession = { ...user, ...data.user };
      localStorage.setItem("user", JSON.stringify(newSession));
      setUser(newSession);
      setCedula("");
      setTelefono("");
      setDireccion("");
      setRutFile(null);
      setMessage(data.mensaje || `Premium activado correctamente. Factura: ${data.numero_factura}`);
      setShowPremiumModal(false);
      setFacturaUrl(`http://localhost:5000/facturas/${data.fact_pdf}`);
      setShowFacturaModal(true);
    } catch (err) {
      setMessage("No se pudo activar premium: " + err.message);
    } finally {
      setPremiumSaving(false);
    }
  };

  const handleUpdatePremium = async () => {
    if (!user || premiumSaving) return;

    setPremiumSaving(true);
    setMessage("");

    try {
      if (!cedula || !telefono || !direccion) {
        setMessage("La cédula, el teléfono y la dirección son obligatorios.");
        return;
      }

      const rut_pdf_data = await fileToDataUrl(rutFile);
      const payload = {
        cedula,
        telefono,
        direccion,
        perfil_bg_color: perfilBgColor,
        ...(rutFile ? { rut_pdf_data } : {}),
      };

      const data = await api("/premium/mi-cliente", {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      const newSession = { ...user, perfil_bg_color: perfilBgColor };
      localStorage.setItem("user", JSON.stringify(newSession));
      setUser(newSession);
      setPremiumData(data.cliente);
      setPremiumEditing(false);
      setRutFile(null);
      setMessage(data.mensaje || "Datos premium actualizados correctamente.");
      setShowPremiumModal(false);
    } catch (err) {
      setMessage("No se pudo actualizar premium: " + err.message);
    } finally {
      setPremiumSaving(false);
    }
  };

  const handlePremiumSubmit = async () => {
    if (isPremiumActive && premiumEditing) {
      await handleUpdatePremium();
      return;
    }

    if (isPremiumActive) {
      setPremiumEditing(true);
      return;
    }

    await handleActivatePremium();
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
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={openPremiumModal}
                className="rounded-full border border-yellow-400 bg-black-400 px-4 py-2.5 text-xs font-semibold text-white transition hover:-translate-y-0.5 hover:bg-black-300 sm:px-5 sm:py-3 md:text-sm"
              >
                {isPremiumActive ? "Premium" : "Hazte Premium"}
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-full border border-white/15 bg-white px-4 py-2.5 text-xs font-semibold text-black transition hover:-translate-y-0.5 hover:bg-zinc-200 sm:px-5 sm:py-3 md:text-sm"
              >
                Cerrar sesión
              </button>
          </div>

          </div>
        </header>

        {isPremiumActive && (
          <div className="mx-3 mt-4 rounded-2xl border border-zinc-800 bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-800 px-4 py-4 text-white shadow-[0_18px_50px_rgba(0,0,0,0.18)] sm:mx-5 sm:mt-5 sm:px-5 md:mx-8 md:mt-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-[0.3em] text-zinc-300">Bienvenido</p>
                <h2 className="mt-1 text-lg font-semibold text-white sm:text-xl">Bienvenido a tu cuenta premium</h2>
              </div>
              <span className="inline-flex w-fit items-center rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-semibold text-zinc-100">
                Premium activo
              </span>
            </div>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-200">
              Tu membresía premium está activa y puedes descargar tu factura o editar tus datos cuando quieras.
            </p>
          </div>
        )}

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

            {showPremiumModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
              <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-widest text-zinc-500">
                      Premium
                    </p>
                    <h2 className="mt-1 text-2xl font-bold text-black">
                      {isPremiumActive ? (premiumEditing ? "Editar datos premium" : "Información premium") : "Activar membresía"}
                    </h2>
                  </div>
                  <button
                    onClick={() => setShowPremiumModal(false)}
                    className="rounded-full bg-zinc-100 px-3 py-1 text-sm font-semibold hover:bg-zinc-200"
                  >
                    X
                  </button>
                </div>

                <p className="mt-3 text-sm text-zinc-600">
                  {isPremiumActive
                    ? "Tu premium está activo. Puedes descargar factura y actualizar tus datos cuando quieras."
                    : "Membresía Premium $29.000 Pesos"}
                </p>

                {isPremiumActive && premiumData?.premium_until && (
                  <p className="mt-3 text-sm font-medium text-emerald-700">
                    Tu premium dura hasta {new Date(premiumData.premium_until).toLocaleString()}.
                  </p>
                )}

                <div className="mt-6 space-y-4">
                  <input
                    value={cedula}
                    onChange={(e) => setCedula(sanitizeNumericInput(e.target.value))}
                    disabled={premiumLoading || (isPremiumActive && !premiumEditing)}
                    className="w-full rounded-2xl border border-black/10 px-4 py-3 text-sm outline-none focus:border-black disabled:bg-zinc-100"
                    placeholder="Cédula"
                  />

                  <input
                    value={telefono}
                    onChange={(e) => setTelefono(sanitizeNumericInput(e.target.value))}
                    disabled={premiumLoading || (isPremiumActive && !premiumEditing)}
                    className="w-full rounded-2xl border border-black/10 px-4 py-3 text-sm outline-none focus:border-black disabled:bg-zinc-100"
                    placeholder="Teléfono"
                  />

                  <input
                    value={direccion}
                    onChange={(e) => setDireccion(e.target.value)}
                    disabled={premiumLoading || (isPremiumActive && !premiumEditing)}
                    className="w-full rounded-2xl border border-black/10 px-4 py-3 text-sm outline-none focus:border-black disabled:bg-zinc-100"
                    placeholder="Dirección"
                  />

                  <div className="rounded-2xl border border-black/10 p-4">
                    <label className="text-xs font-semibold text-zinc-500">
                      Color del perfil premium
                    </label>

                    <div className="mt-2 flex items-center gap-3">
                      <input
                        type="color"
                        value={perfilBgColor}
                        onChange={(e) => setPerfilBgColor(e.target.value)}
                        disabled={premiumLoading || (isPremiumActive && !premiumEditing)}
                        className="h-12 w-16 cursor-pointer rounded-xl border border-black/10 disabled:bg-zinc-100"
                      />

                      <span className="text-sm text-zinc-600">
                        Personaliza tu perfil
                      </span>
                    </div>
                  </div>

                  {!isPremiumActive && (
                    <input
                      type="file"
                      accept="application/pdf"
                      onChange={(e) => setRutFile(e.target.files?.[0] ?? null)}
                      className="w-full rounded-2xl border border-black/10 px-4 py-3 text-sm file:mr-3 file:rounded-full file:border-0 file:bg-black file:px-4 file:py-2 file:text-white"
                    />
                  )}

                  {isPremiumActive && premiumEditing && (
                    <input
                      type="file"
                      accept="application/pdf"
                      onChange={(e) => setRutFile(e.target.files?.[0] ?? null)}
                      className="w-full rounded-2xl border border-black/10 px-4 py-3 text-sm file:mr-3 file:rounded-full file:border-0 file:bg-black file:px-4 file:py-2 file:text-white"
                    />
                  )}
                </div>

                <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
                  {isPremiumActive ? (
                    <>
                      <button
                        type="button"
                        onClick={() => premiumData?.rut_pdf_data && downloadBase64Pdf(premiumData.rut_pdf_data, `rut-${user?.id || "usuario"}.pdf`)}
                        className="rounded-full border border-black/10 px-5 py-2.5 text-sm font-semibold hover:bg-zinc-100"
                      >
                        Descargar RUT
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setFacturaUrl(`http://localhost:5000/facturas/${premiumData?.fact_pdf || ""}`);
                          setShowFacturaModal(true);
                        }}
                        className="rounded-full border border-black/10 px-5 py-2.5 text-sm font-semibold hover:bg-zinc-100"
                      >
                        Ver factura
                      </button>
                      {!premiumEditing && (
                        <button
                          type="button"
                          onClick={() => setPremiumEditing(true)}
                          className="rounded-full bg-black px-5 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800"
                        >
                          Editar datos
                        </button>
                      )}
                      {premiumEditing && (
                        <button
                          type="button"
                          onClick={handlePremiumSubmit}
                          disabled={premiumSaving}
                          className="rounded-full bg-black px-5 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800"
                        >
                          {premiumSaving ? "Guardando..." : "Guardar cambios"}
                        </button>
                      )}
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={handleActivatePremium}
                      disabled={premiumSaving}
                      className="rounded-full bg-black px-5 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800"
                    >
                      {premiumSaving ? "Activando..." : "Activar Premium"}
                    </button>
                  )}

                  <button
                    onClick={() => setShowPremiumModal(false)}
                    className="rounded-full border border-black/10 px-5 py-2.5 text-sm font-semibold hover:bg-zinc-100"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
            )}

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
      
      {showFacturaModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
    <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
      
      <h2 className="text-2xl font-bold text-center">
        🎉 Premium Activado
      </h2>

      <p className="mt-3 text-center text-zinc-600">
        Tu membresía premium fue activada correctamente.
      </p>

      <div className="mt-6 flex flex-col gap-3">
        
        <a
          href={facturaUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full rounded-full bg-black px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-zinc-800"
        >
          Descargar Factura PDF
        </a>

        <button
          onClick={() => setShowFacturaModal(false)}
          className="w-full rounded-full border border-black px-4 py-3 text-sm font-semibold transition hover:bg-zinc-100"
        >
          Cerrar
        </button>

      </div>
    </div>
  </div>
  )}
    </main>
  );
}
