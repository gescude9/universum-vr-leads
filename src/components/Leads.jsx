import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { money, fmtFecha } from '../lib/helpers'
import { ESTADOS } from '../constants'

export default function Leads({ leads, vendedores, onNew, onEdit, onDelete }) {
  const { t } = useTranslation()
  const [q, setQ] = useState('')
  const [fe, setFe] = useState('')
  const [fv, setFv] = useState('')

  const vName = id => vendedores.find(v => v.id === id)?.nombre || '—'

  let rows = leads.slice()
  if (q) { const tx = q.toLowerCase(); rows = rows.filter(l => `${l.nombre} ${l.telefono||''} ${l.contacto||''}`.toLowerCase().includes(tx)) }
  if (fe) rows = rows.filter(l => l.estado === fe)
  if (fv) rows = rows.filter(l => l.vendedor === fv)

  return (
    <section className="view">
      <div className="page-head">
        <div><h1>{t('leads.titulo')}</h1><p>{t('leads.subtitulo')}</p></div>
        <button className="btn btn-primary" onClick={onNew}>{t('leads.nuevoLead')}</button>
      </div>
      <div className="toolbar">
        <input type="search" value={q} onChange={e => setQ(e.target.value)} placeholder={t('leads.buscar')} />
        <select value={fe} onChange={e => setFe(e.target.value)}>
          <option value="">{t('leads.todosEstados')}</option>
          {ESTADOS.map(e => <option key={e} value={e}>{t(`estados.${e}`)}</option>)}
        </select>
        <select value={fv} onChange={e => setFv(e.target.value)}>
          <option value="">{t('leads.todosVendedores')}</option>
          {vendedores.map(v => <option key={v.id} value={v.id}>{v.nombre}</option>)}
        </select>
      </div>
      <div className="table-wrap">
        <table>
          <thead><tr>
            <th>{t('leads.columnas.cliente')}</th>
            <th>{t('leads.columnas.cumpleanos')}</th>
            <th>{t('leads.columnas.paquete')}</th>
            <th>{t('leads.columnas.personas')}</th>
            <th>{t('leads.columnas.vendedor')}</th>
            <th>{t('leads.columnas.estado')}</th>
            <th>{t('leads.columnas.estimado')}</th>
            <th>{t('leads.columnas.cerrado')}</th>
            <th>{t('leads.columnas.comision')}</th>
            <th></th>
          </tr></thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={10} className="empty"><div className="big">✨</div>{t('leads.sinLeads')}</td></tr>
            ) : rows.map(l => (
              <tr key={l.id}>
                <td data-label={t('leads.columnas.cliente')}><div className="strong">{l.nombre}</div><div className="sub">{l.contacto || l.telefono || ''}</div></td>
                <td data-label={t('leads.columnas.cumpleanos')}>{fmtFecha(l.fecha)}<div className="sub">{l.hora || ''}</div></td>
                <td data-label={t('leads.columnas.paquete')}><span className="pkg-tag">{l.paquete}</span>{l.premium && <div className="sub">{l.premium}</div>}</td>
                <td data-label={t('leads.columnas.personas')}>{l.personas}</td>
                <td data-label={t('leads.columnas.vendedor')}>{vName(l.vendedor)}</td>
                <td data-label={t('leads.columnas.estado')}><span className={`pill st-${l.estado}`}>{t(`estados.${l.estado}`)}</span></td>
                <td data-label={t('leads.columnas.estimado')}>{money(l.monto_estimado)}</td>
                <td data-label={t('leads.columnas.cerrado')}>{l.estado === 'Cerrado' ? money(l.monto_cerrado) : '—'}</td>
                <td data-label={t('leads.columnas.comision')} style={{ color: 'var(--good)', fontWeight: 600 }}>{l.estado === 'Cerrado' ? money(l.comision) : '—'}</td>
                <td>
                  <button className="btn btn-ghost btn-sm" onClick={() => onEdit(l)}>{t('leads.editar')}</button>{' '}
                  <button className="btn btn-danger btn-sm" onClick={() => onDelete(l)}>{t('leads.eliminar')}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
