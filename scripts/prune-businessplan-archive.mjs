#!/usr/bin/env node
/**
 * Drop 2023 archive sources (Swico Q&A, Klimast application) from the
 * public business plan. Only current project documents stay cited.
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const LOCALES = ['de', 'en', 'fr', 'it', 'es', 'ja', 'ko', 'ru']
const ARCHIVE_KEYS = new Set(['cit06_qa_swico_2023', 'cit07_klimast_2023'])
const EXTERN_GROUP_TITLE = 'Externes Expertennetzwerk'

const DE_PATCHES = {
  'partner.intro':
    'Organisationen und Personen mit aktivem Beitrag in Etappe 2 — keine Namen aus alten Antragsunterlagen (2023).',
  'belege.intro':
    'Nur Quellen, die für den Stand Juni 2026 noch gelten: aktuelle Swico-Schreiben, ZHAW-Planung, überarbeiteter Kurzbericht Etappe 1 (März 2026) und Werkstatt-Dokumentation. Ältere Antragsmappen sind nicht Teil dieser Seite.',
  'kunden.intro':
    'Aus Etappe-1-Abklärungen und Gesprächen mit potenziellen Abnehmern ergeben sich vier Zielsegmente — kein Designer-Markt, sondern professionelles Beleuchtungs-Einkaufsverhalten.',
  'cit08_modelle_md': {
    label: 'Interne Modellliste (Werkstatt)',
    detail:
      'Laufend gepflegte Liste erfolgreich umgebauter Monitor-Modelle inkl. Standby-Dokumentation — Stand Werkstatt, Juni 2026',
  },
}

const LOCALE_PATCHES = {
  en: {
    'partner.intro':
      'Organisations and people with an active role in stage 2 — no names from old 2023 application files.',
    'belege.intro':
      'Sources that still apply as of June 2026 only: current Swico letters, ZHAW plan, revised stage 1 brief (March 2026) and workshop documentation. Older application folders are not part of this page.',
    'kunden.intro':
      'Stage 1 work and conversations with potential buyers point to four target segments — professional lighting procurement, not a designer market.',
    'cit08_modelle_md': {
      label: 'Internal model list (workshop)',
      detail:
        'Maintained list of successfully retrofitted monitor models including standby documentation — workshop status, June 2026',
    },
  },
  fr: {
    'partner.intro':
      'Organisations et personnes avec un rôle actif à l’étape 2 — pas de noms tirés d’anciens dossiers de candidature (2023).',
    'belege.intro':
      'Uniquement des sources encore valables en juin 2026 : courriers Swico actuels, plan ZHAW, rapport court étape 1 révisé (mars 2026) et documentation d’atelier. Les anciens dossiers de candidature ne figurent pas ici.',
    'kunden.intro':
      'Les travaux de l’étape 1 et les échanges avec des acheteurs potentiels dégagent quatre segments — achat professionnel d’éclairage, pas un marché design.',
    'cit08_modelle_md': {
      label: 'Liste interne des modèles (atelier)',
      detail:
        'Liste tenue à jour des modèles de moniteurs retrofités avec documentation standby — statut atelier, juin 2026',
    },
  },
  it: {
    'partner.intro':
      'Organizzazioni e persone con ruolo attivo nella fase 2 — nessun nome da vecchi dossier di candidatura (2023).',
    'belege.intro':
      'Solo fonti ancora valide a giugno 2026: lettere Swico attuali, piano ZHAW, rapporto breve fase 1 rivisto (marzo 2026) e documentazione officina. I vecchi dossier non fanno parte di questa pagina.',
    'kunden.intro':
      'Dal lavoro di fase 1 e dai colloqui con potenziali acquirenti emergono quattro segmenti — acquisto professionale di illuminazione, non un mercato design.',
    'cit08_modelle_md': {
      label: 'Elenco interno modelli (officina)',
      detail:
        'Elenco aggiornato dei modelli monitor retrofitati con documentazione standby — stato officina, giugno 2026',
    },
  },
  es: {
    'partner.intro':
      'Organizaciones y personas con papel activo en la etapa 2 — sin nombres de antiguos expedientes de solicitud (2023).',
    'belege.intro':
      'Solo fuentes válidas a junio de 2026: cartas Swico actuales, plan ZHAW, informe breve etapa 1 revisado (marzo 2026) y documentación de taller. Los expedientes antiguos no forman parte de esta página.',
    'kunden.intro':
      'Del trabajo de etapa 1 y conversaciones con compradores potenciales surgen cuatro segmentos — compra profesional de iluminación, no un mercado de diseño.',
    'cit08_modelle_md': {
      label: 'Lista interna de modelos (taller)',
      detail:
        'Lista actualizada de modelos de monitor retrofitados con documentación standby — estado del taller, junio 2026',
    },
  },
  ja: {
    'partner.intro':
      '第2段階で実際に関与する組織と人物 — 2023年の旧申請書類からの名前は含めない。',
    'belege.intro':
      '2026年6月時点で有効な出典のみ：最新のSwico書簡、ZHAW計画、改訂第1段階報告（2026年3月）、工房ドキュメント。旧申請フォルダは掲載しない。',
    'kunden.intro':
      '第1段階の作業と潜在購入者との対話から4つのセグメント — プロの照明調達であり、デザイナー市場ではない。',
    'cit08_modelle_md': {
      label: '内部モデル一覧（工房）',
      detail: 'スタンバイ文書化を含む改装成功モデルの更新リスト — 工房ステータス、2026年6月',
    },
  },
  ko: {
    'partner.intro':
      '2단계에서 실제 기여하는 조직과 사람 — 2023년 구 신청 서류의 이름은 제외.',
    'belege.intro':
      '2026년 6월 기준 유효한 출처만: 최신 Swico 서한, ZHAW 계획, 개정 1단계 보고(2026년 3월), 공방 문서. 구 신청 폴더는 포함하지 않음.',
    'kunden.intro':
      '1단계 작업과 잠재 구매자 대화에서 네 가지 세그먼트 — 전문 조명 조달이지 디자이너 시장이 아님.',
    'cit08_modelle_md': {
      label: '내부 모델 목록(공방)',
      detail: '대기 모드 문서화를 포함한 개조 성공 모델의 유지 목록 — 공방 현황, 2026년 6월',
    },
  },
  ru: {
    'partner.intro':
      'Организации и люди с активной ролью на этапе 2 — без имён из старых заявок 2023 года.',
    'belege.intro':
      'Только источники, актуальные на июнь 2026: текущие письма Swico, план ZHAW, пересмотренный краткий отчёт этапа 1 (март 2026) и документация мастерской. Старые папки заявок здесь не используются.',
    'kunden.intro':
      'Из работы этапа 1 и разговоров с потенциальными покупателями — четыре сегмента; профессиональная закупка освещения, не дизайнерский рынок.',
    'cit08_modelle_md': {
      label: 'Внутренний список моделей (мастерская)',
      detail:
        'Поддерживаемый список успешно переделанных моделей мониторов со standby-документацией — статус мастерской, июнь 2026',
    },
  },
}

function replaceCites(obj) {
  if (obj === null || obj === undefined) return
  if (Array.isArray(obj)) {
    obj.forEach(replaceCites)
    return
  }
  if (typeof obj !== 'object') return
  for (const [k, v] of Object.entries(obj)) {
    if (k === 'cite' && v === 'cit06_qa_swico_2023') obj[k] = 'cit04_kurzbericht_e1'
    else if (k === 'cite' && v === 'cit07_klimast_2023') {
      // Werkraum → dedicated source; Swico recycling → cit14; default kurzbericht
      if (obj.linkUrl?.includes('werkraum4')) obj[k] = 'cit19_werkraum4'
      else if (obj.linkUrl?.includes('swico.ch/de/recycling')) obj[k] = 'cit14_swico_recycling'
      else obj[k] = 'cit04_kurzbericht_e1'
    } else replaceCites(v)
  }
}

function isArchivePartnerGroup(g) {
  if (g.title === EXTERN_GROUP_TITLE) return true
  if (/extern.*expert|expertennetzwerk|réseau.*experts|rete.*esperti|red.*expertos|外部専門|외부.*전문|внешн.*эксперт/i.test(g.title ?? '')) {
    return true
  }
  if (g.intro && /Klimastiftung|Klimast application|Klimastiftungs-Antrag|demande.*Klimast|2023.*application/i.test(g.intro)) {
    return true
  }
  if (g.items?.some((i) => i.name?.includes('Balz Krügel'))) return true
  return false
}

function pruneBusinessPlan(bp, locale) {
  delete bp.lieferanten.inventoryFootnote

  if (bp.lieferanten?.stockBreakdown) {
    bp.lieferanten.stockBreakdown.cite = 'cit04_kurzbericht_e1'
  }

  if (bp.partner?.groups) {
    bp.partner.groups = bp.partner.groups.filter((g) => !isArchivePartnerGroup(g))
  }

  bp.belege.citations = bp.belege.citations.filter((c) => !ARCHIVE_KEYS.has(c.key))

  replaceCites(bp)

  const patches = locale === 'de' ? DE_PATCHES : LOCALE_PATCHES[locale]
  if (patches) {
    if (patches['partner.intro']) bp.partner.intro = patches['partner.intro']
    if (patches['belege.intro']) bp.belege.intro = patches['belege.intro']
    if (patches['kunden.intro']) bp.kunden.intro = patches['kunden.intro']
    const cit08 = bp.belege.citations.find((c) => c.key === 'cit08_modelle_md')
    if (cit08 && patches.cit08_modelle_md) {
      cit08.label = patches.cit08_modelle_md.label
      cit08.detail = patches.cit08_modelle_md.detail
    }
  }
}

for (const lc of LOCALES) {
  const file = resolve(ROOT, 'messages', `${lc}.json`)
  const data = JSON.parse(readFileSync(file, 'utf8'))
  pruneBusinessPlan(data.projects.upcycling.businessPlan, lc)
  writeFileSync(file, JSON.stringify(data, null, 2) + '\n')
  console.log('pruned', lc)
}

console.log('Done. Run npm run i18n:businessplan')
