import { useTranslation } from 'react-i18next'

export default function LanguageToggle() {
  const { i18n } = useTranslation()
  const isEN = i18n.language?.startsWith('en')

  function toggle() {
    i18n.changeLanguage(isEN ? 'es' : 'en')
  }

  return (
    <button className="lang-toggle" onClick={toggle} title={isEN ? 'Cambiar a Español' : 'Switch to English'}>
      <span className={!isEN ? 'lang-active' : ''}>ES</span>
      <span className="lang-sep">|</span>
      <span className={isEN ? 'lang-active' : ''}>EN</span>
    </button>
  )
}
