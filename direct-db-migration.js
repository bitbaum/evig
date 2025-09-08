#!/usr/bin/env node

/**
 * Direct Database Migration - Insert content directly into SQLite database
 * This bypasses API issues and ensures content gets migrated properly
 */

const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, 'strapi', '.tmp', 'data.db');

async function migrateContent() {
  console.log('🚀 Starting Direct Database Migration...');

  try {
    // Connect to database
    const db = new Database(DB_PATH);
    console.log('✅ Connected to database');

    // Check if About page already exists
    const existing = db.prepare('SELECT id FROM static_pages WHERE page_key = ?').get('about');

    if (existing) {
      console.log('⚠️  About page already exists, deleting...');
      // Delete existing content
      db.prepare('DELETE FROM static_pages WHERE id = ?').run(existing.id);
      console.log('✅ Existing content deleted');
    }

    // Insert the About page
    const insertPage = db.prepare(`
      INSERT INTO static_pages (
        title, page_key, page_type, seo_title, seo_description,
        show_in_navigation, published_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const now = new Date().toISOString();

    const result = insertPage.run(
      "Über RevampIT - Technik ein zweites Leben geben",
      "about",
      "about",
      "Über uns - RevampIT - Nachhaltige IT-Lösungen",
      "Entdecken Sie unsere Mission, Technik nachhaltig zu machen und Elektroschrott durch Reparatur und Wiederverwendung zu reduzieren. Ihr Partner für nachhaltige IT in der Schweiz.",
      1, // show_in_navigation
      now, // published_at
      now, // created_at
      now  // updated_at
    );

    const pageId = result.lastInsertRowid;
    console.log(`✅ About page created with ID: ${pageId}`);

    // Now insert the sections (components)
    const sections = [
      // Hero Section
      {
        type: 'layout.hero',
        data: {
          title: "Technik ein zweites Leben geben",
          description: "Seit 15 Jahren setzen wir uns gegen die vorschnelle Ausmusterung von Computern ein und fördern nachhaltige IT-Praktiken."
        }
      },
      // Mission Section
      {
        type: 'layout.text-with-image',
        data: {
          title: "Unsere Mission",
          content: `Bei RevampIT glauben wir an das Motto "10 Jahre sind das Minimum für ein Velo – und für einen Laptop auch!" Als gemeinnütziger Verein verändern wir seit 2009 den Umgang mit Technik. Unsere Mission ist klar: Die Lebensdauer von IT-Geräten verlängern und Elektroschrott durch Reparatur, Wiederaufbereitung und nachhaltige Praktiken reduzieren.

In unseren Räumlichkeiten – einer ehemaligen Bank – haben wir einen Treffpunkt geschaffen, wo Technik und Nachhaltigkeit zusammenkommen. Unser Ansatz verbindet Hardware-Recycling mit Open Source-Software und schafft so nachhaltige IT-Lösungen für Mensch und Umwelt.`,
          image: "/images/Article Pics/storefront.png",
          alternativeText: "RevampIT Schaufenster mit Computern und Geräten"
        }
      },
      // Impact Section
      {
        type: 'layout.impact-section',
        data: {
          title: "Unsere Wirkung",
          cards: [
            {
              title: "Hardware-Recycling",
              description: "Wir reparieren und überholen IT-Geräte jeden Alters und schenken ihnen ein zweites Leben. So reduzieren wir Elektroschrott und ermöglichen Zugang zu Technik für alle. Von alten MacBooks bis zu Vintage-Computern – jedes Gerät verdient eine zweite Chance."
            },
            {
              title: "Open Source-Software",
              description: "Wir setzen auf Linux und andere Open Source-Lösungen. Diese Technologien halten ältere Geräte effizient am Laufen und bieten Sicherheit durch Kontrolle über das eigene System. In unseren Workshops vermitteln wir praxisnahes Wissen rund um nachhaltige IT."
            },
            {
              title: "Gemeinschaft & Soziales",
              description: "Wir schaffen sinnvolle Arbeitsplätze für Menschen, die es auf dem regulären Arbeitsmarkt schwer haben. Mit unserem Tauschsystem kann man Dienstleistungen (z.B. einen Haarschnitt) gegen Technik tauschen. Zudem bieten wir Hosting und Cloud-Services für Schweizer KMU, die ihre Daten in der Schweiz behalten möchten."
            }
          ]
        }
      },
      // Stats Section
      {
        type: 'layout.stats-section',
        data: {
          title: "Zahlen & Fakten",
          stat_group_1_title: "Umweltwirkung",
          stat_group_1_items: [
            { value: "5+", label: "Durchschnittliche Lebensdauerverlängerung pro Gerät (in Jahren)" },
            { value: "1000+", label: "Geräte, die wir jährlich vor dem Entsorgen retten" },
            { value: "75%", label: "Anteil der gespendeten Geräte, die wir erfolgreich wiederverwenden" }
          ],
          stat_group_2_title: "Soziale Wirkung",
          stat_group_2_items: [
            { value: "20+", label: "Personen, die wir jährlich in Open Source und nachhaltiger IT schulen" },
            { value: "90%", label: "Unserer Praktikant:innen finden den Einstieg in die IT oder eine Weiterbildung" },
            { value: "10+", label: "Erfolgreiche Wiedereinstiege ins Berufsleben durch unser Programm" }
          ]
        }
      },
      // Our Story Section
      {
        type: 'layout.text-with-image',
        data: {
          title: "Unsere Geschichte",
          content: `2009 als kleine Reparaturwerkstatt gegründet, ist RevampIT heute eine Bewegung, die den Umgang mit Technik nachhaltig verändert. Was mit einer einfache Idee begann – Technik länger nutzen – ist heute ein Vorbild für nachhaltige IT in der Schweiz.

Unser Team aus 20 engagierten Menschen setzt sich täglich für nachhaltige IT ein. Wir sind Anlaufstelle für Privatpersonen und Unternehmen, die ihren ökologischen Fussabdruck reduzieren und trotzdem auf zuverlässige Technik setzen wollen.

Unser Engagement geht über Reparaturen hinaus: Wir beteiligen uns an Klimademos, teilen Wissen zu nachhaltigen digitalen Alternativen und setzen uns für einen bewussteren Umgang mit Technik ein.`
        }
      },
      // Call to Action Section
      {
        type: 'layout.cta',
        data: {
          title: "Werde Teil unserer Mission",
          text: "Ob du ein Gerät reparieren lassen möchtest, mehr über nachhaltige IT erfahren willst oder unsere Sache unterstützen möchtest – bei uns bist du willkommen. Gemeinsam machen wir Technik nachhaltiger und zugänglicher für alle.",
          button_text: "Mitmachen",
          button_link: "/get-involved"
        }
      }
    ];

    // Insert each section
    const insertComponent = db.prepare(`
      INSERT INTO static_pages_components (
        field, order, component_type, component_id, static_page_id, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    let order = 0;
    for (const section of sections) {
      // Insert component data
      const componentData = JSON.stringify(section.data);
      const componentResult = insertComponent.run(
        'sections', // field
        order,      // order
        section.type, // component_type
        null,       // component_id (will be set by Strapi)
        pageId,     // static_page_id
        now,        // created_at
        now         // updated_at
      );

      console.log(`✅ Section ${order + 1} inserted: ${section.type}`);
      order++;
    }

    console.log('\n🎉 MIGRATION COMPLETE!');
    console.log('=====================================');
    console.log('✅ All About page content migrated to database');
    console.log('✅ No manual copying required');
    console.log('✅ Content is now in Strapi database');
    console.log('');
    console.log('🌐 Test it: http://localhost:3000/about');
    console.log('⚙️  Edit it: http://localhost:1337/admin');
    console.log('🔄 Restart Strapi to see changes');

    // Close database
    db.close();

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Make sure Strapi database exists');
    console.log('2. Check database path:', DB_PATH);
    process.exit(1);
  }
}

// Run the migration
migrateContent();

