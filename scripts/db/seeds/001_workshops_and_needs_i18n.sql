-- Seed i18n translations for the 6 existing workshops + 7 active project_needs.
-- All values per locale hand-translated, not machine output.

BEGIN;

-- ============================================================================
-- workshops
-- ============================================================================

-- linux-workshop
UPDATE workshops SET
  title_i18n = jsonb_build_object(
    'en','Linux Workshop',
    'fr','Atelier Linux',
    'es','Taller de Linux',
    'it','Workshop su Linux',
    'ja','Linux ワークショップ',
    'ko','Linux 워크숍',
    'ru','Семинар по Linux'
  ),
  description_i18n = jsonb_build_object(
    'en','Master the Linux operating system from the basics to advanced topics.',
    'fr','Maîtrisez le système d''exploitation Linux, des bases aux sujets avancés.',
    'es','Domina el sistema operativo Linux, desde los fundamentos hasta los temas avanzados.',
    'it','Padroneggia il sistema operativo Linux, dalle basi agli argomenti avanzati.',
    'ja','Linux オペレーティングシステムを基本から応用まで習得しましょう。',
    'ko','Linux 운영체제를 기초부터 고급 주제까지 익혀보세요.',
    'ru','Освойте операционную систему Linux — от основ до продвинутых тем.'
  ),
  category_i18n = jsonb_build_object(
    'en','Operating systems','fr','Systèmes d''exploitation','es','Sistemas operativos',
    'it','Sistemi operativi','ja','オペレーティングシステム','ko','운영체제','ru','Операционные системы'
  ),
  duration_i18n = jsonb_build_object(
    'en','2 days','fr','2 jours','es','2 días','it','2 giorni','ja','2 日間','ko','2일','ru','2 дня'
  ),
  level_i18n = jsonb_build_object(
    'en','Beginner to advanced','fr','Débutant à avancé','es','De principiante a avanzado',
    'it','Da principiante ad avanzato','ja','初級から上級','ko','초급에서 고급까지','ru','От начинающего до продвинутого'
  )
WHERE slug = 'linux-workshop';

-- open-source-software
UPDATE workshops SET
  title_i18n = jsonb_build_object(
    'en','Open-source software','fr','Logiciels open source','es','Software de código abierto',
    'it','Software open source','ja','オープンソースソフトウェア','ko','오픈 소스 소프트웨어','ru','Программы с открытым кодом'
  ),
  description_i18n = jsonb_build_object(
    'en','Discover the world of open-source software development.',
    'fr','Découvrez le monde du développement de logiciels open source.',
    'es','Descubre el mundo del desarrollo de software de código abierto.',
    'it','Scopri il mondo dello sviluppo di software open source.',
    'ja','オープンソースソフトウェア開発の世界を発見しましょう。',
    'ko','오픈 소스 소프트웨어 개발의 세계를 발견하세요.',
    'ru','Откройте для себя мир разработки программ с открытым кодом.'
  ),
  category_i18n = jsonb_build_object(
    'en','Development','fr','Développement','es','Desarrollo','it','Sviluppo',
    'ja','開発','ko','개발','ru','Разработка'
  ),
  duration_i18n = jsonb_build_object(
    'en','1 day','fr','1 jour','es','1 día','it','1 giorno','ja','1 日','ko','1일','ru','1 день'
  ),
  level_i18n = jsonb_build_object(
    'en','All levels','fr','Tous niveaux','es','Todos los niveles','it','Tutti i livelli',
    'ja','全レベル','ko','모든 수준','ru','Все уровни'
  )
WHERE slug = 'open-source-software';

-- computer-repair
UPDATE workshops SET
  title_i18n = jsonb_build_object(
    'en','Computer repair','fr','Réparation d''ordinateurs','es','Reparación de ordenadores',
    'it','Riparazione computer','ja','コンピューター修理','ko','컴퓨터 수리','ru','Ремонт компьютеров'
  ),
  description_i18n = jsonb_build_object(
    'en','Learn essential hardware repair and maintenance skills.',
    'fr','Apprenez les compétences essentielles de réparation et d''entretien du matériel.',
    'es','Aprende las habilidades esenciales de reparación y mantenimiento del hardware.',
    'it','Impara le competenze essenziali per la riparazione e la manutenzione hardware.',
    'ja','基本的なハードウェア修理とメンテナンスのスキルを学びます。',
    'ko','기본적인 하드웨어 수리 및 유지보수 기술을 배웁니다.',
    'ru','Освойте базовые навыки ремонта и обслуживания оборудования.'
  ),
  category_i18n = jsonb_build_object(
    'en','Hardware','fr','Matériel','es','Hardware','it','Hardware',
    'ja','ハードウェア','ko','하드웨어','ru','Оборудование'
  ),
  duration_i18n = jsonb_build_object(
    'en','2 days','fr','2 jours','es','2 días','it','2 giorni','ja','2 日間','ko','2일','ru','2 дня'
  ),
  level_i18n = jsonb_build_object(
    'en','Beginner','fr','Débutant','es','Principiante','it','Principiante',
    'ja','初級','ko','초급','ru','Начинающий'
  )
WHERE slug = 'computer-repair';

-- bitcoin-blockchain
UPDATE workshops SET
  title_i18n = jsonb_build_object(
    'en','Bitcoin & Blockchain','fr','Bitcoin et blockchain','es','Bitcoin y blockchain',
    'it','Bitcoin e blockchain','ja','ビットコインとブロックチェーン','ko','비트코인과 블록체인','ru','Биткоин и блокчейн'
  ),
  description_i18n = jsonb_build_object(
    'en','Understand the fundamentals of Bitcoin and blockchain technology.',
    'fr','Comprenez les fondamentaux du Bitcoin et de la technologie blockchain.',
    'es','Comprende los fundamentos del Bitcoin y la tecnología blockchain.',
    'it','Comprendi i fondamenti del Bitcoin e della tecnologia blockchain.',
    'ja','ビットコインとブロックチェーン技術の基礎を理解します。',
    'ko','비트코인과 블록체인 기술의 기초를 이해합니다.',
    'ru','Поймите основы Биткоина и технологии блокчейн.'
  ),
  category_i18n = jsonb_build_object(
    'en','Blockchain','fr','Blockchain','es','Blockchain','it','Blockchain',
    'ja','ブロックチェーン','ko','블록체인','ru','Блокчейн'
  ),
  duration_i18n = jsonb_build_object(
    'en','1 day','fr','1 jour','es','1 día','it','1 giorno','ja','1 日','ko','1일','ru','1 день'
  ),
  level_i18n = jsonb_build_object(
    'en','Beginner','fr','Débutant','es','Principiante','it','Principiante',
    'ja','初級','ko','초급','ru','Начинающий'
  )
WHERE slug = 'bitcoin-blockchain';

-- ai-workshop
UPDATE workshops SET
  title_i18n = jsonb_build_object(
    'en','Artificial intelligence','fr','Intelligence artificielle','es','Inteligencia artificial',
    'it','Intelligenza artificiale','ja','人工知能','ko','인공지능','ru','Искусственный интеллект'
  ),
  description_i18n = jsonb_build_object(
    'en','Dive into the world of AI and machine learning.',
    'fr','Plongez dans le monde de l''IA et du machine learning.',
    'es','Sumérgete en el mundo de la IA y el aprendizaje automático.',
    'it','Immergiti nel mondo dell''IA e del machine learning.',
    'ja','AI と機械学習の世界に飛び込みましょう。',
    'ko','AI와 머신러닝의 세계에 뛰어드세요.',
    'ru','Погрузитесь в мир ИИ и машинного обучения.'
  ),
  category_i18n = jsonb_build_object(
    'en','AI & ML','fr','IA & ML','es','IA y ML','it','IA e ML',
    'ja','AI と ML','ko','AI 및 ML','ru','ИИ и ML'
  ),
  duration_i18n = jsonb_build_object(
    'en','2 days','fr','2 jours','es','2 días','it','2 giorni','ja','2 日間','ko','2일','ru','2 дня'
  ),
  level_i18n = jsonb_build_object(
    'en','Advanced','fr','Avancé','es','Avanzado','it','Avanzato',
    'ja','上級','ko','고급','ru','Продвинутый'
  )
WHERE slug = 'ai-workshop';

-- creative-coding
UPDATE workshops SET
  title_i18n = jsonb_build_object(
    'en','Creative coding','fr','Programmation créative','es','Programación creativa',
    'it','Programmazione creativa','ja','クリエイティブコーディング','ko','크리에이티브 코딩','ru','Креативное программирование'
  ),
  description_i18n = jsonb_build_object(
    'en','Turn ideas into working prototypes with AI-assisted workflows.',
    'fr','Transformez vos idées en prototypes fonctionnels avec des flux assistés par IA.',
    'es','Convierte ideas en prototipos funcionales con flujos asistidos por IA.',
    'it','Trasforma le idee in prototipi funzionanti con flussi assistiti dall''IA.',
    'ja','AI を活用したワークフローで、アイデアを動くプロトタイプに変えます。',
    'ko','AI 지원 워크플로로 아이디어를 작동하는 프로토타입으로 만듭니다.',
    'ru','Превращайте идеи в работающие прототипы с помощью ИИ-инструментов.'
  ),
  category_i18n = jsonb_build_object(
    'en','Creative','fr','Créatif','es','Creativo','it','Creativo',
    'ja','クリエイティブ','ko','크리에이티브','ru','Креатив'
  ),
  duration_i18n = jsonb_build_object(
    'en','4 sessions','fr','4 séances','es','4 sesiones','it','4 sessioni',
    'ja','4 セッション','ko','4 세션','ru','4 занятия'
  ),
  level_i18n = jsonb_build_object(
    'en','Beginner to advanced','fr','Débutant à avancé','es','De principiante a avanzado',
    'it','Da principiante ad avanzato','ja','初級から上級','ko','초급에서 고급까지','ru','От начинающего до продвинутого'
  )
WHERE slug = 'creative-coding';

-- ============================================================================
-- project_needs (Monitor-Upcycling)
-- ============================================================================

UPDATE project_needs SET
  title_i18n = jsonb_build_object(
    'en','CE conformity engineer','fr','Ingénieur·e conformité CE','es','Ingeniero/a de conformidad CE',
    'it','Ingegnere conformità CE','ja','CE 適合エンジニア','ko','CE 적합성 엔지니어','ru','Инженер по соответствию CE'
  ),
  description_i18n = jsonb_build_object(
    'en','Specialist in product liability and CE marking for small-series production in sheltered workshops.',
    'fr','Spécialiste en responsabilité produit et marquage CE pour les petites séries en ateliers protégés.',
    'es','Especialista en responsabilidad de producto y marcado CE para series pequeñas en talleres protegidos.',
    'it','Specialista in responsabilità di prodotto e marcatura CE per piccole serie in laboratori protetti.',
    'ja','保護作業所での小ロット生産における製品責任と CE マーキングの専門家。',
    'ko','보호 작업장의 소량 생산을 위한 제품 책임 및 CE 마킹 전문가.',
    'ru','Специалист по ответственности за продукцию и маркировке CE для малой серии в защищённых мастерских.'
  )
WHERE title = 'CE-Konformität Fachingenieur:in';

UPDATE project_needs SET
  title_i18n = jsonb_build_object(
    'en','Electronics: flicker & brightness control','fr','Électronique : scintillement et régulation','es','Electrónica: parpadeo y regulación de brillo',
    'it','Elettronica: sfarfallio e regolazione luminosità','ja','エレクトロニクス：ちらつきと輝度調整','ko','전자공학: 깜빡임 및 밝기 조절','ru','Электроника: мерцание и регулировка яркости'
  ),
  description_i18n = jsonb_build_object(
    'en','Cross-model solution for flicker and dimming of LED backlights from old monitors.',
    'fr','Solution multi-modèles pour le scintillement et la variation des rétroéclairages LED d''anciens moniteurs.',
    'es','Solución multimodelo para el parpadeo y la atenuación de retroiluminaciones LED de monitores antiguos.',
    'it','Soluzione multi-modello per sfarfallio e dimmerazione di retroilluminazioni LED da monitor vecchi.',
    'ja','古いモニターの LED バックライトのちらつきと調光に対する、機種横断的なソリューション。',
    'ko','오래된 모니터의 LED 백라이트 깜빡임과 밝기 조절을 위한 모델 통합 솔루션.',
    'ru','Кросс-модельное решение для устранения мерцания и регулировки яркости LED-подсветки старых мониторов.'
  )
WHERE title = 'Elektronik: Flimmern & Helligkeitsregelung';

UPDATE project_needs SET
  title_i18n = jsonb_build_object(
    'en','Sheltered workshop with electronics know-how','fr','Atelier protégé avec savoir-faire en électronique','es','Taller protegido con know-how en electrónica',
    'it','Laboratorio protetto con know-how elettronico','ja','エレクトロニクスのノウハウを持つ保護作業所','ko','전자공학 노하우를 갖춘 보호 작업장','ru','Защищённая мастерская с компетенциями в электронике'
  ),
  description_i18n = jsonb_build_object(
    'en','Production partner for the small series. Focus on Drahtzug, FARO, St. Jakob, Palme or similar.',
    'fr','Partenaire de production pour la petite série. Focus sur Drahtzug, FARO, St. Jakob, Palme ou similaire.',
    'es','Socio de producción para la serie pequeña. Enfoque en Drahtzug, FARO, St. Jakob, Palme o similares.',
    'it','Partner di produzione per la piccola serie. Focus su Drahtzug, FARO, St. Jakob, Palme o simili.',
    'ja','小ロット生産パートナー。Drahtzug、FARO、St. Jakob、Palme またはそれに類する組織を想定。',
    'ko','소량 생산 파트너. Drahtzug, FARO, St. Jakob, Palme 또는 유사한 곳에 중점.',
    'ru','Производственный партнёр для малой серии. Ориентир: Drahtzug, FARO, St. Jakob, Palme или подобные.'
  )
WHERE title = 'Geschützte Werkstatt mit Elektronik-Know-how';

UPDATE project_needs SET
  title_i18n = jsonb_build_object(
    'en','Property management / facility management','fr','Régie immobilière / facility management','es','Administración de inmuebles / facility management',
    'it','Amministrazione immobiliare / facility management','ja','不動産管理 / 施設管理','ko','부동산 관리 / 시설 관리','ru','Управление недвижимостью / facility management'
  ),
  description_i18n = jsonb_build_object(
    'en','Pilot installations in auxiliary rooms, parking garages, technical rooms. Livit, Wincasa, Allreal, ISS or similar.',
    'fr','Installations pilotes dans des locaux annexes, parkings, locaux techniques. Livit, Wincasa, Allreal, ISS ou similaire.',
    'es','Instalaciones piloto en salas anexas, garajes y salas técnicas. Livit, Wincasa, Allreal, ISS o similar.',
    'it','Installazioni pilota in locali accessori, parcheggi, locali tecnici. Livit, Wincasa, Allreal, ISS o simili.',
    'ja','補助室、駐車場、技術室でのパイロット設置。Livit、Wincasa、Allreal、ISS など。',
    'ko','부속 공간, 주차장, 기술실 파일럿 설치. Livit, Wincasa, Allreal, ISS 등.',
    'ru','Пилотные установки во вспомогательных помещениях, парковках, тех. комнатах. Livit, Wincasa, Allreal, ISS и подобные.'
  )
WHERE title = 'Liegenschaftsverwaltung / Facility Management';

UPDATE project_needs SET
  title_i18n = jsonb_build_object(
    'en','Decommissioned monitors (24″+)','fr','Moniteurs déclassés (24″+)','es','Monitores retirados (24″+)',
    'it','Monitor dismessi (24″+)','ja','廃棄されたモニター (24インチ以上)','ko','폐기된 모니터 (24인치 이상)','ru','Списанные мониторы (24″+)'
  ),
  description_i18n = jsonb_build_object(
    'en','Working or repairable monitors from collection points and corporate disposal. ERZ cooperation has started, additional sources welcome.',
    'fr','Moniteurs fonctionnels ou réparables provenant de points de collecte et de mises au rebut d''entreprises. Coopération avec l''ERZ démarrée, sources supplémentaires bienvenues.',
    'es','Monitores funcionales o reparables de puntos de recogida y bajas corporativas. La cooperación con ERZ ya ha empezado, se aceptan fuentes adicionales.',
    'it','Monitor funzionanti o riparabili da punti di raccolta e dismissioni aziendali. La cooperazione con ERZ è avviata, ulteriori fonti benvenute.',
    'ja','回収拠点や企業の廃棄から得られる、動作する／修理可能なモニター。ERZ との連携は開始済み、追加の供給源を歓迎します。',
    'ko','수거 거점 및 기업 폐기물에서 나오는 작동 가능하거나 수리 가능한 모니터. ERZ와의 협력은 시작되었고, 추가 공급원을 환영합니다.',
    'ru','Рабочие или ремонтопригодные мониторы из пунктов приёма и корпоративных списаний. Сотрудничество с ERZ начато, приветствуются дополнительные источники.'
  ),
  target_unit_i18n = jsonb_build_object(
    'en','monitors','fr','moniteurs','es','monitores','it','monitor',
    'ja','台','ko','대','ru','шт.'
  )
WHERE title = 'Ausrangierte Monitore (24″+)';

UPDATE project_needs SET
  title_i18n = jsonb_build_object(
    'en','Funding for LCA & small series','fr','Financement pour l''ACV et la petite série','es','Financiación para el ACV y la serie pequeña',
    'it','Finanziamento per LCA e piccola serie','ja','LCA と小ロットへの資金提供','ko','LCA 및 소량 생산을 위한 자금 지원','ru','Финансирование LCA и малой серии'
  ),
  description_i18n = jsonb_build_object(
    'en','Co-financing of the ZHAW life-cycle assessment and the production of the small series. Foundations: Klimastiftung Schweiz, KliK, Gebert Rüf, Migros Pionierfonds.',
    'fr','Cofinancement de l''ACV ZHAW et de la production de la petite série. Fondations : Klimastiftung Schweiz, KliK, Gebert Rüf, Migros Pionierfonds.',
    'es','Cofinanciación del ACV de la ZHAW y de la producción de la serie pequeña. Fundaciones: Klimastiftung Schweiz, KliK, Gebert Rüf, Migros Pionierfonds.',
    'it','Cofinanziamento dell''LCA ZHAW e della produzione della piccola serie. Fondazioni: Klimastiftung Schweiz, KliK, Gebert Rüf, Migros Pionierfonds.',
    'ja','ZHAW のライフサイクル評価と小ロット生産への共同資金提供。財団：Klimastiftung Schweiz、KliK、Gebert Rüf、Migros Pionierfonds。',
    'ko','ZHAW 생애주기 평가 및 소량 생산 공동 자금 지원. 재단: Klimastiftung Schweiz, KliK, Gebert Rüf, Migros Pionierfonds.',
    'ru','Софинансирование LCA-исследования ZHAW и производства малой серии. Фонды: Klimastiftung Schweiz, KliK, Gebert Rüf, Migros Pionierfonds.'
  )
WHERE title = 'Förderung für LCA & Kleinserie';

UPDATE project_needs SET
  title_i18n = jsonb_build_object(
    'en','Documentation per monitor model','fr','Documentation par modèle de moniteur','es','Documentación por modelo de monitor',
    'it','Documentazione per modello di monitor','ja','モニターモデルごとのドキュメント','ko','모니터 모델별 문서화','ru','Документация по каждой модели монитора'
  ),
  description_i18n = jsonb_build_object(
    'en','Photos, boards, pin-out maps, safety notes for the open guide. Ideal for technicians or students.',
    'fr','Photos, cartes, brochages, consignes de sécurité pour le guide ouvert. Idéal pour technicien·ne·s ou étudiant·e·s.',
    'es','Fotos, placas, pinouts, indicaciones de seguridad para la guía abierta. Ideal para técnicos/as o estudiantes.',
    'it','Foto, schede, pinout, note di sicurezza per la guida aperta. Ideale per tecnici o studenti.',
    'ja','公開ガイド向けの写真、基板、ピン配置、安全情報。技術者や学生に最適。',
    'ko','공개 가이드용 사진, 보드, 핀맵, 안전 안내. 기술자나 학생에게 이상적.',
    'ru','Фото, платы, распиновка, замечания по безопасности для открытого руководства. Идеально для техников или студентов.'
  ),
  target_unit_i18n = jsonb_build_object(
    'en','hours','fr','heures','es','horas','it','ore',
    'ja','時間','ko','시간','ru','часов'
  )
WHERE title = 'Dokumentation pro Monitor-Modell';

COMMIT;
