"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, EmptyState, Spinner, TextField } from "@/components/ui";
import { fetchUbicaciones, type Ubicacion } from "@/features/catalogo";
import {
  crearServicio,
  getUserId,
  isConductor,
  ServicioApiError,
  useEstadoViajesUsuario,
  CAPACIDAD_MAX,
  CAPACIDAD_MIN,
  TIPO_SERVICIO_CONDUCTOR_GRUPO,
  TIPO_SERVICIO_PASAJERO_GRUPO,
} from "@/features/servicios";
import {
  actualizarRutaHabitual,
  AgendaApiError,
  crearRutaHabitual,
  eliminarRutaHabitual,
  fetchRutasHabituales,
} from "./api";
import type { GuardarRutaHabitualPayload, RutaHabitual } from "./types";

const DIAS: { valor: number; corto: string; largo: string }[] = [
  { valor: 1, corto: "Lun", largo: "Lunes" },
  { valor: 2, corto: "Mar", largo: "Martes" },
  { valor: 3, corto: "Mié", largo: "Miércoles" },
  { valor: 4, corto: "Jue", largo: "Jueves" },
  { valor: 5, corto: "Vie", largo: "Viernes" },
  { valor: 6, corto: "Sáb", largo: "Sábado" },
  { valor: 7, corto: "Dom", largo: "Domingo" },
];

function parseDias(raw: string): number[] {
  if (!raw.trim()) return [];
  return raw
    .split(",")
    .map((s) => Number.parseInt(s.trim(), 10))
    .filter((n) => n >= 1 && n <= 7);
}

function formatDias(dias: number[]): string {
  return [...new Set(dias)].sort((a, b) => a - b).join(",");
}

function etiquetaDias(diasSemana: string): string {
  const set = new Set(parseDias(diasSemana));
  if (set.size === 0) return "Sin días";
  return DIAS.filter((d) => set.has(d.valor))
    .map((d) => d.corto)
    .join(" · ");
}

function horaParaInput(hora: string): string {
  if (!hora) return "";
  return hora.length >= 5 ? hora.slice(0, 5) : hora;
}

function hoyIsoLocal(): string {
  const d = new Date();
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** ISO weekday: lunes=1 … domingo=7 (Date.getDay(): dom=0). */
function diaHoyIso(): number {
  const d = new Date().getDay();
  return d === 0 ? 7 : d;
}

type FormState = {
  idLugarSalida: number | "";
  idLugarLlegada: number | "";
  dias: number[];
  hora: string;
  capacidad: number;
  idTipoServicio: number;
  descripcion: string;
};

const formVacio = (): FormState => ({
  idLugarSalida: "",
  idLugarLlegada: "",
  dias: [1, 2, 3, 4, 5],
  hora: "",
  capacidad: CAPACIDAD_MIN,
  idTipoServicio: TIPO_SERVICIO_PASAJERO_GRUPO,
  descripcion: "",
});

function formDesdeRuta(r: RutaHabitual): FormState {
  return {
    idLugarSalida: r.idLugarSalida,
    idLugarLlegada: r.idLugarLlegada,
    dias: parseDias(r.diasSemana),
    hora: horaParaInput(r.horaSalida),
    capacidad: r.capacidad,
    idTipoServicio: r.idTipoServicio || TIPO_SERVICIO_PASAJERO_GRUPO,
    descripcion: r.descripcion ?? "",
  };
}

export function AgendaView() {
  const router = useRouter();
  const idUsuario = getUserId();
  const esConductor = isConductor();
  const {
    idServicioActivo,
    refrescar: refrescarEstado,
  } = useEstadoViajesUsuario();

  const mensajeBloqueo = useMemo(() => {
    if (idServicioActivo != null) {
      return "Ya tienes un servicio activo. En la pestaña Viajes abre “Mi grupo” y, si eres creador, cancela o finaliza el viaje para poder crear otro.";
    }
    return null;
  }, [idServicioActivo]);

  const [rutas, setRutas] = useState<RutaHabitual[]>([]);
  const [ubicaciones, setUbicaciones] = useState<Ubicacion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(formVacio);
  const [guardando, setGuardando] = useState(false);
  const [publicandoId, setPublicandoId] = useState<number | null>(null);

  const cargar = useCallback(async (signal?: AbortSignal) => {
    if (idUsuario == null) {
      setCargando(false);
      setError("Inicia sesión para ver tu agenda");
      return;
    }
    setCargando(true);
    setError(null);
    try {
      const [list, ubis] = await Promise.all([
        fetchRutasHabituales(idUsuario, signal),
        fetchUbicaciones(signal),
      ]);
      if (signal?.aborted) return;
      setRutas(list);
      setUbicaciones(ubis);
    } catch (err) {
      if (signal?.aborted) return;
      if (err instanceof AgendaApiError) {
        setError(err.body || err.message);
      } else {
        setError("No se pudo cargar la agenda");
      }
    } finally {
      if (!signal?.aborted) setCargando(false);
    }
  }, [idUsuario]);

  useEffect(() => {
    const ac = new AbortController();
    void cargar(ac.signal);
    return () => ac.abort();
  }, [cargar]);

  function abrirNueva() {
    setEditandoId(null);
    setForm(formVacio());
    setFormOpen(true);
    setMensaje(null);
  }

  function abrirEditar(r: RutaHabitual) {
    setEditandoId(r.idRuta);
    setForm(formDesdeRuta(r));
    setFormOpen(true);
    setMensaje(null);
  }

  function cerrarForm() {
    setFormOpen(false);
    setEditandoId(null);
  }

  function toggleDia(valor: number) {
    setForm((f) => {
      const has = f.dias.includes(valor);
      return {
        ...f,
        dias: has ? f.dias.filter((d) => d !== valor) : [...f.dias, valor],
      };
    });
  }

  async function onGuardar(e: React.FormEvent) {
    e.preventDefault();
    if (idUsuario == null) {
      setMensaje("No hay sesión activa");
      return;
    }
    if (
      form.idLugarSalida === "" ||
      form.idLugarLlegada === "" ||
      !form.hora ||
      form.dias.length === 0
    ) {
      setMensaje("Completa salida, llegada, hora y al menos un día");
      return;
    }
    if (form.idLugarSalida === form.idLugarLlegada) {
      setMensaje("Salida y llegada deben ser distintas");
      return;
    }

    const payload: GuardarRutaHabitualPayload = {
      idUsuario,
      idLugarSalida: form.idLugarSalida,
      idLugarLlegada: form.idLugarLlegada,
      diasSemana: formatDias(form.dias),
      horaSalida: form.hora.length === 5 ? `${form.hora}:00` : form.hora,
      capacidad: form.capacidad,
      idTipoServicio: form.idTipoServicio,
      descripcion: form.descripcion,
    };

    setGuardando(true);
    setMensaje(null);
    try {
      if (editandoId != null) {
        await actualizarRutaHabitual(editandoId, payload);
      } else {
        await crearRutaHabitual(payload);
      }
      cerrarForm();
      await cargar();
    } catch (err) {
      if (err instanceof AgendaApiError) {
        setMensaje(err.body || err.message);
      } else {
        setMensaje("Error de conexión");
      }
    } finally {
      setGuardando(false);
    }
  }

  async function onEliminar(r: RutaHabitual) {
    if (idUsuario == null) return;
    if (!window.confirm("¿Eliminar esta ruta habitual?")) return;
    setMensaje(null);
    try {
      await eliminarRutaHabitual(r.idRuta, idUsuario);
      await cargar();
    } catch (err) {
      if (err instanceof AgendaApiError) {
        setMensaje(err.body || err.message);
      } else {
        setMensaje("No se pudo eliminar");
      }
    }
  }

  async function onPublicarHoy(r: RutaHabitual) {
    if (mensajeBloqueo) return;
    const idCreador = getUserId();
    if (idCreador == null) {
      setMensaje("No hay sesión activa");
      return;
    }

    setPublicandoId(r.idRuta);
    setMensaje(null);
    const horaStr =
      r.horaSalida.length === 5 ? `${r.horaSalida}:00` : r.horaSalida;

    try {
      const creado = await crearServicio({
        fecha: hoyIsoLocal(),
        descripcion: r.descripcion ?? "",
        idLugarSalida: r.idLugarSalida,
        idLugarLlegada: r.idLugarLlegada,
        horaSalida: horaStr,
        idCreador,
        idTipoServicio: r.idTipoServicio || TIPO_SERVICIO_PASAJERO_GRUPO,
        capacidad: r.capacidad,
      });
      void refrescarEstado();
      router.push(`/grupo/${creado.idServicio}`);
    } catch (err) {
      if (err instanceof ServicioApiError) {
        setMensaje(err.body || err.message);
      } else {
        setMensaje("Error al publicar el servicio");
      }
    } finally {
      setPublicandoId(null);
    }
  }

  if (cargando) {
    return (
      <div className="flex justify-center py-16">
        <Spinner label="Cargando agenda…" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl p-4 md:p-6">
      <div className="mb-5 rounded-2xl border border-[color-mix(in_srgb,var(--gopoli-primary,#1B5E20)_20%,transparent)] bg-[color-mix(in_srgb,var(--gopoli-primary,#1B5E20)_12%,transparent)] p-[18px]">
        <h1 className="text-xl font-bold text-[var(--gopoli-primary,#1B5E20)]">
          Agenda
        </h1>
        <p className="mt-1.5 text-[13px] leading-snug text-[var(--gopoli-text-muted,#757575)]">
          Guarda tu trayecto habitual y publícalo hoy sin volver a llenar el
          formulario del mapa.
        </p>
      </div>

      {mensajeBloqueo ? (
        <div
          className="mb-4 flex gap-2.5 rounded-[10px] border border-[#FFB74D] bg-[#FFF3E0] p-3 text-[13px] leading-snug text-[#BF360C]"
          role="status"
        >
          <span aria-hidden>ℹ</span>
          <p>{mensajeBloqueo}</p>
        </div>
      ) : null}

      {error ? (
        <p className="mb-4 text-sm text-red-600" role="alert">
          {error}{" "}
          <button type="button" className="underline" onClick={() => void cargar()}>
            Reintentar
          </button>
        </p>
      ) : null}

      {mensaje ? (
        <p className="mb-4 text-sm text-red-600" role="alert">
          {mensaje}
        </p>
      ) : null}

      {!formOpen ? (
        <div className="mb-4">
          <Button type="button" fullWidth onClick={abrirNueva}>
            Nueva ruta habitual
          </Button>
        </div>
      ) : null}

      {formOpen ? (
        <Card className="mb-5">
          <h2 className="mb-4 text-base font-bold text-[var(--gopoli-primary,#1B5E20)]">
            {editandoId != null ? "Editar ruta" : "Nueva ruta habitual"}
          </h2>
          <form onSubmit={onGuardar} className="flex flex-col gap-4">
            <div>
              <label
                htmlFor="agenda-salida"
                className="mb-2 block text-sm font-semibold text-[var(--gopoli-primary,#1B5E20)]"
              >
                Lugar de salida *
              </label>
              <select
                id="agenda-salida"
                className="w-full rounded-[10px] border border-[var(--gopoli-border,#E0E0E0)] bg-white px-4 py-3.5 text-[15px] focus:border-2 focus:border-[var(--gopoli-primary,#1B5E20)] focus:outline-none"
                value={form.idLugarSalida === "" ? "" : String(form.idLugarSalida)}
                onChange={(ev) => {
                  const v = ev.target.value;
                  setForm((f) => ({
                    ...f,
                    idLugarSalida: v === "" ? "" : Number.parseInt(v, 10),
                  }));
                }}
              >
                <option value="">Desde dónde sales</option>
                {ubicaciones.map((u) => (
                  <option key={u.idUbicacion} value={u.idUbicacion}>
                    {u.nombreUbicacion}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="agenda-llegada"
                className="mb-2 block text-sm font-semibold text-[var(--gopoli-primary,#1B5E20)]"
              >
                Lugar de llegada *
              </label>
              <select
                id="agenda-llegada"
                className="w-full rounded-[10px] border border-[var(--gopoli-border,#E0E0E0)] bg-white px-4 py-3.5 text-[15px] focus:border-2 focus:border-[var(--gopoli-primary,#1B5E20)] focus:outline-none"
                value={
                  form.idLugarLlegada === "" ? "" : String(form.idLugarLlegada)
                }
                onChange={(ev) => {
                  const v = ev.target.value;
                  setForm((f) => ({
                    ...f,
                    idLugarLlegada: v === "" ? "" : Number.parseInt(v, 10),
                  }));
                }}
              >
                <option value="">¿A dónde vamos?</option>
                {ubicaciones.map((u) => (
                  <option key={u.idUbicacion} value={u.idUbicacion}>
                    {u.nombreUbicacion}
                  </option>
                ))}
              </select>
            </div>

            <fieldset>
              <legend className="mb-2 text-sm font-semibold text-[var(--gopoli-primary,#1B5E20)]">
                Días de la semana *
              </legend>
              <div className="flex flex-wrap gap-2">
                {DIAS.map((d) => {
                  const activo = form.dias.includes(d.valor);
                  return (
                    <button
                      key={d.valor}
                      type="button"
                      aria-pressed={activo}
                      aria-label={d.largo}
                      onClick={() => toggleDia(d.valor)}
                      className={[
                        "rounded-[10px] px-3 py-2 text-sm font-medium",
                        activo
                          ? "bg-[var(--gopoli-primary,#1B5E20)] text-white"
                          : "bg-[#E8F5E9] text-[var(--gopoli-primary,#1B5E20)]",
                      ].join(" ")}
                    >
                      {d.corto}
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <div>
              <label
                htmlFor="agenda-hora"
                className="mb-2 block text-sm font-semibold text-[var(--gopoli-primary,#1B5E20)]"
              >
                Hora de salida *
              </label>
              <input
                id="agenda-hora"
                type="time"
                value={form.hora}
                onChange={(ev) =>
                  setForm((f) => ({ ...f, hora: ev.target.value }))
                }
                className="w-full rounded-[10px] border border-[var(--gopoli-border,#E0E0E0)] bg-white px-4 py-3.5 text-[15px] focus:border-2 focus:border-[var(--gopoli-primary,#1B5E20)] focus:outline-none"
              />
            </div>

            <fieldset>
              <legend className="mb-2 text-sm font-semibold text-[var(--gopoli-primary,#1B5E20)]">
                Tipo de viaje *
              </legend>
              <label className="mb-2 flex cursor-pointer gap-3">
                <input
                  type="radio"
                  name="agenda-tipo"
                  checked={form.idTipoServicio === TIPO_SERVICIO_PASAJERO_GRUPO}
                  onChange={() =>
                    setForm((f) => ({
                      ...f,
                      idTipoServicio: TIPO_SERVICIO_PASAJERO_GRUPO,
                    }))
                  }
                  className="mt-1 accent-[var(--gopoli-primary,#1B5E20)]"
                />
                <span className="font-medium">Grupo de viaje</span>
              </label>
              {esConductor ? (
                <label className="flex cursor-pointer gap-3">
                  <input
                    type="radio"
                    name="agenda-tipo"
                    checked={
                      form.idTipoServicio === TIPO_SERVICIO_CONDUCTOR_GRUPO
                    }
                    onChange={() =>
                      setForm((f) => ({
                        ...f,
                        idTipoServicio: TIPO_SERVICIO_CONDUCTOR_GRUPO,
                      }))
                    }
                    className="mt-1 accent-[var(--gopoli-primary,#1B5E20)]"
                  />
                  <span className="font-medium">Grupo conductor</span>
                </label>
              ) : null}
            </fieldset>

            <div>
              <p className="mb-2 text-sm font-semibold text-[var(--gopoli-primary,#1B5E20)]">
                Capacidad *
              </p>
              <div className="flex items-center justify-center gap-6">
                <button
                  type="button"
                  aria-label="Reducir capacidad"
                  disabled={form.capacidad <= CAPACIDAD_MIN}
                  onClick={() =>
                    setForm((f) => ({
                      ...f,
                      capacidad: Math.max(CAPACIDAD_MIN, f.capacidad - 1),
                    }))
                  }
                  className="text-3xl text-[var(--gopoli-primary,#1B5E20)] disabled:opacity-40"
                >
                  −
                </button>
                <span className="text-[28px] font-bold tabular-nums">
                  {form.capacidad}
                </span>
                <button
                  type="button"
                  aria-label="Aumentar capacidad"
                  disabled={form.capacidad >= CAPACIDAD_MAX}
                  onClick={() =>
                    setForm((f) => ({
                      ...f,
                      capacidad: Math.min(CAPACIDAD_MAX, f.capacidad + 1),
                    }))
                  }
                  className="text-3xl text-[var(--gopoli-primary,#1B5E20)] disabled:opacity-40"
                >
                  +
                </button>
              </div>
            </div>

            <TextField
              multiline
              label="Descripción"
              placeholder="Opcional…"
              value={form.descripcion}
              onChange={(ev) =>
                setForm((f) => ({ ...f, descripcion: ev.target.value }))
              }
              rows={2}
            />

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button type="submit" fullWidth loading={guardando}>
                {editandoId != null ? "Guardar cambios" : "Guardar ruta"}
              </Button>
              <Button
                type="button"
                variant="outline"
                fullWidth
                disabled={guardando}
                onClick={cerrarForm}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </Card>
      ) : null}

      {rutas.length === 0 && !formOpen ? (
        <EmptyState
          title="Sin rutas guardadas"
          description="Crea una ruta habitual con salida, llegada, días, hora y cupos. Luego publícala el día que la necesites."
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {rutas.map((r) => {
            const hoyEnRuta = parseDias(r.diasSemana).includes(diaHoyIso());
            return (
              <li key={r.idRuta}>
                <Card>
                  <div className="flex flex-col gap-3">
                    <div>
                      <p className="text-base font-semibold text-[var(--gopoli-text,#212121)]">
                        {r.nombreSalida ?? `Salida #${r.idLugarSalida}`}
                        <span className="mx-1.5 text-[var(--gopoli-text-muted,#757575)]">
                          →
                        </span>
                        {r.nombreLlegada ?? `Llegada #${r.idLugarLlegada}`}
                      </p>
                      <p className="mt-1 text-[13px] text-[var(--gopoli-text-muted,#757575)]">
                        {etiquetaDias(r.diasSemana)} ·{" "}
                        {horaParaInput(r.horaSalida) || "—"} · {r.capacidad}{" "}
                        cupos
                        {!hoyEnRuta ? (
                          <span className="ml-1 text-[#BF360C]">
                            (hoy no está en tu calendario)
                          </span>
                        ) : null}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        disabled={Boolean(mensajeBloqueo) || publicandoId != null}
                        loading={publicandoId === r.idRuta}
                        onClick={() => void onPublicarHoy(r)}
                      >
                        Publicar hoy
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={publicandoId != null}
                        onClick={() => abrirEditar(r)}
                      >
                        Editar
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        disabled={publicandoId != null}
                        onClick={() => void onEliminar(r)}
                      >
                        Eliminar
                      </Button>
                    </div>
                    {idServicioActivo != null ? (
                      <Link
                        href={`/grupo/${idServicioActivo}`}
                        className="text-sm font-medium text-[var(--gopoli-primary,#1B5E20)] underline"
                      >
                        Ver mi grupo activo
                      </Link>
                    ) : null}
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
