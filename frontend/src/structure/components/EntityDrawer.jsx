import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { entities } from '../config/entities.jsx';
import { toPayload, validateAll, validateField } from '../utils/validation';
import { BASE } from '../config/paths.js';

function buildInitialValues(config, initialData) {
  const values = {};
  config.fields.forEach((field) => {
    const existing = initialData ? initialData[field.name] : undefined;
    values[field.name] = existing === undefined || existing === null ? '' : existing;
  });
  return values;
}

export default function EntityDrawer({ config, initialData, onClose, onSaved }) {
  const isEdit = Boolean(initialData?.id);
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
      const field = config.fields.find((f) => f.name === name);
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
    const found = validateAll(config.fields, values);
    setErrors(found);
    setTouched(Object.fromEntries(config.fields.map((f) => [f.name, true])));
    if (Object.keys(found).length > 0) {
      const firstInvalid = config.fields.find((f) => found[f.name]);
      formRef.current?.querySelector(`#field-${firstInvalid.name}`)?.focus();
      return;
    }

    setSaving(true);
    try {
      const payload = toPayload(config.fields, values);
      if (isEdit) await api.patch(`${config.endpoint}/${initialData.id}`, payload);
      else await api.post(config.endpoint, payload);
      onSaved(isEdit ? 'modifié' : 'ajouté');
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
          {config.fields.map((field) => {
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
                <label htmlFor={id}>
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
