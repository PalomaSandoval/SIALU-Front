# SIALU Front

React + TypeScript + Vite con npm. Sin estilos, dashboard ni pantallas de catálogos. La pantalla mínima comprueba la conexión y permite iniciar y cerrar sesión.

## Ejecutar

En `C:\xampp\htdocs\SIALU-api`:

```powershell
C:\xampp\php\php.exe artisan serve --host=127.0.0.1 --port=8000
```

En `C:\xampp\htdocs\SIALU-Front`:

```powershell
npm install
npm run dev
```

Abrir http://127.0.0.1:5173. Para compilar: `npm run build`.

## Conexión

`src/services/api.ts` centraliza las peticiones a `/api/v1`. Vite reenvía `/api` al backend Laravel. El navegador usa el mismo origen para conservar las cookies de sesión y evitar configuración CORS adicional.

El cliente obtiene el token CSRF antes de escribir y lo renueva después del login. No guarda contraseñas ni tokens en localStorage. Los errores de validación y sesión llegan como `ApiError`, con `status` y `errors`. Una respuesta 419 requiere repetir la acción; no se reenvían escrituras automáticamente.

Para cambiar el backend, copiar `.env.example` a `.env`, ajustar `API_TARGET` y reiniciar Vite. No poner secretos en variables VITE_.

Ejemplo para consumir otro endpoint:

```js
import { request } from './services/api.ts';
const { data } = await request('/catalogos/coordinaciones');
```

Las rutas protegidas requieren iniciar sesión con una cuenta institucional y los permisos correspondientes. La pantalla muestra el JSON de `/me` para comprobar la sesión.

El proxy configurado es de desarrollo. Al desplegar dist, configurar `/api` hacia Laravel bajo el mismo origen y HTTPS; `vite preview` no incluye este proxy.

## Organización de src

- main.tsx: arranca React.
- App.tsx: reúne el router y el proveedor de sesión.
- routes/: declara rutas y controla el acceso público y privado.
- public/login/Main.tsx: reúne las partes de la pantalla /login.
- public/login/components/LoginForm.tsx: formulario completo, con campos, botón y lógica de envío.
- private/home/Main.tsx: pantalla /, disponible al iniciar sesión.
- auth/AuthProvider.tsx: estado de sesión, login y logout compartidos.
- services/api.ts: conexión con Laravel, cookies y CSRF.
- components/: componentes compartidos, como el estado de conexión.

La carpeta src/public contiene pantallas React; no es la carpeta public de archivos estáticos de Vite. Separar carpetas no sustituye la autorización de Laravel: la API sigue comprobando sesión y permisos.

Para agregar una pantalla, crear su carpeta en src/public o src/private, reunir sus componentes en Main.tsx y registrar la ruta en routes/AppRoutes.tsx.



