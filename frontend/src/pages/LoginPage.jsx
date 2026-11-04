import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { forgotPasswordRequest, resetPasswordRequest } from '../services/authApi.js'

const EyeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
)

const EyeOffIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
    <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
    <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
    <line x1="2" y1="2" x2="22" y2="22" />
  </svg>
)

function PasswordField({ id, label, value, onChange, error, autoComplete = 'current-password', placeholder = '********' }) {
  const [visible, setVisible] = useState(false)
  return (
    <div>
      <label htmlFor={id} className="block text-[15px] font-medium text-text mb-1.5">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required
          autoComplete={autoComplete}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 pr-10 text-text focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder={placeholder}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
        >
          {visible ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </div>
      {error && <p className="text-xs text-error mt-1">{error}</p>}
    </div>
  )
}

function LoginPage() {
  const { login, user, sessionExpired, clearSessionExpiredFlag } = useAuth()
  const navigate = useNavigate()

  const [mode, setMode] = useState('login') // 'login' | 'forgot' | 'reset'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [resetCode, setResetCode] = useState('')
  const [issuedCode, setIssuedCode] = useState('')
  const [codeExpiresAt, setCodeExpiresAt] = useState(null)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  useEffect(() => {
    if (user) {
      navigate('/', { replace: true })
    }
  }, [user, navigate])

  useEffect(() => {
    return () => clearSessionExpiredFlag()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function switchMode(nextMode) {
    setMode(nextMode)
    setError('')
    setNotice('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      await login(email, password)
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.message || 'Email ou mot de passe incorrect.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleForgotSubmit(event) {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      const result = await forgotPasswordRequest(email)
      setIssuedCode(result.code || '')
      setCodeExpiresAt(result.expiresAt ? new Date(result.expiresAt) : null)
      setNotice(result.message)
      switchMode('reset')
    } catch (err) {
      setError(err.message || "Impossible de générer le code de vérification.")
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleResetSubmit(event) {
    event.preventDefault()
    setError('')

    if (newPassword !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.')
      return
    }

    setIsSubmitting(true)
    try {
      const result = await resetPasswordRequest(email, resetCode, newPassword)
      setNotice(result.message + ' Vous pouvez vous connecter.')
      switchMode('login')
      setPassword('')
      setResetCode('')
      setNewPassword('')
      setConfirmPassword('')
      setIssuedCode('')
    } catch (err) {
      setError(err.message || 'Code invalide ou expiré.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 py-10 overflow-hidden bg-slate-950">
      <img src="/bg_emit.webp" alt="" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-slate-950/60" />

      <div className="relative z-10 w-full max-w-7xl grid md:grid-cols-2 gap-16 items-center">
        <section className="hidden md:flex flex-col gap-8 text-white">
          <div>
            <img src="/logo_emit.png" alt="EMIT" className="h-16 w-auto rounded-lg bg-white px-4 py-2" />
            <h2 className="mt-4 text-4xl xl:text-5xl font-bold leading-snug">
              Suivi et pilotage des enseignants, centralisé et lisible.
            </h2>
          </div>
          <ul className="space-y-4 text-lg text-slate-200">
            {[
              'Planning des séances en temps réel',
              'Progression, alertes et clôture par enseignement',
              'Tableaux de bord pour les responsables',
            ].map((t) => (
              <li key={t} className="flex items-start gap-2">
                <span className="mt-0.5 h-4 w-4 shrink-0 rounded-full bg-emerald-400/80 flex items-center justify-center text-[10px] font-bold text-slate-900">
                  ✓
                </span>
                {t}
              </li>
            ))}
          </ul>
        </section>

        <div className="w-full max-w-md ml-auto bg-white/95 backdrop-blur rounded-xl shadow-2xl p-10">
          <img src="/logo_emit.png" alt="EMIT" className="h-14 w-auto mb-5" />
          <h1 className="text-3xl font-bold text-text mb-1">Connexion</h1>
          <p className="text-base text-slate-500 mb-7">Accédez à votre espace EMIT</p>

        {sessionExpired && mode === 'login' && (
          <p className="text-sm text-warning bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-4">
            Votre session a expiré, veuillez vous reconnecter.
          </p>
        )}

        {notice && (
          <p className="text-sm text-success bg-green-50 border border-green-200 rounded-lg px-3 py-2 mb-4">
            {notice}
          </p>
        )}

        {mode === 'login' && (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label htmlFor="email" className="block text-[15px] font-medium text-text mb-1.5">
                Adresse email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="username"
                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-base text-text focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="prenom.nom@emit.mg"
              />
            </div>

            <PasswordField id="password" label="Mot de passe" value={password} onChange={setPassword} />

            <div className="flex justify-end -mt-2">
              <button
                type="button"
                onClick={() => switchMode('forgot')}
                className="text-[15px] text-primary hover:underline"
              >
                Mot de passe oublié ?
              </button>
            </div>

            {error && (
              <p className="text-sm text-error bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 bg-primary hover:bg-primary-dark disabled:opacity-60 text-white font-medium rounded-lg px-4 py-3 text-base transition-colors"
            >
              {isSubmitting ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>
        )}

        {mode === 'forgot' && (
          <form onSubmit={handleForgotSubmit} className="flex flex-col gap-4">
            <div>
              <label htmlFor="forgot-email" className="block text-[15px] font-medium text-text mb-1.5">
                Adresse email
              </label>
              <input
                id="forgot-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="username"
                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-base text-text focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="prenom.nom@emit.mg"
              />
            </div>

            {error && (
              <p className="text-sm text-error bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 bg-primary hover:bg-primary-dark disabled:opacity-60 text-white font-medium rounded-lg px-4 py-3 text-base transition-colors"
            >
              {isSubmitting ? 'Envoi...' : 'Demander un code'}
            </button>
            <button
              type="button"
              onClick={() => switchMode('login')}
              className="text-[15px] text-slate-500 hover:text-slate-700"
            >
              Retour à la connexion
            </button>
          </form>
        )}

        {mode === 'reset' && (
          <form onSubmit={handleResetSubmit} className="flex flex-col gap-4">
            {issuedCode && (
              <div className="text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                <p className="text-slate-600 mb-1">
                  Aucun email n'étant configuré, voici votre code (valide 10 minutes) :
                </p>
                <p className="font-mono text-lg tracking-widest text-text font-semibold select-all">{issuedCode}</p>
                {codeExpiresAt && (
                  <p className="text-xs text-slate-400 mt-1">
                    Expire à {codeExpiresAt.toLocaleTimeString('fr-FR')}
                  </p>
                )}
              </div>
            )}

            <div>
              <label htmlFor="reset-code" className="block text-[15px] font-medium text-text mb-1.5">
                Code de vérification
              </label>
              <input
                id="reset-code"
                type="text"
                inputMode="numeric"
                pattern="\d{6}"
                maxLength={6}
                value={resetCode}
                onChange={(e) => setResetCode(e.target.value.replace(/\D/g, ''))}
                required
                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-base text-text focus:outline-none focus:ring-2 focus:ring-primary font-mono tracking-widest"
                placeholder="123456"
              />
            </div>

            <PasswordField
              id="new-password"
              label="Nouveau mot de passe"
              value={newPassword}
              onChange={setNewPassword}
              autoComplete="new-password"
            />
            <PasswordField
              id="confirm-password"
              label="Confirmer le mot de passe"
              value={confirmPassword}
              onChange={setConfirmPassword}
              autoComplete="new-password"
            />

            {error && (
              <p className="text-sm text-error bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 bg-primary hover:bg-primary-dark disabled:opacity-60 text-white font-medium rounded-lg px-4 py-3 text-base transition-colors"
            >
              {isSubmitting ? 'Envoi...' : 'Réinitialiser'}
            </button>
            <button
              type="button"
              onClick={() => switchMode('forgot')}
              className="text-[15px] text-slate-500 hover:text-slate-700"
            >
              Demander un nouveau code
            </button>
          </form>
        )}
        </div>
      </div>
    </div>
  )
}

export default LoginPage
