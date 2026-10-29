import React from 'react';

export default function LoginHeader() {
  return (
    <header className="login-header">
      <div className="login-logos">
        <img
          className="login-logo"
          src="/images/loginUach.png"
          alt="Logo de la UACH"
        />
        <span className="login-logo-divider" aria-hidden="true" />
        <img
          className="login-logo"
          src="/images/loginCERT.png"
          alt="Logo de CERT"
        />
      </div>

      <h1 id="login-title">SIALU</h1>
      <p>Sistema Integral de Analítica de Logs Universitario</p>

    </header>
  );
}


