import { useConfirmation } from './ConfirmationProvider.tsx';

export default function useEditConfirmation() {
  const confirm = useConfirmation();
  return (name: string, description?: string) => confirm({
    title: '¿Guardar cambios?',
    description: description || `¿Estás seguro de guardar los cambios en «${name}»?`,
    confirmLabel: 'Guardar cambios',
    cancelLabel: 'Seguir editando',
  });
}
