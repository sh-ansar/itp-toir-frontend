// Static public catalog. No private workspace data or undocumented product claims.
export const publicModules = [
  { key:'dashboard',icon:'Dashboard',demo:'appearance',family:'overview' },
  { key:'feed',icon:'Activity Feed',demo:'messages',family:'collaboration' },
  { key:'employees',icon:'Resume',demo:'search',family:'collaboration' },
  { key:'projects',icon:'Business',demo:'tasks',family:'workflows' },
  { key:'tasks',icon:'Task',demo:'tasks',family:'workflows' },
  { key:'storage',icon:'Folder',demo:'wiki',family:'knowledge' },
  { key:'wiki',icon:'Read',demo:'wiki',family:'knowledge' },
  { key:'documents',icon:'Document',demo:'wiki',family:'knowledge' },
  { key:'messenger',icon:'Messaging',demo:'messages',family:'collaboration' },
]
export const publicSectors = [
  { key:'it',icon:'Code',demo:'tasks' },
  { key:'manufacturing',icon:'Settings',demo:'tasks' },
  { key:'education',icon:'Read',demo:'wiki' },
  { key:'services',icon:'Business',demo:'messages' },
]
export const modulePath = key => '/product/modules/' + key
export const sectorPath = key => '/solutions/' + key

export const catalogUi = {
  ru:{
    module:'Возможности платформы',sector:'Решения для команд',home:'Главная',modules:'Модули',sectors:'Отрасли',
    seeDemo:'Попробовать интерактивно',getStarted:'Создать портал',allModules:'Все модули',
    highlights:'Что можно делать',highlightsSub:'Функции работают внутри корпоративного пространства с учётом прав пользователей.',
    preview:'Как это выглядит',previewSub:'Переключайте вкладки и попробуйте демонстрационный сценарий без регистрации.',
    learnMore:'Подробнее',related:'Также пригодится',workflows:'Связанные возможности',
    security:'Данные и доступ',securityText:'Для реальной работы требуется аккаунт и доступ к компании. Демо содержит только вымышленные данные.',
    begin:'Начать работу',ctaTitle:'Соберите портал под свою команду',ctaText:'Выбирайте модули и тариф, создайте компанию и пригласите коллег.',
    pricing:'Тарифы и ограничения',backHome:'На главную',sample:'Демонстрация',step1:'Организуйте информацию',
    step2:'Настройте права и роли',step3:'Работайте вместе',
    steps:{overview:['Рабочие блоки в одном месте','Быстрый переход к разделам','Настраиваемый интерфейс'],
      collaboration:['Коммуникация внутри компании','Сотрудники и контекст в одном месте','Информация не теряется в переписках'],
      workflows:['Планирование работы и этапов','Общий статус задач и проектов','Прозрачные следующие действия'],
      knowledge:['Материалы в структурированных разделах','Удобный поиск и просмотр','Доступ по ролям и контексту'],
      sector:['Согласованные задачи и проекты','Быстрый доступ к документам','Командная коммуникация и знания']}
  },
  en:{
    module:'Platform features',sector:'Solutions for teams',home:'Home',modules:'Modules',sectors:'Industries',
    seeDemo:'Try the interactive demo',getStarted:'Create a portal',allModules:'All modules',
    highlights:'What you can do',highlightsSub:'Tools work in one company workspace with role-based access.',
    preview:'See it in action',previewSub:'Switch tabs and explore a safe demo without signing up.',
    learnMore:'Learn more',related:'Related features',workflows:'Connected tools',
    security:'Data and access',securityText:'Real use requires a company account and access. Demo data is fictional.',
    begin:'Get started',ctaTitle:'Build a workspace for your team',ctaText:'Choose modules and a plan, create your company and invite colleagues.',
    pricing:'Plans and limits',backHome:'Back to home',sample:'Demo',
    steps:{overview:['Your tools in one place','Quick access to every module','Adaptable workspace'],
      collaboration:['Communicate inside your company','Team context stays together','Keep important updates visible'],
      workflows:['Plan work in stages','Track projects and tasks','Make next steps clear'],
      knowledge:['Keep material organized','Find and preview content','Control access with roles'],
      sector:['Coordinate projects and tasks','Find important documents','Connect teams and knowledge']}
  },
  ge:{
    module:'პლატფორმის შესაძლებლობები',sector:'გადაწყვეტილებები გუნდებისთვის',home:'მთავარი',modules:'მოდულები',sectors:'დარგები',
    seeDemo:'ინტერაქტიული დემო',getStarted:'პორტალის შექმნა',allModules:'ყველა მოდული',
    highlights:'რისი გაკეთება შეიძლება',highlightsSub:'მოდულები მუშაობს კომპანიის საერთო სივრცეში, წვდომის უფლებების გათვალისწინებით.',
    preview:'როგორ მუშაობს',previewSub:'გადართეთ ჩანართები და სცადეთ დემო რეგისტრაციის გარეშე.',
    learnMore:'დაწვრილებით',related:'დაკავშირებული მოდულები',workflows:'შესაძლებლობები',
    security:'მონაცემები და წვდომა',securityText:'რეალური მუშაობისთვის აუცილებელია ანგარიში და კომპანიის წვდომა. დემო მონაცემები გამოგონილია.',
    begin:'დაწყება',ctaTitle:'შექმენით სივრცე თქვენი გუნდისთვის',ctaText:'აირჩიეთ მოდულები და ტარიფი, შექმენით კომპანია და მოიწვიეთ კოლეგები.',
    pricing:'ტარიფები და ლიმიტები',backHome:'მთავარზე',sample:'დემო',
    steps:{overview:['ყველა ინსტრუმენტი ერთად','მოდულებზე სწრაფი გადასვლა','მორგებადი გარემო'],
      collaboration:['კომპანიის შიდა კომუნიკაცია','გუნდის ინფორმაცია ერთ სივრცეში','მნიშვნელოვანი სიახლეების შენახვა'],
      workflows:['სამუშაოს დაგეგმვა ეტაპებად','პროექტებისა და ამოცანების სტატუსი','შემდეგი ნაბიჯების სიცხადე'],
      knowledge:['მასალების დალაგება','მოძიება და წინასწარი ნახვა','წვდომის კონტროლი როლებით'],
      sector:['პროექტების კოორდინაცია','დოკუმენტების მოძიება','გუნდის ცოდნის გაზიარება']}
  },
  de:{
    module:'Plattformfunktionen',sector:'Lösungen für Teams',home:'Startseite',modules:'Module',sectors:'Branchen',
    seeDemo:'Interaktive Demo testen',getStarted:'Portal erstellen',allModules:'Alle Module',
    highlights:'Was Sie tun können',highlightsSub:'Die Funktionen arbeiten im Firmenbereich mit rollenbasiertem Zugriff.',
    preview:'So funktioniert es',previewSub:'Wechseln Sie die Ansichten und testen Sie die Demo ohne Anmeldung.',
    learnMore:'Mehr erfahren',related:'Verwandte Module',workflows:'Verknüpfte Funktionen',
    security:'Daten und Zugriff',securityText:'Für echte Arbeit benötigen Sie Zugang zum Unternehmen. Die Demodaten sind erfunden.',
    begin:'Jetzt starten',ctaTitle:'Ein Portal für Ihr Team',ctaText:'Wählen Sie Module und Tarif, erstellen Sie Ihr Unternehmen und laden Sie Kollegen ein.',
    pricing:'Tarife und Grenzen',backHome:'Zur Startseite',sample:'Demo',
    steps:{overview:['Alles an einem Ort','Schneller Zugriff auf Module','Anpassbare Arbeitsumgebung'],
      collaboration:['Interne Kommunikation','Teamkontext zentral','Wichtige Updates sichtbar'],
      workflows:['Arbeit in Phasen planen','Status von Aufgaben und Projekten','Klare nächste Schritte'],
      knowledge:['Inhalte strukturieren','Suchen und Vorschau','Rollenbasierter Zugriff'],
      sector:['Projekte koordinieren','Dokumente finden','Wissen im Team teilen']}
  },
  fr:{
    module:'Fonctions de la plateforme',sector:'Solutions pour équipes',home:'Accueil',modules:'Modules',sectors:'Secteurs',
    seeDemo:'Essayer la démo interactive',getStarted:'Créer un portail',allModules:'Tous les modules',
    highlights:'Ce que vous pouvez faire',highlightsSub:'Les modules fonctionnent dans un espace commun avec des droits par rôle.',
    preview:'Voir le fonctionnement',previewSub:'Changez de vue et essayez la démo sans inscription.',
    learnMore:'En savoir plus',related:'Fonctions associées',workflows:'Outils connectés',
    security:'Données et accès',securityText:'Un compte et des droits sont requis pour un usage réel. Les données de démonstration sont fictives.',
    begin:'Commencer',ctaTitle:'Un espace pour votre équipe',ctaText:'Choisissez vos modules et votre forfait, créez votre entreprise et invitez vos collègues.',
    pricing:'Tarifs et limites',backHome:'Retour à l’accueil',sample:'Démo',
    steps:{overview:['Tous vos outils réunis','Accès rapide aux modules','Espace adaptable'],
      collaboration:['Communiquer en interne','Contexte d’équipe centralisé','Actualités visibles'],
      workflows:['Planifier par étapes','Suivre les tâches et projets','Clarifier les prochaines actions'],
      knowledge:['Organiser les contenus','Chercher et prévisualiser','Accès défini par rôle'],
      sector:['Coordonner les projets','Trouver les documents','Partager le savoir']}
  },
  es:{
    module:'Funciones de la plataforma',sector:'Soluciones para equipos',home:'Inicio',modules:'Módulos',sectors:'Sectores',
    seeDemo:'Probar demo interactiva',getStarted:'Crear portal',allModules:'Todos los módulos',
    highlights:'Qué puedes hacer',highlightsSub:'Los módulos comparten un espacio de empresa con acceso por roles.',
    preview:'Cómo funciona',previewSub:'Cambia de vista y prueba la demo sin registrarte.',
    learnMore:'Saber más',related:'Módulos relacionados',workflows:'Funciones conectadas',
    security:'Datos y acceso',securityText:'Para el uso real se requiere una cuenta con acceso a la empresa. Los datos de prueba son ficticios.',
    begin:'Empezar',ctaTitle:'Un portal para tu equipo',ctaText:'Elige módulos y un plan, crea la empresa e invita a compañeros.',
    pricing:'Planes y límites',backHome:'Volver al inicio',sample:'Demo',
    steps:{overview:['Herramientas en un lugar','Acceso rápido a los módulos','Espacio configurable'],
      collaboration:['Comunicación interna','Contexto de equipo compartido','Noticias siempre visibles'],
      workflows:['Planificar por fases','Seguir tareas y proyectos','Pasos siguientes claros'],
      knowledge:['Organizar contenidos','Buscar y previsualizar','Acceso por roles'],
      sector:['Coordinar proyectos','Encontrar documentos','Compartir conocimiento']}
  }
}
// Unique copy for every footer destination in all six supported public languages.
export const catalogDescription = {
  ru:{
    dashboard:['Ваш рабочий день — в одном окне','Откройте ключевые разделы, новости и личные задачи с единого рабочего стола.'],
    feed:['Новости и события компании','Публикуйте внутренние обновления и обсуждайте их там, где коллеги работают каждый день.'],
    employees:['Команда всегда рядом','Находите коллег, их подразделения, контакты и связи в структуре компании.'],
    projects:['Проекты под общим контролем','Объединяйте участников, контекст и задачи внутри рабочих проектов.'],
    tasks:['Понятные задачи и статусы','Ставьте задачи, распределяйте ответственность и отслеживайте движение по этапам.'],
    storage:['Файлы под рукой','Храните рабочие материалы в пространстве компании и открывайте доступ коллегам.'],
    wiki:['Знания не теряются','Создавайте и развивайте внутреннюю базу знаний с иерархией страниц и историей изменений.'],
    documents:['Документы в рабочем пространстве','Собирайте документы компании в одном разделе, чтобы их было удобно найти и просмотреть.'],
    messenger:['Обсуждения без потери контекста','Общайтесь в личных чатах, каналах и проектных беседах, обменивайтесь материалами.'],
    it:['Разработка и коммуникация в одной системе','Соединяйте проектные задачи, команду и техническую базу знаний в общем пространстве.'],
    manufacturing:['Связь между офисом и подразделениями','Организуйте рабочие поручения, документацию и взаимодействие распределённых команд.'],
    education:['Материалы и команда в одном месте','Делитесь инструкциями и знаниями, координируйте задачи и рабочие обсуждения.'],
    services:['Прозрачная работа с задачами и людьми','Планируйте поручения, находите информацию и координируйте специалистов в едином портале.']
  },
  en:{
    dashboard:['Your workday at a glance','Open key modules, news and personal tasks from a shared dashboard.'],
    feed:['Company news and updates','Publish internal updates and discuss them where the team works.'],
    employees:['Find the people you need','Discover colleagues, departments, contacts and the organization structure.'],
    projects:['Keep projects in one place','Bring participants, context and tasks together around shared work.'],
    tasks:['Clear tasks and progress','Assign work, share responsibility and track tasks across stages.'],
    storage:['Files when you need them','Keep work materials in the company space and give colleagues access.'],
    wiki:['Knowledge that stays','Build an internal knowledge base with nested pages and revision history.'],
    documents:['Documents in one workspace','Keep important files in an organized area for easy access and preview.'],
    messenger:['Conversations with context','Talk in direct chats, channels and project discussions and exchange materials.'],
    it:['Build and communicate together','Connect delivery tasks, people and technical knowledge in one workspace.'],
    manufacturing:['Connect office and operations','Coordinate assignments, documents and distributed teams.'],
    education:['Learning resources in one place','Share materials and knowledge while coordinating tasks and discussions.'],
    services:['Clear coordination across teams','Plan assignments, find information and connect people in a shared portal.']
  },
  ge:{
    dashboard:['სამუშაო დღე ერთ გვერდზე','გახსენით ძირითადი მოდულები, სიახლეები და პირადი ამოცანები საერთო სამუშაო მაგიდიდან.'],
    feed:['კომპანიის სიახლეები','გამოაქვეყნეთ შიდა სიახლეები და განიხილეთ ისინი გუნდთან ერთად.'],
    employees:['იპოვეთ საჭირო კოლეგა','ნახეთ თანამშრომლები, განყოფილებები, კონტაქტები და ორგანიზაციული სტრუქტურა.'],
    projects:['პროექტები ერთ სივრცეში','გააერთიანეთ მონაწილეები, ინფორმაცია და ამოცანები პროექტის ფარგლებში.'],
    tasks:['გასაგები ამოცანები და სტატუსები','მიანიჭეთ ამოცანები, განსაზღვრეთ პასუხისმგებლობა და აკონტროლეთ პროგრესი.'],
    storage:['ფაილები ყოველთვის ხელთ','შეინახეთ მასალები კომპანიის სივრცეში და გაუზიარეთ თანამშრომლებს.'],
    wiki:['ცოდნა არ იკარგება','შექმენით ცოდნის ბაზა დაკავშირებული გვერდებითა და ცვლილებების ისტორიით.'],
    documents:['დოკუმენტები ერთ სივრცეში','მოაწესრიგეთ კომპანიის დოკუმენტები სწრაფი მოძიებისა და ნახვისთვის.'],
    messenger:['საუბრები კონტექსტით','ისაუბრეთ პირად ჩატებში, არხებსა და პროექტის ჯგუფებში.'],
    it:['განვითარება და კომუნიკაცია ერთად','დააკავშირეთ ამოცანები, გუნდი და ტექნიკური ცოდნა ერთ გარემოში.'],
    manufacturing:['კავშირი ოფისსა და ობიექტებს შორის','მართეთ დავალებები, დოკუმენტები და განაწილებული გუნდის ურთიერთობა.'],
    education:['სასწავლო მასალები ერთ ადგილას','გაუზიარეთ ცოდნა და კოორდინაცია გაუწიეთ ამოცანებსა და დისკუსიებს.'],
    services:['გუნდის გამართული კოორდინაცია','დაგეგმეთ სამუშაო, მოიძიეთ ინფორმაცია და დააკავშირეთ თანამშრომლები.']
  },
  de:{
    dashboard:['Der Arbeitstag auf einen Blick','Öffnen Sie Module, Neuigkeiten und persönliche Aufgaben von einem Dashboard aus.'],
    feed:['Neuigkeiten im Unternehmen','Veröffentlichen und besprechen Sie interne Updates im Arbeitsalltag.'],
    employees:['Die richtigen Kolleginnen und Kollegen','Finden Sie Teams, Abteilungen, Kontakte und die Organisationsstruktur.'],
    projects:['Projekte an einem Ort','Bringen Sie Beteiligte, Informationen und Aufgaben zusammen.'],
    tasks:['Klare Aufgaben und Status','Verteilen Sie Arbeit und verfolgen Sie den Fortschritt über mehrere Phasen.'],
    storage:['Dateien jederzeit griffbereit','Speichern und teilen Sie Arbeitsmaterial im Unternehmensbereich.'],
    wiki:['Wissen bleibt erhalten','Erstellen Sie eine Wissensdatenbank mit Seitenstruktur und Versionsverlauf.'],
    documents:['Dokumente im Arbeitsbereich','Ordnen und öffnen Sie Unternehmensdokumente an einem Ort.'],
    messenger:['Gespräche im Kontext','Kommunizieren Sie in Direktchats, Kanälen und Projektgruppen.'],
    it:['Entwicklung und Austausch verbinden','Kombinieren Sie Aufgaben, Teams und technisches Wissen.'],
    manufacturing:['Büro und Betrieb verbinden','Koordinieren Sie Aufgaben, Dokumente und verteilte Teams.'],
    education:['Materialien zentral bereitstellen','Teilen Sie Wissen, Aufgaben und Teamgespräche.'],
    services:['Koordination für Service-Teams','Planen Sie Aufgaben und verbinden Sie Fachkräfte im Portal.']
  },
  fr:{
    dashboard:['Votre journée en un coup d’œil','Accédez aux modules, aux actualités et aux tâches depuis le tableau de bord.'],
    feed:['Actualités de l’entreprise','Publiez et discutez les nouvelles avec votre équipe.'],
    employees:['Retrouvez vos collègues','Consultez équipes, départements, contacts et organigramme.'],
    projects:['Projets au même endroit','Réunissez les participants, les informations et les tâches.'],
    tasks:['Tâches et suivi clairs','Assignez le travail et suivez son avancement étape par étape.'],
    storage:['Fichiers à portée de main','Conservez et partagez les documents dans l’espace de l’entreprise.'],
    wiki:['Des connaissances durables','Créez une base de connaissances hiérarchisée avec historique des versions.'],
    documents:['Documents bien organisés','Centralisez les documents pour les retrouver et les consulter facilement.'],
    messenger:['Discussions contextualisées','Échangez en direct, dans les canaux et les groupes de projet.'],
    it:['Développement et communication','Reliez les tâches, les équipes et les connaissances techniques.'],
    manufacturing:['Relier bureau et opérations','Coordonnez les missions, documents et équipes distribuées.'],
    education:['Ressources au même endroit','Partagez le savoir et organisez les tâches et les discussions.'],
    services:['Coopération entre services','Planifiez le travail et reliez les spécialistes dans un portail.']
  },
  es:{
    dashboard:['Tu jornada de un vistazo','Accede a módulos, noticias y tareas personales desde un panel.'],
    feed:['Noticias de la empresa','Publica novedades internas y coméntalas con tu equipo.'],
    employees:['Encuentra a tus compañeros','Consulta equipos, departamentos, contactos y organigrama.'],
    projects:['Proyectos en un mismo lugar','Reúne participantes, información y tareas de cada proyecto.'],
    tasks:['Tareas y estados claros','Asigna responsabilidades y sigue el progreso por etapas.'],
    storage:['Archivos a mano','Guarda y comparte materiales en el espacio de la empresa.'],
    wiki:['Conocimiento que perdura','Crea una base de conocimiento con páginas anidadas e historial de cambios.'],
    documents:['Documentos organizados','Centraliza los documentos para buscarlos y consultarlos fácilmente.'],
    messenger:['Conversaciones con contexto','Habla en chats directos, canales y grupos de proyecto.'],
    it:['Desarrollo y comunicación unidos','Conecta tareas, personas y conocimientos técnicos en un espacio.'],
    manufacturing:['Conecta oficina y operaciones','Coordina tareas, documentos y equipos distribuidos.'],
    education:['Materiales en un solo lugar','Comparte recursos y organiza tareas y conversaciones.'],
    services:['Coordinación entre equipos','Planifica tareas y conecta especialistas en el portal.']
  }
}

catalogUi.ka = catalogUi.ge
catalogDescription.ka = catalogDescription.ge

// MRO copy replaces marketing-only labels, preserving routes/demo interactions.
Object.assign(catalogDescription.ru,{"dashboard":["Обзор технического состояния","Контролируйте объекты, график ТО, незакрытые работы и риски на главном экране."],"feed":["История эксплуатации","Следите за изменениями состояния оборудования, событиями ремонта и действиями инженеров."],"employees":["Бригады и специалисты","Формируйте бригады, назначайте инженеров и распределяйте ремонтные задания."],"projects":["Паспорта оборудования","Описывайте объекты, агрегаты, узлы, компоненты и историю ремонта в цифровом реестре."],"tasks":["Наряды и работы","Создавайте задания на ТО и ремонт, назначайте исполнителей и контролируйте выполнение."],"storage":["Техническая документация","Храните инструкции, чертежи и акты в карточках оборудования и работ."],"wiki":["Регламенты обслуживания","Сохраняйте технические инструкции, планы осмотров и процедуры безопасности."],"documents":["Отчёты и акты","Формируйте отчёты по ремонтам, план-факту и состоянию оборудования."],"messenger":["Коммуникация бригад","Обсуждайте задачи, замечания и срочные ремонты с техническими специалистами."],"it":["Нефтегазовая отрасль","Учитывайте объекты, насосные станции, трубопроводное оборудование и регламентные работы."],"manufacturing":["Промышленное производство","Планируйте обслуживание линий, станков, агрегатов и критического оборудования."],"education":["Горнодобывающая отрасль","Ведите технические паспорта конвейеров, дробилок и технологического оборудования."],"services":["Сервисные организации","Управляйте выездными бригадами, заявками, ремонтами и сроками исполнения."]});
Object.assign(catalogDescription.en,{"dashboard":["Maintenance at a glance","Monitor asset condition, planned maintenance, work orders and risk indicators."],"feed":["Equipment history and events","Follow asset changes, maintenance events and technician activity."],"employees":["Maintenance crews and experts","Manage teams, assign engineers and balance maintenance workload."],"projects":["Digital equipment registers","Manage assets, assemblies, components, technical details and repair history."],"tasks":["Work orders and repairs","Create service orders, assign technicians and track execution."],"storage":["Technical documentation","Keep drawings, manuals and inspection certificates with asset records."],"wiki":["Maintenance procedures","Maintain technical instructions, inspection schedules and safety procedures."],"documents":["Maintenance reports","Generate repair reports, plan-vs-actual analysis and equipment condition reviews."],"messenger":["Team communication","Discuss work orders, defects and urgent repairs with maintenance crews."],"it":["Oil and gas","Manage pump stations, pipelines, process equipment and scheduled maintenance."],"manufacturing":["Manufacturing","Schedule service for production lines, machinery and critical assets."],"education":["Mining","Manage conveyors, crushers and production equipment with digital asset registers."],"services":["Field service providers","Coordinate service crews, requests, repairs and completion deadlines."]});
Object.assign(catalogDescription.ge,{"dashboard":["ტექმომსახურების მიმოხილვა","აკონტროლეთ აღჭურვილობა, გეგმიური სამუშაოები და ტექნიკური რისკები."],"feed":["მოვლენების და ექსპლუატაციის ისტორია","იხილეთ ტექნიკური ცვლილებები, რემონტები და სპეციალისტების მოქმედებები."],"employees":["ბრიგადები და სპეციალისტები","მართეთ სარემონტო გუნდები, ინჟინრები და სამუშაოს განაწილება."],"projects":["აღჭურვილობის ციფრული რეესტრი","აღრიცხეთ ობიექტები, კვანძები, კომპონენტები და რემონტის ისტორია."],"tasks":["სამუშაო დავალებები და რემონტი","შექმენით დავალებები, დანიშნეთ შემსრულებლები და აკონტროლეთ შედეგი."],"storage":["ტექნიკური დოკუმენტაცია","შეინახეთ ნახაზები, ინსტრუქციები და აქტები აღჭურვილობის ბარათებში."],"wiki":["მომსახურების რეგლამენტები","მართეთ ტექნიკური ინსტრუქციები, შემოწმებები და უსაფრთხოების წესები."],"documents":["მომსახურების ანგარიშები","შექმენით ანგარიშები რემონტების, გეგმის შესრულებისა და მდგომარეობის შესახებ."],"messenger":["ბრიგადების კომუნიკაცია","განიხილეთ ტექნიკური სამუშაოები და გადაუდებელი რემონტები გუნდში."],"it":["ნავთობისა და გაზის მრეწველობა","მართეთ სატუმბი სადგურები, მილსადენები და ტექნიკური მომსახურება."],"manufacturing":["სამრეწველო წარმოება","დაგეგმეთ ტექნოლოგიური ხაზებისა და კრიტიკული დანადგარების მომსახურება."],"education":["სამთო მრეწველობა","აღრიცხეთ კონვეიერები, დამსხვრევები და საწარმოო აღჭურვილობა."],"services":["სერვისული კომპანიები","მართეთ ბრიგადები, სარემონტო განაცხადები და შესრულების ვადები."]});
Object.assign(catalogDescription.de,{"dashboard":["Wartung im Überblick","Überwachen Sie Anlagenzustand, Wartungspläne, Arbeitsaufträge und Risiken."],"feed":["Wartungs- und Anlagenhistorie","Verfolgen Sie Änderungen, Reparaturen und Ereignisse."],"employees":["Wartungsteams und Fachkräfte","Koordinieren Sie Techniker und weisen Sie Wartungsarbeiten zu."],"projects":["Digitale Anlagenregister","Erfassen Sie Anlagen, Baugruppen, Komponenten und Reparaturhistorien."],"tasks":["Wartungsaufträge und Reparaturen","Erstellen und verfolgen Sie Arbeitsaufträge und Ausführende."],"storage":["Technische Dokumentation","Verwalten Sie Zeichnungen, Handbücher und Inspektionsnachweise."],"wiki":["Wartungsanweisungen","Pflegen Sie Prüfpläne, technische Regeln und Sicherheitshinweise."],"documents":["Wartungsberichte","Erstellen Sie Reparaturberichte und Plan-Ist-Auswertungen."],"messenger":["Kommunikation der Wartungsteams","Besprechen Sie Arbeitsaufträge und dringende Reparaturen."],"it":["Öl- und Gasindustrie","Überwachen Sie Pumpstationen, Leitungen und verfahrenstechnische Anlagen."],"manufacturing":["Fertigung","Planen Sie Wartung für Maschinen und Produktionslinien."],"education":["Bergbau","Erfassen Sie Förderbänder, Brecher und Produktionsanlagen."],"services":["Servicedienstleister","Steuern Sie mobile Teams, Aufträge und Fristen."]});
Object.assign(catalogDescription.fr,{"dashboard":["Maintenance en un coup d’œil","Suivez les équipements, les interventions prévues et les risques."],"feed":["Historique des équipements","Consultez les événements de maintenance et les opérations des techniciens."],"employees":["Équipes et techniciens","Organisez les équipes et répartissez les travaux de maintenance."],"projects":["Registre numérique des équipements","Gérez les installations, les composants et l’historique des réparations."],"tasks":["Ordres de travail et réparations","Créez, attribuez et suivez les ordres de maintenance."],"storage":["Documentation technique","Archivez les plans, manuels et certificats des équipements."],"wiki":["Procédures de maintenance","Conservez les instructions et les règles de sécurité."],"documents":["Rapports de maintenance","Analysez les interventions et le réalisé par rapport au prévu."],"messenger":["Communication entre équipes","Discutez des interventions et des réparations urgentes."],"it":["Pétrole et gaz","Gérez les pompes, les conduites et les équipements de process."],"manufacturing":["Industrie","Planifiez la maintenance des chaînes de production et des machines."],"education":["Mines","Suivez les convoyeurs, les concasseurs et les installations minières."],"services":["Prestataires de maintenance","Coordonnez les équipes mobiles, les demandes et les délais."]});
Object.assign(catalogDescription.es,{"dashboard":["Resumen del mantenimiento","Supervise equipos, planes de trabajo, reparaciones y riesgos."],"feed":["Historial de mantenimiento","Consulte los cambios de equipos, eventos y acciones técnicas."],"employees":["Cuadrillas y técnicos","Organice equipos y asigne trabajos de mantenimiento."],"projects":["Registro digital de activos","Documente equipos, conjuntos, componentes e historial de reparaciones."],"tasks":["Órdenes de trabajo y reparación","Cree, asigne y controle trabajos de mantenimiento."],"storage":["Documentación técnica","Guarde planos, manuales y certificados de inspección."],"wiki":["Procedimientos de mantenimiento","Conserve instrucciones técnicas y normas de seguridad."],"documents":["Informes de mantenimiento","Prepare informes de reparación y análisis de plan contra realidad."],"messenger":["Comunicación técnica","Coordine tareas, incidencias y reparaciones urgentes entre cuadrillas."],"it":["Petróleo y gas","Mantenga estaciones de bombeo, tuberías y equipos de proceso."],"manufacturing":["Fabricación","Programe servicio para líneas de producción y maquinaria."],"education":["Minería","Gestione transportadores, trituradoras e instalaciones mineras."],"services":["Empresas de servicio","Coordine técnicos móviles, avisos y plazos de reparación."]});
Object.assign(catalogUi.ru,{"module":"Возможности ITP ТОиР","sector":"Решения для отраслей","getStarted":"Создать компанию","ctaTitle":"Управляйте ТОиР в единой системе","ctaText":"Цифровизируйте объекты и оборудование, выберите тариф, создайте компанию и пригласите бригады.","highlightsSub":"Оборудование, ремонты, наряды и бригады связаны правами доступа и историей работы.","steps":{"overview":["Состояние оборудования на одном экране","Ближайшие работы ТО и ремонты","Аналитика рисков и план-факт"],"collaboration":["Бригады и роли исполнителей","Передача задач между сменами","Уведомления по ремонту"],"workflows":["Планирование ТО по объектам","Учет нарядов и этапов","Контроль сроков и исполнителей"],"knowledge":["Паспорта агрегатов и узлов","Чертежи, инструкции и акты","История эксплуатации по объектам"],"sector":["Планирование ремонтных работ","Учёт оборудования и материалов","Согласованность действий технических служб"]}});
Object.assign(catalogUi.en,{"module":"ITP MRO capabilities","sector":"Industry solutions","getStarted":"Create company","ctaTitle":"Manage maintenance in one system","ctaText":"Digitize your assets, choose a plan, create a company and invite your crews.","highlightsSub":"Assets, repairs, work orders and crews share permissions and work history.","steps":{"overview":["Equipment condition at a glance","Upcoming maintenance and repairs","Risk and plan-vs-actual metrics"],"collaboration":["Maintenance roles and crews","Shift handover and task assignment","Repair alerts and updates"],"workflows":["Asset-specific maintenance plans","Work order lifecycle","Deadline and technician tracking"],"knowledge":["Asset and component passports","Drawings, manuals and certificates","Full asset maintenance history"],"sector":["Repair and maintenance schedules","Equipment and material control","Coordinated technical teams"]}});
Object.assign(catalogUi.ge,{"module":"ITP ТОиР შესაძლებლობები","sector":"დარგობრივი გადაწყვეტილებები","getStarted":"კომპანიის შექმნა","ctaTitle":"მართეთ ტექმომსახურება ერთ სისტემაში","ctaText":"აღრიცხეთ აღჭურვილობა, აირჩიეთ ტარიფი და მოიწვიეთ ბრიგადები.","highlightsSub":"აღჭურვილობა, რემონტი და დავალებები დაკავშირებულია ერთ სივრცეში.","steps":{"overview":["აღჭურვილობის მდგომარეობა","მომავალი მომსახურება და რემონტი","რისკების და გეგმის ანალიზი"],"collaboration":["ბრიგადები და როლები","ცვლების გადაბარება","შეტყობინებები რემონტზე"],"workflows":["გეგმიური მომსახურება","სამუშაო დავალებების შესრულება","ვადებისა და შემსრულებლების კონტროლი"],"knowledge":["აღჭურვილობის პასპორტები","ნახაზები და ტექნიკური ინსტრუქციები","რემონტების სრული ისტორია"],"sector":["რემონტის დაგეგმვა","აღჭურვილობის და მასალების აღრიცხვა","ტექნიკური ბრიგადების კოორდინაცია"]}});
Object.assign(catalogUi.de,{"module":"ITP MRO Funktionen","sector":"Branchenlösungen","getStarted":"Unternehmen erstellen","ctaTitle":"Wartung in einem System verwalten","ctaText":"Erfassen Sie Anlagen, wählen Sie einen Tarif und laden Sie Ihr Wartungsteam ein."});
Object.assign(catalogUi.fr,{"module":"Fonctions ITP MRO","sector":"Solutions sectorielles","getStarted":"Créer une entreprise","ctaTitle":"Gérez votre maintenance dans un système","ctaText":"Numérisez les équipements, choisissez une offre et invitez vos équipes."});
Object.assign(catalogUi.es,{"module":"Funciones de ITP MRO","sector":"Soluciones sectoriales","getStarted":"Crear empresa","ctaTitle":"Gestione el mantenimiento en un único sistema","ctaText":"Digitalice sus equipos, elija un plan e invite a las cuadrillas."});
catalogDescription.ka = catalogDescription.ge;
catalogUi.ka = catalogUi.ge;
