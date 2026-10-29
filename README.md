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
js/data.js      ← materias, carreras y datos de ejemplo
js/app.js       ← funcionamiento de la página
```

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

- Sin contraseñas ni datos sensibles; solo alias, carrera y semestre, con consentimiento.
- Todo el texto que escriben los usuarios se escapa (protección contra inyección de código / XSS).
- Botón para reportar contenido y para borrar los datos propios.
- Diseño accesible (navegable con teclado) y adaptable a celular.
