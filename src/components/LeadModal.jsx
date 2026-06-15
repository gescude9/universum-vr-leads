import { useState } from 'react'
import { COMISION, ESTADOS, PAQUETES, PERSONAS, PREMIUM, DURACION } from '../constants'
import { precioDe, horasDe, todayISO, money } from '../lib/helpers'

export default function LeadModal({ lead, preset, vendedores, onSave, onClose, saving }) {
  const initFecha = lead?.fecha || preset?.fecha || todayISO()
  const initHora = lead?.hora || preset?.hora || '11:00'
  const initPaquete = lead?.paquete || 'Gaming'
  const initPersonas = lead?.personas || 5

  const [f, setF] = useState({
    nombre: lead?.nombre || '',
    telefono: lead?.telefono || '',
    contacto: lead?.contacto || '',
    vendedor: lead?.vendedor || '',
    fecha: initFecha,
    hora: initHora,
    personas: initPersonas,
    paquete: initPaquete,
    premium: lead?.premium || '',
    estado: lead?.estado || 'Nuevo',
    monto_estimado: lead ? lead.monto_estimado ?? '' : precioDe(initPaquete, initPersonas),
    monto_cerrado: lead?.monto_cerrado ?? '',
    notas: lead?.notas || '',
  })

  const upd = (campo, valor) => setF((prev) => ({ ...prev, [campo]: valor }))

  const horas = horasDe(f.fecha)
  const isFull = f.paquete === 'Full VR'
  const precio = precioDe(f.paquete, f.personas)
  const comision = +((Number(f.monto_cerrado) || 0) * COMISION).toFixed(2)

  function setFecha(v) {
    const lista = horasDe(v)
    const hora = lista.includes(f.hora) ? f.hora : lista[0]
    setF((p) => ({ ...p, fecha: v, hora }))
  }
  function setPaquete(v) {
    setF((p) => ({
      ...p,
      paquete: v,
      monto_estimado: precioDe(v, p.personas),
      premium: v === 'Full VR' ? p.premium : '',
    }))
  }
  function setPersonas(v) {
    setF((p) => ({ ...p, personas: Number(v), monto_estimado: precioDe(p.paquete, v) }))
  }

  async function submit() {
    const payload = {
      nombre: f.nombre.trim(),
      telefono: f.telefono.trim(),
      contacto: f.contacto.trim(),
      vendedor: f.vendedor || null,
      fecha: f.fecha,
      hora: f.hora,
      personas: Number(f.personas),
      paquete: f.paquete,
      premium: isFull ? f.premium : '',
      estado: f.estado,
      monto_estimado: Number(f.monto_estimado) || precioDe(f.paquete, f.personas),
      monto_cerrado: Number(f.monto_cerrado) || 0,
      notas: f.notas.trim(),
    }
    const ok = await onSave(payload, lead?.id)
    if (ok) onClose()
  }

  return (
    <div
      className="overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="modal">
        <div className="modal-head">
          <h2>{lead ? 'Editar lead' : 'Nuevo lead'}</h2>
          <button className="x" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="field">
            <label>Nombre del cliente *</label>
            <input value={f.nombre} onChange={(e) => upd('nombre', e.target.value)} placeholder="Ej. Sofía Pérez" />
          </div>
          <div className="field">
            <label>Teléfono *</label>
            <input value={f.telefono} onChange={(e) => upd('telefono', e.target.value)} placeholder="Ej. 6000-0000" />
          </div>
          <div className="field">
            <label>Instagram o email</label>
            <input value={f.contacto} onChange={(e) => upd('contacto', e.target.value)} placeholder="@usuario o correo" />
          </div>
          <div className="field">
            <label>Vendedor asignado</label>
            <select value={f.vendedor} onChange={(e) => upd('vendedor', e.target.value)}>
              <option value="">— Sin asignar —</option>
              {vendedores.map((v) => <option key={v.id} value={v.id}>{v.nombre}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Fecha del cumpleaños *</label>
            <input type="date" value={f.fecha} onChange={(e) => setFecha(e.target.value)} />
          </div>
          <div className="field">
            <label>Hora solicitada *</label>
            <select value={f.hora} onChange={(e) => upd('hora', e.target.value)}>
              {horas.map((h) => <option key={h} value={h}>{h}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Cantidad de personas</label>
            <select value={f.personas} onChange={(e) => setPersonas(e.target.value)}>
              {PERSONAS.map((p) => <option key={p} value={p}>{p} personas</option>)}
            </select>
          </div>
          <div className="field">
            <label>Paquete</label>
            <select value={f.paquete} onChange={(e) => setPaquete(e.target.value)}>
              {PAQUETES.map((p) => <option key={p} value={p}>{p} · {DURACION[p]}h</option>)}
            </select>
          </div>

          {isFull && (
            <div className="field full">
              <label>Experiencia premium (Full VR)</label>
              <select value={f.premium} onChange={(e) => upd('premium', e.target.value)}>
                <option value="">— Selecciona una experiencia —</option>
                {PREMIUM.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          )}

          <div className="calc-box">
            <div>
              <div className="hint" style={{ color: 'var(--muted)' }}>Precio del paquete</div>
              <div className="price">{money(precio)}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="hint" style={{ color: 'var(--muted)' }}>Comisión (10% del cierre)</div>
              <div className="com">{money(comision)}</div>
            </div>
          </div>

          <div className="field">
            <label>Estado del lead</label>
            <select value={f.estado} onChange={(e) => upd('estado', e.target.value)}>
              {ESTADOS.map((e) => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Monto estimado ($)</label>
            <input type="number" min="0" step="1" value={f.monto_estimado}
              onChange={(e) => upd('monto_estimado', e.target.value)} placeholder="0" />
          </div>
          <div className="field full">
            <label>
              Monto cerrado ($){' '}
              <span className="hint">
                {f.estado === 'Cerrado' ? '· requerido para calcular comisión' : '· (se usa al marcar como Cerrado)'}
              </span>
            </label>
            <input type="number" min="0" step="1" value={f.monto_cerrado}
              onChange={(e) => upd('monto_cerrado', e.target.value)} placeholder="0" />
            <div className="hint">La comisión se calcula automáticamente al 10% del monto cerrado.</div>
          </div>
          <div className="field full">
            <label>Notas internas</label>
            <textarea value={f.notas} onChange={(e) => upd('notas', e.target.value)}
              placeholder="Detalles de la conversación, preferencias, objeciones…" />
          </div>
        </div>

        <div className="modal-foot">
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={submit} disabled={saving}>
            {saving ? 'Guardando…' : 'Guardar lead'}
          </button>
        </div>
      </div>
    </div>
  )
}
