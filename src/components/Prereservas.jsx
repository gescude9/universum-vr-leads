import { useState } from 'react'
import { money } from '../lib/helpers'

const MESES_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

const EXPERIENCIAS = [
  'Gaming',
  'Titanic',
  'Coliseo',
  'Everest',
  'Blue Moon',
  'Paraíso Salvaje',
  'Murchison Falls',
]

function PrereservaModal({ pr, vendedores, onSave, onDelete, onClose, saving }) {
  const now = new Date()
  const [form, setForm] = useState({
    nombre:      pr?.nombre      || '',
    experiencia: pr?.experiencia || '',
    personas:    pr?.personas    ?? 1,
    monto:       pr?.monto       ?? 0,
    vendedor:    pr?.vendedor    || '',
    mes:         pr?.mes         ?? (now.getMonth() + 1),
    ano:         pr?.ano         ?? now.getFullYear(),
    notas:       pr?.notas       || '',
  })

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  async function handleSave() {
    if (!form.nombre.trim())      { alert('Escribe el nombre del cliente'); return }
    if (!form.experiencia)        { alert('Selecciona una experiencia'); return }
    if (!form.personas || Number(form.personas) < 1) { alert('Ingresa la cantidad de personas'); return }
    const payload = {
      nombre:      form.nombre.trim(),
      experiencia: form.experiencia,
      personas:    Number(form.personas),
      monto:       Number(form.monto) || 0,
      vendedor:    form.vendedor || null,
      mes:         Number(form.mes),
      ano:         Number(form.ano),
      notas:       form.notas.trim() || null,
    }
    const ok = await onSave(payload, pr?.id)
    if (ok) onClose()
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 500 }}>
        <div className="modal-head">
          <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 20 }}>
            {pr ? 'Editar Pre-reserva' : '📋 Nueva Pre-reserva'}
          </h2>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">

          <div className="field">
            <label>Nombre del cliente *</label>
            <input value={form.nombre} onChange={e => set('nombre', e.target.value)}
              placeholder="Nombre del cliente" autoFocus />
          </div>

          <div className="field">
            <label>Experiencia *</label>
            <select value={form.experiencia} onChange={e => set('experiencia', e.target.value)}>
              <option value="">— Seleccionar experiencia —</option>
              {EXPERIENCIAS.map(exp => <option key={exp} value={exp}>{exp}</option>)}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="field">
              <label>Personas *</label>
              <input type="number" min={1} step={1} value={form.personas}
                onChange={e => set('personas', e.target.value)} placeholder="8" />
            </div>
            <div className="field">
              <label>Monto ($)</label>
              <input type="number" min={0} step={0.01} value={form.monto}
                onChange={e => set('monto', e.target.value)} placeholder="0.00" />
            </div>
          </div>

          <div className="field">
            <label>Vendedor (opcional)</label>
            <select value={form.vendedor} onChange={e => set('vendedor', e.target.value)}>
              <option value="">— Sin vendedor —</option>
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

          <div style={{ background: 'rgba(99,179,237,.07)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>
            📋 Esta pre-reserva se contabilizará en <b>{MESES_ES[(form.mes||1)-1]} {form.ano}</b> en los reportes.
          </div>
        </div>
        <div className="modal-foot">
          {pr && (
            <button className="btn btn-danger btn-sm" onClick={() => onDelete(pr)} disabled={saving}>
              Eliminar
            </button>
          )}
          <button className="btn btn-ghost" onClick={onClose} disabled={saving}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Guardando…' : (pr ? 'Actualizar' : 'Crear Pre-reserva')}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Prereservas({ prereservas, vendedores, onNew, onEdit, onDelete, isViewer }) {
  const vName = id => vendedores.find(v => v.id === id)?.nombre || '—'
  const now = new Date()
  const [filtroAno, setFiltroAno] = useState(now.getFullYear())

  const anos = [...new Set(prereservas.map(p => p.ano))].sort((a,b) => b-a)

  const filtrados = prereservas.filter(p => p.ano === filtroAno)
  const porMes = MESES_ES.map((nombre, i) => {
    const del = filtrados.filter(p => p.mes === i+1)
    return { mes: i+1, nombre, items: del, total: del.reduce((s,p) => s+(Number(p.monto)||0), 0) }
  }).filter(m => m.items.length > 0)

  const total = filtrados.reduce((s,p) => s+(Number(p.monto)||0), 0)

  return (
    <section className="view">
      <div className="page-head">
        <div>
          <h1>📋 Pre-reservas</h1>
          <p>Reservas con monto y experiencia confirmados</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <select value={filtroAno} onChange={e => setFiltroAno(Number(e.target.value))}
            style={{ background: 'var(--panel-solid)', border: '1px solid var(--border)', color: 'var(--text)', font: 'inherit', fontSize: 14, padding: '9px 12px', borderRadius: 'var(--radius-sm)' }}>
            {(anos.length > 0 ? anos : [now.getFullYear()]).map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          {!isViewer && (
            <button className="btn btn-primary btn-sm" onClick={onNew}>+ Nueva Pre-reserva</button>
          )}
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20, padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ color: 'var(--muted)', fontSize: 13 }}>Total pre-reservas {filtroAno}</div>
        <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 28, fontWeight: 700, color: 'var(--blue)' }}>{money(total)}</div>
      </div>

      {filtrados.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
          <div>No hay pre-reservas en {filtroAno}</div>
          {!isViewer && <button className="btn btn-primary btn-sm" style={{ marginTop: 16 }} onClick={onNew}>+ Agregar primera pre-reserva</button>}
        </div>
      ) : (
        <div>
          {porMes.map(m => (
            <div key={m.mes} style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 17, color: 'var(--blue)', margin: 0 }}>
                  {m.nombre} {filtroAno}
                </h3>
                <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, color: 'var(--blue)' }}>{money(m.total)}</span>
              </div>
              <div className="table-wrap">
                <table>
                  <thead><tr>
                    <th>Cliente</th><th>Experiencia</th><th>Personas</th><th>Vendedor</th><th>Monto</th><th>Notas</th>
                    {!isViewer && <th>Acciones</th>}
                  </tr></thead>
                  <tbody>
                    {m.items.map(p => (
                      <tr key={p.id}>
                        <td data-label="Cliente" className="strong">
                          <span style={{ background: 'rgba(99,179,237,.12)', color: 'var(--blue)', fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4, marginRight: 6 }}>PRE</span>
                          {p.nombre}
                        </td>
                        <td data-label="Experiencia"><span className="pkg-tag">{p.experiencia}</span></td>
                        <td data-label="Personas">{p.personas}p</td>
                        <td data-label="Vendedor">{vName(p.vendedor)}</td>
                        <td data-label="Monto" style={{ color: 'var(--blue)', fontWeight: 600 }}>{money(p.monto)}</td>
                        <td data-label="Notas" style={{ color: 'var(--muted)', fontSize: 12 }}>{p.notas || '—'}</td>
                        {!isViewer && (
                          <td data-label="Acciones">
                            <button className="btn btn-ghost btn-sm" onClick={() => onEdit(p)}>✏️</button>
                            <button className="btn btn-danger btn-sm" style={{ marginLeft: 4 }} onClick={() => onDelete(p)}>🗑</button>
                          </td>
                        )}
                      </tr>
                    ))}
                    <tr style={{ borderTop: '2px solid var(--border)' }}>
                      <td colSpan={4} style={{ color: 'var(--muted)', fontSize: 12, padding: '10px 16px' }}>
                        {m.items.length} pre-reserva{m.items.length !== 1 ? 's' : ''}
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

export { PrereservaModal }
