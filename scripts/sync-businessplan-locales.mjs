#!/usr/bin/env node
/**
 * One-off sync: apply businessPlan structural + content updates from DE
 * to all other locales. Run after editing messages/de.json businessPlan block.
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const LOCALES = ['en', 'fr', 'it', 'es', 'ja', 'ko', 'ru']

const de = JSON.parse(readFileSync(resolve(ROOT, 'messages/de.json'), 'utf8'))
const deBp = de.projects.upcycling.businessPlan

/** Copy invariant subtree from DE (dates, amounts, URLs, paths, proper nouns). */
function invariantsFromDe(obj, deObj) {
  if (deObj === null || deObj === undefined) return obj
  if (Array.isArray(deObj)) {
    return deObj.map((v, i) => invariantsFromDe(Array.isArray(obj) ? obj[i] : undefined, v))
  }
  if (typeof deObj === 'object') {
    const out = { ...(typeof obj === 'object' && obj && !Array.isArray(obj) ? obj : {}) }
    for (const [k, dv] of Object.entries(deObj)) {
      if (typeof dv === 'string' && isInvariant(dv)) out[k] = dv
      else if (typeof dv === 'object') out[k] = invariantsFromDe(out[k], dv)
      else if (!(k in out)) out[k] = dv
    }
    return out
  }
  return obj
}

function isInvariant(s) {
  return (
    /^[\d'.,]+\s*CHF/.test(s) ||
    /^\d{2}\.\d{2}\.\d{4}/.test(s) ||
    /^\/projects\/upcycling\//.test(s) ||
    /^https?:\/\//.test(s) ||
    s === 'Verein revamp-it' ||
    s === 'Corinna Baumgartner, ZHAW' ||
    s === '132.351 INNO-EE' ||
    s === '15.06.2026' ||
    s === 'Monitor-Upcycling zu Wand- und Deckenleuchten'
  )
}

const PATCHES = {
  en: {
    navZusammenfassung: 'Executive summary',
    documentMeta: {
      sponsor: 'Swico Innovation Fund · Stage 2',
      versionLabel: 'As of',
      projectLabel: 'Project',
      sponsorLabel: 'Funding',
      preparedByLabel: 'Prepared by',
    },
    hero: {
      eyebrow: 'BUSINESS PLAN · STAGE 2',
      intro:
        'This document summarises status, product, market, financing and open questions for funders, partners and the advisory board. All figures and names are cited — not a marketing version.',
    },
    executiveSummary: {
      eyebrow: 'EXECUTIVE SUMMARY',
      title: 'Summary for decision-makers',
      paragraphs: [
        'Revamp-IT converts decommissioned LED monitors into wall and ceiling lamps — produced at social workshop Werkraum 4 (zsge foundation), with scientific support from ZHAW (LCA per ISO 14044, project 132.351 INNO-EE).',
        'As of mid-June 2026: Swico Innovation Fund stage 2 is running (budget CHF 65,000 gross, CHF 15,000 Innosuisse to ZHAW). Twelve monitor models successfully retrofitted; five with documented standby solution. First fully photo-documented model guide (Lenovo L2251pwd) online since 28 May 2026.',
        'Before the Swico final report (30.06.2026): reliable unit costs from the small series and findings from pilot installations are still pending. The ZHAW LCA report is being finalised (due 18.06.2026); results were presented to the project team at the end of May. Next public milestone: Swico presentation on 03.07.2026.',
      ],
      highlights: [
        { label: 'Project phase', value: 'Stage 2 · small series' },
        { label: 'Stage 2 budget', value: "65'000 CHF" },
        { label: 'Models retrofitted', value: '12 successful' },
        { label: 'Next deadline', value: '30.06.2026' },
      ],
    },
    statusIntro:
      'Stage 1 complete, stage 2 in its final phase. Small-series production and pilot installations are running; the ZHAW LCA report is being finalised (due 18.06.2026).',
    lieferanten: {
      title: 'Raw material: decommissioned monitors.',
      intro:
        'The project needs working screens with LED backlighting (typically 19–24 inches). Revamp-IT collects decommissioned IT hardware in Zurich; the current monitor stock is sufficient for the stage-2 small series.',
      stockBreakdown: {
        title: 'Relevant equipment on site',
        subtitle: 'Monitor upcycling focus — not a full warehouse inventory',
        rows: [
          {
            label: 'Monitors, TVs and all-in-one computers',
            value: 'Small series covered',
            emphasis: true,
            note: '← direct input material',
          },
          {
            label: 'Preferred technology',
            value: 'LED backlight',
            note: 'higher light output, less retrofit effort',
          },
        ],
      },
      inventoryFootnote:
        'Background: In the Swico Q&A (September 2023) the warehouse was recorded as 150 Euro pallets (wooden pallets of IT equipment) — roughly 30 pallets with screen material. That count is historical; decisions rely on monitors available today.',
      channelBody:
        'The collected and pre-sorted monitor stock on site covers the stage-2 small series.',
    },
    wissenschaftPhase: 'Results presentation (completed)',
    risikenZhaw:
      'SimaPro modelling and the results presentation at ZHAW were completed in May 2026. The written report will be finalised by 18.06.2026.',
    statusScale: 'Scaling phase II — more models & sales',
  },
  fr: {
    navZusammenfassung: 'Résumé',
    documentMeta: {
      sponsor: 'Fonds d’innovation Swico · Étape 2',
      versionLabel: 'État au',
      projectLabel: 'Projet',
      sponsorLabel: 'Financement',
      preparedByLabel: 'Établi par',
    },
    hero: {
      eyebrow: 'PLAN D’AFFAIRES · ÉTAPE 2',
      intro:
        'Ce document résume l’état, le produit, le marché, le financement et les questions ouvertes pour bailleurs, partenaires et comité. Tous les chiffres et noms sont sourcés — pas une version marketing.',
    },
    executiveSummary: {
      eyebrow: 'RÉSUMÉ',
      title: 'Synthèse pour décideurs',
      paragraphs: [
        'Revamp-IT transforme des moniteurs LED déclassés en luminaires muraux et plafonniers — produits à l’atelier social Werkraum 4 (fondation zsge), accompagnés scientifiquement par la ZHAW (ACV selon ISO 14044, projet 132.351 INNO-EE).',
        'Mi-juin 2026 : l’étape 2 du fonds Swico est en cours (budget 65’000 CHF brut, dont 15’000 CHF Innosuisse à la ZHAW). Douze modèles de moniteurs retrofités avec succès ; cinq avec solution standby documentée. Premier guide modèle entièrement photo-documenté (Lenovo L2251pwd) en ligne depuis le 28 mai 2026.',
        'Avant le rapport final Swico (30.06.2026) : coûts unitaires fiables de la petite série et retours des installations pilotes restent en suspens. Le rapport ACV ZHAW est en finalisation (remise 18.06.2026) ; présentation des résultats fin mai. Prochain jalon public : présentation Swico le 03.07.2026.',
      ],
      highlights: [
        { label: 'Phase', value: 'Étape 2 · petite série' },
        { label: 'Budget étape 2', value: '65’000 CHF' },
        { label: 'Modèles retrofités', value: '12 réussis' },
        { label: 'Prochaine échéance', value: '30.06.2026' },
      ],
    },
    statusIntro:
      'Étape 1 terminée, étape 2 en phase finale. Petite série et installations pilotes en cours ; rapport ACV ZHAW en finalisation (remise 18.06.2026).',
    lieferanten: {
      title: 'Matière première : moniteurs déclassés.',
      intro:
        'Le projet nécessite des écrans fonctionnels à rétroéclairage LED (typ. 19–24 pouces). Revamp-IT collecte du matériel IT déclassé à Zurich ; le stock de moniteurs actuel suffit pour la petite série de l’étape 2.',
      stockBreakdown: {
        title: 'Équipement pertinent sur site',
        subtitle: 'Focus upcycling moniteurs — pas d’inventaire complet',
        rows: [
          {
            label: 'Moniteurs, TV et all-in-one',
            value: 'Petite série couverte',
            emphasis: true,
            note: '← matière directe',
          },
          {
            label: 'Technologie privilégiée',
            value: 'Rétroéclairage LED',
            note: 'plus de lumière, moins de travail de retrofit',
          },
        ],
      },
      inventoryFootnote:
        'Contexte : dans le Q&R Swico (septembre 2023), l’entrepôt a été compté en 150 palettes Euro (palettes bois de matériel IT) — dont ~30 avec écrans. Ce décompte est historique ; seul le stock actuel compte pour décider.',
      channelBody:
        'Le stock de moniteurs collecté et trié sur site couvre la petite série de l’étape 2.',
    },
    wissenschaftPhase: 'Présentation des résultats (terminée)',
    risikenZhaw:
      'Modélisation SimaPro et présentation des résultats à la ZHAW achevées en mai 2026. Rapport écrit finalisé d’ici le 18.06.2026.',
    statusScale: 'Phase de montée en charge II — modèles & vente',
  },
  it: {
    navZusammenfassung: 'Sintesi',
    documentMeta: {
      sponsor: 'Fondo innovazione Swico · Fase 2',
      versionLabel: 'Stato al',
      projectLabel: 'Progetto',
      sponsorLabel: 'Finanziamento',
      preparedByLabel: 'Redatto da',
    },
    hero: {
      eyebrow: 'BUSINESS PLAN · FASE 2',
      intro:
        'Questo documento riassume stato, prodotto, mercato, finanziamento e domande aperte per finanziatori, partner e comitato. Tutti i numeri e i nomi sono documentati — non una versione marketing.',
    },
    executiveSummary: {
      eyebrow: 'SINTESI ESECUTIVA',
      title: 'Sintesi per i decisori',
      paragraphs: [
        'Revamp-IT trasforma monitor LED dismessi in lampade a parete e soffitto — prodotte presso Werkraum 4 (fondazione zsge), con supporto scientifico ZHAW (LCA ISO 14044, progetto 132.351 INNO-EE).',
        'A metà giugno 2026: fase 2 del fondo Swico in corso (budget 65’000 CHF lordi, 15’000 CHF Innosuisse alla ZHAW). Dodici modelli di monitor retrofitati con successo; cinque con soluzione standby documentata. Prima guida modello completamente fotografata (Lenovo L2251pwd) online dal 28 maggio 2026.',
        'Prima del rapporto finale Swico (30.06.2026): costi unitari affidabili dalla piccola serie e risultati dalle installazioni pilota ancora in sospeso. Rapporto LCA ZHAW in finalizzazione (consegna 18.06.2026); presentazione risultati a fine maggio. Prossima pietra miliare: presentazione Swico il 03.07.2026.',
      ],
      highlights: [
        { label: 'Fase', value: 'Fase 2 · piccola serie' },
        { label: 'Budget fase 2', value: '65’000 CHF' },
        { label: 'Modelli retrofitati', value: '12 riusciti' },
        { label: 'Prossima scadenza', value: '30.06.2026' },
      ],
    },
    statusIntro:
      'Fase 1 completata, fase 2 in chiusura. Piccola serie e installazioni pilota in corso; rapporto LCA ZHAW in finalizzazione (consegna 18.06.2026).',
    lieferanten: {
      title: 'Materia prima: monitor dismessi.',
      intro:
        'Il progetto richiede schermi funzionanti con retroilluminazione LED (tip. 19–24 pollici). Revamp-IT raccoglie hardware IT dismesso a Zurigo; lo stock monitor attuale basta per la piccola serie della fase 2.',
      stockBreakdown: {
        title: 'Attrezzatura rilevante in sede',
        subtitle: 'Focus upcycling monitor — nessun inventario completo',
        rows: [
          {
            label: 'Monitor, TV e all-in-one',
            value: 'Piccola serie coperta',
            emphasis: true,
            note: '← materiale diretto',
          },
          {
            label: 'Tecnologia preferita',
            value: 'Retroilluminazione LED',
            note: 'più luce, meno lavoro di retrofit',
          },
        ],
      },
      inventoryFootnote:
        'Contesto: nel Q&A Swico (settembre 2023) il magazzino era contato in 150 pallet Euro (pallet di legno con IT) — ~30 con schermi. Conteggio storico; per le decisioni conta lo stock odierno.',
      channelBody:
        'Lo stock monitor raccolto e presortato in sede copre la piccola serie della fase 2.',
    },
    wissenschaftPhase: 'Presentazione risultati (completata)',
    risikenZhaw:
      'Modellazione SimaPro e presentazione risultati alla ZHAW completate a maggio 2026. Rapporto scritto entro il 18.06.2026.',
    statusScale: 'Fase di scaling II — altri modelli & vendita',
  },
  es: {
    navZusammenfassung: 'Resumen',
    documentMeta: {
      sponsor: 'Fondo de innovación Swico · Etapa 2',
      versionLabel: 'Estado al',
      projectLabel: 'Proyecto',
      sponsorLabel: 'Financiación',
      preparedByLabel: 'Elaborado por',
    },
    hero: {
      eyebrow: 'PLAN DE NEGOCIO · ETAPA 2',
      intro:
        'Este documento resume estado, producto, mercado, financiación y preguntas abiertas para financiadores, socios y comité. Todas las cifras y nombres están documentados — no es una versión de marketing.',
    },
    executiveSummary: {
      eyebrow: 'RESUMEN EJECUTIVO',
      title: 'Síntesis para decisores',
      paragraphs: [
        'Revamp-IT convierte monitores LED dados de baja en lámparas de pared y techo — producidas en el taller social Werkraum 4 (fundación zsge), con apoyo científico de la ZHAW (ACV según ISO 14044, proyecto 132.351 INNO-EE).',
        'A mediados de junio de 2026: la etapa 2 del fondo Swico está en curso (presupuesto 65’000 CHF brutos, 15’000 CHF Innosuisse a la ZHAW). Doce modelos de monitor retrofitados con éxito; cinco con solución standby documentada. Primera guía de modelo completamente fotografiada (Lenovo L2251pwd) en línea desde el 28 de mayo de 2026.',
        'Antes del informe final Swico (30.06.2026): faltan costes unitarios fiables de la pequeña serie y resultados de instalaciones piloto. Informe ACV ZHAW en finalización (entrega 18.06.2026); presentación de resultados a finales de mayo. Próximo hito: presentación Swico el 03.07.2026.',
      ],
      highlights: [
        { label: 'Fase', value: 'Etapa 2 · pequeña serie' },
        { label: 'Presupuesto etapa 2', value: '65’000 CHF' },
        { label: 'Modelos retrofitados', value: '12 con éxito' },
        { label: 'Próximo plazo', value: '30.06.2026' },
      ],
    },
    statusIntro:
      'Etapa 1 completada, etapa 2 en fase final. Pequeña serie e instalaciones piloto en curso; informe ACV ZHAW en finalización (entrega 18.06.2026).',
    lieferanten: {
      title: 'Materia prima: monitores dados de baja.',
      intro:
        'El proyecto necesita pantallas funcionales con retroiluminación LED (típ. 19–24 pulgadas). Revamp-IT recoge hardware IT dado de baja en Zúrich; el stock actual de monitores basta para la pequeña serie de la etapa 2.',
      stockBreakdown: {
        title: 'Equipamiento relevante in situ',
        subtitle: 'Enfoque upcycling de monitores — sin inventario completo',
        rows: [
          {
            label: 'Monitores, TV y all-in-one',
            value: 'Pequeña serie cubierta',
            emphasis: true,
            note: '← material directo',
          },
          {
            label: 'Tecnología preferida',
            value: 'Retroiluminación LED',
            note: 'más luz, menos trabajo de retrofit',
          },
        ],
      },
      inventoryFootnote:
        'Contexto: en el Q&A Swico (septiembre 2023) el almacén se contó en 150 palés Euro (palés de madera con IT) — ~30 con pantallas. Recuento histórico; para decidir cuenta el stock actual.',
      channelBody:
        'El stock de monitores recogido y preclasificado in situ cubre la pequeña serie de la etapa 2.',
    },
    wissenschaftPhase: 'Presentación de resultados (completada)',
    risikenZhaw:
      'Modelización SimaPro y presentación de resultados en la ZHAW completadas en mayo de 2026. Informe escrito finalizado antes del 18.06.2026.',
    statusScale: 'Fase de escalado II — más modelos y venta',
  },
  ja: {
    navZusammenfassung: '要約',
    documentMeta: {
      sponsor: 'Swico イノベーション基金 · 第2段階',
      versionLabel: '更新日',
      projectLabel: 'プロジェクト',
      sponsorLabel: '資金',
      preparedByLabel: '作成',
    },
    hero: {
      eyebrow: '事業計画 · 第2段階',
      intro:
        '資金提供者・パートナー・諮問委員会向けに、現状・製品・市場・資金・未解決事項をまとめた文書です。数値と名称はすべて出典付き — マーケティング版ではありません。',
    },
    executiveSummary: {
      eyebrow: 'エグゼクティブサマリー',
      title: '意思決定者向け要約',
      paragraphs: [
        'Revamp-ITは退役LEDモニターを壁・天井ランプに改装 — ソーシャルワークショップ Werkraum 4（zsge財団）で生産、ZHAWが科学的支援（ISO 14044 LCA、プロジェクト 132.351 INNO-EE）。',
        '2026年6月中旬時点：Swico第2段階進行中（予算65’000 CHF、うち15’000 CHFはInnosuisse経由でZHAWへ）。12モデル改装成功、5モデルはスタンバイ回避を文書化。初の完全写真付きモデルガイド（Lenovo L2251pwd）は2026年5月28日から公開。',
        'Swico最終報告（30.06.2026）まで：小ロットの信頼できる単価とパイロット設置の知見が未確定。ZHAW LCA報告書は仕上げ中（提出18.06.2026）；結果発表は5月末に実施。次の公開マイルストーン：Swicoプレゼン 03.07.2026。',
      ],
      highlights: [
        { label: 'フェーズ', value: '第2段階 · 小ロット' },
        { label: '第2段階予算', value: '65’000 CHF' },
        { label: '改装モデル', value: '12 成功' },
        { label: '次の期限', value: '30.06.2026' },
      ],
    },
    statusIntro:
      '第1段階完了、第2段階は最終段階。小ロット生産とパイロット設置進行中；ZHAW LCA報告書仕上げ中（提出18.06.2026）。',
    lieferanten: {
      title: '原材料：退役モニター。',
      intro:
        'LEDバックライト付きの動作する画面（通常19–24インチ）が必要。Revamp-ITはチューリッヒで退役IT機器を収集；現在のモニター在庫で第2段階小ロットは足りる。',
      stockBreakdown: {
        title: '拠点の関連機器',
        subtitle: 'モニターアップサイクルに焦点 — 全在庫調査ではない',
        rows: [
          {
            label: 'モニター、TV、オールインワン',
            value: '小ロット対応',
            emphasis: true,
            note: '← 直接投入材',
          },
          {
            label: '優先技術',
            value: 'LEDバックライト',
            note: '明るさ高、改装工数少',
          },
        ],
      },
      inventoryFootnote:
        '背景：Swico Q&A（2023年9月）で倉庫は150ユーロパレット（IT機器の木パレット）と記録 — うち約30が画面系。当時の集計であり、判断は現在の在庫に基づく。',
      channelBody: '拠点で収集・仕分け済みのモニター在庫で第2段階小ロットをカバー。',
    },
    wissenschaftPhase: '結果発表（完了）',
    risikenZhaw:
      'SimaProモデル化とZHAWでの結果発表は2026年5月完了。書面報告は18.06.2026までに確定。',
    statusScale: 'スケール第II相 — 追加モデルと販売',
  },
  ko: {
    navZusammenfassung: '요약',
    documentMeta: {
      sponsor: 'Swico 혁신 기금 · 2단계',
      versionLabel: '기준일',
      projectLabel: '프로젝트',
      sponsorLabel: '자금',
      preparedByLabel: '작성',
    },
    hero: {
      eyebrow: '사업 계획 · 2단계',
      intro:
        '자금 제공자, 파트너, 자문 위원회를 위해 현황, 제품, 시장, 재정, 미해결 질문을 정리한 문서입니다. 모든 수치와 이름은 출처가 있습니다 — 마케팅 버전이 아닙니다.',
    },
    executiveSummary: {
      eyebrow: '요약',
      title: '의사결정자용 요약',
      paragraphs: [
        'Revamp-IT는 퇴역 LED 모니터를 벽·천장 램프로 개조 — 사회적 작업장 Werkraum 4(zsge 재단)에서 생산, ZHAW 과학적 지원(ISO 14044 LCA, 프로젝트 132.351 INNO-EE).',
        '2026년 6월 중순: Swico 2단계 진행 중(예산 65’000 CHF, 15’000 CHF Innosuisse→ZHAW). 12개 모델 개조 성공, 5개는 대기 모드 우회 문서화. 첫 완전 사진 가이드(Lenovo L2251pwd) 2026년 5월 28일 공개.',
        'Swico 최종 보고(30.06.2026) 전: 소량 생산의 신뢰할 단가와 파일럿 설치 결과 미확정. ZHAW LCA 보고서 마무리 중(제출 18.06.2026); 결과 발표는 5월 말 완료. 다음 공개 이정표: Swico 발표 03.07.2026.',
      ],
      highlights: [
        { label: '단계', value: '2단계 · 소량' },
        { label: '2단계 예산', value: '65’000 CHF' },
        { label: '개조 모델', value: '12 성공' },
        { label: '다음 기한', value: '30.06.2026' },
      ],
    },
    statusIntro:
      '1단계 완료, 2단계 마무리 단계. 소량 생산과 파일럿 설치 진행 중; ZHAW LCA 보고서 마무리 중(제출 18.06.2026).',
    lieferanten: {
      title: '원자재: 퇴역 모니터.',
      intro:
        'LED 백라이트가 있는 작동 화면(보통 19–24인치)이 필요합니다. Revamp-IT는 취리히에서 퇴역 IT 하드웨어를 수집; 현재 모니터 재고로 2단계 소량 생산 가능.',
      stockBreakdown: {
        title: '현장 관련 장비',
        subtitle: '모니터 업사이클링 중심 — 전체 재고 조사 아님',
        rows: [
          {
            label: '모니터, TV, 올인원',
            value: '소량 생산 충당',
            emphasis: true,
            note: '← 직접 투입',
          },
          {
            label: '선호 기술',
            value: 'LED 백라이트',
            note: '밝기 높음, 개조 공수 적음',
          },
        ],
      },
      inventoryFootnote:
        '배경: Swico Q&A(2023년 9월)에서 창고를 150유로 팔레트(IT 장비 목재 팔레트)로 기록 — 약 30이 화면류. 당시 집계이며, 결정은 현재 재고 기준.',
      channelBody: '현장에서 수집·분류한 모니터 재고로 2단계 소량 생산 충당.',
    },
    wissenschaftPhase: '결과 발표(완료)',
    risikenZhaw:
      'SimaPro 모델링과 ZHAW 결과 발표는 2026년 5월 완료. 서면 보고서는 18.06.2026까지 확정.',
    statusScale: '확대 2단계 — 추가 모델 및 판매',
  },
  ru: {
    navZusammenfassung: 'Резюме',
    documentMeta: {
      sponsor: 'Инновационный фонд Swico · Этап 2',
      versionLabel: 'Состояние на',
      projectLabel: 'Проект',
      sponsorLabel: 'Финансирование',
      preparedByLabel: 'Подготовил',
    },
    hero: {
      eyebrow: 'БИЗНЕС-ПЛАН · ЭТАП 2',
      intro:
        'Документ обобщает статус, продукт, рынок, финансирование и открытые вопросы для доноров, партнёров и совета. Все цифры и имена с источниками — не маркетинговая версия.',
    },
    executiveSummary: {
      eyebrow: 'РЕЗЮМЕ',
      title: 'Кратко для лиц, принимающих решения',
      paragraphs: [
        'Revamp-IT переделывает списанные LED-мониторы в настенные и потолочные лампы — производство в социальной мастерской Werkraum 4 (фонд zsge), научное сопровождение ZHAW (LCA по ISO 14044, проект 132.351 INNO-EE).',
        'Середина июня 2026: этап 2 фонда Swico идёт (бюджет 65’000 CHF брутто, 15’000 CHF Innosuisse в ZHAW). 12 моделей мониторов успешно переделаны; у 5 документирован обход standby. Первое полностью фото-документированное руководство (Lenovo L2251pwd) онлайн с 28 мая 2026.',
        'До финального отчёта Swico (30.06.2026): надёжные unit costs малой серии и выводы пилотных установок ещё не готовы. Отчёт LCA ZHAW финализируется (сдача 18.06.2026); презентация результатов в конце мая. Следующий публичный рубеж: презентация Swico 03.07.2026.',
      ],
      highlights: [
        { label: 'Фаза', value: 'Этап 2 · малая серия' },
        { label: 'Бюджет этапа 2', value: '65’000 CHF' },
        { label: 'Переделано моделей', value: '12 успешно' },
        { label: 'Следующий срок', value: '30.06.2026' },
      ],
    },
    statusIntro:
      'Этап 1 завершён, этап 2 в финальной фазе. Малая серия и пилотные установки идут; отчёт LCA ZHAW финализируется (сдача 18.06.2026).',
    lieferanten: {
      title: 'Сырьё: списанные мониторы.',
      intro:
        'Нужны рабочие экраны с LED-подсветкой (обычно 19–24 дюйма). Revamp-IT собирает списанное IT-оборудование в Цюрихе; текущего запаса мониторов хватает для малой серии этапа 2.',
      stockBreakdown: {
        title: 'Релевантное оборудование на площадке',
        subtitle: 'Фокус на upcycling мониторов — не полная инвентаризация',
        rows: [
          {
            label: 'Мониторы, ТВ и all-in-one',
            value: 'Малая серия обеспечена',
            emphasis: true,
            note: '← прямое сырьё',
          },
          {
            label: 'Предпочитаемая технология',
            value: 'LED-подсветка',
            note: 'больше света, меньше переделки',
          },
        ],
      },
      inventoryFootnote:
        'Контекст: в Q&A Swico (сентябрь 2023) склад учитывался как 150 евро-паллет (деревянные паллеты с IT) — ~30 с экранами. Это исторический подсчёт; для решений важен запас сегодня.',
      channelBody:
        'Собранный и отсортированный на площадке запас мониторов покрывает малую серию этапа 2.',
    },
    wissenschaftPhase: 'Презентация результатов (завершена)',
    risikenZhaw:
      'Моделирование SimaPro и презентация результатов в ZHAW завершены в мае 2026. Письменный отчёт будет финализирован до 18.06.2026.',
    statusScale: 'Фаза масштабирования II — модели и продажи',
  },
}

function applyPatch(bp, p) {
  // Nav: insert zusammenfassung if missing
  const hasZ = bp.nav.items.some((i) => i.id === 'zusammenfassung')
  if (!hasZ) {
    bp.nav.items.unshift({ id: 'zusammenfassung', label: p.navZusammenfassung })
  } else {
    bp.nav.items.find((i) => i.id === 'zusammenfassung').label = p.navZusammenfassung
  }

  bp.documentMeta = { ...deBp.documentMeta, ...p.documentMeta }
  bp.hero.eyebrow = p.hero.eyebrow
  bp.hero.intro = p.hero.intro
  bp.executiveSummary = invariantsFromDe(p.executiveSummary, deBp.executiveSummary)

  bp.status.intro = p.statusIntro

  bp.lieferanten.title = p.lieferanten.title
  bp.lieferanten.intro = p.lieferanten.intro
  bp.lieferanten.stockBreakdown.title = p.lieferanten.stockBreakdown.title
  bp.lieferanten.stockBreakdown.subtitle = p.lieferanten.stockBreakdown.subtitle
  bp.lieferanten.stockBreakdown.rows = p.lieferanten.stockBreakdown.rows
  bp.lieferanten.inventoryFootnote = p.lieferanten.inventoryFootnote
  bp.lieferanten.channels.items[0].body = p.lieferanten.channelBody

  const phase = bp.wissenschaft.timeline.phases.find((x) => x.date === '25.05. – 31.05.2026')
  if (phase) phase.label = p.wissenschaftPhase

  const risk = bp.risiken.items.find((x) => x.cite === 'cit05_zhaw_gantt')
  if (risk) risk.body = p.risikenZhaw
}

for (const lc of LOCALES) {
  const file = resolve(ROOT, 'messages', `${lc}.json`)
  const data = JSON.parse(readFileSync(file, 'utf8'))
  const bp = data.projects.upcycling.businessPlan
  applyPatch(bp, PATCHES[lc])

  // Status page milestone label
  const scale = data.projects.upcycling.status?.timeline?.items?.find((i) => i.key === 'scale')
  if (scale) scale.label = PATCHES[lc].statusScale

  writeFileSync(file, JSON.stringify(data, null, 2) + '\n')
  console.log('synced', lc)
}

console.log('Done. Run npm run i18n:businessplan to verify parity.')
