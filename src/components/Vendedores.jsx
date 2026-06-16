import { useTranslation } from 'react-i18next'
import { money } from '../lib/helpers'

export default function Vendedores({ vendedores, leads, onNew, onEdit, onDelete }) {
  const { t } = useTranslation()
  return (
    <section className="view">
      <div className="page-head">
        <div><h1>{t('vendedores.titulo')}</h1><p>{t('vendedores.subtitulo')}</p></div>
        <button className="btn btn-primary" onClick={onNew}>{t('vendedores.nuevoVendedor')}</button>
      </div>
      <div className="table-wrap">
        <table>
          <thead><tr>
            <th>{t('vendedores.columnas.vendedor')}</th>
            <th>{t('vendedores.columnas.contacto')}</th>
            <th>{t('vendedores.columnas.leads')}</th>
            <th>{t('vendedores.columnas.cerrados')}</th>
            <th>{t('vendedores.columnas.conversion')}</th>
            <th>{t('vendedores.columnas.totalVendido')}</th>
            <th>{t('vendedores.columnas.comision')}</th>
            <th></th>
          </tr></thead>
          <tbody>
            {vendedores.length === 0 ? (
              <tr><td colSpan={8} className="empty">{t('vendedores.sinVendedores')}</td></tr>
            ) : vendedores.map(v => {
              const sus = leads.filter(l => l.vendedor === v.id)
              const cerr = sus.filter(l => l.estado === 'Cerrado')
              const vendido = cerr.reduce((s, l) => s + (Number(l.monto_cerrado) || 0), 0)
              const comision = cerr.reduce((s, l) => s + (Number(l.comision) || 0), 0)
              const conv = sus.length ? Math.round(cerr.length / sus.length * 100) : 0
              return (
                <tr key={v.id}>
                  <td className="strong">{v.nombre}</td>
                  <td><div className="sub">{v.telefono || '—'}</div><div className="sub">{v.email || ''}</div></td>
                  <td>{sus.length}</td>
                  <td>{cerr.length}</td>
                  <td>{conv}%<div className="bar"><i style={{ width: `${conv}%` }}></i></div></td>
                  <td>{money(vendido)}</td>
                  <td style={{ color: 'var(--good)', fontWeight: 600 }}>{money(comision)}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => onEdit(v)}>{t('vendedores.editar')}</button>{' '}
                    <button className="btn btn-danger btn-sm" onClick={() => onDelete(v)}>{t('vendedores.eliminar')}</button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}
