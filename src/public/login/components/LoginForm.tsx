import React, { useState } from 'react';
import { CircleAlert, CircleUserRound, LoaderCircle } from 'lucide-react';
import type { FormEvent } from 'react';
import { useAuth } from '../../../auth/AuthProvider.tsx';
import { errorMessage } from '../../../services/errors.ts';
import LoginField from './LoginField.tsx';
import { theme } from '../../../theme/theme.ts';

export default function LoginForm() {
  const { login } = useAuth();
  const [busy, setBusy] = useState(false);
  const [submitHovered, setSubmitHovered] = useState(false);
  const [error, setError] = useState('');
  const [invalidField, setInvalidField] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;

    const form = event.currentTarget;
    const fields = new FormData(form);
    const uid = String(fields.get('uid') ?? '').trim();
    const password = String(fields.get('password') ?? '');

    const missingField = !uid ? 'uid' : !password ? 'password' : '';
    setInvalidField(missingField);
    setError('');
    if (missingField) {
      (form.elements.namedItem(missingField) as HTMLInputElement).focus();
      return;
    }

    setBusy(true);
    setError('');

    try {
      await login(uid, password);
      form.reset();
    } catch (error) {
      setError(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      className="login-form"
      noValidate
      onSubmit={handleSubmit}
      aria-busy={busy}
    >
      <LoginField
        id="uid"
        name="uid"
        type="text"
        label="Usuario"
        autoComplete="username"
        autoCapitalize="none"
        spellCheck={false}
        required
        disabled={busy}
        validationError={invalidField === 'uid' ? 'Completa este campo' : undefined}
        onChange={event => { if (event.currentTarget.value.trim() && invalidField === 'uid') setInvalidField(''); }}
        icon={<CircleUserRound size={20} strokeWidth={1.5} aria-hidden="true" />}
      />

      <LoginField
        id="password"
        name="password"
        type="password"
        label="Contraseña"
        autoComplete="current-password"
        required
        disabled={busy}
        validationError={invalidField === 'password' ? 'Completa este campo' : undefined}
        onChange={event => { if (event.currentTarget.value && invalidField === 'password') setInvalidField(''); }}
      />

      {error && (
        <p className="login-notice login-error" role="alert">
          <CircleAlert size={18} aria-hidden="true" />
          <span>{error}</span>
        </p>
      )}

      <button
        className="login-submit"
        type="submit"
        disabled={busy}
        onMouseEnter={() => setSubmitHovered(true)}
        onMouseLeave={() => setSubmitHovered(false)}
        style={{
          width: '100%',
          minHeight: 54,
          marginTop: 12,
          border: 0,
          borderRadius: 999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          background: submitHovered && !busy ? theme.colors.buttonHover : 'var(--login-primary)',
          color: theme.colors.buttonText,
          fontFamily: theme.fonts.body,
          fontSize: 14,
          fontWeight: 700,
          cursor: busy ? 'wait' : 'pointer',
          transition: 'background .2s, color .2s, box-shadow .2s',
        }}
      >
        {busy && <LoaderCircle className="login-spinner" size={20} aria-hidden="true" />}
        Iniciar sesión
      </button>
    </form>
  );
}
