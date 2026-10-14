import { useState } from 'react'
import { money } from '../lib/helpers'

const MESES_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

function ExtraModal({ extra, vendedores, onSave, onDelete, onClose, saving }) {
  const now = new Date()
  const [form, setForm] = useState({
    nombre: extra?.nombre || '',
    monto: extra?.monto ?? 0,
    vendedor: extra?.vendedor || '',
    mes: extra?.mes ?? (now.getMonth() + 1),
    ano: extra?.ano ?? now.getFullYear(),
    notas: extra?.notas || '',
  })

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  async function handleSave() {
    if (!form.nombre.trim()) { alert('Escribe un nombre para el extra'); return }
    if (!form.vendedor) { alert('Selecciona el vendedor'); return }
    const payload = {
      nombre: form.nombre.trim(),
      monto: Number(form.monto) || 0,
      vendedor: form.vendedor,
      mes: Number(form.mes),
      ano: Number(form.ano),
      notas: form.notas.trim() || null,
    }
    const ok = await onSave(payload, extra?.id)
    if (ok) onClose()
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 480 }}>
        <div className="modal-head">
          <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 20 }}>
            {extra ? 'Editar Extra' : '➕ Nuevo Extra'}
          </h2>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">

          <div className="field">
            <label>Nombre / Descripción *</label>
            <input value={form.nombre} onChange={e => set('nombre', e.target.value)}
              placeholder="ej: Venta especial, Mercadeo, etc." autoFocus />
          </div>

          <div className="field">
            <label>Monto ($)</label>
            <input type="number" min={0} step={0.01} value={form.monto}
              onChange={e => set('monto', e.target.value)}
              placeholder="0.00" />
          </div>

          <div className="field">
            <label>Vendedor *</label>
            <select value={form.vendedor} onChange={e => set('vendedor', e.target.value)}>
              <option value="">— Seleccionar —</option>
              {vendedores.map(v => <option key={v.id} value={v.id}>{v.nombre}</option>)}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="field">
              <label>Mes</label>
              <select value={form.mes} onChange={e => set('mes', Number(e.target.value))}>
                {MESES_ES.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Año</label>
              <input type="number" value={form.ano} min={2024} max={2099}
                onChange={e => set('ano', e.target.value)} />
            </div>
          </div>

          <div className="field">
            <label>Notas (opcional)</label>
            <textarea rows={2} value={form.notas} onChange={e => set('notas', e.target.value)}
              placeholder="Observaciones..." />
          </div>

          <div style={{ background: 'rgba(140,108,255,.07)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>
            💡 Este extra se contabilizará en <b>{MESES_ES[(form.mes||1)-1]} {form.ano}</b> en los reportes.
          </div>
        </div>
        <div className="modal-foot">
          {extra && (
            <button className="btn btn-danger btn-sm" onClick={() => onDelete(extra)} disabled={saving}>
              Eliminar
            </button>
          )}
          <button className="btn btn-ghost" onClick={onClose} disabled={saving}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Guardando…' : (extra ? 'Actualizar' : 'Crear Extra')}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Extras({ extras, vendedores, onNew, onEdit, onDelete, isViewer }) {
  const vName = id => vendedores.find(v => v.id === id)?.nombre || '-'
  const now = new Date()
  const [filtroAno, setFiltroAno] = useState(now.getFullYear())

  const anos = [...new Set(extras.map(e => e.ano))].sort((a,b)=>b-a)
  if (!anos.includes(filtroAno) && anos.length > 0) {
    // no action needed, just show all
  }

  const filtrados = extras.filter(e => e.ano === filtroAno)
  const porMes = MESES_ES.map((nombre, i) => {
    const del = filtrados.filter(e => e.mes === i+1)
    return { mes: i+1, nombre, items: del, total: del.reduce((s,e)=>s+(Number(e.monto)||0),0) }
  }).filter(m => m.items.length > 0)

  const total = filtrados.reduce((s,e)=>s+(Number(e.monto)||0),0)

  return (
    <section className="view">
      <div className="page-head">
        <div>
          <h1>⚡ Extras</h1>
          <p>Ingresos adicionales no relacionados a cumpleaños del sistema</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <select value={filtroAno} onChange={e => setFiltroAno(Number(e.target.value))}
            style={{ background: 'var(--panel-solid)', border: '1px solid var(--border)', color: 'var(--text)', font: 'inherit', fontSize: 14, padding: '9px 12px', borderRadius: 'var(--radius-sm)' }}>
            {(anos.length > 0 ? anos : [now.getFullYear()]).map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          {!isViewer && (
            <button className="btn btn-primary btn-sm" onClick={onNew}>+ Nuevo Extra</button>
          )}
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20, padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ color: 'var(--muted)', fontSize: 13 }}>Total extras {filtroAno}</div>
        <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 28, fontWeight: 700, color: 'var(--good)' }}>{money(total)}</div>
      </div>

      {filtrados.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>⚡</div>
          <div>No hay extras registrados en {filtroAno}</div>
          {!isViewer && <button className="btn btn-primary btn-sm" style={{ marginTop: 16 }} onClick={onNew}>+ Agregar primer extra</button>}
        </div>
      ) : (
        <div>
          {porMes.map(m => (
            <div key={m.mes} style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 17, color: 'var(--purple)', margin: 0 }}>
                  {m.nombre} {filtroAno}
                </h3>
                <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, color: 'var(--good)' }}>{money(m.total)}</span>
              </div>
              <div className="table-wrap">
                <table>
                  <thead><tr>
                    <th>Nombre / Descripción</th><th>Vendedor</th><th>Monto</th><th>Notas</th>
                    {!isViewer && <th>Acciones</th>}
                  </tr></thead>
                  <tbody>
                    {m.items.map(e => (
                      <tr key={e.id}>
                        <td data-label="Nombre" className="strong">
                          <span style={{ background: 'rgba(168,85,247,.12)', color: 'var(--purple)', fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4, marginRight: 6 }}>EXTRA</span>
                          {e.nombre}
                        </td>
                        <td data-label="Vendedor">{vName(e.vendedor)}</td>
                        <td data-label="Monto" style={{ color: 'var(--blue)', fontWeight: 600 }}>{money(e.monto)}</td>
                        <td data-label="Notas" style={{ color: 'var(--muted)', fontSize: 12 }}>{e.notas || '-'}</td>
                        {!isViewer && (
                          <td data-label="Acciones">
                            <button className="btn btn-ghost btn-sm" onClick={() => onEdit(e)}>✏️</button>
                            <button className="btn btn-danger btn-sm" style={{ marginLeft: 4 }} onClick={() => onDelete(e)}>🗑</button>
                          </td>
                        )}
                      </tr>
                    ))}
                    <tr style={{ borderTop: '2px solid var(--border)' }}>
                      <td colSpan={!isViewer ? 2 : 2} style={{ color: 'var(--muted)', fontSize: 12, padding: '10px 16px' }}>
                        {m.items.length} extra{m.items.length !== 1 ? 's' : ''}
                      </td>
                      <td style={{ color: 'var(--blue)', fontWeight: 700, padding: '10px 16px' }}>{money(m.total)}</td>
                      <td colSpan={!isViewer ? 2 : 1}></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

export { ExtraModal }
