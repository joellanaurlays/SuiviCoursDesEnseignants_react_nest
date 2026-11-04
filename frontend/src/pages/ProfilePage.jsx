import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, KeyRound, UserRound } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { changePassword, updateProfile } from '../services/usersApi.js'
import { PasswordField } from '../components/ui/PasswordField'

const ROLE_LABELS = {
  ENSEIGNANT: 'Enseignant',
  CHEF_SCOLARITE: 'Chef de scolarité',
  ADMINISTRATEUR: 'Administrateur',
  RESPONSABLE_LICENCE: 'Responsable Licence',
  RESPONSABLE_MASTER: 'Responsable Master',
  RESPONSABLE_MENTION: 'Responsable de mention',
}

const inputClass =
  'block w-full pl-3 pr-3 py-2 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-[#00B4D8] focus:border-[#00B4D8] sm:text-sm'

const buttonClass =
  'px-4 py-2 bg-[#0077B6] text-white rounded-md text-sm font-medium hover:bg-[#03045E] disabled:opacity-60 transition-colors'

function MessageBanner({ message }) {
  if (!message) return null
  return (
    <p
      className={`text-sm rounded-md px-3 py-2 border ${
        message.type === 'success'
          ? 'text-green-700 bg-green-50 border-green-200'
          : 'text-red-600 bg-red-50 border-red-100'
      }`}
    >
      {message.text}
    </p>
  )
}

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

  const initials = `${(user.firstName || '?')[0]}${(user.lastName || ' ')[0]}`.toUpperCase()

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
    <div className="max-w-2xl mx-auto">
      <div className="mb-6 border-b pb-4">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-[#0077B6]"
        >
          <ArrowLeft size={16} />
          Retour au tableau de bord
        </Link>
        <h1 className="text-3xl font-bold text-[#03045E] mt-2">Mon profil</h1>
        <p className="text-sm text-gray-500 mt-1">Gérez vos informations personnelles et votre mot de passe.</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
        <div className="flex items-center gap-4">
          <span className="w-14 h-14 rounded-full bg-[#00B4D8] text-[#03045E] flex items-center justify-center text-xl font-bold shrink-0">
            {initials}
          </span>
          <div className="min-w-0">
            <p className="text-lg font-semibold text-gray-900 truncate">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-sm text-gray-500 truncate">{user.email}</p>
            <span className="inline-block mt-1 px-2 text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
              {ROLE_LABELS[user.role] || user.role}
            </span>
          </div>
        </div>
      </div>

      <form
        onSubmit={handleProfileSubmit}
        className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6"
      >
        <div className="flex items-center gap-2 mb-5">
          <UserRound size={18} className="text-[#0077B6]" />
          <h2 className="text-lg font-semibold text-[#03045E]">Informations personnelles</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={user.email}
              disabled
              className={`${inputClass} bg-gray-100 text-gray-500 cursor-not-allowed`}
            />
          </div>

          <div>
            <label htmlFor="profile-first-name" className="block text-sm font-medium text-gray-700 mb-1">
              Prénom
            </label>
            <input
              id="profile-first-name"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="profile-last-name" className="block text-sm font-medium text-gray-700 mb-1">
              Nom
            </label>
            <input
              id="profile-last-name"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="profile-phone" className="block text-sm font-medium text-gray-700 mb-1">
              Téléphone
            </label>
            <input
              id="profile-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="034 00 000 00"
              className={inputClass}
            />
          </div>
        </div>

        <div className="mt-5 space-y-4">
          <MessageBanner message={profileMessage} />
          <button type="submit" disabled={isSavingProfile} className={buttonClass}>
            {isSavingProfile ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </form>

      <form
        onSubmit={handlePasswordSubmit}
        className="bg-white rounded-xl border border-gray-200 shadow-sm p-6"
      >
        <div className="flex items-center gap-2 mb-5">
          <KeyRound size={18} className="text-[#0077B6]" />
          <h2 className="text-lg font-semibold text-[#03045E]">Changer le mot de passe</h2>
        </div>

        <div className="space-y-4">
          <PasswordField
            id="current-password"
            label="Mot de passe actuel"
            value={currentPassword}
            onChange={setCurrentPassword}
            required
          />
          <PasswordField
            id="new-password"
            label="Nouveau mot de passe"
            value={newPassword}
            onChange={setNewPassword}
            required
            minLength={6}
            autoComplete="new-password"
          />
        </div>

        <div className="mt-5 space-y-4">
          <MessageBanner message={passwordMessage} />
          <button type="submit" disabled={isSavingPassword} className={buttonClass}>
            {isSavingPassword ? 'Enregistrement...' : 'Changer le mot de passe'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default ProfilePage
