import { Metadata } from 'next'
import Image from 'next/image'
import { HeroBanner } from '@/components/ui/hero-banner'
import { getStaticPage } from '@/lib/strapi'
import RichTextRenderer from '@/components/ui/rich-text-renderer'
import HardcodedAboutPage from './hardcoded-content'

const getImageUrl = (image: any) => {
  if (!image?.data?.attributes?.url) {
    return null;
  }
  const url = image.data.attributes.url;
  return url.startsWith('http') ? url : `${process.env.STRAPI_URL || 'http://localhost:1337'}${url}`;
};

// Component Map
const components = {
  'layout.hero': (section: any, index: number) => (
    <HeroBanner key={index} title={section.title} description={section.description} />
  ),
  'layout.text-with-image': (section: any, index: number) => {
    const imageUrl = getImageUrl(section.image);
    return (
      <section key={index} className="py-20 px-4 max-w-6xl mx-auto">
        <div className="space-y-8">
          <RichTextRenderer content={section.content} />
          {imageUrl && (
            <div className="relative w-full h-[400px] rounded-lg overflow-hidden my-8">
              <Image
                src={imageUrl}
                alt={section.image.data.attributes.alternativeText || 'About us image'}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 1024px"
              />
            </div>
          )}
        </div>
      </section>
    )
  },
  'layout.impact-section': (section: any, index: number) => (
    <section key={index} className="py-20 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="text-3xl font-bold mb-12 text-center">{section.title}</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {section.cards.map((card: any) => (
            <div key={card.id} className="bg-white p-8 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-4">{card.title}</h3>
              <p className="text-lg">{card.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  ),
  'layout.stats-section': (section: any, index: number) => (
     <section key={index} className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold mb-12 text-center">{section.title}</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-green-50 p-8 rounded-lg shadow-md">
              <h3 className="text-2xl font-bold text-green-800 mb-2">{section.stat_group_1_title}</h3>
              <div className="space-y-6">
                {section.stat_group_1_items.map((item: any) => (
                  <div key={item.id}>
                    <p className="text-4xl font-bold text-green-700 mb-2">{item.value}</p>
                    <p className="text-gray-600">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-green-50 p-8 rounded-lg shadow-md">
              <h3 className="text-2xl font-bold text-green-800 mb-2">{section.stat_group_2_title}</h3>
              <div className="space-y-6">
                {section.stat_group_2_items.map((item: any) => (
                   <div key={item.id}>
                    <p className="text-4xl font-bold text-green-700 mb-2">{item.value}</p>
                    <p className="text-gray-600">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
  ),
  'layout.cta': (section: any, index: number) => (
     <section key={index} className="py-20 bg-green-600 text-white">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-3xl font-bold mb-6">{section.title}</h2>
          <p className="text-xl mb-8">{section.text}</p>
          <a
            href={section.button_link}
            className="inline-block bg-white text-green-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            {section.button_text}
          </a>
        </div>
      </section>
  )
};

export async function generateMetadata(): Promise<Metadata> {
  const page = await getStaticPage('about', { populate: 'deep' });

  if (!page) {
    return {
      title: 'About Us - RevampIT',
      description: 'Learn about our mission to extend the life of IT devices and promote sustainable computing practices.',
    };
  }
  
  const seo = page.attributes.seo || {};

  return {
    title: seo.seo_title || page.attributes.title,
    description: seo.seo_description || page.attributes.excerpt,
  };
}

export default async function AboutPage() {
  const page = await getStaticPage('about', { populate: 'deep' });

  if (!page || !page.attributes.sections || page.attributes.sections.length === 0) {
    return <HardcodedAboutPage />;
  }

  return (
    <main className="min-h-screen">
      {page.attributes.sections.map((section: any, index: number) => {
        const Component = components[section.__component as keyof typeof components];
        if (!Component) {
          return <p key={index}>Component not found: {section.__component}</p>;
        }
        return Component(section, index);
      })}
    </main>
  )
} 