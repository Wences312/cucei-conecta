/* ==========================================================
   CUCEI Conecta — lógica de la aplicación
   Página de una sola vista (SPA) sin dependencias.
   Los datos se guardan en el navegador (localStorage).
   ========================================================== */
(function () {
  'use strict';

  const STORE_KEY = 'cuceiconecta:v1';
  const app = document.getElementById('app');
  const modal = document.getElementById('modal');
  const modalForm = document.getElementById('modalForm');
  const modalTitle = document.getElementById('modalTitle');

  /* ---------- Utilidades ---------- */
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const avg = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);
  const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

  // Texto seguro: escapa HTML, respeta saltos de línea y `código`
  const rich = (text) => esc(text)
    .replace(/`([^`\n]+)`/g, '<code>$1</code>')
    .replace(/\n/g, '<br>');

  function timeAgo(ts) {
    const s = (Date.now() - ts) / 1000;
    if (s < 60) return 'hace un momento';
    const m = Math.floor(s / 60);
    if (m < 60) return `hace ${m} min`;
    const h = Math.floor(m / 60);
    if (h < 24) return `hace ${h} h`;
    const d = Math.floor(h / 24);
    if (d < 30) return `hace ${plural(d, 'día', 'días')}`;
    return new Date(ts).toLocaleDateString('es-MX');
  }

  function stars(value) {
    const r = Math.round(value);
    return '★'.repeat(r) + '☆'.repeat(5 - r);
  }

  function initials(name) {
    return name.replace(/\(.*?\)/g, '').trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '?';
  }

  function colorFor(name) {
    const palette = ['#1f3a8a', '#0f766e', '#9333ea', '#c2410c', '#be123c', '#0369a1', '#4d7c0f'];
    let h = 0;
    for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    return palette[h % palette.length];
  }

  function toast(msg) {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toast.t);
    toast.t = setTimeout(() => el.classList.remove('show'), 2600);
  }

  const options = (list, selected = '', placeholder = '') =>
    (placeholder ? `<option value="">${esc(placeholder)}</option>` : '') +
    list.map((v) => `<option ${v === selected ? 'selected' : ''}>${esc(v)}</option>`).join('');

  /* ---------- Almacenamiento ---------- */
  let db = load();

  function load() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        if (data && data.version === SEED.version) return data;
      }
    } catch (e) { /* sin acceso a localStorage: se usan los datos de ejemplo */ }
    return clone(SEED);
  }

  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(db)); } catch (e) {
      toast('No se pudo guardar en este navegador');
    }
  }

  const me = () => (db.user ? db.user.name : '');
  const findQuestion = (id) => db.questions.find((q) => q.id === id);
  const findTutor = (name) => db.tutors.find((t) => t.name === name);

  /* ---------- Modal ---------- */
  let modalCfg = null;

  function openModal(cfg) {
    if (modal.open) modal.close();
    modalCfg = { ...cfg, token: uid() };
    modalTitle.textContent = cfg.title;
    modalForm.innerHTML = cfg.body + `
      <div class="modal-actions">
        <button type="button" class="btn ghost" data-action="close-modal">Cancelar</button>
        <button type="submit" class="btn primary">${esc(cfg.submitLabel || 'Guardar')}</button>
      </div>`;
    modal.showModal();
    const first = modalForm.querySelector('input:not([type=hidden]):not([type=radio]), select, textarea');
    if (first) first.focus();
  }

  function closeModal() {
    if (modal.open) modal.close();
    modalCfg = null;
  }

  modalForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!modalCfg) return;
    const cfg = modalCfg;
    const result = cfg.onSubmit(new FormData(modalForm));
    if (result === false) return;
    // Si onSubmit abrió otro modal, no lo cerramos
    if (modalCfg && modalCfg.token === cfg.token) closeModal();
  });

  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

  /* ---------- Perfil ---------- */
  function updateChip() {
    const chip = document.getElementById('userChip');
    chip.textContent = db.user ? `👤 ${db.user.name}` : 'Entrar';
    chip.title = db.user ? 'Editar tu perfil' : 'Crea tu perfil para participar';
  }

  function requireUser(then) {
    if (db.user) return then();
    openProfile(then);
  }

  function openProfile(after) {
    const u = db.user || {};
    const sem = Array.from({ length: 12 }, (_, i) => String(i + 1));
    openModal({
      title: db.user ? 'Tu perfil' : 'Antes de participar',
      submitLabel: db.user ? 'Guardar cambios' : 'Comenzar',
      body: `
        ${db.user ? '' : '<p class="muted">Solo necesitamos un nombre o alias para mostrar en tus preguntas y asesorías. <b>No pedimos contraseñas.</b></p>'}
        <div class="field">
          <label for="pf-name">Nombre o alias</label>
          <input id="pf-name" name="name" required minlength="2" maxlength="40" value="${esc(u.name)}" placeholder="Ej. Wences R.">
          <span class="hint">Evita poner tu nombre completo o tu código de estudiante.</span>
        </div>
        <div class="row">
          <div class="field">
            <label for="pf-carrera">Carrera</label>
            <select id="pf-carrera" name="carrera" required>${options(CARRERAS, u.carrera, 'Selecciona…')}</select>
          </div>
          <div class="field">
            <label for="pf-sem">Semestre</label>
            <select id="pf-sem" name="semestre" required>${options(sem, String(u.semestre || ''), 'Selecciona…')}</select>
          </div>
        </div>
        <label class="check">
          <input type="checkbox" name="consent" required ${db.user ? 'checked' : ''}>
          <span>Leí y acepto el <a href="#/privacidad" target="_blank">aviso de privacidad</a> y me comprometo a participar con respeto.</span>
        </label>`,
      onSubmit(fd) {
        const name = fd.get('name').trim();
        if (name.length < 2) { toast('Escribe un nombre válido'); return false; }
        db.user = { name, carrera: fd.get('carrera'), semestre: Number(fd.get('semestre')), consentAt: Date.now() };
        save();
        updateChip();
        toast(`¡Hola, ${name}!`);
        render();
        if (typeof after === 'function') after();
      }
    });
  }

  /* ---------- Formularios principales ---------- */
  function openAsk() {
    requireUser(() => openModal({
      title: 'Hacer una pregunta',
      submitLabel: 'Publicar pregunta',
      body: `
        <div class="field">
          <label for="ask-title">Título</label>
          <input id="ask-title" name="title" required minlength="10" maxlength="140" placeholder="Resume tu duda en una línea">
        </div>
        <div class="field">
          <label for="ask-subject">Materia</label>
          <select id="ask-subject" name="subject" required>${options(SUBJECTS, ui.qSubject, 'Selecciona la materia…')}</select>
        </div>
        <div class="field">
          <label for="ask-body">Explica tu duda</label>
          <textarea id="ask-body" name="body" required minlength="20" maxlength="3000" placeholder="¿Qué intentaste? ¿En qué parte te atoras?"></textarea>
          <span class="hint">Tip: escribe fórmulas o código entre \`comillas invertidas\`. No compartas datos personales.</span>
        </div>`,
      onSubmit(fd) {
        const q = {
          id: uid(),
          title: fd.get('title').trim(),
          body: fd.get('body').trim(),
          subject: fd.get('subject'),
          author: me(),
          createdAt: Date.now(),
          voters: [],
          solved: false,
          reported: false,
          answers: []
        };
        db.questions.unshift(q);
        save();
        toast('Pregunta publicada');
        location.hash = `#/pregunta/${q.id}`;
      }
    }));
  }

  function openRequest(prefill = {}) {
    requireUser(() => {
      const now = new Date();
      const pad = (n) => String(n).padStart(2, '0');
      const today = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
      const tutorNames = db.tutors.map((t) => t.name);
      openModal({
        title: 'Solicitar asesoría',
        submitLabel: 'Enviar solicitud',
        body: `
          <div class="row">
            <div class="field">
              <label for="rq-subject">Materia</label>
              <select id="rq-subject" name="subject" required>${options(SUBJECTS, prefill.subject, 'Selecciona…')}</select>
            </div>
            <div class="field">
              <label for="rq-tutor">Asesor(a) preferido</label>
              <select id="rq-tutor" name="preferredTutor">${options(tutorNames, prefill.tutor, 'Cualquiera disponible')}</select>
            </div>
          </div>
          <div class="field">
            <label for="rq-topic">Tema</label>
            <input id="rq-topic" name="topic" required minlength="3" maxlength="100" placeholder="Ej. Derivadas implícitas">
          </div>
          <div class="field">
            <label for="rq-detail">¿Qué necesitas? (opcional)</label>
            <textarea id="rq-detail" name="detail" maxlength="800" placeholder="Cuéntale al asesor qué temas llevas y qué se te dificulta."></textarea>
          </div>
          <div class="row">
            <div class="field">
              <label for="rq-date">Fecha</label>
              <input id="rq-date" type="date" name="date" required min="${today}" value="${today}">
            </div>
            <div class="field">
              <label for="rq-time">Hora</label>
              <input id="rq-time" type="time" name="time" required value="12:00" min="07:00" max="21:00">
            </div>
          </div>
          <div class="row">
            <div class="field">
              <label for="rq-mod">Modalidad</label>
              <select id="rq-mod" name="modality" required>${options(['Presencial', 'En línea'], 'Presencial')}</select>
            </div>
            <div class="field">
              <label for="rq-place">Lugar o plataforma</label>
              <input id="rq-place" name="place" list="places" required maxlength="80" placeholder="Biblioteca CUCEI">
              <datalist id="places">${PLACES.map((p) => `<option value="${esc(p)}">`).join('')}</datalist>
            </div>
          </div>
          <p class="hint muted small">🔒 Para asesorías presenciales elige espacios públicos dentro del campus.</p>`,
        onSubmit(fd) {
          const s = {
            id: uid(),
            subject: fd.get('subject'),
            topic: fd.get('topic').trim(),
            detail: fd.get('detail').trim(),
            modality: fd.get('modality'),
            date: fd.get('date'),
            time: fd.get('time'),
            place: fd.get('place').trim(),
            requester: me(),
            preferredTutor: fd.get('preferredTutor') || '',
            tutor: '',
            status: 'pendiente',
            createdAt: Date.now()
          };
          db.sessions.unshift(s);
          save();
          ui.sTab = 'mine';
          toast('Solicitud enviada');
          if (location.hash !== '#/asesorias') location.hash = '#/asesorias'; else render();
        }
      });
    });
  }

  function openTutorForm() {
    requireUser(() => {
      const t = findTutor(me()) || {};
      const mine = t.subjects || [];
      openModal({
        title: t.id ? 'Editar mi perfil de asesor' : 'Quiero ser asesor(a)',
        submitLabel: t.id ? 'Guardar' : 'Registrarme',
        body: `
          <p class="muted">Comparte lo que sabes: ser asesor te ayuda a repasar, ganar experiencia y apoyar a tu comunidad.</p>
          <div class="field">
            <span class="label">Materias que puedes asesorar</span>
            <div class="checks">
              ${SUBJECTS.filter((s) => s !== 'Otra').map((s) => `
                <label class="check"><input type="checkbox" name="subjects" value="${esc(s)}" ${mine.includes(s) ? 'checked' : ''}><span>${esc(s)}</span></label>`).join('')}
            </div>
          </div>
          <div class="field">
            <label for="tt-schedule">Horario disponible</label>
            <input id="tt-schedule" name="schedule" required maxlength="80" value="${esc(t.schedule)}" placeholder="Ej. Lunes y miércoles 12:00–14:00">
          </div>
          <div class="field">
            <label for="tt-mod">Modalidad</label>
            <select id="tt-mod" name="modality">${options(['Presencial', 'En línea', 'Ambas'], t.modality || 'Ambas')}</select>
          </div>
          <div class="field">
            <label for="tt-bio">Sobre ti</label>
            <textarea id="tt-bio" name="bio" required maxlength="240" placeholder="¿Cómo explicas? ¿Qué te gusta enseñar?">${esc(t.bio)}</textarea>
          </div>`,
        onSubmit(fd) {
          const subjects = fd.getAll('subjects');
          if (!subjects.length) { toast('Elige al menos una materia'); return false; }
          const data = {
            name: me(),
            carrera: db.user.carrera,
            semestre: db.user.semestre,
            subjects,
            schedule: fd.get('schedule').trim(),
            modality: fd.get('modality'),
            bio: fd.get('bio').trim()
          };
          if (t.id) Object.assign(t, data);
          else db.tutors.push({ id: uid(), ratings: [], ...data });
          save();
          toast(t.id ? 'Perfil actualizado' : '¡Ya eres asesor(a)! Gracias por ayudar');
          render();
        }
      });
    });
  }

  function openRate(session) {
    openModal({
      title: 'Califica tu asesoría',
      submitLabel: 'Enviar calificación',
      body: `
        <p>¿Cómo te fue con <b>${esc(session.tutor)}</b> en <b>${esc(session.topic)}</b>?</p>
        <div class="field">
          <span class="label">Calificación</span>
          <div class="rating-input">
            ${[5, 4, 3, 2, 1].map((n) => `
              <input type="radio" id="rt-${n}" name="rating" value="${n}" required>
              <label for="rt-${n}" title="${n} estrella${n > 1 ? 's' : ''}">★</label>`).join('')}
          </div>
        </div>
        <div class="field">
          <label for="rt-review">Comentario (opcional)</label>
          <textarea id="rt-review" name="review" maxlength="300" placeholder="¿Qué te ayudó más?"></textarea>
        </div>`,
      onSubmit(fd) {
        const rating = Number(fd.get('rating'));
        if (!rating) { toast('Elige de 1 a 5 estrellas'); return false; }
        session.status = 'completada';
        session.rating = rating;
        session.review = fd.get('review').trim();
        const t = findTutor(session.tutor);
        if (t) t.ratings.push(rating);
        save();
        toast('¡Gracias por tu calificación!');
        render();
      }
    });
  }

  /* ---------- Estado de la interfaz ---------- */
  const ui = { qSearch: '', qSubject: '', qFilter: 'all', qSort: 'recent', sTab: 'open', tSubject: '' };

  /* ---------- Componentes ---------- */
  function questionCard(q) {
    const n = q.answers.length;
    return `
      <article class="card q-card">
        <div class="q-stats">
          <div><b>${q.voters.length}</b> votos</div>
          <div class="${n ? 'answered' : ''}"><b>${n}</b> ${n === 1 ? 'resp.' : 'resps.'}</div>
        </div>
        <div>
          <a class="q-title" href="#/pregunta/${esc(q.id)}">${esc(q.title)}</a>
          <p class="muted clamp">${esc(q.body)}</p>
          <div class="meta">
            <span class="chip">${esc(q.subject)}</span>
            ${q.solved ? '<span class="chip ok">✓ Resuelta</span>' : ''}
            ${q.reported ? '<span class="chip danger">En revisión</span>' : ''}
            <span>por <b>${esc(q.author)}</b> · ${timeAgo(q.createdAt)}</span>
          </div>
        </div>
      </article>`;
  }

  function sessionCard(s) {
    const d = new Date(`${s.date}T${s.time || '00:00'}`);
    const mon = d.toLocaleDateString('es-MX', { month: 'short' }).replace('.', '');
    const statusChip = {
      pendiente: '<span class="chip warn">Pendiente</span>',
      aceptada: '<span class="chip">Confirmada</span>',
      completada: '<span class="chip ok">Completada</span>',
      cancelada: '<span class="chip gray">Cancelada</span>'
    }[s.status];
    const isRequester = s.requester === me();
    const canAccept = s.status === 'pendiente' && !isRequester &&
      (!s.preferredTutor || s.preferredTutor === me() || !db.user);

    const actions = [];
    if (canAccept) actions.push(`<button class="btn primary sm" data-action="accept" data-id="${s.id}">Aceptar como asesor</button>`);
    if (isRequester && s.status === 'pendiente') actions.push(`<button class="btn sm danger" data-action="cancel-session" data-id="${s.id}">Cancelar</button>`);
    if (isRequester && s.status === 'aceptada') actions.push(`<button class="btn accent sm" data-action="complete" data-id="${s.id}">Marcar como completada</button>`);
    if (s.tutor === me() && s.status === 'aceptada') actions.push(`<button class="btn sm" data-action="release" data-id="${s.id}">Ya no puedo asistir</button>`);

    return `
      <article class="card s-card">
        <div class="s-date" aria-label="${esc(d.toLocaleDateString('es-MX', { dateStyle: 'full' }))}">
          <span class="d">${d.getDate()}</span><span class="m">${esc(mon)}</span><span class="t">${esc(s.time)}</span>
        </div>
        <div>
          <h3>${esc(s.topic)}</h3>
          <div class="meta">
            <span class="chip">${esc(s.subject)}</span>
            <span class="chip gray">${s.modality === 'En línea' ? '💻' : '📍'} ${esc(s.modality)}</span>
            ${statusChip}
          </div>
          ${s.detail ? `<p class="detail">${esc(s.detail)}</p>` : ''}
          <p class="meta" style="margin-top:8px">
            <span>📌 ${esc(s.place)}</span>
            <span>· Solicita: <b>${esc(s.requester)}</b></span>
            ${s.tutor ? `<span>· Asesor: <b>${esc(s.tutor)}</b></span>` : s.preferredTutor ? `<span>· Solicitada a: <b>${esc(s.preferredTutor)}</b></span>` : ''}
            ${s.rating ? `<span class="stars" title="${s.rating} de 5">${stars(s.rating)}</span>` : ''}
          </p>
          ${actions.length ? `<div class="post-actions">${actions.join('')}</div>` : ''}
        </div>
      </article>`;
  }

  function tutorCard(t) {
    const r = avg(t.ratings);
    return `
      <article class="card tutor">
        <div class="tutor-head">
          <span class="avatar" style="background:${colorFor(t.name)}">${esc(initials(t.name))}</span>
          <div>
            <h3 style="margin:0">${esc(t.name)}</h3>
            <div class="muted small">${esc(t.carrera)} · ${esc(t.semestre)}.º sem.</div>
          </div>
        </div>
        <div class="small">
          ${t.ratings.length
            ? `<span class="stars">${stars(r)}</span> <b>${r.toFixed(1)}</b> <span class="muted">(${plural(t.ratings.length, 'reseña', 'reseñas')})</span>`
            : '<span class="muted">Nuevo asesor · sin reseñas aún</span>'}
        </div>
        <p style="margin:0">${esc(t.bio)}</p>
        <div class="chips">${t.subjects.map((s) => `<span class="chip">${esc(s)}</span>`).join('')}</div>
        <div class="muted small">🕒 ${esc(t.schedule)}<br>${t.modality === 'En línea' ? '💻' : '📍'} ${esc(t.modality)}</div>
        ${t.name === me()
          ? '<button class="btn sm" data-action="tutor-form">Editar mi perfil</button>'
          : `<button class="btn primary sm" data-action="request" data-tutor="${esc(t.name)}" data-subject="${esc(t.subjects[0] || '')}">Solicitar asesoría</button>`}
      </article>`;
  }

  /* ---------- Vistas ---------- */
  function viewHome() {
    const answers = db.questions.reduce((n, q) => n + q.answers.length, 0);
    const done = db.sessions.filter((s) => s.status === 'completada').length;
    const recent = [...db.questions].sort((a, b) => b.createdAt - a.createdAt).slice(0, 3);
    const top = [...db.tutors].sort((a, b) => avg(b.ratings) - avg(a.ratings)).slice(0, 3);

    app.innerHTML = `
      <section class="hero">
        <div>
          <span class="hero-badge">Hecho por y para estudiantes de CUCEI</span>
          <h1>Nadie aprueba solo.<br>Pregunta, enseña y aprende en comunidad.</h1>
          <p>Resuelve tus dudas con compañeros que ya cursaron la materia o agenda una asesoría gratuita, presencial o en línea.</p>
          <div class="hero-actions">
            <button class="btn accent" data-action="ask">Hacer una pregunta</button>
            <button class="btn" data-action="request">Pedir asesoría</button>
            <button class="btn" data-action="tutor-form">Quiero ser asesor</button>
          </div>
        </div>
        <div class="hero-art" aria-hidden="true">
          <div class="bubble"><small>Mariana · Cálculo Integral</small>¿Cuándo uso integración por partes? 😵</div>
          <div class="bubble right"><small>Luis · asesor</small>¡Usa ILATE! Te explico con un ejemplo 👇</div>
          <div class="bubble"><small>Mariana</small>¡Ya entendí! Gracias 🙌</div>
        </div>
      </section>

      <div class="stats">
        <div class="card stat"><b>${db.questions.length}</b><span>preguntas</span></div>
        <div class="card stat"><b>${answers}</b><span>respuestas</span></div>
        <div class="card stat"><b>${db.tutors.length}</b><span>asesores</span></div>
        <div class="card stat"><b>${done}</b><span>asesorías completadas</span></div>
      </div>

      <section class="section">
        <h2>¿Cómo funciona?</h2>
        <div class="steps">
          <div class="card step"><h3>Crea tu perfil</h3><p class="muted">Solo un alias, tu carrera y semestre. Sin contraseñas ni datos sensibles.</p></div>
          <div class="card step"><h3>Pregunta o agenda</h3><p class="muted">Publica tu duda en el foro o solicita una asesoría por materia, fecha y lugar.</p></div>
          <div class="card step"><h3>Aprende y califica</h3><p class="muted">Marca la mejor respuesta y califica a tu asesor para que otros encuentren ayuda de calidad.</p></div>
        </div>
      </section>

      <section class="section">
        <div class="section-head"><h2>Preguntas recientes</h2><a href="#/preguntas">Ver todas →</a></div>
        <div class="list">${recent.map(questionCard).join('')}</div>
      </section>

      <section class="section">
        <div class="section-head"><h2>Asesores mejor calificados</h2><a href="#/asesores">Ver todos →</a></div>
        <div class="grid">${top.map(tutorCard).join('')}</div>
      </section>

      <section class="section">
        <div class="ods">
          <div class="ods-badge"><div><b>4</b>EDUCACIÓN<br>DE CALIDAD</div></div>
          <div>
            <h3>Alineado al Objetivo de Desarrollo Sostenible 4</h3>
            <p class="muted" style="margin:0">Promovemos el aprendizaje entre pares para reducir la reprobación y que más estudiantes terminen su carrera.
            <a href="#/acerca">Conoce el proyecto →</a></p>
          </div>
        </div>
      </section>`;
  }

  function viewQuestions() {
    app.innerHTML = `
      <section class="page-head">
        <div>
          <h1>Preguntas</h1>
          <p class="muted">¿No entendiste algo en clase? Alguien en CUCEI seguro ya pasó por ahí.</p>
        </div>
        <button class="btn primary" data-action="ask">+ Hacer pregunta</button>
      </section>
      <div class="toolbar">
        <input type="search" id="qSearch" placeholder="Buscar por palabra clave…" aria-label="Buscar preguntas" value="${esc(ui.qSearch)}">
        <select id="qSubject" aria-label="Filtrar por materia">${options(SUBJECTS, ui.qSubject, 'Todas las materias')}</select>
        <div class="seg" role="group" aria-label="Filtrar por estado">
          ${[['all', 'Todas'], ['open', 'Sin resolver'], ['solved', 'Resueltas']].map(([v, l]) =>
            `<button data-action="q-filter" data-v="${v}" aria-pressed="${ui.qFilter === v}">${l}</button>`).join('')}
        </div>
        <div class="seg" role="group" aria-label="Ordenar">
          ${[['recent', 'Recientes'], ['votes', 'Más votadas']].map(([v, l]) =>
            `<button data-action="q-sort" data-v="${v}" aria-pressed="${ui.qSort === v}">${l}</button>`).join('')}
        </div>
      </div>
      <div id="qList" class="list"></div>`;

    $('#qSearch').addEventListener('input', (e) => { ui.qSearch = e.target.value; renderQuestionList(); });
    $('#qSubject').addEventListener('change', (e) => { ui.qSubject = e.target.value; renderQuestionList(); });
    renderQuestionList();
  }

  function renderQuestionList() {
    const term = ui.qSearch.trim().toLowerCase();
    let list = db.questions.filter((q) =>
      (!ui.qSubject || q.subject === ui.qSubject) &&
      (ui.qFilter === 'all' || (ui.qFilter === 'solved' ? q.solved : !q.solved)) &&
      (!term || `${q.title} ${q.body} ${q.subject}`.toLowerCase().includes(term))
    );
    list.sort(ui.qSort === 'votes'
      ? (a, b) => b.voters.length - a.voters.length || b.createdAt - a.createdAt
      : (a, b) => b.createdAt - a.createdAt);

    $('#qList').innerHTML = list.length
      ? list.map(questionCard).join('')
      : `<div class="card empty"><b>No encontramos preguntas</b>Sé la primera persona en preguntar sobre esto.<br><br>
           <button class="btn primary" data-action="ask">Hacer pregunta</button></div>`;
  }

  function viewQuestion(id) {
    const q = findQuestion(id);
    if (!q) {
      app.innerHTML = `<a class="back" href="#/preguntas">← Volver a preguntas</a>
        <div class="card empty"><b>Esta pregunta no existe</b>Puede que se haya eliminado.</div>`;
      return;
    }
    const isAuthor = q.author === me();
    const answers = [...q.answers].sort((a, b) =>
      (b.accepted - a.accepted) || (b.voters.length - a.voters.length) || (a.createdAt - b.createdAt));

    app.innerHTML = `
      <a class="back" href="#/preguntas">← Volver a preguntas</a>
      <article class="card post">
        <div class="vote">
          <button data-action="vote-q" data-id="${q.id}" aria-pressed="${q.voters.includes(me())}" aria-label="Votar: esta pregunta también me sirve">▲</button>
          <b>${q.voters.length}</b>
        </div>
        <div class="post-body">
          ${q.reported ? '<div class="notice">⚠️ Esta publicación fue reportada y está en revisión.</div>' : ''}
          <h1 style="font-size:1.5rem">${esc(q.title)}</h1>
          <div class="meta" style="margin-bottom:12px">
            <span class="chip">${esc(q.subject)}</span>
            ${q.solved ? '<span class="chip ok">✓ Resuelta</span>' : ''}
            <span>por <b>${esc(q.author)}</b> · ${timeAgo(q.createdAt)}</span>
          </div>
          <div>${rich(q.body)}</div>
          <div class="post-actions">
            <button class="btn sm" data-action="request" data-subject="${esc(q.subject)}">📅 Pedir asesoría de este tema</button>
            ${!q.reported && !isAuthor ? `<button class="btn ghost sm" data-action="report" data-id="${q.id}">🚩 Reportar</button>` : ''}
            ${isAuthor ? `<button class="btn ghost sm danger" data-action="delete-q" data-id="${q.id}">Eliminar</button>` : ''}
          </div>
        </div>
      </article>

      <h2 style="margin:28px 0 12px">${plural(q.answers.length, 'respuesta', 'respuestas')}</h2>
      <div class="list">
        ${answers.map((a) => `
          <article class="card post answer ${a.accepted ? 'accepted' : ''}">
            <div class="vote">
              <button data-action="vote-a" data-id="${q.id}" data-aid="${a.id}" aria-pressed="${a.voters.includes(me())}" aria-label="Votar: respuesta útil">▲</button>
              <b>${a.voters.length}</b>
            </div>
            <div class="post-body">
              ${a.accepted ? '<span class="chip ok" style="margin-bottom:8px">✓ Mejor respuesta</span>' : ''}
              <div>${rich(a.body)}</div>
              <div class="meta" style="margin-top:10px">
                <span>— <b>${esc(a.author)}</b> · ${timeAgo(a.createdAt)}</span>
                ${findTutor(a.author) ? '<span class="chip gray">Asesor</span>' : ''}
              </div>
              ${isAuthor && !a.accepted && a.author !== me()
                ? `<div class="post-actions"><button class="btn sm" data-action="accept-answer" data-id="${q.id}" data-aid="${a.id}">✓ Marcar como mejor respuesta</button></div>` : ''}
            </div>
          </article>`).join('') || '<div class="card empty"><b>Aún no hay respuestas</b>¿Sabes la respuesta? ¡Ayuda a tu compañero!</div>'}
      </div>

      <form class="card" id="answerForm" data-id="${q.id}" style="margin-top:20px">
        <div class="field">
          <label for="answerBody">Tu respuesta</label>
          <textarea id="answerBody" name="body" required minlength="10" maxlength="3000" placeholder="Explica paso a paso. Recuerda: ayudar a entender, no hacer la tarea por otro 😉"></textarea>
        </div>
        <button class="btn primary" type="submit">Publicar respuesta</button>
      </form>`;
  }

  function viewSessions() {
    const name = me();
    const filters = {
      open: (s) => s.status === 'pendiente',
      mine: (s) => name && (s.requester === name || s.tutor === name),
      all: () => true
    };
    const list = db.sessions.filter(filters[ui.sTab])
      .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
    const emptyMsg = {
      open: '<b>No hay solicitudes abiertas</b>¡Todo el mundo tiene asesor! Vuelve más tarde.',
      mine: name ? '<b>Aún no tienes asesorías</b>Solicita una o acepta la de un compañero.' : '<b>Entra para ver tus asesorías</b>Crea tu perfil con un alias.',
      all: '<b>No hay asesorías registradas</b>'
    }[ui.sTab];

    app.innerHTML = `
      <section class="page-head">
        <div>
          <h1>Asesorías</h1>
          <p class="muted">Agenda una sesión con otro estudiante o acepta ayudar a alguien que lo necesita.</p>
        </div>
        <button class="btn primary" data-action="request">+ Solicitar asesoría</button>
      </section>
      <div class="toolbar">
        <div class="seg" role="group" aria-label="Ver asesorías">
          ${[['open', 'Solicitudes abiertas'], ['mine', 'Mis asesorías'], ['all', 'Todas']].map(([v, l]) =>
            `<button data-action="s-tab" data-v="${v}" aria-pressed="${ui.sTab === v}">${l}</button>`).join('')}
        </div>
      </div>
      <div class="list">
        ${list.map(sessionCard).join('') || `<div class="card empty">${emptyMsg}</div>`}
      </div>`;
  }

  function viewTutors() {
    const list = db.tutors
      .filter((t) => !ui.tSubject || t.subjects.includes(ui.tSubject))
      .sort((a, b) => avg(b.ratings) - avg(a.ratings));
    const isTutor = !!findTutor(me());

    app.innerHTML = `
      <section class="page-head">
        <div>
          <h1>Asesores</h1>
          <p class="muted">Estudiantes de CUCEI que comparten lo que saben. Elige por materia y agenda.</p>
        </div>
        <button class="btn ${isTutor ? '' : 'accent'}" data-action="tutor-form">${isTutor ? 'Editar mi perfil de asesor' : '🙋 Quiero ser asesor'}</button>
      </section>
      <div class="toolbar">
        <select id="tSubject" aria-label="Filtrar por materia">${options(SUBJECTS.filter((s) => s !== 'Otra'), ui.tSubject, 'Todas las materias')}</select>
      </div>
      <div class="grid">
        ${list.map(tutorCard).join('') || '<div class="card empty"><b>Aún no hay asesores para esta materia</b>¿Tú la dominas? ¡Regístrate!</div>'}
      </div>`;
    $('#tSubject').addEventListener('change', (e) => { ui.tSubject = e.target.value; viewTutors(); });
  }

  function viewImpact() {
    const qs = db.questions;
    const answered = qs.filter((q) => q.answers.length);
    const solved = qs.filter((q) => q.solved);
    const firstReply = answered.map((q) => (Math.min(...q.answers.map((a) => a.createdAt)) - q.createdAt) / 3600e3);
    const ss = db.sessions;
    const completed = ss.filter((s) => s.status === 'completada');
    const ratings = completed.map((s) => s.rating).filter(Boolean);
    const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);

    const counts = {};
    qs.forEach((q) => { counts[q.subject] = (counts[q.subject] || 0) + 1; });
    ss.forEach((s) => { counts[s.subject] = (counts[s.subject] || 0) + 1; });
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 8);
    const max = top.length ? top[0][1] : 1;

    const carreras = {};
    db.tutors.forEach((t) => { carreras[t.carrera] = (carreras[t.carrera] || 0) + 1; });

    app.innerHTML = `
      <section class="page-head">
        <div>
          <h1>Impacto del proyecto</h1>
          <p class="muted">Indicadores para medir si la plataforma funciona (la "M" de SMART). Úsalos en tus resultados.</p>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <button class="btn sm" data-action="export-csv">⬇ Exportar CSV</button>
          <button class="btn sm" data-action="export-json">⬇ Exportar JSON</button>
        </div>
      </section>

      <div class="kpis">
        <div class="card kpi"><b>${qs.length}</b><span>preguntas publicadas</span></div>
        <div class="card kpi"><b>${pct(answered.length, qs.length)}%</b><span>preguntas con respuesta</span></div>
        <div class="card kpi"><b>${pct(solved.length, qs.length)}%</b><span>preguntas resueltas</span></div>
        <div class="card kpi"><b>${firstReply.length ? avg(firstReply).toFixed(1) + ' h' : '—'}</b><span>tiempo promedio a la 1.ª respuesta</span></div>
        <div class="card kpi"><b>${ss.length}</b><span>asesorías solicitadas</span></div>
        <div class="card kpi"><b>${pct(completed.length, ss.length)}%</b><span>asesorías completadas</span></div>
        <div class="card kpi"><b>${ratings.length ? avg(ratings).toFixed(1) + ' ★' : '—'}</b><span>satisfacción promedio</span></div>
        <div class="card kpi"><b>${db.tutors.length}</b><span>asesores registrados</span></div>
      </div>

      <div class="two-col">
        <section class="card">
          <h2>Materias con más demanda</h2>
          <p class="muted small">Preguntas + solicitudes de asesoría por materia.</p>
          <div class="bars">
            ${top.map(([s, n]) => `
              <div class="bar-row">
                <span>${esc(s)}</span>
                <div class="bar-track" role="img" aria-label="${esc(s)}: ${n}"><div class="bar-fill" style="width:${(n / max) * 100}%"></div></div>
                <b>${n}</b>
              </div>`).join('') || '<p class="muted">Sin datos todavía.</p>'}
          </div>
        </section>
        <section class="card">
          <h2>Metas SMART sugeridas</h2>
          <ul class="small" style="padding-left:18px;margin:0">
            <li><b>S</b>pecífica: apoyar a estudiantes de CUCEI en materias de ciencias básicas.</li>
            <li><b>M</b>edible: lograr que ≥ 70 % de las preguntas reciban respuesta (hoy: ${pct(answered.length, qs.length)} %).</li>
            <li><b>A</b>lcanzable: registrar al menos 5 asesores voluntarios (hoy: ${db.tutors.length}).</li>
            <li><b>R</b>elevante: contribuye a la meta 4.3 del ODS 4 (acceso a educación superior de calidad).</li>
            <li><b>T</b>emporal: medir resultados en la prueba piloto antes del 30 de octubre de 2026.</li>
          </ul>
          <h3 style="margin-top:16px">Asesores por carrera</h3>
          <div class="meta">${Object.entries(carreras).map(([c, n]) => `<span class="chip gray">${esc(c)}: ${n}</span>`).join('') || '—'}</div>
        </section>
      </div>

      <section class="section card">
        <h2>Datos de la prueba piloto</h2>
        <p class="muted">Esta versión guarda la información en <b>este navegador</b>. Si hacen la prueba en un solo equipo (por ejemplo, una laptop en la biblioteca), exporten los datos al final para su reporte.</p>
        <button class="btn sm danger" data-action="reset">Restablecer datos de ejemplo</button>
      </section>`;
  }

  function viewSecurity() {
    const tips = [
      ['🔑', 'Nunca compartas tus contraseñas', 'Ningún asesor, compañero o "soporte" necesita tu contraseña de SIIAU, correo o redes. CUCEI Conecta jamás te la pedirá.'],
      ['🎣', 'Cuidado con el phishing', 'Desconfía de enlaces que prometen "exámenes resueltos" o "calificaciones". Revisa la dirección antes de iniciar sesión en cualquier sitio.'],
      ['🪪', 'Protege tus datos personales', 'No publiques tu teléfono, domicilio, código de estudiante ni fotos de tu credencial. Usa un alias.'],
      ['📍', 'Asesorías en lugares seguros', 'Para sesiones presenciales elige espacios públicos del campus como la biblioteca. En línea, usa tu cuenta institucional.'],
      ['🛑', 'Reporta el acoso', 'Si alguien te molesta, te amenaza o publica contenido inapropiado, usa el botón "Reportar" y avisa a tu coordinación.'],
      ['📚', 'Integridad académica', 'Una asesoría es para entender, no para que alguien haga tu tarea o examen. Vender o comprar tareas puede tener sanciones.'],
      ['🔐', 'Activa la verificación en dos pasos', 'En tu correo y redes sociales. Es la forma más simple de evitar que roben tu cuenta.'],
      ['💸', 'Fraudes de "asesorías pagadas"', 'Desconfía de quien pide depósitos por adelantado para "pasarte" una materia. Aquí las asesorías son gratuitas entre estudiantes.']
    ];
    app.innerHTML = `
      <section class="page-head">
        <div>
          <h1>Seguridad digital</h1>
          <p class="muted">Una comunidad que aprende también se cuida. Buenas prácticas para participar de forma segura.</p>
        </div>
      </section>
      <div class="tips">
        ${tips.map(([i, t, d]) => `<div class="card tip"><span class="ico" aria-hidden="true">${i}</span><h3>${t}</h3><p class="muted" style="margin:0">${d}</p></div>`).join('')}
      </div>
      <section class="section card prose" style="max-width:none">
        <h2 style="margin-top:0">¿Fuiste víctima de un delito digital?</h2>
        <ul>
          <li>Guarda evidencia: capturas de pantalla, enlaces, fechas y nombres de usuario.</li>
          <li>No borres las conversaciones ni respondas a amenazas o extorsiones.</li>
          <li>Repórtalo a la Policía Cibernética de tu estado o a la línea de denuncia <b>088</b> de la Guardia Nacional.</li>
          <li>Si ocurre dentro de la comunidad universitaria, informa también a tu coordinación de carrera.</li>
        </ul>
      </section>`;
  }

  function viewAbout() {
    app.innerHTML = `
      <div class="prose" style="max-width:none">
        <section class="page-head"><div><h1>Acerca del proyecto</h1>
          <p class="muted">Plataforma web educativa · Proyecto de fin de semestre</p></div></section>

        <div class="ods" style="margin-bottom:24px">
          <div class="ods-badge"><div><b>4</b>EDUCACIÓN<br>DE CALIDAD</div></div>
          <div>
            <h3>ODS 4: Garantizar una educación inclusiva, equitativa y de calidad</h3>
            <p class="muted" style="margin:0">Nos enfocamos en la <b>meta 4.3</b> (acceso igualitario a una educación superior de calidad) y la <b>meta 4.4</b> (aumentar las competencias técnicas de jóvenes) de la Agenda 2030 de la ONU.</p>
          </div>
        </div>

        <div class="two-col">
          <section class="card">
            <h2 style="margin-top:0">El problema</h2>
            <p>Muchos estudiantes de CUCEI reprueban o abandonan materias de ciencias básicas (cálculo, física, programación) por no tener a quién preguntar fuera del horario de clase. Las asesorías formales tienen cupo y horarios limitados.</p>
          </section>
          <section class="card">
            <h2 style="margin-top:0">Nuestra propuesta</h2>
            <p>Un espacio digital donde los estudiantes se ayudan entre sí: un <b>foro de preguntas</b> por materia y un sistema para <b>agendar asesorías entre pares</b>, con calificaciones que reconocen a quienes ayudan.</p>
          </section>
        </div>

        <section class="section">
          <h2>Objetivo general</h2>
          <p>Desarrollar y probar una plataforma web que facilite el aprendizaje entre pares en CUCEI, para contribuir a reducir la reprobación en materias de ciencias básicas.</p>
          <h2>Objetivos específicos</h2>
          <ul>
            <li>Diseñar un foro de preguntas y respuestas organizado por materia.</li>
            <li>Implementar un módulo para solicitar, aceptar y calificar asesorías.</li>
            <li>Aplicar una prueba piloto con estudiantes de CUCEI y medir los indicadores de la sección <a href="#/impacto">Impacto</a>.</li>
            <li>Promover buenas prácticas de seguridad digital y protección de datos personales.</li>
          </ul>
        </section>
      </div>`;
  }

  function viewPrivacy() {
    app.innerHTML = `
      <article class="prose">
        <h1>Aviso de privacidad simplificado</h1>
        <p class="muted">Prototipo académico · Última actualización: octubre de 2026</p>
        <h2>¿Qué datos usamos?</h2>
        <ul>
          <li>El nombre o alias que tú eliges, tu carrera y semestre.</li>
          <li>Las preguntas, respuestas, solicitudes de asesoría y calificaciones que publicas.</li>
        </ul>
        <p><b>No</b> solicitamos contraseñas, teléfono, domicilio, código de estudiante ni datos sensibles.</p>
        <h2>¿Para qué?</h2>
        <p>Únicamente para mostrar tu participación dentro de la plataforma y calcular indicadores generales del proyecto (por ejemplo, porcentaje de preguntas respondidas). Los resultados se presentan de forma agregada, sin identificar a nadie.</p>
        <h2>¿Dónde se guardan?</h2>
        <p>En esta versión de prototipo, la información se guarda <b>solo en tu navegador</b> (almacenamiento local). No se envía a ningún servidor.</p>
        <h2>Tus derechos</h2>
        <p>Puedes acceder, rectificar o eliminar tus datos en cualquier momento (derechos ARCO), conforme a la legislación mexicana de protección de datos personales. Edita tu perfil desde el botón con tu nombre o borra todo con el siguiente botón.</p>
        <h2>Fotos, audio y video</h2>
        <p>Si participas en la prueba piloto o en encuestas, el equipo te pedirá autorización por escrito antes de usar tu imagen, voz o video como evidencia del proyecto.</p>
        <button class="btn danger" data-action="wipe">Borrar mis datos de este navegador</button>
      </article>`;
  }

  /* ---------- Router ---------- */
  const routes = {
    inicio: viewHome,
    preguntas: viewQuestions,
    pregunta: viewQuestion,
    asesorias: viewSessions,
    asesores: viewTutors,
    impacto: viewImpact,
    seguridad: viewSecurity,
    acerca: viewAbout,
    privacidad: viewPrivacy
  };
  const titles = {
    inicio: 'Inicio', preguntas: 'Preguntas', pregunta: 'Pregunta', asesorias: 'Asesorías', asesores: 'Asesores',
    impacto: 'Impacto', seguridad: 'Seguridad digital', acerca: 'Acerca', privacidad: 'Aviso de privacidad'
  };

  function $(sel) { return app.querySelector(sel); }

  function render() {
    const [name, param] = location.hash.replace(/^#\/?/, '').split('/');
    const route = routes[name] ? name : 'inicio';
    routes[route](param && decodeURIComponent(param));
    document.title = `${titles[route]} · CUCEI Conecta`;
    const active = route === 'pregunta' ? 'preguntas' : route;
    document.querySelectorAll('.nav a').forEach((a) => a.classList.toggle('active', a.dataset.nav === active));
  }

  window.addEventListener('hashchange', () => {
    document.getElementById('nav').classList.remove('open');
    render();
    window.scrollTo(0, 0);
  });

  /* ---------- Exportar ---------- */
  function download(filename, content, type) {
    const url = URL.createObjectURL(new Blob([content], { type }));
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function toCSV(rows) {
    const cell = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    return '﻿' + rows.map((r) => r.map(cell).join(',')).join('\n');
  }

  function exportCSV() {
    const fmt = (ts) => new Date(ts).toLocaleString('es-MX');
    const rows = [['tipo', 'materia', 'titulo_o_tema', 'autor_o_solicitante', 'fecha', 'respuestas', 'votos', 'estado', 'asesor', 'calificacion']];
    db.questions.forEach((q) => rows.push(['pregunta', q.subject, q.title, q.author, fmt(q.createdAt), q.answers.length, q.voters.length, q.solved ? 'resuelta' : 'abierta', '', '']));
    db.sessions.forEach((s) => rows.push(['asesoria', s.subject, s.topic, s.requester, `${s.date} ${s.time}`, '', '', s.status, s.tutor, s.rating || '']));
    download('cucei-conecta-datos.csv', toCSV(rows), 'text/csv;charset=utf-8');
  }

  /* ---------- Acciones (delegación de eventos) ---------- */
  const actions = {
    'toggle-menu'(el) {
      const nav = document.getElementById('nav');
      const open = nav.classList.toggle('open');
      el.setAttribute('aria-expanded', String(open));
    },
    'close-modal': closeModal,
    profile: () => openProfile(),
    ask: openAsk,
    request: (el) => openRequest({ tutor: el.dataset.tutor, subject: el.dataset.subject }),
    'tutor-form': openTutorForm,
    'q-filter'(el) { ui.qFilter = el.dataset.v; viewQuestions(); },
    'q-sort'(el) { ui.qSort = el.dataset.v; viewQuestions(); },
    's-tab'(el) { ui.sTab = el.dataset.v; viewSessions(); },

    'vote-q'(el) {
      requireUser(() => {
        const q = findQuestion(el.dataset.id);
        const i = q.voters.indexOf(me());
        if (i >= 0) q.voters.splice(i, 1); else q.voters.push(me());
        save(); render();
      });
    },
    'vote-a'(el) {
      requireUser(() => {
        const a = findQuestion(el.dataset.id).answers.find((x) => x.id === el.dataset.aid);
        const i = a.voters.indexOf(me());
        if (i >= 0) a.voters.splice(i, 1); else a.voters.push(me());
        save(); render();
      });
    },
    'accept-answer'(el) {
      const q = findQuestion(el.dataset.id);
      q.answers.forEach((a) => { a.accepted = a.id === el.dataset.aid; });
      q.solved = true;
      save(); toast('¡Pregunta marcada como resuelta!'); render();
    },
    report(el) {
      if (!confirm('¿Reportar esta publicación como inapropiada? El equipo la revisará.')) return;
      findQuestion(el.dataset.id).reported = true;
      save(); toast('Gracias. La publicación quedó en revisión.'); render();
    },
    'delete-q'(el) {
      if (!confirm('¿Eliminar tu pregunta y sus respuestas?')) return;
      db.questions = db.questions.filter((q) => q.id !== el.dataset.id);
      save(); toast('Pregunta eliminada'); location.hash = '#/preguntas';
    },

    accept(el) {
      requireUser(() => {
        const s = db.sessions.find((x) => x.id === el.dataset.id);
        if (s.requester === me()) { toast('No puedes aceptar tu propia solicitud'); return; }
        if (s.preferredTutor && s.preferredTutor !== me()) { toast(`Esta solicitud es para ${s.preferredTutor}`); return; }
        s.status = 'aceptada';
        s.tutor = me();
        save(); toast('¡Asesoría confirmada! Revisa fecha y lugar.'); render();
      });
    },
    'cancel-session'(el) {
      if (!confirm('¿Cancelar esta solicitud de asesoría?')) return;
      db.sessions.find((x) => x.id === el.dataset.id).status = 'cancelada';
      save(); toast('Solicitud cancelada'); render();
    },
    release(el) {
      const s = db.sessions.find((x) => x.id === el.dataset.id);
      s.status = 'pendiente';
      s.tutor = '';
      if (s.preferredTutor === me()) s.preferredTutor = '';
      save(); toast('La solicitud volvió a estar abierta'); render();
    },
    complete(el) { openRate(db.sessions.find((x) => x.id === el.dataset.id)); },

    'export-csv': exportCSV,
    'export-json'() { download('cucei-conecta-datos.json', JSON.stringify(db, null, 2), 'application/json'); },
    reset() {
      if (!confirm('Esto borrará todo lo registrado y volverá a los datos de ejemplo. ¿Continuar?')) return;
      const user = db.user;
      db = clone(SEED);
      db.user = user;
      save(); toast('Datos restablecidos'); render();
    },
    wipe() {
      if (!confirm('Se borrarán tu perfil y toda la información guardada en este navegador. ¿Continuar?')) return;
      try { localStorage.removeItem(STORE_KEY); } catch (e) { /* nada que borrar */ }
      db = clone(SEED);
      updateChip(); toast('Tus datos fueron eliminados'); location.hash = '#/inicio';
    }
  };

  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-action]');
    if (!el || !actions[el.dataset.action]) return;
    e.preventDefault();
    actions[el.dataset.action](el);
  });

  document.addEventListener('submit', (e) => {
    if (e.target.id !== 'answerForm') return;
    e.preventDefault();
    const form = e.target;
    requireUser(() => {
      const body = form.elements.body.value.trim();
      if (body.length < 10) { toast('Escribe una respuesta un poco más completa'); return; }
      findQuestion(form.dataset.id).answers.push({
        id: uid(), body, author: me(), createdAt: Date.now(), voters: [], accepted: false
      });
      save(); toast('Respuesta publicada'); render();
    });
  });

  /* ---------- Inicio ---------- */
  updateChip();
  render();
})();
