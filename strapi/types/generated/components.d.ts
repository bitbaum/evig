import type { Attribute, Schema } from '@strapi/strapi';

export interface LayoutCta extends Schema.Component {
  collectionName: 'components_layout_ctas';
  info: {
    description: 'A call-to-action section with a title, text, and a button.';
    displayName: 'Call To Action';
    icon: 'cursor';
  };
  attributes: {
    button_link: Attribute.String & Attribute.Required;
    button_text: Attribute.String & Attribute.Required;
    text: Attribute.Text;
    title: Attribute.String & Attribute.Required;
  };
}

export interface LayoutHero extends Schema.Component {
  collectionName: 'components_layout_heroes';
  info: {
    description: 'A hero banner with a title and description.';
    displayName: 'Hero';
    icon: 'heading';
  };
  attributes: {
    description: Attribute.Text;
    title: Attribute.String & Attribute.Required;
  };
}

export interface LayoutImpactSection extends Schema.Component {
  collectionName: 'components_layout_impact_sections';
  info: {
    description: 'A section to display multiple impact cards.';
    displayName: 'Impact Section';
    icon: 'apps';
  };
  attributes: {
    cards: Attribute.Component<'shared.impact-card', true> &
      Attribute.Required &
      Attribute.SetMinMax<
        {
          min: 1;
        },
        number
      >;
    title: Attribute.String & Attribute.Required;
  };
}

export interface LayoutStatsSection extends Schema.Component {
  collectionName: 'components_layout_stats_sections';
  info: {
    description: 'A section to display statistics in two columns.';
    displayName: 'Stats Section';
    icon: 'bullet-list';
  };
  attributes: {
    stat_group_1_items: Attribute.Component<'shared.stat-item', true> &
      Attribute.Required;
    stat_group_1_title: Attribute.String & Attribute.Required;
    stat_group_2_items: Attribute.Component<'shared.stat-item', true> &
      Attribute.Required;
    stat_group_2_title: Attribute.String & Attribute.Required;
    title: Attribute.String & Attribute.Required;
  };
}

export interface LayoutTextWithImage extends Schema.Component {
  collectionName: 'components_layout_text_with_images';
  info: {
    description: 'A block of text that can be accompanied by an image.';
    displayName: 'Text With Image';
    icon: 'image';
  };
  attributes: {
    content: Attribute.RichText & Attribute.Required;
    image: Attribute.Media<'images'>;
  };
}

export interface SharedImpactCard extends Schema.Component {
  collectionName: 'components_shared_impact_cards';
  info: {
    description: 'A card with a title and description to highlight an area of impact.';
    displayName: 'Impact Card';
    icon: 'star';
  };
  attributes: {
    description: Attribute.Text & Attribute.Required;
    title: Attribute.String & Attribute.Required;
  };
}

export interface SharedStatItem extends Schema.Component {
  collectionName: 'components_shared_stat_items';
  info: {
    description: 'A single statistic with a value and description.';
    displayName: 'Stat Item';
    icon: 'chart-bubble';
  };
  attributes: {
    label: Attribute.String & Attribute.Required;
    value: Attribute.String & Attribute.Required;
  };
}

declare module '@strapi/types' {
  export module Shared {
    export interface Components {
      'layout.cta': LayoutCta;
      'layout.hero': LayoutHero;
      'layout.impact-section': LayoutImpactSection;
      'layout.stats-section': LayoutStatsSection;
      'layout.text-with-image': LayoutTextWithImage;
      'shared.impact-card': SharedImpactCard;
      'shared.stat-item': SharedStatItem;
    }
  }
}
