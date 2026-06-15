export default function Toast({ toast }) {
  const cls = `toast ${toast.show ? 'show' : ''} ${toast.type || 'ok'}`
  return <div className={cls}>{toast.msg}</div>
}
