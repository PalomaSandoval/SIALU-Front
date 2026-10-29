import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import ConfirmDialog from './ConfirmDialog.tsx';
import type { ConfirmationOptions } from './ConfirmDialog.tsx';

type Confirm = (options: ConfirmationOptions) => Promise<boolean>;
const ConfirmationContext = createContext<Confirm | null>(null);

export function ConfirmationProvider({ children }: { children: ReactNode }) {
  const [options, setOptions] = useState<ConfirmationOptions | null>(null);
  const pending = useRef<((confirmed: boolean) => void) | null>(null);
  const mounted = useRef(true);
  const location = useLocation();
  const finish = useCallback((confirmed: boolean) => {
    const resolve = pending.current;
    pending.current = null;
    setOptions(null);
    resolve?.(confirmed);
  }, []);
  const confirm = useCallback<Confirm>(next => {
    // Do not replace a pending decision if the user clicks an action twice.
    if (!mounted.current || pending.current) return Promise.resolve(false);
    return new Promise<boolean>(resolve => { pending.current = resolve; setOptions(next); });
  }, []);
  useEffect(() => { finish(false); }, [location.key, finish]);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; pending.current?.(false); pending.current = null; };
  }, []);

  return <ConfirmationContext.Provider value={confirm}>
    {children}
    <ConfirmDialog options={options} onResolve={finish} />
  </ConfirmationContext.Provider>;
}

export function useConfirmation(): Confirm {
  const confirm = useContext(ConfirmationContext);
  if (!confirm) throw new Error('useConfirmation debe usarse dentro de ConfirmationProvider.');
  return confirm;
}
