#!/usr/bin/env node

/**
 * Docker-based migration script to populate About page content in Strapi
 * This script runs inside the Docker container and directly uses Strapi's entity service
 */

const content = {
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
    // Mission Section
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
    // Impact Section
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

Unser Engagement geht über Reparaturen hinaus: Wir beteiligen uns an Klimademos, teilen Wissen zu nachhaltigen digitalen Alternativen und setzen uns für einen bewussteren Umgang mit Technik ein.`,
      show_image: false
    },
    // Call to Action
    {
      __component: "layout.cta",
      title: "Werde Teil unserer Mission",
      text: "Ob du ein Gerät reparieren lassen möchtest, mehr über nachhaltige IT erfahren willst oder unsere Sache unterstützen möchtest – bei uns bist du willkommen. Gemeinsam machen wir Technik nachhaltiger und zugänglicher für alle.",
      button_text: "Mitmachen",
      button_link: "/get-involved"
    }
  ]
};

async function populateAboutContent() {
  try {
    console.log('🚀 Starting About page content migration (Docker)...');

    // Check if content already exists
    const existingContent = await strapi.entityService.findMany('api::static-page.static-page', {
      filters: { page_key: 'about' }
    });

    if (existingContent && existingContent.length > 0) {
      console.log('ℹ️  About page content already exists. Updating...');
      const result = await strapi.entityService.update('api::static-page.static-page', existingContent[0].id, {
        data: content
      });
      console.log('✅ Successfully updated About page content in Strapi!');
      console.log('📄 Content ID:', result.id);
      return result;
    } else {
      // Create new content
      const result = await strapi.entityService.create('api::static-page.static-page', {
        data: content
      });
      console.log('✅ Successfully created About page content in Strapi!');
      console.log('📄 Content ID:', result.id);
      return result;
    }
  } catch (error) {
    console.error('❌ Error populating content:', error);
    console.log('📝 Please check that:');
    console.log('   1. Strapi is running');
    console.log('   2. The static-page content type exists');
    console.log('   3. All layout components are properly configured');
  }
}

// Only run if strapi is available
if (typeof strapi !== 'undefined') {
  populateAboutContent();
} else {
  console.error('❌ Strapi is not available. This script must be run inside a Strapi container.');
  console.log('💡 Try: docker compose exec strapi node /app/docker-populate-about.js');
}
