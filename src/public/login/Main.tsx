import React from 'react';
import { useAuth } from '../../auth/AuthProvider.tsx';
import LoginForm from './components/LoginForm.tsx';
import LoginHeader from './components/LoginHeader.tsx';
const loginStyles = `

.login-page {
  --login-primary: var(--palette-primary);
  min-height: 100svh;
  box-sizing: border-box;
  padding: 0;
  display: flex;
  background: var(--palette-white);
  font-family: var(--font-body);
  color: var(--palette-text);
}

body {
  margin: 0;
}

.login-page *, .login-page *::before, .login-page *::after {
  box-sizing: border-box;
}

.login-card {
  width: 100%;
  min-height: 100svh;
  display: grid;
  grid-template-columns: 1fr;
  padding: 16px;
  background: var(--palette-white);
}

.login-panel {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px 28px;
}

.login-content {
  width: 100%;
  max-width: 476px;
  padding: 40px 48px;
  border: 1px solid var(--palette-neutralSurface);
  border-radius: 28px;
  background: var(--palette-white);
  box-shadow: 0 12px 40px var(--palette-legacyCardShadow);
}

.login-header {
  text-align: center;
  margin-bottom: 36px;
}

.login-logos {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24px;
  margin-bottom: 28px;
}

.login-logo {
  display: block;
  width: auto;
  max-width: calc((100% - 24px) / 2);
  height: 120px;
  object-fit: contain;
}

.login-header h1 {
  font-size: clamp(24px,2.15vw,32px);
  font-weight: 800;
  line-height: 1.25;
  letter-spacing: -1.15px;
  margin: 0 0 12px;
}

.login-header p {
  margin: 0;
  color: var(--palette-legacyMuted);
  font-size: 14px;
  line-height: 1.6;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.login-field {
  position: relative;
}

.login-field input {
  width: 100%;
  height: 56px;
  border: 1px solid var(--palette-legacyBorder);
  border-radius: 999px;
  padding: 0 54px 0 22px;
  font: inherit;
  font-size: 14px;
  color: var(--palette-text);
  background: var(--palette-white);
  transition: box-shadow .2s, border-color .2s;
}

.login-field input::placeholder {
  color: var(--palette-legacyMuted);
  opacity: 1;
}

.login-field input:focus {
  outline: none;
  border: 2px solid var(--login-primary);
  padding-left: 21px;
  box-shadow: 0 0 0 4px var(--palette-legacyFocus);
}

.login-field-icon,.login-eye {
  position: absolute;
  right: 18px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--palette-icon);
  display: grid;
  place-items: center;
}

.login-eye {
  border: 0;
  background: transparent;
  padding: 8px;
  right: 10px;
  cursor: pointer;
  border-radius: 50%;
}

.login-options {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-size: 11px;
  line-height: 1.5;
}

.login-remember {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  color: var(--palette-legacyMuted);
}

.login-remember input {
  width: 15px;
  height: 15px;
  margin: 0;
  accent-color: var(--login-primary);
  cursor: pointer;
}

.login-recovery {
  border: 0;
  padding: 4px 0;
  background: transparent;
  color: var(--login-primary);
  font: inherit;
  font-weight: 500;
  cursor: pointer;
}

.login-recovery:hover {
  text-decoration: underline;
}





.login-page button:focus-visible,.login-remember input:focus-visible {
  outline: 2px solid var(--login-primary);
  outline-offset: 4px;
}

.login-page :disabled {
  cursor: wait;
  opacity: .65;
}

.login-notice {
  margin: 0;
  padding: 12px 16px;
  border-radius: 12px;
  background: var(--palette-noticeSurface);
  color: var(--palette-noticeText);
  font-size: 13px;
  line-height: 1.6;
}

.login-content > .login-notice {
  margin-bottom: 20px;
}

.login-image-panel {
  min-height: 480px;
  border-radius: 28px;
  overflow: hidden;
  background: var(--palette-neutralSurface);
  position: relative;
}

.login-image-panel img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.login-image-placeholder {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: var(--palette-placeholder);
  font-size: 13px;
}

.login-sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;
}

@media (max-width: 1000px) {
  .login-panel {
    padding-inline: 20px;
  }
  .login-options {
    flex-wrap: wrap;
    gap: 12px;
  }
}

@media (max-width: 767px) {
  .login-content {
    padding: 32px 24px;
    border-radius: 24px;
  }
  .login-page {
    padding: 0;
  }
  .login-card {
    grid-template-columns: 1fr;
    min-height: 100svh;
    padding: 8px;
  }
  .login-image-panel {
    display: none;
  }
  .login-panel {
    padding: 48px 16px;
  }
  .login-header h1 {
    font-size: 27px;
  }
  .login-options {
    font-size: 11px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .login-page * {
    transition: none;
  }
}

/* Login presentation and accessible interaction states. */
.login-page {
  --login-surface: var(--palette-white);
  --login-text: var(--palette-text);
  --login-muted: var(--palette-muted);
  --login-border: var(--palette-border);
  background: var(--palette-page);
  color: var(--login-text);
}
.login-card { background: transparent; }
.login-content {
  background: var(--login-surface);
  border-color: var(--login-border);
  box-shadow: 0 16px 48px var(--palette-cardShadow);
  animation: login-enter .4s ease-out both;
}
.login-header { margin-bottom: 20px; }
.login-logos { gap: 20px; margin-bottom: 20px; }
.login-logo { height: 80px; max-width: calc((100% - 42px) / 2); }
.login-logo-divider { width: 1px; height: 64px; background: var(--palette-divider); flex-shrink: 0; }
.login-header h1 { font-size: clamp(32px, 3vw, 38px); }
.login-header p { color: var(--login-muted); letter-spacing: -.2px; }
.login-form { gap: 18px; }
.login-label {
  position: absolute;
  left: 18px;
  top: 50%;
  transform: translateY(-50%);
  margin: 0;
  padding: 0 5px;
  color: var(--login-muted);
  font-size: 14px;
  line-height: 1.2;
  cursor: text;
  transition: top .18s ease, font-size .18s ease, color .18s ease;
}
.login-field input:focus + .login-label,
.login-field input:not(:placeholder-shown) + .login-label,
.login-field input:-webkit-autofill + .login-label {
  top: 0;
  font-size: 12px;
  background: var(--login-surface);
}
.login-field input:focus + .login-label { color: color-mix(in srgb, var(--login-muted) 90%, var(--palette-primary) 10%); }
.login-input-wrap { position: relative; }
.login-field input { border: 2px solid var(--login-border); padding-left: 21px; background: var(--login-surface); color: var(--login-text); }
.login-field input::placeholder { color: var(--login-muted); }
.login-field input:focus { box-shadow: 0 0 0 4px var(--palette-legacyFocusHalo); }
.login-field input:-webkit-autofill,
.login-field input:-webkit-autofill:hover,
.login-field input:-webkit-autofill:focus {
  -webkit-text-fill-color: var(--login-text);
  -webkit-box-shadow: 0 0 0 1000px var(--login-surface) inset;
  caret-color: var(--login-text);
}
.login-field input:-webkit-autofill:focus {
  box-shadow: 0 0 0 1000px var(--login-surface) inset, 0 0 0 4px var(--palette-legacyFocusHalo);
}

.login-error { display: flex; align-items: flex-start; gap: 8px; color: var(--palette-errorText); background: var(--palette-errorSurface); border: 1px solid var(--palette-errorBorder); }
.login-caps { color: var(--login-muted); font-size: 12px; margin: 8px 0 0; }
.login-footer { border-top: 1px solid var(--login-border); padding-top: 16px; margin-top: 24px; color: var(--login-muted); font-size: 11px; text-align: center; line-height: 1.6; }
.login-spinner { animation: login-spin .8s linear infinite; }
@keyframes login-spin { to { transform: rotate(360deg); } }
@keyframes login-enter { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
@media (prefers-color-scheme: dark) {
  .login-page {
    --login-surface: var(--palette-darkSurface);
    --login-text: var(--palette-darkText);
    --login-muted: var(--palette-darkMuted);
    --login-border: var(--palette-darkBorder);
    --login-primary: var(--palette-darkPrimary);
    color-scheme: dark;
    background: var(--palette-darkPage);
  }
  .login-logo { background: var(--palette-white); border-radius: 8px; padding: 4px; }
  .login-logo-divider { background: var(--palette-darkBorder); }
  .login-field input:focus { border-color: var(--palette-primary); }
  .login-error { display: flex; align-items: flex-start; gap: 8px; color: var(--palette-darkErrorText); background: var(--palette-darkErrorSurface); border-color: var(--palette-darkErrorBorder); }
  .login-eye, .login-field-icon { color: var(--palette-darkMuted); }
}
@media (prefers-reduced-motion: reduce) {
  .login-page *, .login-page *::before, .login-page *::after { animation: none; transition: none; }
}

.login-header h1::after {
  content: '';
  display: block;
  width: 48px;
  height: 3px;
  margin: 12px auto 0;
  border-radius: 3px;
  background: linear-gradient(90deg, var(--palette-primary), var(--palette-accent));
}
.login-error svg { flex-shrink: 0; margin-top: 1px; }

/* Password visibility control. */
.login-page .login-eye {
  width: 36px;
  height: 36px;
  padding: 0;
  right: 8px;
  color: var(--palette-eyeInactive);
  isolation: isolate;
  transition: color 200ms ease;
}
.login-eye::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: -1;
  border-radius: 50%;
  background: var(--palette-eyeHover);
  opacity: 0;
  transform: scale(.9);
  transition: opacity 200ms ease, transform 200ms ease, background 200ms ease, box-shadow 200ms ease;
}
.login-eye:hover:not(:disabled)::before {
  opacity: 1;
  transform: scale(1);
}
.login-page .login-eye-active { color: var(--palette-primary); }
.login-eye-active::before {
  background: var(--palette-eyeActive);
  box-shadow: 0 2px 6px var(--palette-eyeShadow);
  opacity: 1;
  transform: scale(1);
}
.login-eye-active:hover:not(:disabled)::before { background: var(--palette-eyeActiveHover); }
.login-page .login-eye:focus-visible {
  outline: 2px solid var(--palette-primary);
  outline-offset: 2px;
}
.login-eye svg { stroke-linecap: round; stroke-linejoin: round; }
@media (prefers-reduced-motion: reduce) {
  .login-page .login-eye, .login-eye::before { transition: none; }
}

.login-header h1 { font-family: var(--font-title); font-weight: 700; letter-spacing: 2px; }






.login-validation {
  position: absolute;
  top: 100%;
  left: 16px;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 8px;
  width: fit-content;
  max-width: 100%;
  margin: 10px 0 0;
  padding: 10px 12px;
  border: 1px solid var(--login-border);
  border-radius: 10px;
  background: var(--login-surface);
  color: var(--login-text);
  box-shadow: 0 4px 14px var(--palette-tooltipShadow);
  font-size: 12px;
  line-height: 1.5;
}
.login-validation::before {
  content: '';
  position: absolute;
  top: -5px;
  left: 20px;
  width: 8px;
  height: 8px;
  background: var(--login-surface);
  border-top: 1px solid var(--login-border);
  border-left: 1px solid var(--login-border);
  transform: rotate(45deg);
}
.login-validation svg { flex-shrink: 0; color: var(--palette-error); }
.login-field input[aria-invalid='true'] { border-color: var(--palette-error); }



/* Subtle focus treatment for login inputs. */
.login-page .login-field input:focus {
  border-color: var(--palette-focusBorder);
  box-shadow: 0 0 0 4px var(--palette-focusHalo);
}
.login-page .login-field input:-webkit-autofill:focus {
  border-color: var(--palette-focusBorder);
  box-shadow: 0 0 0 1000px var(--login-surface) inset, 0 0 0 4px var(--palette-focusHalo);
}
@media (prefers-color-scheme: dark) {
  .login-page .login-field input:focus { border-color: var(--palette-darkFocusBorder); }
}








`;
import { theme } from '../../theme/theme.ts';

export default function LoginMain() {
  const { error } = useAuth();

  return (
    <main className="login-page" style={theme.cssVariables}>
      <style>{loginStyles}</style>
      <link rel="stylesheet" href={theme.fonts.stylesheet} />
      <section className="login-card" aria-labelledby="login-title">
        <div className="login-panel">
          <div className="login-content">
            <LoginHeader />

            {error && (
              <p className="login-notice" role="alert">
                {error}
              </p>
            )}

            <LoginForm />
            <footer className="login-footer">© 2026 Universidad Autónoma de Chihuahua · CERT-UACH</footer>
          </div>
        </div>
      </section>
    </main>
  );
}
