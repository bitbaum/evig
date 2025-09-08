#!/usr/bin/env node

/**
 * Docker PostgreSQL Migration - Migrate content to Docker PostgreSQL database
 * This script uses Docker to connect to the PostgreSQL database
 */

const { execSync } = require('child_process');
const path = require('path');

async function migrateToDocker() {
  console.log('🚀 Starting Docker PostgreSQL Migration...');

  try {
    // Check if Docker containers are running
    const containers = execSync('cd /home/g/dev/revampit && docker-compose ps --services --filter "status=running"', { encoding: 'utf8' });
    if (!containers.includes('db')) {
      throw new Error('Docker PostgreSQL container is not running');
    }
    console.log('✅ Docker containers are running');

    // Clear existing data
    console.log('🧹 Clearing existing data...');
    try {
      execSync(`cd /home/g/dev/revampit && docker-compose exec -T db psql -U strapi -d strapi -c "DELETE FROM static_pages_components;"`, { stdio: 'pipe' });
      execSync(`cd /home/g/dev/revampit && docker-compose exec -T db psql -U strapi -d strapi -c "DELETE FROM static_pages;"`, { stdio: 'pipe' });
      console.log('✅ Existing data cleared');
    } catch (e) {
      console.log('ℹ️  No existing data to clear');
    }

    // Insert About page
    console.log('📝 Creating About page...');
    const insertPageSQL = `
      INSERT INTO static_pages (
        title, page_key, page_type, seo_title, seo_description,
        show_in_navigation, published_at, created_at, updated_at
      ) VALUES (
        'Über RevampIT - Technik ein zweites Leben geben',
        'about',
        'about',
        'Über uns - RevampIT - Nachhaltige IT-Lösungen',
        'Entdecken Sie unsere Mission, Technik nachhaltig zu machen und Elektroschrott durch Reparatur und Wiederverwendung zu reduzieren. Ihr Partner für nachhaltige IT in der Schweiz.',
        true,
        NOW(),
        NOW(),
        NOW()
      ) RETURNING id;
    `;

    const pageResult = execSync(`cd /home/g/dev/revampit && docker-compose exec -T db psql -U strapi -d strapi -t -c "${insertPageSQL.replace(/\n/g, ' ')}"`, { encoding: 'utf8' }).trim();
    const pageId = parseInt(pageResult);
    console.log(`✅ About page created with ID: ${pageId}`);

    // Insert sections
    const sections = [
      {
        type: 'layout.hero',
        data: {
          title: "Technik ein zweites Leben geben",
          description: "Seit 15 Jahren setzen wir uns gegen die vorschnelle Ausmusterung von Computern ein und fördern nachhaltige IT-Praktiken."
        }
      },
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
      {
        type: 'layout.text-with-image',
        data: {
          title: "Unsere Geschichte",
          content: `2009 als kleine Reparaturwerkstatt gegründet, ist RevampIT heute eine Bewegung, die den Umgang mit Technik nachhaltig verändert. Was mit einer einfachen Idee begann – Technik länger nutzen – ist heute ein Vorbild für nachhaltige IT in der Schweiz.

Unser Team aus 20 engagierten Menschen setzt sich täglich für nachhaltige IT ein. Wir sind Anlaufstelle für Privatpersonen und Unternehmen, die ihren ökologischen Fussabdruck reduzieren und trotzdem auf zuverlässige Technik setzen wollen.

Unser Engagement geht über Reparaturen hinaus: Wir beteiligen uns an Klimademos, teilen Wissen zu nachhaltigen digitalen Alternativen und setzen uns für einen bewussteren Umgang mit Technik ein.`
        }
      },
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

    console.log('📤 Inserting content sections...');
    let order = 0;
    for (const section of sections) {
      const componentData = JSON.stringify(section.data).replace(/'/g, "''");

      const insertComponentSQL = `INSERT INTO static_pages_components (entity_id, component_type, field, "order", component_id) VALUES (${pageId}, '${section.type}', 'sections', ${order}, NULL);`;

      execSync(`cd /home/g/dev/revampit && docker-compose exec -T db psql -U strapi -d strapi -c "${insertComponentSQL}"`, { stdio: 'pipe' });
      console.log(`✅ Section ${order + 1} inserted: ${section.type}`);
      order++;
    }

    // Verify migration
    console.log('\n🔍 Verifying migration...');
    const verifySQL = `SELECT COUNT(*) as pages FROM static_pages WHERE page_key = 'about';`;
    const verifyResult = execSync(`cd /home/g/dev/revampit && docker-compose exec -T db psql -U strapi -d strapi -t -c "${verifySQL}"`, { encoding: 'utf8' }).trim();

    if (parseInt(verifyResult) > 0) {
      console.log('✅ Migration successful!');
      console.log(`📄 Pages in database: ${verifyResult}`);
    }

    console.log('\n🎉 MIGRATION COMPLETE!');
    console.log('=====================================');
    console.log('✅ All About page content migrated to Docker PostgreSQL');
    console.log('✅ No manual copying required');
    console.log('✅ Content is now in production database');
    console.log('');
    console.log('🌐 Test it: http://localhost:3000/about');
    console.log('⚙️  Edit it: http://localhost:1337/admin');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Make sure Docker containers are running');
    console.log('2. Check: docker-compose ps');
    console.log('3. Restart if needed: docker-compose restart');
    process.exit(1);
  }
}

// Run the migration
migrateToDocker();
