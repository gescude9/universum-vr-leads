import { useState } from 'react'
import { useTranslation } from 'react-i18next'

export default function VendedorModal({ vendedor, onSave, onClose, saving }) {
  const { t } = useTranslation()
  const [f, setF] = useState({ nombre: vendedor?.nombre || '', telefono: vendedor?.telefono || '', email: vendedor?.email || '' })
  const upd = (k, v) => setF(p => ({ ...p, [k]: v }))

  async function submit() {
    const ok = await onSave({ nombre: f.nombre.trim(), telefono: f.telefono.trim(), email: f.email.trim() }, vendedor?.id)
    if (ok) onClose()
  }

  return (
    <div className="overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal" style={{ maxWidth: 480 }}>
        <div className="modal-head">
          <h2>{vendedor ? t('vendedorModal.editarVendedor') : t('vendedorModal.nuevoVendedor')}</h2>
          <button className="x" onClick={onClose}>×</button>
        </div>
        <div className="modal-body" style={{ gridTemplateColumns: '1fr' }}>
          <div className="field"><label>{t('vendedorModal.nombre')}</label>
            <input value={f.nombre} onChange={e => upd('nombre', e.target.value)} placeholder={t('vendedorModal.nombrePlaceholder')} /></div>
          <div className="field"><label>{t('vendedorModal.telefono')}</label>
            <input value={f.telefono} onChange={e => upd('telefono', e.target.value)} /></div>
          <div className="field"><label>{t('vendedorModal.email')}</label>
            <input value={f.email} onChange={e => upd('email', e.target.value)} placeholder={t('vendedorModal.emailPlaceholder')} /></div>
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
