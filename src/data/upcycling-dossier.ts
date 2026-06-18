/**
 * Monitor-Upcycling — internes Projektdossier (SSOT)
 *
 * Datenquelle: die an Andreas übergebenen Unterlagen unter
 * `Nextcloud/Kreislaufnutzung_IT/G/` (Projektinfo + Kontaktdetails).
 *
 * Dies ist die EINZIGE Quelle für den passwortgeschützten internen
 * Bereich `/projects/upcycling/dossier`. Kontakte hier sind reale,
 * öffentlich verifizierbare Geschäftsadressen — keine erfundenen Daten.
 *
 * Jede Gruppe trägt eine eigene Akquise-Botschaft (`outreach`), aus der
 * die Oberfläche einen vorausgefüllten `mailto:`-Link baut, damit die
 * Kontaktaufnahme ein Klick statt eine leere Seite ist.
 */

export interface DossierContact {
  name: string
  category: string
  address?: string
  /** PLZ/Ort */
  city?: string
  phone?: string
  email?: string
  website?: string
  /** Warum relevant / Notiz (v.a. für Grossverteiler). */
  note?: string
  /** Aktionärster Link: Nachhaltigkeits-/Partnerschafts-/Kontaktseite. */
  bestContactUrl?: string
}

export interface DossierOutreach {
  /** Betreff der vorausgefüllten E-Mail. */
  subject: string
  /** Body der vorausgefüllten E-Mail (mit \n umbrüchen). */
  body: string
}

export interface DossierGroup {
  key: string
  /** Kurzlabel für Filter-Chips. */
  shortLabel: string
  title: string
  intro: string
  outreach: DossierOutreach
  contacts: DossierContact[]
}

/* ─── Akquise-Botschaften pro Gruppe ──────────────────────────────── */

const GRUSS = 'Guten Tag'
const SIGNATUR =
  'Freundliche Grüsse\nRevamp-IT — Verein für funktionelle Kreislaufnutzung von IT-Geräten\nhttps://revamp-it.ch'

const OUTREACH = {
  hersteller: {
    subject: 'Produktionspartnerschaft: Monitore werden zu Leuchten',
    body:
      `${GRUSS}\n\n` +
      'Revamp-IT verwandelt ausgediente Computermonitore in funktionierende ' +
      'LED-Leuchten und Leuchtpaneele. Für die Serienfertigung einer Kleinserie ' +
      '(rund 70 Stück) suchen wir eine geschützte Werkstatt mit Elektronik- und ' +
      'Montage-Know-how als Produktionspartnerin.\n\n' +
      'Hätten Sie Interesse, das Vorhaben gemeinsam zu prüfen? Wir stellen Ihnen ' +
      'gerne Muster, Anleitungen und den Zeitplan vor.\n\n' +
      SIGNATUR,
  },
  kunden: {
    subject: 'Kreislauf-Leuchten aus Monitoren für Ihre Liegenschaften',
    body:
      `${GRUSS}\n\n` +
      'Revamp-IT fertigt aus ausgedienten Monitoren langlebige LED-Leuchten für ' +
      'Nebenräume wie Keller, Velo- und Technikräume, Einstellhallen und Korridore. ' +
      'Wir suchen Pilotpartner mit grösseren Liegenschaftsportfolios für einen ' +
      'Praxistest mit Feedback.\n\n' +
      'Dürfen wir Ihnen das Produkt und die Ökobilanz in einem kurzen Termin ' +
      'vorstellen?\n\n' +
      SIGNATUR,
  },
  spender: {
    subject: 'Förderanfrage: Kreislaufnutzung von IT-Geräten',
    body:
      `${GRUSS}\n\n` +
      'Revamp-IT entwickelt ein Verfahren, mit dem ausgediente Computermonitore ' +
      'zu funktionierenden Leuchten aufgewertet statt rezykliert werden — als ' +
      'gemeinnütziges Kreislauf- und Arbeitsintegrationsprojekt in der Region ' +
      'Zürich.\n\n' +
      'Für die nächste Projektphase suchen wir Fördermittel. Gerne senden wir ' +
      'Ihnen ein Kurzdossier und einen Finanzierungsplan zu — passt unser ' +
      'Vorhaben in Ihr Förderprofil?\n\n' +
      SIGNATUR,
  },
  vertrieb: {
    subject: 'Upcycling-Leuchten aus Monitoren — Verkauf in Ihrem Sortiment?',
    body:
      `${GRUSS}\n\n` +
      'Revamp-IT stellt aus ausgedienten Monitoren designstarke Kreislauf-Leuchten ' +
      'her — lokal produziert, reparierbar und mit nachweisbarer Ökobilanz. ' +
      'Wir suchen Verkaufspartner, die solche Produkte führen.\n\n' +
      'Hätten Sie Interesse an Mustern und Konditionen für Ihr Sortiment?\n\n' +
      SIGNATUR,
  },
  grossverteiler: {
    subject: 'Kreislauf-Leuchten aus Schweizer Produktion — Partnerschaft',
    body:
      `${GRUSS}\n\n` +
      'Revamp-IT verwandelt ausgediente Computermonitore in langlebige, ' +
      'reparierbare LED-Leuchten — gemeinnützig, lokal produziert und mit ' +
      'nachweisbarer CO₂-Einsparung gegenüber Neuware. Das passt zu Ihren ' +
      'Nachhaltigkeits- und Kreislaufzielen.\n\n' +
      'Wir würden das Produkt gerne Ihrem Einkauf bzw. Ihrem Nachhaltigkeitsteam ' +
      'vorstellen — als Sortimentsergänzung oder im Rahmen Ihrer Circular-Economy-' +
      'Aktivitäten. Wer wäre dafür die richtige Ansprechperson?\n\n' +
      SIGNATUR,
  },
} satisfies Record<string, DossierOutreach>

/* ─── Kontaktgruppen ──────────────────────────────────────────────── */

export const DOSSIER_GROUPS: DossierGroup[] = [
  {
    key: 'hersteller',
    shortLabel: 'Hersteller',
    title: 'Hersteller — geschützte Werkstätten & Produktionspartner',
    intro:
      'Geschützte Werkstätten mit Elektronik- und Montagekompetenz für die ' +
      'Serienfertigung. Priorität auf Betriebe mit echtem Elektronik-Know-how; ' +
      'rein gastronomisch ausgerichtete Einrichtungen sind weniger geeignet.',
    outreach: OUTREACH.hersteller,
    contacts: [
      { name: 'Werkraum 4', category: 'Geschützte Werkstatt', address: 'Kanonengasse 20', city: '8004 Zürich', phone: '+41 44 296 80 01', email: 'info@werkraum4.ch', website: 'https://www.werkraum4.ch' },
      { name: 'Züriwerk', category: 'Geschützte Werkstatt', address: 'Baslerstrasse 30', city: '8048 Zürich', phone: '+41 44 405 71 00', email: 'stiftung@zueriwerk.ch', website: 'https://www.zueriwerk.ch' },
      { name: 'Stiftung St. Jakob', category: 'Geschützte Werkstatt', address: 'Viaduktstrasse 20', city: '8005 Zürich', phone: '+41 44 295 93 93', email: 'info@st-jakob.ch', website: 'https://www.st-jakob.ch' },
      { name: 'Pigna', category: 'Geschützte Werkstatt', address: 'Graswinkelstrasse 52', city: '8302 Kloten', phone: '+41 44 800 75 00', email: 'pigna@pigna.ch', website: 'https://www.pigna.ch' },
      { name: 'Stiftung Wisli', category: 'Geschützte Werkstatt', address: 'Trafostrasse 1', city: '8180 Bülach', phone: '+41 43 411 45 45', email: 'info@wisli.ch', website: 'https://www.wisli.ch' },
      { name: 'Re- und Upcycling Winterthur (RUW)', category: 'Trainingsarbeitsplätze', address: 'Schützenstrasse 1', city: '8400 Winterthur', phone: '+41 43 411 46 27', email: 'ruw@wisli.ch', website: 'https://www.wisli.ch/ruw' },
      { name: 'Stiftung FARO', category: 'Elektro- & Kleinmontage', address: 'Süssbachareal 1', city: '5210 Windisch', phone: '+41 56 462 39 39', email: 'info@stiftung-faro.ch', website: 'https://www.stiftung-faro.ch' },
      { name: 'Noveos', category: 'Geschützte Arbeitsplätze', address: 'Turicaphonstrasse 31', city: '8616 Riedikon', phone: '+41 44 944 60 40', email: 'info@noveos.ch', website: 'https://www.noveos.ch' },
      { name: 'Drahtzug', category: 'Elektro / Montage', address: 'Drahtzugstrasse 72–78', city: '8008 Zürich', phone: '+41 43 336 76 76', email: 'kundendienst@drahtzug.ch', website: 'https://www.drahtzug.ch' },
      { name: 'Stiftung Altried', category: 'Geschützte Werkstatt', address: 'Überlandstrasse 424', city: '8051 Zürich', phone: '+41 44 325 44 44', email: 'hauptsitz@altried.ch', website: 'https://www.altried.ch' },
      { name: 'cb-Stiftung', category: 'Geschützte Arbeitsplätze', address: 'Thurgauerstrasse 30', city: '8050 Zürich', phone: '+41 44 319 80 40', email: 'cb@cb-stiftung.ch', website: 'https://www.cb-stiftung.ch' },
      { name: 'Wagerenhof', category: 'Soziale Einrichtung', address: 'Asylstrasse 24', city: '8610 Uster', phone: '+41 44 905 13 11', email: 'info@wagerenhof.ch', website: 'https://www.wagerenhof.ch' },
      { name: 'Werkheim Uster', category: 'Soziale Einrichtung', address: 'Friedhofstrasse 3A', city: '8610 Uster', phone: '+41 58 861 00 00', email: 'info@werkheim-uster.ch', website: 'https://www.werkheim-uster.ch' },
      { name: 'IWAZ Sozialunternehmen', category: 'Geschützte Arbeitsplätze', address: 'Neugrundstrasse 4', city: '8620 Wetzikon', phone: '+41 44 933 23 23', email: 'kontakt@iwaz.ch', website: 'https://www.iwaz.ch' },
      { name: 'EPI WohnWerk', category: 'Werkstätten & Wohnheime', address: 'Bleulerstrasse 60', city: '8008 Zürich', phone: '+41 44 387 64 01', email: 'info@epi-wohnwerk.ch', website: 'https://www.epi-wohnwerk.ch' },
      { name: 'Stiftung zur Palme (Werkstatt)', category: 'Geschützte Werkstatt', address: 'Allmendstrasse 30', city: '8320 Fehraltorf', phone: '+41 44 953 31 78', email: 'werkstatt@palme.ch', website: 'https://www.palme.ch' },
      { name: 'Stiftung zur Palme (Zentrale)', category: 'Soziale Einrichtung', address: 'Hochstrasse 31–33', city: '8330 Pfäffikon', phone: '+41 44 953 31 31', email: 'info@palme.ch', website: 'https://www.palme.ch' },
      { name: 'SaveElektro', category: 'ReUse / Upcycling', city: 'Zürcher Region', email: 'info@saveelektro.ch', website: 'https://www.saveelektro.ch' },
    ],
  },
  {
    key: 'kunden',
    shortLabel: 'Kunden',
    title: 'Kunden — Immobilienbewirtschaftung & Facility Management',
    intro:
      'Eigentümer und Verwalter grösserer Immobilienportfolios mit vielen ' +
      'geeigneten Nebenräumen (Keller, Technik-, Velo- und Einstellräume) für ' +
      'Pilotprojekte und Feedback.',
    outreach: OUTREACH.kunden,
    contacts: [
      { name: 'Wincasa AG', category: 'Immobilienbewirtschaftung', address: 'Theaterstr. 17', city: '8400 Winterthur', phone: '+41 58 455 77 77', email: 'info@wincasa.ch', website: 'https://www.wincasa.ch' },
      { name: 'Livit AG', category: 'Immobilienbewirtschaftung', address: 'Altstetterstrasse 124', city: '8048 Zürich', phone: '+41 58 360 33 33', email: 'info@livit.ch', website: 'https://www.livit.ch' },
      { name: 'Allreal Holding AG', category: 'Immobilienunternehmen', address: 'Lindbergh-Allee 1', city: '8152 Glattpark', phone: '+41 44 319 11 11', email: 'info@allreal.ch', website: 'https://www.allreal.ch' },
      { name: 'ISS Schweiz AG', category: 'Facility Management', address: 'Vulkanplatz 3', city: '8010 Zürich', phone: '+41 58 787 85 00', email: 'info@ch.issworld.com', website: 'https://www.issworld.com' },
      { name: 'Schaeppi Grundstücke AG', category: 'Immobilienbewirtschaftung', address: 'Sihlfeldstrasse 10', city: '8003 Zürich', phone: '+41 44 456 56 56', website: 'https://www.schaeppi.ch' },
      { name: 'Esca Immobilien AG', category: 'Immobilienbewirtschaftung', address: 'Rieterstrasse 52', city: '8002 Zürich', phone: '+41 44 281 00 01', email: 'info@escaverwaltung.ch', website: 'https://www.escaverwaltung.ch' },
      { name: 'Stockwerk8', category: 'Immobilienbewirtschaftung', address: 'Zollikerstrasse 65', city: '8702 Zollikon', phone: '+41 44 318 70 70', email: 'hello@stockwerk8.ch', website: 'https://www.stockwerk8.ch' },
      { name: 'Privera AG', category: 'Immobilienbewirtschaftung', address: 'Worbstrasse 142', city: '3073 Gümligen', phone: '+41 58 715 60 00', email: 'guemligen@privera.ch', website: 'https://www.privera.ch' },
      { name: 'Helvetia Service AG (Real Estate)', category: 'Immobilienbewirtschaftung', address: 'Zürichstrasse 130', city: '8600 Dübendorf', phone: '+41 58 280 86 77', website: 'https://www.helvetia.com' },
      { name: 'Stadt Zürich Immobilien (IMMO)', category: 'Immobilienverwaltung Stadt', address: 'Eggbühlstrasse 15', city: '8050 Zürich', website: 'https://www.stadt-zuerich.ch/immobilien' },
      { name: 'ISS Facility Services (Basel)', category: 'Facility Management', address: 'Hochbergerstrasse 15', city: '4002 Basel', phone: '+41 58 787 76 00', website: 'https://www.ch.issworld.com' },
    ],
  },
  {
    key: 'spender',
    shortLabel: 'Förderer',
    title: 'Spender — Stiftungen & Förderorganisationen',
    intro:
      'Stiftungen mit Förderprofil in Klima, Kreislaufwirtschaft, Innovation oder ' +
      'sozialer Integration. Mehrere parallel ansprechen erhöht die Chance auf ' +
      'eine Anschlussfinanzierung.',
    outreach: OUTREACH.spender,
    contacts: [
      { name: 'Gebert Rüf Stiftung', category: 'Förderstiftung', address: 'St. Alban-Vorstadt 12', city: '4052 Basel', phone: '+41 61 270 88 22', email: 'info@grstiftung.ch', website: 'https://www.grstiftung.ch' },
      { name: 'Klimastiftung Schweiz', category: 'Förderstiftung', address: 'Mythenquai 50/60', city: '8002 Zürich', phone: '+41 43 285 44 80', email: 'info@klimastiftung.ch', website: 'https://www.klimastiftung.ch' },
      { name: 'Swiss Re Foundation', category: 'Stiftung', address: 'Mythenquai 50/60', city: '8022 Zürich', email: 'foundation@swissre.com', website: 'https://www.swissre.com/foundation' },
      { name: 'Sophie und Karl Binding Stiftung', category: 'Förderstiftung', address: 'Rennweg 50', city: '4020 Basel', phone: '+41 61 317 40 90', email: 'contact@binding-stiftung.ch', website: 'https://www.binding-stiftung.ch' },
      { name: 'Migros Pionierfonds', category: 'Förderfonds', address: 'Limmatstrasse 152', city: '8031 Zürich', phone: '+41 58 575 32 10', website: 'https://www.migros-pionierfonds.ch' },
      { name: 'myclimate', category: 'Stiftung', address: 'Pfingstweidstrasse 10', city: '8005 Zürich', phone: '+41 44 500 43 50', email: 'info@myclimate.org', website: 'https://www.myclimate.org' },
      { name: 'Schweizerische Energie-Stiftung', category: 'Stiftung', address: 'Sihlquai 67', city: '8005 Zürich', phone: '+41 44 275 21 21', email: 'info@energiestiftung.ch', website: 'https://www.energiestiftung.ch' },
      { name: 'Clima Now', category: 'Stiftung', address: 'Forchstrasse 60', city: '8008 Zürich', email: 'contact@climanow.ch', website: 'https://www.climanow.ch' },
      { name: 'Paul Schiller Stiftung', category: 'Stiftung', address: 'Feldmoosstrasse 12', city: '8853 Lachen', phone: '+41 55 451 53 90', email: 'info@paul-schiller-stiftung.ch', website: 'https://www.paul-schiller-stiftung.ch' },
      { name: 'Christoph Merian Stiftung', category: 'Stiftung', address: 'St. Alban-Vorstadt 12', city: '4052 Basel', phone: '+41 61 226 33 33', email: 'info@cms-basel.ch', website: 'https://www.cms-basel.ch' },
      { name: 'UBS Optimus Foundation', category: 'Förderstiftung', address: 'Bahnhofstrasse 45', city: '8001 Zürich', email: 'sh-philanthropy@ubs.com', website: 'https://www.ubs.com/optimusfoundation' },
    ],
  },
  {
    key: 'vertrieb',
    shortLabel: 'Vertrieb (klein)',
    title: 'Vertriebspartner — nachhaltige Läden & Werkstätten',
    intro:
      'Kleinere, nachhaltig ausgerichtete Läden und Upcycling-Werkstätten als ' +
      'Verkaufskanäle mit passendem Publikum.',
    outreach: OUTREACH.vertrieb,
    contacts: [
      { name: 'Marktlücke', category: 'Nachhaltiger Laden', address: 'Schipfe 24+26', city: '8001 Zürich', phone: '+41 44 212 77 25', email: 'laden@markt-luecke.ch', website: 'https://www.markt-luecke.ch' },
      { name: 'Werk:laden', category: 'Upcycling & Veloreparaturen', address: 'Josefstrasse 104', city: '8005 Zürich', phone: '+41 78 228 87 64', email: 'info@werkladen.ch', website: 'https://www.werkladen.ch' },
      { name: 'Akzentwerk', category: 'Upcycling-Design', address: 'Alpenstrasse 9', city: '3550 Langnau i.E.', phone: '+41 34 402 12 69', email: 'info@akzentwerk.ch', website: 'https://www.akzentwerk.ch' },
      { name: 'Mr. Green', category: 'Nachhaltiger Shop', address: 'Predigerplatz 2', city: '8001 Zürich', phone: '+41 44 271 30 30', email: 'info@mr-green.ch', website: 'https://www.mr-green.ch' },
      { name: 'Saus&Braus', category: 'Secondhand & Upcycling', address: 'Ankerstrasse 14', city: '8004 Zürich', phone: '+41 44 242 23 11', email: 'info@sausbraus.ch', website: 'https://www.sausbraus.ch' },
      { name: 'Changemaker', category: 'Nachhaltige Produkte', address: 'Marktgasse 10', city: '8001 Zürich', phone: '+41 44 251 21 20', email: 'zuerich@changemaker.ch', website: 'https://www.changemaker.ch' },
      { name: 'Marktlücke Werkstatt', category: 'Werkstatt & Produktion', address: 'Hermetschloostrasse 70', city: '8048 Zürich', phone: '+41 44 401 91 80', email: 'werkstatt@markt-luecke.ch', website: 'https://www.markt-luecke.ch' },
    ],
  },
  {
    key: 'grossverteiler',
    shortLabel: 'Grossverteiler',
    title: 'Grossverteiler & Detailhandel — Schweiz',
    intro:
      'Grosse Schweizer Detailhändler aus Leuchten, Möbel, Heimsortiment und ' +
      'Baumarkt — bevorzugt mit bestehendem Nachhaltigkeits- oder Kreislauf-' +
      'Programm. Höheres Volumen, aber längere Entscheidungswege; idealer ' +
      'Einstieg über das Nachhaltigkeits- oder Einkaufsteam.',
    outreach: OUTREACH.grossverteiler,
    contacts: [
      {
        name: 'Lumimart (Coop-Gruppe)',
        category: 'Leuchten-Detailhandel',
        note: 'Grösste Schweizer Leuchten-Fachhandelskette — der direkteste Absatzkanal für upgecycelte LED-Leuchten. Telefon/E-Mail vor Kontaktaufnahme prüfen.',
        website: 'https://www.lumimart.ch',
        bestContactUrl: 'https://www.lumimart.ch/de/impressum',
      },
      {
        name: 'IKEA Schweiz',
        category: 'Möbel-Detailhandel',
        note: 'Betreibt mit dem Kreislauf-/Secondhand-Programm einen Rückkauf-Service — warmer Lead für Second-Life-Produkte.',
        address: 'Müslistrasse 16',
        city: '8957 Spreitenbach',
        email: 'customer.support.de.ch@ikea.com',
        website: 'https://www.ikea.com/ch/de/',
        bestContactUrl: 'https://www.ikea.com/ch/de/circular/',
      },
      {
        name: 'Micasa (Migros)',
        category: 'Möbel-Detailhandel',
        note: 'Führt mit der Linie „RELOVED“ restaurierte Secondhand-Möbel und verkauft Leuchten — Kreislauf-Affinität vorhanden.',
        phone: '+41 58 311 70 00',
        email: 'contact@micasa.ch',
        website: 'https://www.micasa.ch',
        bestContactUrl: 'https://www.micasa.ch/pages/nachhaltigkeit',
      },
      {
        name: 'Möbel Pfister',
        category: 'Möbel-Detailhandel',
        note: 'Grosse Einrichtungskette mit Beleuchtungssortiment und eigener Nachhaltigkeitsstrategie. Für den Vertrieb über die Kontaktseite, nicht die Presse-Adresse.',
        address: 'Bernstrasse Ost 49',
        city: '5034 Suhr',
        phone: '+41 62 855 33 33',
        website: 'https://www.pfister.ch',
        bestContactUrl: 'https://www.pfister.ch/de/umwelt-und-nachhaltigkeit',
      },
      {
        name: 'Vitra',
        category: 'Möbel-Detailhandel (Design)',
        note: 'Betreibt das „Vitra Circle“-Programm mit Circle Stores für aufbereitete Gebrauchtmöbel — explizit Second-Life-orientiert.',
        address: 'Klünenfeldstrasse 22',
        city: '4127 Birsfelden',
        website: 'https://www.vitra.com/de-ch/',
        bestContactUrl: 'https://www.vitra.com/de-ch/about-vitra/sustainability/vitra-circle-stores',
      },
      {
        name: 'HORNBACH Schweiz AG',
        category: 'Baumarkt / DIY',
        note: 'Schweizweite Bau-/Gartenmarktkette mit Beleuchtungssortiment und offenem Kanal für Lieferantenbewerbungen.',
        address: 'Schellenrain 9',
        city: '6210 Sursee',
        phone: '+41 41 929 64 99',
        website: 'https://www.hornbach.ch',
        bestContactUrl: 'https://www.hornbach.ch/services/hilfe-und-kontakt/',
      },
      {
        name: 'LANDI Schweiz AG (fenaco)',
        category: 'Baumarkt / DIY',
        note: 'Sehr dichtes Filialnetz im ländlichen Raum — breiter, dezentraler Absatzkanal.',
        address: 'Schulriederstrasse 5',
        city: '3293 Dotzigen',
        phone: '+41 848 000 120',
        email: 'kundendienst@landischweiz.ch',
        website: 'https://www.landi.ch',
        bestContactUrl: 'https://www.landi.ch/fenaco-landi-gruppe/landi-contact',
      },
      {
        name: 'BAUHAUS Schweiz',
        category: 'Baumarkt / DIY',
        note: 'Fachcentren-Kette für Heimwerker- und Renovationsbedarf mit Beleuchtungssortiment. Adresse vor Kontaktaufnahme prüfen.',
        phone: '+41 31 818 11 60',
        website: 'https://www.bauhaus.ch',
        bestContactUrl: 'https://www.bauhaus.ch/de/l/legal/contact-information',
      },
      {
        name: 'Globus (Magazine zum Globus AG)',
        category: 'Warenhaus (Premium)',
        note: 'Premium-Warenhaus mit Wohn-/Home-Sortiment und eigener Nachhaltigkeitsseite — passend für hochwertige Leuchten.',
        address: 'Schweizergasse 12',
        city: '8001 Zürich',
        email: 'service@globus.ch',
        website: 'https://www.globus.ch',
        bestContactUrl: 'https://www.globus.ch/nachhaltigkeit',
      },
      {
        name: 'Manor AG',
        category: 'Warenhaus',
        note: 'Grösste Warenhausgruppe der Schweiz mit Wohn-/Beleuchtungssortiment und offenem Lieferantenprogramm („Suppliers @ Manor“) — idealer Partnerschaftskanal.',
        address: 'Rebgasse 34',
        city: '4058 Basel',
        phone: '+41 848 802 805',
        email: 'info@manor.ch',
        website: 'https://www.manor.ch',
        bestContactUrl: 'https://www.manor.ch/de/u/suppliers',
      },
      {
        name: 'Digitec Galaxus AG',
        category: 'Online-Detailhandel',
        note: 'Grösster Schweizer Online-Händler mit eigenem Nachhaltigkeitsprogramm — potenzieller Online-Absatzkanal. Kontaktdaten vor Kontaktaufnahme prüfen.',
        website: 'https://www.digitec.ch',
        bestContactUrl: 'https://www.digitec.ch/de/page/nachhaltigkeit-bei-galaxus-und-digitec-34164',
      },
    ],
  },
]

/* ─── Projektübersicht (aus Projektinfo-Dokument) ─────────────────── */

export interface DossierTimelineItem {
  date: string
  label: string
  done?: boolean
}

export const DOSSIER_PROJECT = {
  /** ISO-Stand des Dossiers — von der Statusseite getrennt geführt. */
  snapshotIso: '2026-06-18',
  summary:
    'Umwandlung ausgedienter Computermonitore in Leuchten: Stand, offene ' +
    'Fragen, Meilensteine und Akquise-Kontakte auf einen Blick.',
  tasks: [
    'Produktion einer Kleinserie umgebauter Monitor-Leuchten (ca. 70 Stück) und Sicherstellung der Qualität.',
    'Kosten-Nutzen-Analyse mit Unterstützung der ZHAW und ökologischer Vergleich (LCA).',
    'Detaillierte Anleitung pro Monitor-Modell (Fotos, Boards, Pin-Belegung, Sicherheit) für die Veröffentlichung.',
    'Kontaktaufnahme mit Produktionspartnern (geschützte Werkstätten) und Bewertung ihrer Eignung.',
    'Kontaktaufnahme mit potenziellen Kunden (Immobilienverwaltungen, Facility-Manager) für Pilotprojekte.',
    'Identifikation von Förderorganisationen und Einreichen von Förderanträgen.',
    'Kontaktaufnahme mit Vertriebspartnern für mögliche Verkaufskanäle.',
    'Klärung der rechtlichen Rahmenbedingungen (CE-Konformität) mit einem Fachingenieur.',
    'Abklärung mit Entsorgung + Recycling Zürich (ERZ), ob Bildschirme vor dem Recycling herausgelöst werden können.',
    'Festlegung eines Mediums (Domain / Wiki) für die frei zugängliche Publikation der Anleitungen.',
    'Organisation des Schlussberichts und des Präsentationstermins (3. Juli 2026).',
  ],
  openQuestions: [
    'Welche Monitor-Modelle eignen sich am besten? Wie lassen sich unterschiedliche Boards standardisieren?',
    'Wie lassen sich Flimmern und Helligkeitsregelung modellübergreifend lösen?',
    'Wie hoch ist der tatsächliche Umweltvorteil gegenüber neuen Leuchten — reicht eine grobe Ökobilanz oder braucht es eine umfassende LCA?',
    'Wie viel darf die Lampe kosten, damit sie im Markt akzeptiert wird?',
    'Welche Partner übernehmen Produkthaftung und CE-Kennzeichnung bei Serienproduktion?',
    'Wie lassen sich ausreichende Mengen an auszutauschenden Bildschirmen sichern (ERZ, weitere Sammelstellen)?',
    'Welche Fördergelder sind realistisch und an welche Bedingungen geknüpft?',
    'Wie wird das Projekt kommuniziert — funktionale Leuchte oder kreatives Designobjekt?',
  ],
  timeline: [
    { date: 'Januar 2026', label: 'Abschluss der Kleinserie sowie erste Kosten-/Nutzenanalysen.', done: true },
    { date: '31. Januar 2026', label: 'Ursprüngliche Frist für Etappe 2 (Swico) — bis Juni 2026 verlängert.', done: true },
    { date: 'Juni 2026', label: 'Fertigstellung des Schlussberichts mit allen Listen und Analysen.' },
    { date: '3. Juli 2026', label: 'Präsentation der Projektergebnisse vor dem Swico Innovationsfonds.' },
    { date: 'Laufend', label: 'Dokumentation weiterer Modelle, Akquise von Kunden und Partnern, Förderanträge.' },
  ] satisfies DossierTimelineItem[],
  recommendations: [
    'Bei den Herstellern zuerst auf Produktionspartner mit Elektronik-Know-how konzentrieren (z. B. Drahtzug, FARO, cb-Stiftung) und rein gastronomisch ausgerichtete Einrichtungen meiden.',
    'Bei den Kunden mit Eigentümern grösserer Immobilienportfolios starten (Wincasa, Livit, Allreal), die über viele geeignete Nebenräume verfügen.',
    'Für die Finanzierung mehrere Stiftungen parallel ansprechen.',
    'Klare Kommunikationsstrategie: das Produkt als funktionale, kreislauffähige Alternative präsentieren; kreative Zusatznutzen in einer späteren Phase adressieren.',
  ],
} as const
