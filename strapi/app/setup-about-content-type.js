const { Strapi } = require('@strapi/strapi');

async function setupAboutContentType() {
  const strapi = await Strapi().load();
  
  // Create the About content type
  const contentType = {
    kind: 'collectionType',
    collectionName: 'abouts',
    info: {
      singularName: 'about',
      pluralName: 'abouts',
      displayName: 'About',
      description: 'About page content',
    },
    options: {
      draftAndPublish: true,
    },
    attributes: {
      hero: {
        type: 'component',
        component: 'sections.hero',
        required: true,
      },
      mission: {
        type: 'component',
        component: 'sections.mission',
        required: true,
      },
      impactAreas: {
        type: 'component',
        component: 'sections.impact-areas',
        required: true,
      },
      byTheNumbers: {
        type: 'component',
        component: 'sections.by-the-numbers',
        required: true,
      },
      ourStory: {
        type: 'component',
        component: 'sections.our-story',
        required: true,
      },
      callToAction: {
        type: 'component',
        component: 'sections.call-to-action',
        required: true,
      },
    },
  };

  // Create the components
  const components = {
    'sections.hero': {
      title: 'Hero Section',
      attributes: {
        title: {
          type: 'string',
          required: true,
        },
        description: {
          type: 'text',
          required: true,
        },
      },
    },
    'sections.mission': {
      title: 'Mission Section',
      attributes: {
        title: {
          type: 'string',
          required: true,
        },
        content: {
          type: 'richtext',
          required: true,
        },
        image: {
          type: 'media',
          multiple: false,
          required: true,
          allowedTypes: ['images'],
        },
      },
    },
    'sections.impact-areas': {
      title: 'Impact Areas',
      attributes: {
        title: {
          type: 'string',
          required: true,
        },
        areas: {
          type: 'component',
          repeatable: true,
          component: 'elements.impact-area',
          required: true,
        },
      },
    },
    'sections.by-the-numbers': {
      title: 'By the Numbers',
      attributes: {
        title: {
          type: 'string',
          required: true,
        },
        environmentalImpact: {
          type: 'component',
          repeatable: true,
          component: 'elements.statistic',
          required: true,
        },
        communityImpact: {
          type: 'component',
          repeatable: true,
          component: 'elements.statistic',
          required: true,
        },
      },
    },
    'sections.our-story': {
      title: 'Our Story',
      attributes: {
        title: {
          type: 'string',
          required: true,
        },
        content: {
          type: 'richtext',
          required: true,
        },
      },
    },
    'sections.call-to-action': {
      title: 'Call to Action',
      attributes: {
        title: {
          type: 'string',
          required: true,
        },
        description: {
          type: 'text',
          required: true,
        },
        buttonText: {
          type: 'string',
          required: true,
        },
      },
    },
    'elements.impact-area': {
      title: 'Impact Area',
      attributes: {
        title: {
          type: 'string',
          required: true,
        },
        description: {
          type: 'richtext',
          required: true,
        },
      },
    },
    'elements.statistic': {
      title: 'Statistic',
      attributes: {
        number: {
          type: 'string',
          required: true,
        },
        description: {
          type: 'text',
          required: true,
        },
      },
    },
  };

  try {
    // Create components first
    for (const [uid, component] of Object.entries(components)) {
      await strapi.plugins['content-type-builder'].services.components.createComponent({
        component: {
          ...component,
          category: 'sections',
        },
      });
    }

    // Create the content type
    await strapi.plugins['content-type-builder'].services.contenttypes.createContentType({
      contentType,
    });

    console.log('Successfully created About page content type and components');
  } catch (error) {
    console.error('Error creating content type:', error);
  }
}

setupAboutContentType(); 