#!/usr/bin/env node

/**
 * Automated Migration Script - Migrate hardcoded About page content to Strapi
 * This script automatically creates the About page content in Strapi via API
 * No manual copying required!
 */

const STRAPI_URL = 'http://localhost:1337';

async function migrateContent() {
  console.log('🚀 Starting Automated Content Migration...');

  try {
    // First, check if About page already exists
    const existingResponse = await fetch(`${STRAPI_URL}/api/static-pages?filters[page_key][$eq]=about`);
    const existingData = await existingResponse.json();

    if (existingData.data && existingData.data.length > 0) {
      console.log('⚠️  About page already exists in Strapi!');
      console.log('   Deleting existing content to replace with migrated content...');

      // Delete existing About page
      const deleteResponse = await fetch(`${STRAPI_URL}/api/static-pages/${existingData.data[0].id}`, {
        method: 'DELETE'
      });

      if (!deleteResponse.ok) {
        throw new Error('Failed to delete existing About page');
      }
      console.log('✅ Existing About page deleted');
    }

    // Create the About page with all content
    const aboutPageData = {
      data: {
        title: "Über RevampIT - Technik ein zweites Leben geben",
        page_key: "about",
        page_type: "about",
        seo_title: "Über uns - RevampIT - Nachhaltige IT-Lösungen",
        seo_description: "Entdecken Sie unsere Mission, Technik nachhaltig zu machen und Elektroschrott durch Reparatur und Wiederverwendung zu reduzieren. Ihr Partner für nachhaltige IT in der Schweiz.",
        show_in_navigation: true,
        sections: [
          // Hero Section
          {
            __component: "layout.hero",
            title: "Technik ein zweites Leben geben",
            description: "Seit 15 Jahren setzen wir uns gegen die vorschnelle Ausmusterung von Computern ein und fördern nachhaltige IT-Praktiken."
          },
          // Mission Section with Image
          {
            __component: "layout.text-with-image",
            title: "Unsere Mission",
            content: `Bei RevampIT glauben wir an das Motto "10 Jahre sind das Minimum für ein Velo – und für einen Laptop auch!" Als gemeinnütziger Verein verändern wir seit 2009 den Umgang mit Technik. Unsere Mission ist klar: Die Lebensdauer von IT-Geräten verlängern und Elektroschrott durch Reparatur, Wiederaufbereitung und nachhaltige Praktiken reduzieren.

In unseren Räumlichkeiten – einer ehemaligen Bank – haben wir einen Treffpunkt geschaffen, wo Technik und Nachhaltigkeit zusammenkommen. Unser Ansatz verbindet Hardware-Recycling mit Open Source-Software und schafft so nachhaltige IT-Lösungen für Mensch und Umwelt.`,
            image: {
              url: "/images/Article Pics/storefront.png",
              alternativeText: "RevampIT Schaufenster mit Computern und Geräten"
            }
          },
          // Impact Cards Section
          {
            __component: "layout.impact-section",
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
          },
          // Stats Section
          {
            __component: "layout.stats-section",
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
          },
          // Our Story Section
          {
            __component: "layout.text-with-image",
            title: "Unsere Geschichte",
            content: `2009 als kleine Reparaturwerkstatt gegründet, ist RevampIT heute eine Bewegung, die den Umgang mit Technik nachhaltig verändert. Was mit einer einfachen Idee begann – Technik länger nutzen – ist heute ein Vorbild für nachhaltige IT in der Schweiz.

Unser Team aus 20 engagierten Menschen setzt sich täglich für nachhaltige IT ein. Wir sind Anlaufstelle für Privatpersonen und Unternehmen, die ihren ökologischen Fussabdruck reduzieren und trotzdem auf zuverlässige Technik setzen wollen.

Unser Engagement geht über Reparaturen hinaus: Wir beteiligen uns an Klimademos, teilen Wissen zu nachhaltigen digitalen Alternativen und setzen uns für einen bewussteren Umgang mit Technik ein.`
          },
          // Call to Action Section
          {
            __component: "layout.cta",
            title: "Werde Teil unserer Mission",
            text: "Ob du ein Gerät reparieren lassen möchtest, mehr über nachhaltige IT erfahren willst oder unsere Sache unterstützen möchtest – bei uns bist du willkommen. Gemeinsam machen wir Technik nachhaltiger und zugänglicher für alle.",
            button_text: "Mitmachen",
            button_link: "/get-involved"
          }
        ]
      }
    };

    console.log('📤 Creating About page in Strapi...');

    const createResponse = await fetch(`${STRAPI_URL}/api/static-pages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(aboutPageData)
    });

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      throw new Error(`Failed to create About page: ${createResponse.status} ${errorText}`);
    }

    const result = await createResponse.json();
    console.log('✅ About page created successfully!');
    console.log('📄 Page ID:', result.data.id);
    console.log('🔗 Page Key:', result.data.attributes.page_key);

    // Test the content by fetching it back
    console.log('\n🔍 Testing content retrieval...');
    const testResponse = await fetch(`${STRAPI_URL}/api/static-pages?filters[page_key][$eq]=about&populate=sections`);
    const testData = await testResponse.json();

    if (testData.data && testData.data.length > 0) {
      const page = testData.data[0];
      console.log('✅ Content successfully migrated!');
      console.log(`📊 Sections migrated: ${page.attributes.sections?.length || 0}`);
      console.log(`📝 Title: "${page.attributes.title}"`);
      console.log(`🔍 SEO Title: "${page.attributes.seo_title}"`);
    }

    console.log('\n🎉 MIGRATION COMPLETE!');
    console.log('=====================================');
    console.log('✅ All About page content migrated to Strapi');
    console.log('✅ No manual copying required');
    console.log('✅ Content is now manageable through CMS');
    console.log('');
    console.log('🌐 Test it: http://localhost:3000/about');
    console.log('⚙️  Edit it: http://localhost:1337/admin');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Make sure Strapi is running: npm run develop');
    console.log('2. Check Strapi admin: http://localhost:1337/admin');
    console.log('3. Verify API is accessible: curl http://localhost:1337/api/static-pages');
    process.exit(1);
  }
}

// Run the migration
migrateContent();

