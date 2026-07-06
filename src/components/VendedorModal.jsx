import { useState } from 'react'
import { useTranslation } from 'react-i18next'

export default function VendedorModal({ vendedor, onSave, onClose, saving }) {
  const { t } = useTranslation()
  const [f, setF] = useState({
    nombre: vendedor?.nombre || '',
    telefono: vendedor?.telefono || '',
    email: vendedor?.email || '',
    comision_pct: vendedor?.comision_pct ?? 10,
  })
  const upd = (k, v) => setF(p => ({ ...p, [k]: v }))

  async function submit() {
    const ok = await onSave({
      nombre: f.nombre.trim(),
      telefono: f.telefono.trim(),
      email: f.email.trim(),
      comision_pct: Number(f.comision_pct) || 10,
    }, vendedor?.id)
    if (ok) onClose()
  }

  return (
    <div className="overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal" style={{ maxWidth: 480 }}>
        <div className="modal-head">
          <h2>{vendedor ? t('vendedorModal.editarVendedor') : t('vendedorModal.nuevoVendedor')}</h2>
          <button className="x" onClick={onClose}>x</button>
        </div>
        <div className="modal-body" style={{ gridTemplateColumns: '1fr' }}>
          <div className="field">
            <label>{t('vendedorModal.nombre')}</label>
            <input value={f.nombre} onChange={e => upd('nombre', e.target.value)} placeholder={t('vendedorModal.nombrePlaceholder')} />
          </div>
          <div className="field">
            <label>{t('vendedorModal.telefono')}</label>
            <input value={f.telefono} onChange={e => upd('telefono', e.target.value)} />
          </div>
          <div className="field">
            <label>{t('vendedorModal.email')}</label>
            <input value={f.email} onChange={e => upd('email', e.target.value)} placeholder={t('vendedorModal.emailPlaceholder')} />
          </div>
          <div className="field">
            <label>Comision % (1-100)</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <input
                type="range" min="1" max="100" step="1"
                value={f.comision_pct}
                onChange={e => upd('comision_pct', e.target.value)}
                style={{ flex: 1, accentColor: 'var(--purple)' }}
              />
              <div style={{
                minWidth: 56, textAlign: 'center', fontFamily: 'Space Grotesk, sans-serif',
                fontSize: 22, fontWeight: 700, color: 'var(--purple)'
              }}>
                {f.comision_pct}%
              </div>
            </div>
            <div className="hint">Comision que recibe este vendedor sobre cada venta cerrada.</div>
          </div>
        </div>
        <div className="modal-foot">
          <button className="btn btn-ghost" onClick={onClose}>{t('vendedorModal.cancelar')}</button>
          <button className="btn btn-primary" onClick={submit} disabled={saving}>
            {saving ? t('vendedorModal.guardando') : t('vendedorModal.guardar')}
          </button>
        </div>
      </div>
    </div>
  )
}
