import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { COMISION, ESTADOS, PAQUETES, PREMIUM, DURACION } from '../constants'
import { precioDe, desglosePrecio, horasDe, todayISO, money } from '../lib/helpers'

export default function LeadModal({ lead, preset, vendedores, onSave, onClose, onDelete, saving }) {
  const { t } = useTranslation()
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

  const upd = (k, v) => setF(p => ({ ...p, [k]: v }))
  const horas = horasDe(f.fecha)
  const isFull = f.paquete === 'Full VR'
  const precio = precioDe(f.paquete, f.personas)
  const desglose = desglosePrecio(f.paquete, f.personas)
  const vendedorObj = vendedores.find(v => v.id === f.vendedor)
  const pct = vendedorObj?.comision_pct != null ? Number(vendedorObj.comision_pct) / 100 : COMISION
  const comision = +((Number(f.monto_cerrado) || 0) * pct).toFixed(2)

  function setFecha(v) {
    const lista = horasDe(v)
    const hora = lista.includes(f.hora) ? f.hora : lista[0]
    setF(p => ({ ...p, fecha: v, hora }))
  }
  function setPaquete(v) {
    const nuevoPrecio = precioDe(v, f.personas)
    setF(p => ({ ...p, paquete: v, monto_estimado: nuevoPrecio, premium: v === 'Full VR' ? p.premium : '' }))
  }
  function setPersonas(v) {
    const n = Math.max(1, parseInt(v) || 1)
    setF(p => ({ ...p, personas: n, monto_estimado: precioDe(p.paquete, n) }))
  }

  async function submit() {
    const payload = {
      nombre: f.nombre.trim(), telefono: f.telefono.trim(), contacto: f.contacto.trim(),
      vendedor: f.vendedor || null, fecha: f.fecha, hora: f.hora,
      personas: Number(f.personas), paquete: f.paquete,
      premium: isFull ? f.premium : '', estado: f.estado,
      monto_estimado: Number(f.monto_estimado) || precioDe(f.paquete, f.personas),
      monto_cerrado: Number(f.monto_cerrado) || 0,
      notas: f.notas.trim(),
    }
    const ok = await onSave(payload, lead?.id)
    if (ok) onClose()
  }

  return (
    <div className="overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal">
        <div className="modal-head">
          <h2>{lead ? t('leadModal.editarLead') : t('leadModal.nuevoLead')}</h2>
          <button className="x" onClick={onClose}>x</button>
        </div>
        <div className="modal-body">
          <div className="field"><label>{t('leadModal.nombre')}</label>
            <input value={f.nombre} onChange={e => upd('nombre', e.target.value)} placeholder={t('leadModal.nombrePlaceholder')} /></div>
          <div className="field"><label>{t('leadModal.telefono')}</label>
            <input value={f.telefono} onChange={e => upd('telefono', e.target.value)} placeholder={t('leadModal.telefonoPlaceholder')} /></div>
          <div className="field"><label>{t('leadModal.contacto')}</label>
            <input value={f.contacto} onChange={e => upd('contacto', e.target.value)} placeholder={t('leadModal.contactoPlaceholder')} /></div>
          <div className="field"><label>{t('leadModal.vendedor')}</label>
            <select value={f.vendedor} onChange={e => upd('vendedor', e.target.value)}>
              <option value="">{t('leadModal.sinAsignar')}</option>
              {vendedores.map(v => <option key={v.id} value={v.id}>{v.nombre}</option>)}
            </select></div>
          <div className="field"><label>{t('leadModal.fecha')}</label>
            <input type="date" value={f.fecha} onChange={e => setFecha(e.target.value)} /></div>
          <div className="field"><label>{t('leadModal.hora')}</label>
            <select value={f.hora} onChange={e => upd('hora', e.target.value)}>
              {horas.map(h => <option key={h} value={h}>{h}</option>)}
            </select></div>
          <div className="field"><label>{t('leadModal.personas')}</label>
            <input
              type="number" min="1" max="200" step="1"
              value={f.personas}
              onChange={e => setPersonas(e.target.value)}
              placeholder="Ej. 7"
            /></div>
          <div className="field"><label>{t('leadModal.paquete')}</label>
            <select value={f.paquete} onChange={e => setPaquete(e.target.value)}>
              {PAQUETES.map(p => <option key={p} value={p}>{p} · {DURACION[p]}h</option>)}
            </select></div>

          {isFull && (
            <div className="field full"><label>{t('leadModal.premium')}</label>
              <select value={f.premium} onChange={e => upd('premium', e.target.value)}>
                <option value="">{t('leadModal.seleccionaExp')}</option>
                {PREMIUM.map(p => <option key={p} value={p}>{p}</option>)}
              </select></div>
          )}

          <div className="calc-box">
            <div>
              <div className="hint" style={{ color: 'var(--muted)' }}>{t('leadModal.precioPaquete')}</div>
              <div className="price">{money(precio)}</div>
              {desglose && desglose.adicionales > 0 && (
                <div className="hint" style={{ color: 'var(--muted)', marginTop: 4, fontSize: 11 }}>
                  Base {desglose.base}p {money(desglose.precioBase)} + {desglose.adicionales} adicional(es) {money(desglose.precioAdicional)}
                </div>
              )}
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="hint" style={{ color: 'var(--muted)' }}>
                {t('leadModal.comision10')} ({vendedorObj?.comision_pct ?? 10}%)
              </div>
              <div className="com">{money(comision)}</div>
            </div>
          </div>

          <div className="field"><label>{t('leadModal.estado')}</label>
            <select value={f.estado} onChange={e => upd('estado', e.target.value)}>
              {ESTADOS.map(e => <option key={e} value={e}>{t('estados.' + e, e)}</option>)}
            </select></div>
          <div className="field"><label>{t('leadModal.estimado')}</label>
            <input type="number" min="0" step="0.01" value={f.monto_estimado}
              onChange={e => upd('monto_estimado', e.target.value)} placeholder="0" /></div>
          <div className="field full">
            <label>{t('leadModal.cerrado')}{' '}
              <span className="hint">{f.estado === 'Cerrado' ? t('leadModal.cerradoHint') : t('leadModal.cerradoHint2')}</span>
            </label>
            <input type="number" min="0" step="0.01" value={f.monto_cerrado}
              onChange={e => upd('monto_cerrado', e.target.value)} placeholder="0" />
            <div className="hint">{t('leadModal.comisionHint')}</div>
          </div>
          <div className="field full"><label>{t('leadModal.notas')}</label>
            <textarea value={f.notas} onChange={e => upd('notas', e.target.value)}
              placeholder={t('leadModal.notasPlaceholder')} /></div>
        </div>
        <div className="modal-foot">
          <button className="btn btn-ghost" onClick={onClose}>{t('leadModal.cancelar')}</button>
          {lead && onDelete && <button className="btn btn-danger" onClick={() => { onDelete(lead); onClose() }} style={{marginRight:'auto'}}>Eliminar lead</button>}
          <button className="btn btn-primary" onClick={submit} disabled={saving}>
            {saving ? t('leadModal.guardando') : t('leadModal.guardar')}
          </button>
        </div>
      </div>
    </div>
  )
}
