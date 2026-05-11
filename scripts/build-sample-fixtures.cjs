// Build locale-specific sample fixtures from EN baseline.
// Run: node scripts/build-sample-fixtures.cjs
// Outputs: src/data/sample/sampleDataFixture.{en,ru,de,es}.json
const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, '..', 'src', 'data', 'sampleDataFixture.json');
const OUT_DIR = path.join(__dirname, '..', 'src', 'data', 'sample');
const en = JSON.parse(fs.readFileSync(SRC, 'utf8'));

// ──────────────────────────────────────────────────────────────────────────
// Translation tables. Brand names (Stripe, Product Hunt, Linear, GitHub,
// Figma, Notion, Slack, italki, RTVE, Strava, Runner's World, etc.) and
// proper nouns (Aula Internacional, Hal Higdon, DELE) stay English.
// Tone: informal (ты / du / tú).
// ──────────────────────────────────────────────────────────────────────────

const T = {
  // GOAL titles
  'Get my SaaS to $10k MRR': {
    ru: 'Вывести SaaS на $10k MRR',
    de: 'SaaS auf $10k MRR bringen',
    es: 'Llevar mi SaaS a $10k MRR',
  },
  'Run a sub-2h half marathon': {
    ru: 'Пробежать полумарафон быстрее 2 часов',
    de: 'Halbmarathon unter 2 Stunden laufen',
    es: 'Correr un medio maratón en menos de 2h',
  },
  'Pass C1 Spanish proficiency exam': {
    ru: 'Сдать экзамен по испанскому уровня C1',
    de: 'C1-Spanisch-Prüfung bestehen',
    es: 'Aprobar el examen de español nivel C1',
  },
  // SUCCESS CRITERIA
  'Paying MRR ≥ $10,000 for 3 consecutive months': {
    ru: 'Платный MRR ≥ $10 000 три месяца подряд',
    de: 'Zahlender MRR ≥ $10.000 über 3 aufeinanderfolgende Monate',
    es: 'MRR de pago ≥ $10.000 durante 3 meses consecutivos',
  },
  'At least 50 active paying customers': {
    ru: 'Минимум 50 активных платящих клиентов',
    de: 'Mindestens 50 aktive zahlende Kunden',
    es: 'Al menos 50 clientes de pago activos',
  },
  'Net revenue retention ≥ 100%': {
    ru: 'Net revenue retention ≥ 100%',
    de: 'Net Revenue Retention ≥ 100%',
    es: 'Net revenue retention ≥ 100%',
  },
  'Complete 21.1km in under 2:00:00 in a real race': {
    ru: 'Пробежать 21,1 км быстрее 2:00:00 на реальном забеге',
    de: '21,1 km in unter 2:00:00 in einem echten Rennen schaffen',
    es: 'Completar 21,1 km en menos de 2:00:00 en una carrera real',
  },
  'Hold sub-5:40/km pace for full distance': {
    ru: 'Удерживать темп быстрее 5:40/км всю дистанцию',
    de: 'Pace unter 5:40/km über die gesamte Distanz halten',
    es: 'Mantener un ritmo inferior a 5:40/km durante toda la distancia',
  },
  'Pass DELE C1 official exam': {
    ru: 'Сдать официальный экзамен DELE C1',
    de: 'Offizielle DELE-C1-Prüfung bestehen',
    es: 'Aprobar el examen oficial DELE C1',
  },
  'Hold 30-min conversation with native speaker without effort': {
    ru: 'Без напряжения провести 30-минутный разговор с носителем',
    de: '30 Minuten mühelos mit Muttersprachler unterhalten',
    es: 'Mantener una conversación de 30 min con un nativo sin esfuerzo',
  },

  // PROJECTS
  'Set up Stripe billing': { ru: 'Настроить биллинг через Stripe', de: 'Stripe-Billing einrichten', es: 'Configurar facturación con Stripe' },
  'Launch on Product Hunt': { ru: 'Запуск на Product Hunt', de: 'Launch auf Product Hunt', es: 'Lanzamiento en Product Hunt' },
  'Build pricing page': { ru: 'Сделать страницу с тарифами', de: 'Pricing-Page bauen', es: 'Crear página de precios' },
  'Set up customer support flow': { ru: 'Настроить поддержку клиентов', de: 'Customer-Support-Flow aufsetzen', es: 'Configurar flujo de soporte al cliente' },
  'Establish 4×/week training routine': { ru: 'Закрепить рутину тренировок 4 раза в неделю', de: '4×/Woche Trainingsroutine etablieren', es: 'Establecer rutina de entrenamiento 4×/semana' },
  'Build base mileage to 30km/week': { ru: 'Нарастить базу до 30 км в неделю', de: 'Grundkilometer auf 30 km/Woche aufbauen', es: 'Subir la base hasta 30 km/semana' },
  'Add tempo and interval workouts': { ru: 'Добавить темповые и интервальные тренировки', de: 'Tempo- und Intervallläufe ergänzen', es: 'Añadir entrenamientos de tempo e intervalos' },
  'Complete B2 textbook': { ru: 'Пройти учебник уровня B2', de: 'B2-Lehrbuch durcharbeiten', es: 'Completar el libro de B2' },
  'Find conversation partner': { ru: 'Найти собеседника для разговорной практики', de: 'Konversationspartner finden', es: 'Encontrar compañero de conversación' },

  // RITUALS
  'Read 30 min in Spanish daily': { ru: 'Читать на испанском по 30 минут в день', de: 'Täglich 30 Min auf Spanisch lesen', es: 'Leer 30 min en español al día' },
  'Strength training (alternating with runs)': { ru: 'Силовая (чередуя с пробежками)', de: 'Krafttraining (im Wechsel mit Läufen)', es: 'Entrenamiento de fuerza (alternando con carreras)' },
  'Weekly project audit': { ru: 'Еженедельный аудит проектов', de: 'Wöchentliches Projekt-Audit', es: 'Auditoría semanal de proyectos' },
  'Morning pages (3 pages of writing)': { ru: 'Утренние страницы (3 страницы письма)', de: 'Morning Pages (3 Seiten schreiben)', es: 'Páginas matutinas (3 páginas de escritura)' },

  // IDEAS
  'Newsletter to share build-in-public learnings': { ru: 'Рассылка с уроками build-in-public', de: 'Newsletter mit Build-in-Public-Learnings', es: 'Newsletter con aprendizajes de build-in-public' },
  'Build a public dashboard showing live MRR': { ru: 'Сделать публичный дашборд с live MRR', de: 'Öffentliches Dashboard mit Live-MRR bauen', es: 'Crear un dashboard público con MRR en vivo' },
  'Try cold therapy after long runs': { ru: 'Попробовать холодовую терапию после длинных пробежек', de: 'Kältetherapie nach langen Läufen ausprobieren', es: 'Probar terapia de frío tras tiradas largas' },
  'Watch Spanish news (RTVE) for 15 min daily': { ru: 'Смотреть испанские новости (RTVE) по 15 минут в день', de: 'Täglich 15 Min spanische Nachrichten (RTVE) schauen', es: 'Ver noticias en español (RTVE) 15 min al día' },
  'Start a podcast about indie SaaS journey': { ru: 'Запустить подкаст про путь indie-SaaS', de: 'Podcast über die Indie-SaaS-Journey starten', es: 'Lanzar un podcast sobre el camino indie SaaS' },

  // ACTIONS
  'Read Stripe API docs': { ru: 'Изучить документацию Stripe API', de: 'Stripe-API-Docs lesen', es: 'Leer la documentación de la API de Stripe' },
  'Set up Stripe account and verify business': { ru: 'Создать аккаунт Stripe и верифицировать бизнес', de: 'Stripe-Account anlegen und Business verifizieren', es: 'Crear cuenta de Stripe y verificar el negocio' },
  'Implement checkout webhook handler': { ru: 'Реализовать обработчик checkout-вебхуков', de: 'Checkout-Webhook-Handler implementieren', es: 'Implementar handler de webhook de checkout' },
  'Test payment flow end-to-end': { ru: 'Протестировать оплату end-to-end', de: 'Payment-Flow end-to-end testen', es: 'Probar el flujo de pago end-to-end' },
  'Add subscription management page': { ru: 'Сделать страницу управления подпиской', de: 'Seite für Abo-Verwaltung hinzufügen', es: 'Añadir página de gestión de suscripción' },
  'Handle failed payment retries': { ru: 'Обработать повторы неудачных платежей', de: 'Retries fehlgeschlagener Zahlungen behandeln', es: 'Manejar reintentos de pagos fallidos' },
  'Write Stripe integration documentation': { ru: 'Написать документацию по интеграции Stripe', de: 'Stripe-Integrations-Doku schreiben', es: 'Escribir documentación de la integración con Stripe' },
  'Deploy Stripe integration to production': { ru: 'Выкатить интеграцию Stripe в продакшн', de: 'Stripe-Integration in Produktion deployen', es: 'Desplegar la integración de Stripe en producción' },
  'Draft Product Hunt launch copy': { ru: 'Написать копирайт для запуска на Product Hunt', de: 'Product-Hunt-Launch-Copy entwerfen', es: 'Redactar el copy del lanzamiento en Product Hunt' },
  'Design hero image for launch': { ru: 'Сделать hero-картинку для запуска', de: 'Hero-Bild für den Launch designen', es: 'Diseñar la imagen hero del lanzamiento' },
  'Reach out to 20 potential hunters': { ru: 'Связаться с 20 потенциальными hunters', de: '20 potenzielle Hunters anschreiben', es: 'Contactar a 20 hunters potenciales' },
  'Prepare launch-day social posts': { ru: 'Подготовить посты в соцсети на день запуска', de: 'Social-Posts für den Launch-Day vorbereiten', es: 'Preparar posts de redes para el día del lanzamiento' },
  'Schedule launch on Product Hunt': { ru: 'Запланировать запуск на Product Hunt', de: 'Launch auf Product Hunt planen', es: 'Programar el lanzamiento en Product Hunt' },
  'Reply to launch-day comments': { ru: 'Отвечать на комментарии в день запуска', de: 'Auf Launch-Day-Kommentare antworten', es: 'Responder a los comentarios del día del lanzamiento' },
  'Research competitor pricing': { ru: 'Изучить цены конкурентов', de: 'Konkurrenz-Pricing recherchieren', es: 'Investigar precios de la competencia' },
  'Draft pricing tiers and copy': { ru: 'Описать тарифы и копирайт к ним', de: 'Preisstufen und Copy entwerfen', es: 'Redactar planes de precios y copy' },
  'Design pricing page layout': { ru: 'Спроектировать страницу с тарифами', de: 'Pricing-Page-Layout designen', es: 'Diseñar el layout de la página de precios' },
  'Implement pricing page in code': { ru: 'Сверстать страницу с тарифами', de: 'Pricing-Page im Code umsetzen', es: 'Implementar la página de precios en código' },
  'Compare Intercom vs Crisp vs Plain': { ru: 'Сравнить Intercom, Crisp и Plain', de: 'Intercom vs Crisp vs Plain vergleichen', es: 'Comparar Intercom vs Crisp vs Plain' },
  'Set up support email forwarding': { ru: 'Настроить пересылку support-почты', de: 'Support-E-Mail-Weiterleitung einrichten', es: 'Configurar reenvío del email de soporte' },
  'Schedule 4 weekly training slots in calendar': { ru: 'Поставить в календарь 4 тренировки в неделю', de: '4 wöchentliche Trainingsslots im Kalender einplanen', es: 'Programar 4 entrenamientos semanales en el calendario' },
  'Buy proper running shoes': { ru: 'Купить нормальные беговые кроссовки', de: 'Richtige Laufschuhe kaufen', es: 'Comprar zapatillas de correr decentes' },
  'Plan first 4 weeks of runs': { ru: 'Распланировать первые 4 недели пробежек', de: 'Erste 4 Laufwochen planen', es: 'Planificar las primeras 4 semanas de carreras' },
  'Run first base-building week': { ru: 'Пробежать первую неделю базы', de: 'Erste Base-Building-Woche laufen', es: 'Correr la primera semana de base' },
  'Build training routine into habit': { ru: 'Превратить тренировки в привычку', de: 'Trainingsroutine zur Gewohnheit machen', es: 'Convertir el entrenamiento en hábito' },
  'Complete week 1 of base building': { ru: 'Закрыть 1-ю неделю базы', de: 'Woche 1 des Base-Buildings abschließen', es: 'Completar la semana 1 de base' },
  'Add long Sunday run': { ru: 'Добавить длинную воскресную пробежку', de: 'Langen Sonntagslauf hinzufügen', es: 'Añadir tirada larga de domingo' },
  'Hit 20km week': { ru: 'Закрыть неделю на 20 км', de: '20-km-Woche schaffen', es: 'Cerrar semana de 20 km' },
  'Recovery jog after long run': { ru: 'Восстановительный бег после длинной', de: 'Recovery-Jog nach dem langen Lauf', es: 'Trote de recuperación tras la tirada larga' },
  'Hit 25km week': { ru: 'Закрыть неделю на 25 км', de: '25-km-Woche schaffen', es: 'Cerrar semana de 25 km' },
  'Test pace on long run': { ru: 'Проверить темп на длинной пробежке', de: 'Pace auf dem langen Lauf testen', es: 'Probar el ritmo en la tirada larga' },
  'Hit 28km week': { ru: 'Закрыть неделю на 28 км', de: '28-km-Woche schaffen', es: 'Cerrar semana de 28 km' },
  'Long run with negative split': { ru: 'Длинная с negative split', de: 'Langer Lauf mit Negative Split', es: 'Tirada larga con negative split' },
  'First tempo workout (3×1km)': { ru: 'Первая темповая (3×1 км)', de: 'Erstes Tempotraining (3×1 km)', es: 'Primer entrenamiento de tempo (3×1 km)' },
  'First interval workout (8×400m)': { ru: 'Первая интервальная (8×400 м)', de: 'Erstes Intervalltraining (8×400 m)', es: 'Primer entrenamiento de intervalos (8×400 m)' },
  'Get B2 textbook (Aula Internacional 4)': { ru: 'Купить учебник B2 (Aula Internacional 4)', de: 'B2-Lehrbuch besorgen (Aula Internacional 4)', es: 'Conseguir libro de B2 (Aula Internacional 4)' },
  'Complete unit 1 (subjunctive review)': { ru: 'Пройти unit 1 (повторение subjunctive)', de: 'Unit 1 abschließen (Subjunctive-Wiederholung)', es: 'Completar unidad 1 (repaso de subjuntivo)' },
  'Complete unit 2 (narrative tenses)': { ru: 'Пройти unit 2 (нарративные времена)', de: 'Unit 2 abschließen (Erzählzeiten)', es: 'Completar unidad 2 (tiempos narrativos)' },
  'Complete unit 3 (conditionals)': { ru: 'Пройти unit 3 (условные)', de: 'Unit 3 abschließen (Konditionalsätze)', es: 'Completar unidad 3 (condicionales)' },
  'Complete unit 4 (reported speech)': { ru: 'Пройти unit 4 (косвенная речь)', de: 'Unit 4 abschließen (Indirekte Rede)', es: 'Completar unidad 4 (estilo indirecto)' },
  'Complete unit 5 (passive voice)': { ru: 'Пройти unit 5 (пассивный залог)', de: 'Unit 5 abschließen (Passiv)', es: 'Completar unidad 5 (voz pasiva)' },
  'Mid-textbook review and self-test': { ru: 'Середина учебника: повторение и self-test', de: 'Halbzeit-Review und Selbsttest', es: 'Repaso de mitad del libro y autoevaluación' },
  'Sign up for italki.com': { ru: 'Зарегистрироваться на italki.com', de: 'Bei italki.com anmelden', es: 'Registrarse en italki.com' },
  'Write Product Hunt FAQ replies': { ru: 'Написать ответы на FAQ для Product Hunt', de: 'Product-Hunt-FAQ-Antworten schreiben', es: 'Escribir respuestas a las FAQ de Product Hunt' },
  'Add testimonials to pricing page': { ru: 'Добавить отзывы на страницу тарифов', de: 'Testimonials zur Pricing-Page hinzufügen', es: 'Añadir testimonios a la página de precios' },
  'Tempo workout: 4×1km @ goal pace': { ru: 'Темповая: 4×1 км в целевом темпе', de: 'Tempotraining: 4×1 km im Zieltempo', es: 'Entrenamiento de tempo: 4×1 km al ritmo objetivo' },
  'Email Product Hunt feedback to team': { ru: 'Отправить команде фидбек с Product Hunt', de: 'Product-Hunt-Feedback per Mail ans Team', es: 'Enviar al equipo el feedback de Product Hunt' },
  'Complete unit 6 (relative clauses)': { ru: 'Пройти unit 6 (относительные придаточные)', de: 'Unit 6 abschließen (Relativsätze)', es: 'Completar unidad 6 (oraciones de relativo)' },
  'Plan post-launch retention campaign': { ru: 'Спланировать retention-кампанию после запуска', de: 'Retention-Kampagne nach dem Launch planen', es: 'Planificar campaña de retención post-lanzamiento' },
  'A/B test pricing page CTA copy': { ru: 'A/B-тест копирайта CTA на странице тарифов', de: 'A/B-Test der CTA-Copy auf der Pricing-Page', es: 'Test A/B del copy del CTA de la página de precios' },
  'Draft 10 canned support replies': { ru: 'Написать 10 шаблонов ответов поддержки', de: '10 vorgefertigte Support-Antworten entwerfen', es: 'Redactar 10 respuestas tipo de soporte' },
  'Set up support team workflow': { ru: 'Настроить workflow команды поддержки', de: 'Support-Team-Workflow aufsetzen', es: 'Configurar el workflow del equipo de soporte' },
  'Plan taper week before race': { ru: 'Спланировать неделю taper перед забегом', de: 'Taper-Woche vor dem Rennen planen', es: 'Planificar semana de taper antes de la carrera' },
  'Run race-pace simulation 15km': { ru: 'Симуляция гонки в темпе на 15 км', de: '15-km-Simulation im Renntempo', es: 'Simulación de carrera a ritmo de 15 km' },
  'Find C1 prep textbook': { ru: 'Найти учебник для подготовки к C1', de: 'C1-Vorbereitungslehrbuch finden', es: 'Encontrar libro de preparación para C1' },
  'Schedule first italki lesson': { ru: 'Записаться на первый урок italki', de: 'Erste italki-Stunde buchen', es: 'Agendar la primera clase en italki' },
  'Investigate referral program': { ru: 'Изучить вариант реферальной программы', de: 'Referral-Programm prüfen', es: 'Investigar programa de referidos' },
  'Find Spanish-language podcast for daily commute': { ru: 'Найти испанский подкаст на дорогу', de: 'Spanischen Podcast für den Arbeitsweg finden', es: 'Encontrar un podcast en español para el trayecto diario' },
  'Design Product Hunt assets': { ru: 'Сделать креативы для Product Hunt', de: 'Product-Hunt-Assets designen', es: 'Diseñar los assets para Product Hunt' },
  'Code review pricing page PR': { ru: 'Ревью PR со страницей тарифов', de: 'Code-Review für Pricing-Page-PR', es: 'Code review del PR de la página de precios' },
  'Audit current support emails': { ru: 'Аудит текущих писем поддержки', de: 'Aktuelle Support-Mails auditieren', es: 'Auditar los emails de soporte actuales' },
  'Research churn benchmarks for SaaS': { ru: 'Изучить бенчмарки churn для SaaS', de: 'Churn-Benchmarks für SaaS recherchieren', es: 'Investigar benchmarks de churn para SaaS' },
  'Match me with conversation partner': { ru: 'Подобрать мне собеседника', de: 'Mich mit Konversationspartner matchen', es: 'Emparejarme con un compañero de conversación' },
  'Build custom CRM integration': { ru: 'Сделать кастомную интеграцию с CRM', de: 'Eigene CRM-Integration bauen', es: 'Crear integración personalizada con CRM' },
  'Add manual invoice generation': { ru: 'Добавить ручную генерацию инвойсов', de: 'Manuelle Rechnungserstellung hinzufügen', es: 'Añadir generación manual de facturas' },
  'Sign up for marathon (deferred)': { ru: 'Записаться на марафон (отложено)', de: 'Für Marathon anmelden (verschoben)', es: 'Inscribirse en el maratón (aplazado)' },
  'Trial running coach (cancelled)': { ru: 'Пробное занятие с тренером (отменено)', de: 'Probestunde Lauftrainer (abgesagt)', es: 'Sesión de prueba con entrenador (cancelada)' },
  'Buy old C1 textbook (replaced)': { ru: 'Купить старый учебник C1 (заменён)', de: 'Altes C1-Lehrbuch kaufen (ersetzt)', es: 'Comprar libro C1 antiguo (reemplazado)' },

  // REFERENCES (titles only — URLs preserved)
  'Stripe Subscriptions docs': { ru: 'Документация Stripe Subscriptions', de: 'Stripe-Subscriptions-Docs', es: 'Docs de Stripe Subscriptions' },
  'Webhook signature verification': { ru: 'Проверка подписи вебхуков', de: 'Webhook-Signatur-Verifikation', es: 'Verificación de firma de webhooks' },
  'PR #127 — Stripe integration': { ru: 'PR #127 — интеграция Stripe', de: 'PR #127 — Stripe-Integration', es: 'PR #127 — integración con Stripe' },
  'PR #142 — Customer portal': { ru: 'PR #142 — клиентский портал', de: 'PR #142 — Customer Portal', es: 'PR #142 — portal de cliente' },
  'Internal: billing architecture notes': { ru: 'Внутреннее: заметки по архитектуре биллинга', de: 'Intern: Notizen zur Billing-Architektur', es: 'Interno: notas de arquitectura de facturación' },
  'Product Hunt launch checklist': { ru: 'Чек-лист запуска на Product Hunt', de: 'Product-Hunt-Launch-Checkliste', es: 'Checklist de lanzamiento en Product Hunt' },
  'Internal: launch day playbook': { ru: 'Внутреннее: плейбук дня запуска', de: 'Intern: Launch-Day-Playbook', es: 'Interno: playbook del día del lanzamiento' },
  'Twitter list of launch supporters': { ru: 'Twitter-список саппортеров запуска', de: 'Twitter-Liste der Launch-Supporter', es: 'Lista de Twitter de apoyos al lanzamiento' },
  'Stripe Atlas: pricing playbook': { ru: 'Stripe Atlas: плейбук по pricing', de: 'Stripe Atlas: Pricing-Playbook', es: 'Stripe Atlas: playbook de pricing' },
  'Pricing strategy reading': { ru: 'Чтение по pricing-стратегии', de: 'Lektüre zur Pricing-Strategie', es: 'Lecturas sobre estrategia de pricing' },
  'Plain (chosen tool)': { ru: 'Plain (выбранный инструмент)', de: 'Plain (gewähltes Tool)', es: 'Plain (herramienta elegida)' },
  'Internal: tool comparison notes': { ru: 'Внутреннее: сравнение инструментов', de: 'Intern: Tool-Vergleichsnotizen', es: 'Interno: notas de comparación de herramientas' },
  "Runner's World: base building principles": { ru: "Runner's World: принципы построения базы", de: "Runner's World: Base-Building-Prinzipien", es: "Runner's World: principios de base building" },
  'Strava: first 5km test run': { ru: 'Strava: первый тестовый бег на 5 км', de: 'Strava: erster 5-km-Testlauf', es: 'Strava: primera carrera de prueba de 5 km' },
  'Form check video — coach feedback': { ru: 'Видео с разбором техники — фидбек тренера', de: 'Form-Check-Video — Coach-Feedback', es: 'Vídeo de revisión de técnica — feedback del coach' },
  'Hal Higdon Half Marathon Training Guide': { ru: 'Hal Higdon: гайд по подготовке к полумарафону', de: 'Hal Higdon Halbmarathon-Trainingsguide', es: 'Guía de entrenamiento de medio maratón de Hal Higdon' },
  '10% rule explained': { ru: 'Правило 10% — объяснение', de: 'Die 10-%-Regel erklärt', es: 'La regla del 10% explicada' },
  'Strava training log': { ru: 'Тренировочный лог Strava', de: 'Strava-Trainingslog', es: 'Registro de entrenamiento en Strava' },
  'Personal weekly log': { ru: 'Личный недельный лог', de: 'Persönlicher Wochen-Log', es: 'Registro semanal personal' },
  'Aula Internacional textbook info': { ru: 'Информация по учебнику Aula Internacional', de: 'Infos zum Aula-Internacional-Lehrbuch', es: 'Información del libro Aula Internacional' },
  'Spanish B2 Anki deck': { ru: 'Anki-колода для испанского B2', de: 'Spanisch-B2-Anki-Deck', es: 'Mazo de Anki de español B2' },
  'italki': { ru: 'italki', de: 'italki', es: 'italki' },
};

function tx(s, lang) {
  if (s == null) return s;
  const hit = T[s];
  if (hit && hit[lang]) return hit[lang];
  return s; // fallback EN — flagged below
}

const flagged = new Set();

function localize(lang, data) {
  // Deep clone
  const f = JSON.parse(JSON.stringify(data));

  function maybe(s) {
    if (typeof s !== 'string' || !s.trim()) return s;
    if (lang === 'en') return s;
    if (T[s] && T[s][lang]) return T[s][lang];
    flagged.add(`[${lang}] ${s}`);
    return s;
  }

  for (const g of f.goals) {
    g.title = maybe(g.title);
    if (g.description) g.description = maybe(g.description);
    for (const c of g.successCriteria || []) c.text = maybe(c.text);
  }
  for (const p of f.projects) {
    p.title = maybe(p.title);
    // p.description is TipTap JSON — leave as-is (long-form, EN acceptable per spec note).
    for (const r of p.references || []) r.title = maybe(r.title);
  }
  for (const a of f.actions) {
    a.title = maybe(a.title);
    if (a.delegateNote) a.delegateNote = maybe(a.delegateNote);
  }
  for (const r of f.rituals) r.title = maybe(r.title);
  for (const i of f.ideas) i.title = maybe(i.title);
  return f;
}

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
for (const lang of ['en', 'ru', 'de', 'es']) {
  const out = localize(lang, en);
  fs.writeFileSync(
    path.join(OUT_DIR, `sampleDataFixture.${lang}.json`),
    JSON.stringify(out, null, 2),
  );
  console.log('wrote', `sampleDataFixture.${lang}.json`);
}

if (flagged.size) {
  console.log('\n⚠️  Untranslated strings (kept as EN):');
  [...flagged].slice(0, 50).forEach((s) => console.log('  ', s));
  console.log(`  …${flagged.size} total`);
}
