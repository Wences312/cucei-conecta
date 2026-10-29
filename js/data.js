/* ==========================================================
   CUCEI Conecta — datos base del prototipo
   ========================================================== */

const SUBJECTS = [
  'Cálculo Diferencial',
  'Cálculo Integral',
  'Cálculo Multivariable',
  'Álgebra Lineal',
  'Ecuaciones Diferenciales',
  'Matemáticas Discretas',
  'Probabilidad y Estadística',
  'Métodos Numéricos',
  'Física (Mecánica)',
  'Electricidad y Magnetismo',
  'Química General',
  'Programación',
  'Estructuras de Datos',
  'Bases de Datos',
  'Circuitos Eléctricos',
  'Electrónica',
  'Termodinámica',
  'Inglés',
  'Otra'
];

const CARRERAS = [
  'Ing. en Computación',
  'Ing. Informática',
  'Ing. Civil',
  'Ing. Química',
  'Ing. Industrial',
  'Ing. Mecánica Eléctrica',
  'Ing. en Comunicaciones y Electrónica',
  'Ing. Biomédica',
  'Ing. en Alimentos y Biotecnología',
  'Ing. Robótica',
  'Ing. Fotónica',
  'Ing. en Logística y Transporte',
  'Ing. Topográfica Geomática',
  'Lic. en Física',
  'Lic. en Matemáticas',
  'Lic. en Química',
  'Químico Farmacéutico Biólogo',
  'Otra'
];

const PLACES = [
  'Biblioteca CUCEI',
  'Explanada CUCEI',
  'Salón (indicar módulo y aula)',
  'Google Meet',
  'Microsoft Teams',
  'Zoom'
];

/* Datos de ejemplo para que la página no se vea vacía en la presentación.
   Los nombres son ficticios. */
const SEED = (() => {
  const now = Date.now();
  const H = 3600e3;
  const D = 24 * H;
  const day = (offset) => {
    const d = new Date(now + offset * D);
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  };

  return {
    version: 1,
    user: null,
    questions: [
      {
        id: 'q1',
        title: '¿Cómo saber cuándo usar integración por partes y cuándo sustitución?',
        body: 'En Cálculo Integral siempre me confundo. Por ejemplo con `∫ x·e^x dx` intenté sustitución y no me salió. ¿Hay alguna regla para decidir?',
        subject: 'Cálculo Integral',
        author: 'Mariana (ejemplo)',
        createdAt: now - 26 * H,
        voters: ['Luis (ejemplo)', 'Diego (ejemplo)', 'Sofía (ejemplo)'],
        solved: true,
        reported: false,
        answers: [
          {
            id: 'a1',
            body: 'Una regla práctica es ILATE (Inversas, Logarítmicas, Algebraicas, Trigonométricas, Exponenciales): la que aparezca primero en la lista es tu "u".\nEn `∫ x·e^x dx` la algebraica (x) va antes que la exponencial, entonces u = x y dv = e^x dx. Te queda x·e^x − e^x + C.\nSustitución conviene cuando ves una función y su derivada juntas, como `∫ 2x·cos(x²) dx`.',
            author: 'Luis (ejemplo)',
            createdAt: now - 24 * H,
            voters: ['Mariana (ejemplo)', 'Sofía (ejemplo)'],
            accepted: true
          },
          {
            id: 'a2',
            body: 'Complementando: si después de aplicar partes la integral se ve igual o más difícil, prueba intercambiar u y dv.',
            author: 'Sofía (ejemplo)',
            createdAt: now - 20 * H,
            voters: [],
            accepted: false
          }
        ]
      },
      {
        id: 'q2',
        title: 'Diferencia entre lista enlazada y arreglo en C++',
        body: 'Para Estructuras de Datos, ¿cuándo conviene una lista enlazada en lugar de un arreglo o un vector? El profe dijo que depende de las operaciones pero no me quedó claro.',
        subject: 'Estructuras de Datos',
        author: 'Diego (ejemplo)',
        createdAt: now - 9 * H,
        voters: ['Ana (ejemplo)'],
        solved: false,
        reported: false,
        answers: [
          {
            id: 'a3',
            body: 'El arreglo te da acceso directo por índice en O(1), pero insertar en medio cuesta O(n) porque hay que recorrer elementos.\nLa lista enlazada inserta y elimina en O(1) si ya tienes el nodo, pero buscar el elemento i cuesta O(n).\nSi vas a insertar/borrar mucho en medio → lista. Si vas a consultar por posición → arreglo/vector.',
            author: 'Ana (ejemplo)',
            createdAt: now - 7 * H,
            voters: ['Diego (ejemplo)'],
            accepted: false
          }
        ]
      },
      {
        id: 'q3',
        title: '¿Alguien tiene ejercicios resueltos de ley de Kirchhoff?',
        body: 'Tengo examen de Circuitos Eléctricos la próxima semana y quiero practicar mallas con dos fuentes. ¿Qué libro o canal me recomiendan?',
        subject: 'Circuitos Eléctricos',
        author: 'Jorge (ejemplo)',
        createdAt: now - 3 * H,
        voters: [],
        solved: false,
        reported: false,
        answers: []
      },
      {
        id: 'q4',
        title: 'Eigenvalores: ¿qué significan geométricamente?',
        body: 'Sé calcularlos con det(A − λI) = 0 pero no entiendo qué representan. ¿Alguien me lo explica con un ejemplo?',
        subject: 'Álgebra Lineal',
        author: 'Valeria (ejemplo)',
        createdAt: now - 50 * H,
        voters: ['Mariana (ejemplo)', 'Jorge (ejemplo)'],
        solved: true,
        reported: false,
        answers: [
          {
            id: 'a4',
            body: 'Un eigenvector es una dirección que la matriz NO gira, solo estira o encoge. El eigenvalor es cuánto la estira.\nEjemplo: A = [[2,0],[0,3]] estira el eje x al doble (λ=2) y el eje y al triple (λ=3).',
            author: 'Luis (ejemplo)',
            createdAt: now - 47 * H,
            voters: ['Valeria (ejemplo)', 'Jorge (ejemplo)', 'Ana (ejemplo)'],
            accepted: true
          }
        ]
      }
    ],
    tutors: [
      {
        id: 't1',
        name: 'Luis (ejemplo)',
        carrera: 'Lic. en Matemáticas',
        semestre: 7,
        subjects: ['Cálculo Diferencial', 'Cálculo Integral', 'Álgebra Lineal'],
        schedule: 'Lunes y miércoles de 12:00 a 14:00',
        modality: 'Ambas',
        bio: 'Me gusta explicar con ejemplos y dibujos. Paciencia garantizada.',
        ratings: [5, 5, 4, 5]
      },
      {
        id: 't2',
        name: 'Ana (ejemplo)',
        carrera: 'Ing. en Computación',
        semestre: 6,
        subjects: ['Programación', 'Estructuras de Datos', 'Bases de Datos'],
        schedule: 'Martes y jueves por la tarde',
        modality: 'En línea',
        bio: 'Te ayudo a entender la lógica antes del código. C++, Python y SQL.',
        ratings: [5, 4, 5]
      },
      {
        id: 't3',
        name: 'Sofía (ejemplo)',
        carrera: 'Ing. Química',
        semestre: 8,
        subjects: ['Química General', 'Termodinámica', 'Ecuaciones Diferenciales'],
        schedule: 'Viernes de 9:00 a 13:00',
        modality: 'Presencial',
        bio: 'Asesora de química desde 4.º semestre. Traigo ejercicios tipo examen.',
        ratings: [4, 5]
      }
    ],
    sessions: [
      {
        id: 's1',
        subject: 'Ecuaciones Diferenciales',
        topic: 'Ecuaciones exactas y factor integrante',
        detail: 'No entiendo cómo encontrar el factor integrante cuando la ecuación no es exacta.',
        modality: 'Presencial',
        date: day(2),
        time: '12:00',
        place: 'Biblioteca CUCEI',
        requester: 'Valeria (ejemplo)',
        preferredTutor: '',
        tutor: '',
        status: 'pendiente',
        createdAt: now - 5 * H
      },
      {
        id: 's2',
        subject: 'Programación',
        topic: 'Recursividad',
        detail: 'Quiero practicar problemas de recursión antes del parcial.',
        modality: 'En línea',
        date: day(1),
        time: '18:00',
        place: 'Google Meet',
        requester: 'Jorge (ejemplo)',
        preferredTutor: 'Ana (ejemplo)',
        tutor: 'Ana (ejemplo)',
        status: 'aceptada',
        createdAt: now - 30 * H
      },
      {
        id: 's3',
        subject: 'Cálculo Diferencial',
        topic: 'Límites al infinito',
        detail: '',
        modality: 'Presencial',
        date: day(-3),
        time: '13:00',
        place: 'Biblioteca CUCEI',
        requester: 'Mariana (ejemplo)',
        preferredTutor: 'Luis (ejemplo)',
        tutor: 'Luis (ejemplo)',
        status: 'completada',
        rating: 5,
        review: 'Me quedó clarísimo, gracias.',
        createdAt: now - 6 * D
      }
    ]
  };
})();
