# Listado compartido de catálogos

`CatalogList<T>` recibe registros y funciones para mostrar sus campos. No conoce
endpoints, procedimientos SQL ni formularios. Los estilos viven en los componentes.

Ejemplo para Áreas, con nombres de propiedades distintos a Fuentes:

```tsx
import CatalogList from './CatalogList.tsx';

interface Area {
  IdArea: number;
  Nombre: string;
  Descripcion: string;
  Vigente: boolean;
}

function Areas({ areas }: { areas: Area[] }) {
  return <CatalogList
    items={areas}
    getKey={area => area.IdArea}
    getTitle={area => area.Nombre}
    getSubtitle={area => area.Descripcion}
    isActive={area => area.Vigente}
    labels={{ title: 'Áreas', singular: 'área', plural: 'áreas',
      all: 'Todas', active: 'Activas', inactive: 'Inactivas',
      activeState: 'Activa', inactiveState: 'Inactiva',
      empty: 'No hay áreas que coincidan' }}
  />;
}
```

- `details`: campos adicionales (`key`, `label`, `value`), sin límite fijo de campos.
- `onEdit` y `onToggle`: opcionales; sin ellos se muestran datos sin acciones.
- `isActive`: opcional; sin él se omiten estados y pestañas de estado.
- `loading`, `busy`, `error`, `onRetry`: estados de la consulta externa.
- `pageSize`: ocho por defecto. Los filtros y la paginación se aplican a los datos recibidos.
- `getSearchText`: permite personalizar la búsqueda; por defecto usa título y subtítulo.

La confirmación, los permisos y el guardado pertenecen a cada catálogo. El cambio
de estado de Fuentes conserva la confirmación y la API existentes en `useFuentes`.
Cada instancia mantiene sus propios filtros; no se comparte estado entre catálogos.
