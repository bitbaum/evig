import type { Schema, Attribute } from '@strapi/strapi';

export interface LayoutCta extends Schema.Component {
  collectionName: 'components_layout_ctas';
  info: {
    displayName: 'Call To Action';
    icon: 'cursor';
    description: 'A call-to-action section with a title, text, and a button.';
  };
  attributes: {
    title: Attribute.String & Attribute.Required;
    text: Attribute.Text;
    button_text: Attribute.String & Attribute.Required;
    button_link: Attribute.String & Attribute.Required;
  };
}

export interface LayoutHero extends Schema.Component {
  collectionName: 'components_layout_heroes';
  info: {
    displayName: 'Hero';
    icon: 'heading';
    description: 'A hero banner with a title and description.';
  };
  attributes: {
    title: Attribute.String & Attribute.Required;
    description: Attribute.Text;
  };
}

export interface LayoutImpactSection extends Schema.Component {
  collectionName: 'components_layout_impact_sections';
  info: {
    displayName: 'Impact Section';
    icon: 'apps';
    description: 'A section to display multiple impact cards.';
  };
  attributes: {
    title: Attribute.String & Attribute.Required;
    cards: Attribute.Component<'shared.impact-card', true> &
      Attribute.Required &
      Attribute.SetMinMax<{
        min: 1;
      }>;
  };
}

export interface LayoutStatsSection extends Schema.Component {
  collectionName: 'components_layout_stats_sections';
  info: {
    displayName: 'Stats Section';
    icon: 'bullet-list';
    description: 'A section to display statistics in two columns.';
  };
  attributes: {
    title: Attribute.String & Attribute.Required;
    stat_group_1_title: Attribute.String & Attribute.Required;
    stat_group_1_items: Attribute.Component<'shared.stat-item', true> &
      Attribute.Required;
    stat_group_2_title: Attribute.String & Attribute.Required;
    stat_group_2_items: Attribute.Component<'shared.stat-item', true> &
      Attribute.Required;
  };
}

export interface LayoutTextWithImage extends Schema.Component {
  collectionName: 'components_layout_text_with_images';
  info: {
    displayName: 'Text With Image';
    icon: 'image';
    description: 'A block of text that can be accompanied by an image.';
  };
  attributes: {
    content: Attribute.RichText & Attribute.Required;
    image: Attribute.Media;
  };
}

export interface SharedImpactCard extends Schema.Component {
  collectionName: 'components_shared_impact_cards';
  info: {
    displayName: 'Impact Card';
    icon: 'star';
    description: 'A card with a title and description to highlight an area of impact.';
  };
  attributes: {
    title: Attribute.String & Attribute.Required;
    description: Attribute.Text & Attribute.Required;
  };
}

export interface SharedStatItem extends Schema.Component {
  collectionName: 'components_shared_stat_items';
  info: {
    displayName: 'Stat Item';
    icon: 'chart-bubble';
    description: 'A single statistic with a value and description.';
  };
  attributes: {
    value: Attribute.String & Attribute.Required;
    label: Attribute.String & Attribute.Required;
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
