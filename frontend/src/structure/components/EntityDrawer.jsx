import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { entities } from '../config/entities.jsx';
import { toPayload, validateAll, validateField } from '../utils/validation';
import { BASE } from '../config/paths.js';
import { PLAN_STANDARD, libelleAnnee } from '../utils/dates.js';

// Champs affiches : ceux marques `createOnly` n'existent qu'a la creation.
function visibleFields(config, isEdit) {
  return config.fields.filter((f) => !(isEdit && f.createOnly));
}

function buildInitialValues(config, initialData) {
  const isEdit = Boolean(initialData?.id);
  const values = {};
  visibleFields(config, isEdit).forEach((field) => {
    const existing = initialData ? initialData[field.name] : undefined;
    if (existing !== undefined && existing !== null) values[field.name] = existing;
    else if (!isEdit && field.defaultValue) values[field.name] = field.defaultValue();
    else values[field.name] = field.type === 'checkbox' ? false : '';
  });
  return values;
}

/** Apercu de la structure creee automatiquement avec une nouvelle mention. */
function StructurePreview({ debut }) {
  const annee = libelleAnnee(debut);
  return (
    <div className="gen-preview" aria-live="polite">
      <div className="gen-preview-title">
        Sera généré automatiquement{annee ? ` pour ${annee}` : ''} :
      </div>
      {PLAN_STANDARD.map((cycle) => (
        <div key={cycle.type} className="gen-cycle">
          <strong>{cycle.type}</strong>
          <ul>
            {cycle.niveaux.map(([niveau, [a, b]]) => (
              <li key={niveau}>
                <span className="pill">{niveau}</span> S{a} · S{b}
              </li>
            ))}
          </ul>
        </div>
      ))}
      <p className="field-hint">Les matières s'ajoutent ensuite, semestre par semestre, dans la vue arborescente.</p>
    </div>
  );
}

export default function EntityDrawer({ config, initialData, onClose, onSaved }) {
  const isEdit = Boolean(initialData?.id);
  const fields = visibleFields(config, isEdit);
  const [values, setValues] = useState(() => buildInitialValues(config, initialData));
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [options, setOptions] = useState({}); // { fieldName: { loading, error, items } }
  const formRef = useRef(null);
  const initialRef = useRef(JSON.stringify(buildInitialValues(config, initialData)));
  const dirty = JSON.stringify(values) !== initialRef.current;

  // Charge les listes deroulantes (relations)
  useEffect(() => {
    let cancelled = false;
    config.fields
      .filter((f) => f.type === 'relation')
      .forEach((field) => {
        setOptions((prev) => ({ ...prev, [field.name]: { loading: true, items: [] } }));
        api
          .get(entities[field.target].endpoint)
          .then((res) => {
            if (!cancelled) setOptions((prev) => ({ ...prev, [field.name]: { loading: false, items: res.data } }));
          })
          .catch((err) => {
            if (!cancelled) {
              setOptions((prev) => ({
                ...prev,
                [field.name]: { loading: false, items: [], error: err.userMessage },
              }));
            }
          });
      });
    return () => {
      cancelled = true;
    };
  }, [config]);

  // Focus sur le premier champ + fermeture avec Echap
  useEffect(() => {
    formRef.current?.querySelector('input, select')?.focus();
    function onKey(e) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  function setValue(name, value) {
    setValues((prev) => ({ ...prev, [name]: value }));
    // re-valide en direct une fois le champ touche
    if (touched[name] || errors[name]) {
      const field = fields.find((f) => f.name === name);
      setErrors((prev) => ({ ...prev, [name]: validateField(field, value) }));
    }
  }

  function handleBlur(field) {
    setTouched((prev) => ({ ...prev, [field.name]: true }));
    setErrors((prev) => ({ ...prev, [field.name]: validateField(field, values[field.name]) }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError('');
    const found = validateAll(fields, values);
    setErrors(found);
    setTouched(Object.fromEntries(fields.map((f) => [f.name, true])));
    if (Object.keys(found).length > 0) {
      const firstInvalid = fields.find((f) => found[f.name]);
      formRef.current?.querySelector(`#field-${firstInvalid.name}`)?.focus();
      return;
    }

    setSaving(true);
    try {
      let payload = toPayload(fields, values);
      let saved;
      if (isEdit) {
        // Modification : seuls les champs changes sont envoyes (evite de renvoyer une ancienne date de fin).
        const initial = JSON.parse(initialRef.current);
        payload = Object.fromEntries(Object.entries(payload).filter(([k]) => String(values[k]) !== String(initial[k])));
        saved = (await api.patch(`${config.endpoint}/${initialData.id}`, payload)).data;
      } else {
        saved = (await api.post(config.endpoint, payload)).data;
      }
      onSaved(isEdit ? 'modifié' : 'ajouté', saved);
    } catch (err) {
      if (err.fieldErrors) {
        setErrors(Object.fromEntries(Object.entries(err.fieldErrors).map(([k, v]) => [k, v[0]])));
        setFormError(err.userMessage);
      } else {
        setFormError(err.userMessage);
      }
    } finally {
      setSaving(false);
    }
  }

  function requestClose() {
    if (dirty && !window.confirm('Vous avez des modifications non enregistrées. Fermer quand même ?')) return;
    onClose();
  }

  return (
    <div className="drawer-backdrop" onMouseDown={(e) => e.target === e.currentTarget && requestClose()}>
      <form
        ref={formRef}
        className="drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
        onSubmit={handleSubmit}
        noValidate
      >
        <div className="drawer-head">
          <div>
            <div className="eyebrow">{isEdit ? 'Modification' : 'Nouvel élément'}</div>
            <h3 id="drawer-title">
              {isEdit ? `Modifier — ${config.singular}` : `Ajouter ${config.article} ${config.singular.toLowerCase()}`}
            </h3>
          </div>
          <button type="button" className="close-btn" onClick={requestClose} aria-label="Fermer le formulaire">
            ×
          </button>
        </div>

        {formError && (
          <div className="form-error" role="alert">
            {formError}
          </div>
        )}

        <div className="drawer-body">
          {fields.map((field) => {
            const id = `field-${field.name}`;
            const error = errors[field.name];
            const describedBy = error ? `${id}-error` : field.help ? `${id}-help` : undefined;
            const common = {
              id,
              'aria-invalid': error ? 'true' : undefined,
              'aria-describedby': describedBy,
              onBlur: () => handleBlur(field),
              className: error ? 'has-error' : undefined,
            };
            const opt = options[field.name];
            const relationTarget = field.type === 'relation' ? entities[field.target] : null;

            return (
              <div className="field" key={field.name}>
                <label htmlFor={id} className={field.type === 'checkbox' ? 'sr-only' : undefined}>
                  {field.label}
                  {field.required && (
                    <span className="req" aria-hidden="true">
                      {' '}
                      *
                    </span>
                  )}
                </label>

                {field.type === 'select' && (
                  <select
                    {...common}
                    value={values[field.name]}
                    onChange={(e) => setValue(field.name, e.target.value)}
                  >
                    <option value="" disabled>
                      Choisir…
                    </option>
                    {values[field.name] && !field.options.some((o) => o.value === values[field.name]) && (
                      <option value={values[field.name]}>
                        {field.extraLabel ? field.extraLabel(values[field.name]) : values[field.name]}
                      </option>
                    )}
                    {field.options.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                )}

                {field.type === 'relation' && (
                  <>
                    <select
                      {...common}
                      value={values[field.name]}
                      disabled={opt?.loading}
                      onChange={(e) => setValue(field.name, e.target.value)}
                    >
                      <option value="" disabled>
                        {opt?.loading ? 'Chargement…' : 'Choisir…'}
                      </option>
                      {(opt?.items ?? []).map((item) => (
                        <option key={item.id} value={item.id}>
                          {relationTarget.optionLabel(item)}
                        </option>
                      ))}
                    </select>
                    {opt && !opt.loading && !opt.error && opt.items.length === 0 && (
                      <p className="field-hint warn">
                        Aucun(e) {relationTarget.singular.toLowerCase()} disponible.{' '}
                        <Link to={`${BASE}/${field.target}`} onClick={onClose}>
                          Créez-en un(e) d'abord
                        </Link>
                        .
                      </p>
                    )}
                    {opt?.error && <p className="field-error">{opt.error}</p>}
                  </>
                )}

                {field.type === 'date' && (
                  <input
                    {...common}
                    type="date"
                    min="2000-01-01"
                    max="2100-12-31"
                    value={values[field.name]}
                    onChange={(e) => setValue(field.name, e.target.value)}
                  />
                )}

                {field.type === 'checkbox' && (
                  <label className="check">
                    <input
                      {...common}
                      type="checkbox"
                      checked={Boolean(values[field.name])}
                      onChange={(e) => setValue(field.name, e.target.checked)}
                    />
                    <span>{field.label}</span>
                  </label>
                )}

                {(field.type === 'text' || field.type === 'number') && (
                  <input
                    {...common}
                    type={field.type}
                    inputMode={field.type === 'number' ? 'numeric' : undefined}
                    min={field.rules?.min}
                    max={field.rules?.max}
                    maxLength={field.type === 'text' ? field.rules?.maxLength : undefined}
                    placeholder={field.placeholder}
                    autoComplete="off"
                    value={values[field.name]}
                    onChange={(e) => setValue(field.name, e.target.value)}
                  />
                )}

                {error ? (
                  <p id={`${id}-error`} className="field-error" role="alert">
                    {error}
                  </p>
                ) : (
                  field.help && (
                    <p id={`${id}-help`} className="field-hint">
                      {field.help}
                    </p>
                  )
                )}
              </div>
            );
          })}
        </div>
        <div className="drawer-actions">
          <button type="button" className="btn-secondary" onClick={requestClose}>
            Annuler
          </button>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Enregistrement…' : isEdit ? 'Enregistrer' : 'Créer'}
          </button>
        </div>
      </form>
    </div>
  );
}