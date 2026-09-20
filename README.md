# HorarioEdu — Fase D (Autenticación y permisos)

Este es el scaffolding real de Next.js + Supabase Auth para el proyecto
`preicfes2020pp-ops's Project` (ref `hmazqbwqodbiyburvczn`). No usa datos
simulados: el login, el dashboard y la protección de rutas hablan
directamente con tu Supabase real, respetando las políticas RLS que ya
configuramos en las Fases B y C.

## 1. Instalar dependencias

```bash
npm install
```

## 2. Configurar variables de entorno

```bash
cp .env.local.example .env.local
```

El archivo de ejemplo ya trae la URL y la clave `anon` de tu proyecto
(`hmazqbwqodbiyburvczn`). Esa clave es segura para el frontend: el acceso
real está controlado por las políticas RLS de Supabase, no por esta clave.
**Nunca** agregues aquí la `service_role key`.

## 3. Ejecutar en desarrollo

```bash
npm run dev
```

Abre http://localhost:3000

## 4. Cómo probar la autenticación y los roles

Ya existen 3 usuarios de prueba en la base de datos (perfiles `docente`,
`rector`, `superadmin`), pero **no tienen contraseña asignada todavía**
porque `auth.users` y `perfiles` son tablas separadas por diseño de
Supabase Auth. Para poder iniciar sesión con ellos:

1. Ve al dashboard de Supabase → Authentication → Users.
2. Verifica si esos usuarios ya existen en `auth.users` (deberían, ya que
   `perfiles.id` referencia `auth.users.id`).
3. Si necesitas una contraseña de prueba, usa el botón "Send magic link"
   o "Reset password" desde ese panel — no se puede fijar una contraseña
   directamente por SQL, es una decisión de seguridad de Supabase.

Alternativa más simple para probar ya mismo: crea un usuario nuevo desde
`/login` una vez agreguemos la página de registro (Fase E), o créalo
manualmente desde Authentication → Users → "Add user" en el dashboard de
Supabase, y luego crea su fila correspondiente en `perfiles` con el mismo
`id` y el `rol` que quieras probar.

## 5. Qué queda protegido

El archivo `middleware.ts` protege estas rutas por rol (ver tabla
`REGLAS_DE_ACCESO`): si un docente intenta entrar a `/profesores` o
`/generador`, es redirigido a `/dashboard` con un aviso. Todas las rutas
requieren sesión activa excepto `/login`.

Las páginas de cada módulo (`/profesores`, `/asignaturas`, `/aulas`, etc.)
todavía no existen — son la Fase E (CRUD). Este scaffolding cubre
únicamente autenticación, sesión, perfil y navegación por rol.

## Riesgos / cosas a revisar

- El middleware hace una consulta a `perfiles` en cada navegación a una
  ruta protegida por rol. Es aceptable para el tamaño actual de datos,
  pero si la institución crece mucho, conviene cachear el rol en el JWT
  (custom claims de Supabase Auth) en vez de consultarlo cada vez.
- No se tocó ninguna tabla ni dato de Supabase en esta fase — es código
  de aplicación puro.

## 6. Crear profesores con cuenta real

Para que el botón "Crear profesor" funcione, necesitas la `service_role key`
de tu proyecto de Supabase (es distinta de la clave pública `anon`):

1. Ve a supabase.com/dashboard → tu proyecto `preicfes2020pp-ops` → Project
   Settings → API.
2. En "Project API keys", copia la clave marcada como **service_role**
   (NO la `anon`/`publishable`).
3. En tu `.env.local`, reemplaza `pega_aqui_tu_service_role_key` con esa
   clave.
4. Reinicia `npm run dev`.

**Esta clave es extremadamente sensible** — bypassa todas las políticas RLS
de tu base de datos. Nunca la subas a git, nunca la compartas, nunca la
pongas en una variable que empiece con `NEXT_PUBLIC_`.

## 7. Camino hacia Play Store (TWA)

Este proyecto ya incluye lo necesario para empaquetarse como PWA
(`public/manifest.json`, `public/sw.js`, íconos). Pasos que tú vas a dar
fuera de este proyecto, cuando estés listo para publicar:

1. **Despliega la app** en un dominio público con HTTPS (recomendado:
   Vercel — conecta este repo y listo, detecta Next.js automáticamente).
2. Configura las variables de entorno (`NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) en el panel
   de tu proveedor de hosting — nunca las subas al repositorio.
3. Instala la herramienta oficial de Google: `npm i -g @bubblewrap/cli`
4. Corre `bubblewrap init --manifest=https://tu-dominio.com/manifest.json`
   — esto genera el proyecto Android completo automáticamente.
5. Sube el archivo `assetlinks.json` que Bubblewrap genera a
   `https://tu-dominio.com/.well-known/assetlinks.json` (verifica que tú
   eres dueño del dominio, requisito de Android).
6. `bubblewrap build` genera el `.aab` que subes a Google Play Console
   (cuenta de desarrollador, pago único de $25 USD).

## 8. Pruebas (Fase 31)

### Pruebas del motor (rápidas, sin Supabase)

```bash
npm test
```

Verifica, con datos 100% aislados en memoria: que nunca se genera un
profesor/aula/grupo duplicado en el mismo bloque, que se respeta la
disponibilidad del docente, que se reportan conflictos cuando falta
intensidad horaria, que nunca se usa un bloque de descanso, que se respeta
el tipo de aula requerido, y que el detector de imposibilidades funciona.

### Pruebas de integración (contra tu Supabase real, en datos aislados)

```bash
npm run test:integracion
```

Inicia sesión de verdad como coordinador, rector y docente de prueba, y
confirma que las políticas RLS realmente bloquean lo que deben bloquear
(rector no puede crear aulas, docente no puede leer nada del módulo), y que
la base de datos rechaza códigos de grupo duplicados. Crea y borra sus
propios datos de prueba — nunca toca "sagrada familia" ni tu institución
real.

**Requiere** que las cuentas de prueba (`coordinador.prueba@aula360.test`,
`rector.prueba@aula360.test`, `docente.prueba@aula360.test`) sigan
existiendo con las contraseñas configuradas durante el desarrollo. Si las
cambiaste, actualízalas en `tests/integracion.test.ts`.
