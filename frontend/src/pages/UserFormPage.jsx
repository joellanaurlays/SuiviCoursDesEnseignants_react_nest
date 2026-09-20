import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { createUser, getUser, updateUser } from '../services/usersApi.js'
import { listRoles } from '../services/rolesApi.js'

function UserFormPage() {
  const { id } = useParams()
  const isEditMode = Boolean(id)
  const navigate = useNavigate()

  const [roles, setRoles] = useState([])
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [roleId, setRoleId] = useState('')
  const [isActive, setIsActive] = useState(true)

  const [isLoading, setIsLoading] = useState(isEditMode)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    listRoles().then(setRoles).catch((err) => setError(err.message))
  }, [])

  useEffect(() => {
    if (!isEditMode) return

    getUser(id)
      .then((user) => {
        setEmail(user.email)
        setFirstName(user.firstName)
        setLastName(user.lastName)
        setPhone(user.phone || '')
        setIsActive(user.isActive)
        setRoleId(String(user.roleId))
      })
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false))
  }, [id, isEditMode])

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      if (isEditMode) {
        await updateUser(id, {
          email,
          firstName,
          lastName,
          phone: phone || undefined,
          roleId: Number(roleId),
          isActive,
        })
      } else {
        await createUser({
          email,
          password,
          firstName,
          lastName,
          phone: phone || undefined,
          roleId: Number(roleId),
          isActive,
        })
      }
      navigate('/users', { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return <p style={{ textAlign: 'center', marginTop: '4rem' }}>Chargement...</p>
  }

  return (
    <div className="min-h-screen bg-bg px-6 py-8">
      <div className="max-w-lg mx-auto">
        <Link to="/users" className="text-sm text-primary hover:text-primary-dark">
          &larr; Retour à la liste
        </Link>

        <h1 className="text-2xl font-bold text-text mt-2 mb-6">
          {isEditMode ? "Modifier l'utilisateur" : 'Nouvel utilisateur'}
        </h1>

        <form
          onSubmit={handleSubmit}
          className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col gap-4"
        >
          <div>
            <label className="block text-sm font-medium text-text mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-text focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {!isEditMode && (
            <div>
              <label className="block text-sm font-medium text-text mb-1">Mot de passe</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-text focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-text mb-1">Prénom</label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-text focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-1">Nom</label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-text focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-1">Téléphone</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="034 00 000 00"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-text focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-1">Rôle</label>
            <select
              value={roleId}
              onChange={(e) => setRoleId(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-text focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="" disabled>
                Sélectionner un rôle
              </option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.description || r.name}
                </option>
              ))}
            </select>
          </div>

          <label className="flex items-center gap-2 text-sm text-text">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="rounded border-slate-300"
            />
            Compte actif
          </label>

          {error && (
            <p className="text-sm text-error bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 bg-primary hover:bg-primary-dark disabled:opacity-60 text-white font-medium rounded-lg px-4 py-2 transition-colors"
          >
            {isSubmitting ? 'Enregistrement...' : isEditMode ? 'Enregistrer' : 'Créer'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default UserFormPage