import { useState } from 'react'

export default function VendedorModal({ vendedor, onSave, onClose, saving }) {
  const [f, setF] = useState({
    nombre: vendedor?.nombre || '',
    telefono: vendedor?.telefono || '',
    email: vendedor?.email || '',
  })
  const upd = (campo, valor) => setF((p) => ({ ...p, [campo]: valor }))

  async function submit() {
    const ok = await onSave(
      {
        nombre: f.nombre.trim(),
        telefono: f.telefono.trim(),
        email: f.email.trim(),
      },
      vendedor?.id
    )
    if (ok) onClose()
  }

  return (
    <div className="overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal" style={{ maxWidth: 480 }}>
        <div className="modal-head">
          <h2>{vendedor ? 'Editar vendedor' : 'Nuevo vendedor'}</h2>
          <button className="x" onClick={onClose}>×</button>
        </div>
        <div className="modal-body" style={{ gridTemplateColumns: '1fr' }}>
          <div className="field">
            <label>Nombre *</label>
            <input value={f.nombre} onChange={(e) => upd('nombre', e.target.value)} placeholder="Nombre del vendedor" />
          </div>
          <div className="field">
            <label>Teléfono</label>
            <input value={f.telefono} onChange={(e) => upd('telefono', e.target.value)} placeholder="Teléfono" />
          </div>
          <div className="field">
            <label>Email</label>
            <input value={f.email} onChange={(e) => upd('email', e.target.value)} placeholder="correo@ejemplo.com" />
          </div>
        </div>
        <div className="modal-foot">
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={submit} disabled={saving}>
            {saving ? 'Guardando…' : 'Guardar vendedor'}
          </button>
        </div>
      </div>
    </div>
  )
}
