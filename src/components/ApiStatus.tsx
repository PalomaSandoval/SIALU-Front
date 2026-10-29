import { errorMessage } from '../services/errors.ts';
import React, { useEffect, useState } from 'react';
import { api } from '../services/api.ts';

export default function ApiStatus() {
  const [message, setMessage] = useState('Comprobando conexión…');
  useEffect(() => {
    const controller = new AbortController();
    api.health({ signal: controller.signal }).then(data => setMessage(`${data.application}: ${data.status}`))
      .catch(error => { if (!controller.signal.aborted) setMessage(errorMessage(error)); });
    return () => controller.abort();
  }, []);
  return <p role="status">{message}</p>;
}

