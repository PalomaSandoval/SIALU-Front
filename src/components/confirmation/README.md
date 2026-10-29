# Confirmación compartida

El proveedor está registrado en App dentro del router. Cualquier pantalla puede
pedir una decisión antes de llamar a su API, sin duplicar el diseño:

```tsx
import { useConfirmation } from './ConfirmationProvider.tsx';

const confirm = useConfirmation();
const accepted = await confirm({
  title: '¿Desactivar registro?',
  description: 'Puedes volver a activarlo cuando lo necesites.',
  confirmLabel: 'Desactivar',
  cancelLabel: 'Cancelar',
  tone: 'danger',
});
if (!accepted) return;
// Ejecutar aquí la acción propia del catálogo.
```

`tone` es opcional (`default` o `danger`). Los estilos están en ConfirmDialog.tsx.
Cancelar, cerrar, Escape o navegar a otra página resuelven `false`.
El diálogo nativo HTML conserva el foco y bloquea la interacción con el fondo;
no usa window.confirm ni librerías nuevas. Una segunda solicitud mientras hay
una decisión pendiente se cancela sin reemplazar el diálogo original.
