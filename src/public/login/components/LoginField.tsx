import React, { useState } from 'react';
import { CircleAlert, Eye, EyeClosed } from 'lucide-react';
import type { InputHTMLAttributes, ReactNode } from 'react';

interface LoginFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: ReactNode;
  validationError?: string;
}

export default function LoginField({
  label,
  icon,
  type,
  validationError,
  ...inputProps
}: LoginFieldProps) {
  const [visible, setVisible] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword && visible ? 'text' : type;

  return (
    <div className="login-field">
      <div className="login-input-wrap">
      <input {...inputProps} type={inputType} placeholder=" "
        aria-invalid={validationError ? true : undefined}
        aria-describedby={[inputProps['aria-describedby'], validationError ? `${inputProps.id}-validation` : '', isPassword && capsLock ? `${inputProps.id}-caps` : ''].filter(Boolean).join(' ') || undefined}
        onKeyDown={event => { if (isPassword) setCapsLock(event.getModifierState('CapsLock')); inputProps.onKeyDown?.(event); }}
        onKeyUp={event => { if (isPassword) setCapsLock(event.getModifierState('CapsLock')); inputProps.onKeyUp?.(event); }}
        onBlur={event => { setCapsLock(false); inputProps.onBlur?.(event); }}
      />
      <label className="login-label" htmlFor={inputProps.id}>{label}</label>

      {isPassword ? (
        <button
          className={`login-eye${visible ? '' : ' login-eye-active'}`}
          type="button"
          disabled={inputProps.disabled}
          onClick={() => setVisible(!visible)}
          aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          aria-pressed={visible}
        >
          {visible ? (
            <Eye size={20} strokeWidth={2} aria-hidden="true" />
          ) : (
            <EyeClosed size={20} strokeWidth={2} aria-hidden="true" />
          )}
        </button>
      ) : (
        <span className="login-field-icon">{icon}</span>
      )}
      </div>
      {validationError && <p id={`${inputProps.id}-validation`} className="login-validation" role="alert">
        <CircleAlert size={18} strokeWidth={2} aria-hidden="true" />
        <span>{validationError}</span>
      </p>}
      {isPassword && capsLock && <p id={`${inputProps.id}-caps`} className="login-caps" role="status">Bloq Mayús está activado.</p>}
    </div>
  );
}

