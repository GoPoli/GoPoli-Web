"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button, TextField } from "@/components/ui";
import { fetchUbicaciones, type Ubicacion } from "@/features/catalogo";
import { crearServicio, ServicioApiError } from "./api";
import { getUserId, isConductor } from "./session";
import {
  CAPACIDAD_MAX,
  CAPACIDAD_MIN,
  TIPO_SERVICIO_CONDUCTOR_GRUPO,
  TIPO_SERVICIO_PASAJERO_GRUPO,
} from "./constants";

export type LatLng = { lat: number; lng: number };

export type CrearServicioFormProps = {
  onServicioCreado: (idServicio: number) => void;
  /** Query de búsqueda de destino (mapa). */
  destinoQuery?: string;
  onCoordenadasSeleccion?: (
    salida: LatLng | null,
    llegada: LatLng | null,
    aviso?: string,
  ) => void;
  /** Si hay mensaje, no se puede crear (servicio activo). */
  bloqueoCrearMensaje?: string | null;
  /** Fija el botón de envío al pie del contenedor con scroll (hoja del mapa). */
  accionFija?: boolean;
};

function latLngDe(u: Ubicacion | undefined): LatLng | null {
  if (!u || u.latitud == null || u.longitud == null) return null;
  return { lat: u.latitud, lng: u.longitud };
}

function pad2(n: number): string {
  return n.toString().padStart(2, "0");
}

export function CrearServicioForm({
  onServicioCreado,
  destinoQuery = "",
  onCoordenadasSeleccion,
  bloqueoCrearMensaje = null,
  accionFija = false,
}: CrearServicioFormProps) {
  const [ubicaciones, setUbicaciones] = useState<Ubicacion[]>([]);
  const [ubicacionSalida, setUbicacionSalida] = useState<number | "">("");
  const [ubicacionLlegada, setUbicacionLlegada] = useState<number | "">("");
  const [capacidad, setCapacidad] = useState(CAPACIDAD_MIN);
  const [idTipoServicio, setIdTipoServicio] = useState(
    TIPO_SERVICIO_PASAJERO_GRUPO,
  );
  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [cargando, setCargando] = useState(false);
  const [cargandoUbicaciones, setCargandoUbicaciones] = useState(true);
  const [mensaje, setMensaje] = useState("");
  const [errorUbicaciones, setErrorUbicaciones] = useState<string | null>(null);

  const esConductor = isConductor();
  const bloqueado = Boolean(bloqueoCrearMensaje);

  const minFecha = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  }, []);

  const notificarCoordenadas = useCallback(
    (salidaId: number | "", llegadaId: number | "", list: Ubicacion[]) => {
      if (!onCoordenadasSeleccion) return;
      const salidaU = list.find((u) => u.idUbicacion === salidaId);
      const llegadaU = list.find((u) => u.idUbicacion === llegadaId);
      const ls = latLngDe(salidaU);
      const ll = latLngDe(llegadaU);
      let aviso: string | undefined;
      if (salidaId !== "" && ls == null) {
        aviso =
          "La salida elegida no tiene coordenadas en el servidor. Reinicia el backend y revisa la consola (UbicacionCoordenadasSeeder).";
      } else if (llegadaId !== "" && ll == null) {
        aviso =
          "La llegada elegida no tiene coordenadas en el servidor. Reinicia el backend y revisa la consola (UbicacionCoordenadasSeeder).";
      }
      onCoordenadasSeleccion(ls, ll, aviso);
    },
    [onCoordenadasSeleccion],
  );

  useEffect(() => {
    const ac = new AbortController();
    (async () => {
      setCargandoUbicaciones(true);
      setErrorUbicaciones(null);
      try {
        const list = await fetchUbicaciones(ac.signal);
        if (ac.signal.aborted) return;
        setUbicaciones(list);
      } catch {
        if (!ac.signal.aborted) {
          setErrorUbicaciones("Error cargando ubicaciones");
          setMensaje("Error cargando ubicaciones");
        }
      } finally {
        if (!ac.signal.aborted) setCargandoUbicaciones(false);
      }
    })();
    return () => ac.abort();
  }, []);

  useEffect(() => {
    notificarCoordenadas(ubicacionSalida, ubicacionLlegada, ubicaciones);
  }, [ubicacionSalida, ubicacionLlegada, ubicaciones, notificarCoordenadas]);

  const filtradas = useMemo(() => {
    const q = destinoQuery.trim().toLowerCase();
    if (!q) return ubicaciones;
    return ubicaciones.filter((u) =>
      u.nombreUbicacion.toLowerCase().includes(q),
    );
  }, [destinoQuery, ubicaciones]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (bloqueado) return;

    if (
      !fecha ||
      !hora ||
      ubicacionSalida === "" ||
      ubicacionLlegada === ""
    ) {
      setMensaje("Por favor completa todos los campos obligatorios");
      return;
    }

    const idCreador = getUserId();
    if (idCreador == null) {
      setMensaje("No hay sesión activa");
      return;
    }

    setCargando(true);
    setMensaje("");
    const horaStr = hora.length === 5 ? `${hora}:00` : hora;

    try {
      const creado = await crearServicio({
        fecha,
        descripcion,
        idLugarSalida: ubicacionSalida,
        idLugarLlegada: ubicacionLlegada,
        horaSalida: horaStr,
        idCreador,
        idTipoServicio,
        capacidad,
      });
      onServicioCreado(creado.idServicio);
    } catch (err) {
      if (err instanceof ServicioApiError) {
        setMensaje(err.body || err.message);
      } else {
        setMensaje("Error de conexión");
      }
    } finally {
      setCargando(false);
    }
  }

  const sugerencias =
    destinoQuery.trim() && filtradas.length > 0 ? filtradas.slice(0, 6) : [];

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      {bloqueoCrearMensaje ? (
        <div
          className="flex gap-2.5 rounded-[10px] border border-[#FFB74D] bg-[#FFF3E0] p-3 text-[13px] leading-snug text-[#BF360C]"
          role="status"
        >
          <span aria-hidden>ℹ</span>
          <p>{bloqueoCrearMensaje}</p>
        </div>
      ) : null}

      {errorUbicaciones ? (
        <p className="text-sm text-red-600" role="alert">
          {errorUbicaciones}
        </p>
      ) : null}

      <div>
        <label
          htmlFor="lugar-salida"
          className="mb-2 block text-sm font-semibold text-[var(--gopoli-primary,#1B5E20)]"
        >
          Lugar de Salida *
        </label>
        <select
          id="lugar-salida"
          className="w-full rounded-[10px] border border-[var(--gopoli-border,#E0E0E0)] bg-white px-4 py-3.5 text-[15px] focus:border-2 focus:border-[var(--gopoli-primary,#1B5E20)] focus:outline-none"
          value={ubicacionSalida === "" ? "" : String(ubicacionSalida)}
          disabled={cargandoUbicaciones || bloqueado}
          onChange={(ev) => {
            const v = ev.target.value;
            setUbicacionSalida(v === "" ? "" : Number.parseInt(v, 10));
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
          htmlFor="lugar-llegada"
          className="mb-2 block text-sm font-semibold text-[var(--gopoli-primary,#1B5E20)]"
        >
          Lugar de Llegada *
        </label>
        {sugerencias.length > 0 ? (
          <div className="mb-3">
            <p className="mb-2 text-xs text-[var(--gopoli-text-muted,#757575)]">
              Sugerencias
            </p>
            <div className="flex flex-wrap gap-2">
              {sugerencias.map((u) => (
                <button
                  key={u.idUbicacion}
                  type="button"
                  className="rounded-full bg-[#E8F5E9] px-3 py-1.5 text-[13px] text-[var(--gopoli-primary,#1B5E20)] hover:bg-[#C8E6C9]"
                  onClick={() => setUbicacionLlegada(u.idUbicacion)}
                >
                  {u.nombreUbicacion}
                </button>
              ))}
            </div>
          </div>
        ) : null}
        <select
          id="lugar-llegada"
          className="w-full rounded-[10px] border border-[var(--gopoli-border,#E0E0E0)] bg-white px-4 py-3.5 text-[15px] focus:border-2 focus:border-[var(--gopoli-primary,#1B5E20)] focus:outline-none"
          value={ubicacionLlegada === "" ? "" : String(ubicacionLlegada)}
          disabled={cargandoUbicaciones || bloqueado}
          onChange={(ev) => {
            const v = ev.target.value;
            setUbicacionLlegada(v === "" ? "" : Number.parseInt(v, 10));
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

      <div>
        <label
          htmlFor="fecha-servicio"
          className="mb-2 block text-sm font-semibold text-[var(--gopoli-primary,#1B5E20)]"
        >
          Fecha *
        </label>
        <input
          id="fecha-servicio"
          type="date"
          min={minFecha}
          value={fecha}
          disabled={bloqueado}
          onChange={(ev) => setFecha(ev.target.value)}
          className="w-full rounded-[10px] border border-[var(--gopoli-border,#E0E0E0)] bg-white px-4 py-3.5 text-[15px] focus:border-2 focus:border-[var(--gopoli-primary,#1B5E20)] focus:outline-none"
        />
      </div>

      <div>
        <label
          htmlFor="hora-servicio"
          className="mb-2 block text-sm font-semibold text-[var(--gopoli-primary,#1B5E20)]"
        >
          Hora de Salida *
        </label>
        <input
          id="hora-servicio"
          type="time"
          value={hora}
          disabled={bloqueado}
          onChange={(ev) => setHora(ev.target.value)}
          className="w-full rounded-[10px] border border-[var(--gopoli-border,#E0E0E0)] bg-white px-4 py-3.5 text-[15px] focus:border-2 focus:border-[var(--gopoli-primary,#1B5E20)] focus:outline-none"
        />
      </div>

      <fieldset disabled={bloqueado}>
        <legend className="mb-2 text-sm font-semibold text-[var(--gopoli-primary,#1B5E20)]">
          Tipo de viaje *
        </legend>
        <label className="mb-2 flex cursor-pointer gap-3">
          <input
            type="radio"
            name="tipo-viaje"
            checked={idTipoServicio === TIPO_SERVICIO_PASAJERO_GRUPO}
            onChange={() => setIdTipoServicio(TIPO_SERVICIO_PASAJERO_GRUPO)}
            className="mt-1 accent-[var(--gopoli-primary,#1B5E20)]"
          />
          <span>
            <span className="block font-medium">Grupo de viaje</span>
            <span className="block text-xs text-[var(--gopoli-text-muted,#757575)]">
              Pasajeros que contratan servicio externo (taxi, InDrive, etc.)
            </span>
          </span>
        </label>
        {esConductor ? (
          <label className="flex cursor-pointer gap-3">
            <input
              type="radio"
              name="tipo-viaje"
              checked={idTipoServicio === TIPO_SERVICIO_CONDUCTOR_GRUPO}
              onChange={() => setIdTipoServicio(TIPO_SERVICIO_CONDUCTOR_GRUPO)}
              className="mt-1 accent-[var(--gopoli-primary,#1B5E20)]"
            />
            <span>
              <span className="block font-medium">Grupo conductor</span>
              <span className="block text-xs text-[var(--gopoli-text-muted,#757575)]">
                Viaje ofrecido por conductor con vehículo propio
              </span>
            </span>
          </label>
        ) : null}
      </fieldset>

      <TextField
        multiline
        label="Descripción"
        placeholder="Describe tu servicio..."
        value={descripcion}
        disabled={bloqueado}
        onChange={(ev) => setDescripcion(ev.target.value)}
        rows={3}
      />

      <div>
        <p className="mb-2 text-sm font-semibold text-[var(--gopoli-primary,#1B5E20)]">
          Capacidad *
        </p>
        <div className="flex items-center justify-center gap-6">
          <button
            type="button"
            aria-label="Reducir capacidad"
            disabled={capacidad <= CAPACIDAD_MIN || bloqueado}
            onClick={() => setCapacidad((c) => Math.max(CAPACIDAD_MIN, c - 1))}
            className="text-3xl text-[var(--gopoli-primary,#1B5E20)] disabled:opacity-40"
          >
            −
          </button>
          <span className="text-[28px] font-bold tabular-nums">{capacidad}</span>
          <button
            type="button"
            aria-label="Aumentar capacidad"
            disabled={capacidad >= CAPACIDAD_MAX || bloqueado}
            onClick={() => setCapacidad((c) => Math.min(CAPACIDAD_MAX, c + 1))}
            className="text-3xl text-[var(--gopoli-primary,#1B5E20)] disabled:opacity-40"
          >
            +
          </button>
        </div>
      </div>

      <div
        className={
          accionFija
            ? "sticky bottom-0 z-10 -mx-5 mt-1 border-t border-[var(--gopoli-border,#E0E0E0)] bg-white px-5 py-3"
            : "contents"
        }
      >
        <Button
          type="submit"
          fullWidth
          size="lg"
          loading={cargando}
          disabled={bloqueado || cargandoUbicaciones}
        >
          Crear Servicio
        </Button>

        {mensaje ? (
          <p
            className={`mt-2 text-center text-sm ${
              mensaje.includes("exitosamente")
                ? "text-[var(--gopoli-secondary,#2E7D32)]"
                : "text-red-600"
            }`}
            role="status"
          >
            {mensaje}
          </p>
        ) : null}
      </div>
    </form>
  );
}
