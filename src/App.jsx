import { useEffect, useRef, useState } from 'react'
import { supabase, supabaseConfigurado } from './supabaseClient'
import {
  getLeads, getVendedores,
  createLead, updateLead, deleteLead,
  createVendedor, updateVendedor, deleteVendedor,
} from './lib/data'
import { COMISION } from './constants'
import { ultimaHoraInicio, hayConflicto } from './lib/helpers'

import Auth from './components/Auth'
import Sidebar from './components/Sidebar'
import Dashboard from './components/Dashboard'
import Leads from './components/Leads'
import LeadModal from './components/LeadModal'
import Vendedores from './components/Vendedores'
import VendedorModal from './components/VendedorModal'
import Calendario from './components/Calendario'
import Toast from './components/Toast'

export default function App() {
  const [session, setSession] = useState(null)
  const [authReady, setAuthReady] = useState(false)

  const [leads, setLeads] = useState([])
  const [vendedores, setVendedores] = useState([])
  const [dataReady, setDataReady] = useState(false)

  const [view, setView] = useState('dashboard')
  const [leadModal, setLeadModal] = useState(null)
  const [vendModal, setVendModal] = useState(null)
  const [saving, setSaving] = useState(false)

  const [toast, setToast] = useState({ msg: '', type: 'ok', show: false })
  const timer = useRef()

  function notify(msg, type = 'ok') {
    setToast({ msg, type, show: true })
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setToast((t) => ({ ...t, show: false })), 2800)
  }

  // ---------- Sesión ----------
  useEffect(() => {
    if (!supabaseConfigurado) {
      setAuthReady(true)
      return
    }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setAuthReady(true)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  // ---------- Carga de datos + Realtime ----------
  useEffect(() => {
    if (!session) return
    let activo = true
    ;(async () => {
      try {
        const [v, l] = await Promise.all([getVendedores(), getLeads()])
        if (!activo) return
        setVendedores(v)
        setLeads(l)
      } catch (e) {
        notify('Error cargando datos: ' + e.message, 'bad')
      } finally {
        if (activo) setDataReady(true)
      }
    })()

    // Realtime: escucha cambios en tiempo real de cualquier usuario
    const channel = supabase
      .channel('universum-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' },
        () => { getLeads().then(l => setLeads(l)) })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vendedores' },
        () => { getVendedores().then(v => setVendedores(v)) })
      .subscribe()

    return () => {
      activo = false
      supabase.removeChannel(channel)
    }
  }, [session])

  const reloadLeads = async () => setLeads(await getLeads())
  const reloadVend = async () => setVendedores(await getVendedores())

  // ---------- Handlers de leads ----------
  function openNewLead(preset) { setLeadModal({ lead: null, preset: preset || null }) }
  function openEditLead(lead) { setLeadModal({ lead, preset: null }) }

  async function onSaveLead(payload, id) {
    if (!payload.nombre) { notify('El nombre del cliente es obligatorio', 'bad'); return false }
    if (!payload.telefono) { notify('El teléfono es obligatorio', 'bad'); return false }

    if (payload.fecha && payload.hora) {
      if (parseInt(payload.hora) > ultimaHoraInicio(payload.fecha)) {
        notify('Esa hora está fuera del horario de ese día', 'bad'); return false
      }
      const c = hayConflicto(leads, payload.fecha, payload.hora, payload.paquete, id)
      if (c) { notify(`Choca con la reserva de ${c.nombre} (${c.hora})`, 'bad'); return false }
    }
    if (payload.estado === 'Cerrado' && (Number(payload.monto_cerrado) || 0) <= 0) {
      notify('Para cerrar el lead ingresa el monto cerrado', 'bad'); return false
    }

    payload.comision =
      payload.estado === 'Cerrado'
        ? +((Number(payload.monto_cerrado) || 0) * COMISION).toFixed(2)
        : 0

    try {
      setSaving(true)
      if (id) await updateLead(id, payload)
      else await createLead(payload)
      await reloadLeads()
      notify(id ? 'Lead actualizado' : 'Lead creado', 'ok')
      return true
    } catch (e) {
      notify('Error al guardar: ' + e.message, 'bad')
      return false
    } finally {
      setSaving(false)
    }
  }

  async function onDeleteLead(lead) {
    if (!confirm(`¿Eliminar el lead de "${lead.nombre}"? Esta acción no se puede deshacer.`)) return
    try {
      await deleteLead(lead.id)
      await reloadLeads()
      notify('Lead eliminado', 'ok')
    } catch (e) {
      notify('Error: ' + e.message, 'bad')
    }
  }

  // ---------- Handlers de vendedores ----------
  async function onSaveVend(payload, id) {
    if (!payload.nombre) { notify('El nombre del vendedor es obligatorio', 'bad'); return false }
    try {
      setSaving(true)
      if (id) await updateVendedor(id, payload)
      else await createVendedor(payload)
      await reloadVend()
      notify(id ? 'Vendedor actualizado' : 'Vendedor agregado', 'ok')
      return true
    } catch (e) {
      notify('Error: ' + e.message, 'bad')
      return false
    } finally {
      setSaving(false)
    }
  }

  async function onDeleteVend(v) {
    const asignados = leads.filter((l) => l.vendedor === v.id).length
    const msg = asignados
      ? `"${v.nombre}" tiene ${asignados} lead(s) asignado(s). Quedarán sin vendedor. ¿Eliminar?`
      : `¿Eliminar al vendedor "${v.nombre}"?`
    if (!confirm(msg)) return
    try {
      await deleteVendedor(v.id)
      await Promise.all([reloadVend(), reloadLeads()])
      notify('Vendedor eliminado', 'ok')
    } catch (e) {
      notify('Error: ' + e.message, 'bad')
    }
  }

  async function logout() {
    await supabase.auth.signOut()
    setDataReady(false)
    setLeads([])
    setVendedores([])
  }

  // ---------- Render ----------
  if (!authReady) {
    return (
      <div className="center-screen">
        <div><div className="spinner"></div><div className="loading-text">Cargando…</div></div>
      </div>
    )
  }

  if (!session) return <Auth />

  if (!dataReady) {
    return (
      <div className="center-screen">
        <div><div className="spinner"></div><div className="loading-text">Cargando tus datos…</div></div>
      </div>
    )
  }

  return (
    <>
      <div className="app">
        <Sidebar
          view={view}
          setView={setView}
          email={session.user?.email}
          onLogout={logout}
        />
        <main className="main">
          {view === 'dashboard' && (
            <Dashboard leads={leads} vendedores={vendedores} onNewLead={() => openNewLead()} />
          )}
          {view === 'leads' && (
            <Leads
              leads={leads}
              vendedores={vendedores}
              onNew={() => openNewLead()}
              onEdit={openEditLead}
              onDelete={onDeleteLead}
            />
          )}
          {view === 'vendedores' && (
            <Vendedores
              vendedores={vendedores}
              leads={leads}
              onNew={() => setVendModal({ vendedor: null })}
              onEdit={(v) => setVendModal({ vendedor: v })}
              onDelete={onDeleteVend}
            />
          )}
          {view === 'calendario' && (
            <Calendario leads={leads} onNew={openNewLead} onEdit={openEditLead} />
          )}
        </main>
      </div>

      {leadModal && (
        <LeadModal
          key={leadModal.lead?.id || 'nuevo'}
          lead={leadModal.lead}
          preset={leadModal.preset}
          vendedores={vendedores}
          onSave={onSaveLead}
          onClose={() => setLeadModal(null)}
          saving={saving}
        />
      )}
      {vendModal && (
        <VendedorModal
          key={vendModal.vendedor?.id || 'nuevo'}
          vendedor={vendModal.vendedor}
          onSave={onSaveVend}
          onClose={() => setVendModal(null)}
          saving={saving}
        />
      )}

      <Toast toast={toast} />
    </>
  )
}
