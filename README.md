# CUCEI Conecta 🎓

Plataforma web para que estudiantes de CUCEI **hagan preguntas** y **pidan asesorías a otros estudiantes**.
Proyecto de fin de semestre alineado al **ODS 4: Educación de calidad** (metas 4.3 y 4.4).

> Prototipo académico. No es un sitio oficial de la Universidad de Guadalajara.

## Secciones

| Sección | Qué hace |
|---|---|
| **Inicio** | Presentación, estadísticas y cómo funciona |
| **Preguntas** | Foro por materia: preguntar, responder, votar, marcar la mejor respuesta, reportar |
| **Asesorías** | Solicitar, aceptar, cancelar y calificar asesorías (presencial o en línea) |
| **Asesores** | Directorio de estudiantes asesores con materias, horario y calificación |
| **Impacto** | Indicadores medibles (SMART) y exportación de datos a CSV/JSON |
| **Seguridad** | Buenas prácticas de seguridad digital y qué hacer ante un ciberdelito |
| **Acerca** | Problema, objetivos y ODS 4 |
| **Aviso de privacidad** | Qué datos se usan y botón para borrarlos |

## Estructura

```
index.html      ← página principal
css/styles.css  ← diseño (se adapta a celular y modo oscuro)
js/config.js    ← ID de cliente de Google y dominio permitido (udg.mx)
js/data.js      ← materias, carreras y datos de ejemplo
js/app.js       ← funcionamiento de la página
```

## Inicio de sesión con Google (solo correos UdeG)

Las secciones Preguntas, Asesorías, Asesores e Impacto piden iniciar sesión con Google.
Solo se aceptan correos que terminan en `udg.mx` (por ejemplo `@alumnos.udg.mx` y `@academicos.udg.mx`).
Cualquier otra cuenta, como `@gmail.com`, se rechaza.

### Obtener el ID de cliente (una sola vez, ~5 min)

1. Entra a <https://console.cloud.google.com/> con tu cuenta de Google y crea un proyecto llamado `cucei-conecta`.
2. Ve a **APIs y servicios → Pantalla de consentimiento de OAuth** (Google Auth Platform) → **Comenzar**:
   - Nombre de la app: `CUCEI Conecta` · correo de asistencia: el tuyo
   - Público: **Externo** · correo de contacto: el tuyo → acepta y **Crear**.
3. En **Público** (Audience) haz clic en **Publicar app**. Así puede entrar cualquier cuenta y no solo los "usuarios de prueba".
   Como la página solo pide nombre y correo, Google no exige verificación.
4. En **Clientes** → **Crear cliente** → tipo **Aplicación web**. En **Orígenes autorizados de JavaScript** agrega:
   - `https://wences312.github.io`
   - `http://localhost:8765` (para pruebas en tu computadora)
5. Copia el **ID de cliente**, que termina en `.apps.googleusercontent.com`, y pégalo en `js/config.js`:
   ```js
   googleClientId: '1234567890-abc123.apps.googleusercontent.com',
   ```

El ID de cliente **no es secreto**: está hecho para ir en la página. Nunca subas un *client secret*; esta página no lo necesita.

> ⚠️ Si al entrar con tu cuenta `@alumnos.udg.mx` aparece **"Acceso bloqueado"**, significa que el administrador de Google de la UdeG restringe apps externas. En ese caso hay que pedir autorización a la universidad.

> ℹ️ La validación del dominio se hace en el navegador. Para un sistema real habría que verificar el token también en un servidor (por ejemplo con Firebase Authentication).

## Publicar en GitHub Pages (sin instalar nada)

1. Entra a <https://github.com> e inicia sesión (o crea tu cuenta).
2. Clic en **New repository** → nombre: `cucei-conecta` → **Public** → **Create repository**.
3. Clic en **uploading an existing file**.
4. Arrastra **`index.html`, `README.md` y las carpetas `css` y `js`** → **Commit changes**.
5. Ve a **Settings → Pages** → en *Branch* elige `main` y carpeta `/ (root)` → **Save**.
6. Espera 1–2 minutos y abre: `https://TU-USUARIO.github.io/cucei-conecta/`

Para actualizar algo después: abre el archivo en GitHub, clic en el lápiz ✏️, edita y **Commit changes**.

## Importante: dónde se guardan los datos

Esta versión guarda todo en el **navegador de cada persona** (`localStorage`):

- ✅ Funciona sin servidor y es gratis; perfecto para presentar y para una prueba piloto en un mismo equipo.
- ⚠️ Lo que publica una persona **no lo ven otras personas en otros dispositivos**.
- Para la prueba piloto: usen una laptop/tablet compartida y al final usen **Impacto → Exportar CSV** para sus resultados.

Siguiente paso para uso real entre muchos usuarios: conectar una base de datos en la nube (por ejemplo Firebase o Supabase, ambos con plan gratuito).

## Calidad y seguridad

- Inicio de sesión con Google restringido a correos institucionales `udg.mx`. La página nunca ve contraseñas.
- El correo no se muestra a otros usuarios; solo se publican el alias, la carrera y el semestre, con consentimiento.
- Todo el texto que escriben los usuarios se escapa (protección contra inyección de código / XSS).
- Botón para reportar contenido y para borrar los datos propios.
- Diseño accesible (navegable con teclado) y adaptable a celular.
