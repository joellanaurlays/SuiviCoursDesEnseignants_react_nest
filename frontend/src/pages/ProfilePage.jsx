import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { changePassword, updateProfile } from '../services/usersApi.js'

function ProfilePage() {
    const { user, updateUserData } = useAuth()

  const [firstName, setFirstName] = useState(user.firstName || '')
  const [lastName, setLastName] = useState(user.lastName || '')
  const [phone, setPhone] = useState(user.phone || '')
  const [profileMessage, setProfileMessage] = useState(null)
  const [isSavingProfile, setIsSavingProfile] = useState(false)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [passwordMessage, setPasswordMessage] = useState(null)
  const [isSavingPassword, setIsSavingPassword] = useState(false)

  async function handleProfileSubmit(event) {
    event.preventDefault()
    setProfileMessage(null)
    setIsSavingProfile(true)

    try {
        const updated = await updateProfile({ firstName, lastName, phone })
      updateUserData(updated)
      setProfileMessage({ type: 'success', text: 'Profil mis à jour avec succès.' })
    } catch (err) {
      setProfileMessage({ type: 'error', text: err.message })
    } finally {
      setIsSavingProfile(false)
    }
  }

  async function handlePasswordSubmit(event) {
    event.preventDefault()
    setPasswordMessage(null)
    setIsSavingPassword(true)

    try {
        await changePassword({ currentPassword, newPassword })
      setPasswordMessage({ type: 'success', text: 'Mot de passe mis à jour avec succès.' })
      setCurrentPassword('')
      setNewPassword('')
    } catch (err) {
      setPasswordMessage({ type: 'error', text: err.message })
    } finally {
      setIsSavingPassword(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg px-6 py-8">
      <div className="max-w-xl mx-auto">
        <Link to="/dashboard" className="text-sm text-primary hover:text-primary-dark">
          &larr; Retour
        </Link>

        <h1 className="text-2xl font-bold text-text mt-2 mb-6">Mon profil</h1>

        <form
          onSubmit={handleProfileSubmit}
          className="bg-white border border-slate-200 rounded-xl p-6 mb-6 flex flex-col gap-4"
        >
          <h2 className="text-lg font-semibold text-text">Informations personnelles</h2>

          <div>
            <label className="block text-sm font-medium text-text mb-1">Email</label>
            <input
              type="email"
              value={user.email}
              disabled
              className="w-full rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-slate-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-1">Prénom</label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-text focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-1">Nom</label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
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

          {profileMessage && (
            <p
              className={`text-sm rounded-lg px-3 py-2 border ${
                profileMessage.type === 'success'
                  ? 'text-success bg-green-50 border-green-200'
                  : 'text-error bg-red-50 border-red-200'
              }`}
            >
              {profileMessage.text}
            </p>
          )}

          <button
            type="submit"
            disabled={isSavingProfile}
            className="self-start bg-primary hover:bg-primary-dark disabled:opacity-60 text-white font-medium rounded-lg px-4 py-2 transition-colors"
          >
            {isSavingProfile ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </form>

        <form
          onSubmit={handlePasswordSubmit}
          className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col gap-4"
        >
          <h2 className="text-lg font-semibold text-text">Changer le mot de passe</h2>

          <div>
            <label className="block text-sm font-medium text-text mb-1">Mot de passe actuel</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-text focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-1">Nouveau mot de passe</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-text focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {passwordMessage && (
            <p
              className={`text-sm rounded-lg px-3 py-2 border ${
                passwordMessage.type === 'success'
                  ? 'text-success bg-green-50 border-green-200'
                  : 'text-error bg-red-50 border-red-200'
              }`}
            >
              {passwordMessage.text}
            </p>
          )}

          <button
            type="submit"
            disabled={isSavingPassword}
            className="self-start bg-primary hover:bg-primary-dark disabled:opacity-60 text-white font-medium rounded-lg px-4 py-2 transition-colors"
          >
            {isSavingPassword ? 'Enregistrement...' : 'Changer le mot de passe'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default ProfilePage