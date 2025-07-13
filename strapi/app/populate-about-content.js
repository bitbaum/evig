const { Strapi } = require('@strapi/strapi');

async function populateAboutContent() {
  const strapi = await Strapi().load();

  const aboutContent = {
    hero: {
      title: "Extending the Life of Technology",
      description: "For 15 years, we've been fighting against the premature retirement of computers and promoting sustainable IT practices."
    },
    mission: {
      title: "Our Mission",
      content: "At RevampIT, we believe in \"Retirement Age 10 for Laptops!\" We're a non-profit organization that has been transforming the way people think about technology since 2009. Our mission is simple but powerful: extend the life of IT devices and reduce electronic waste through repair, refurbishment, and sustainable practices.\n\nOperating from our unique space in a former bank building, we've created a community hub where technology meets sustainability. Our approach combines hardware recycling with open-source software solutions, creating a holistic approach to sustainable computing that benefits both people and the planet.",
      image: "storefront.png" // You'll need to upload this image first
    },
    impactAreas: {
      title: "Our Impact",
      areas: [
        {
          title: "Hardware Recycling",
          description: "We repair and refurbish IT devices of all ages, giving them a second life and reducing electronic waste. From 11-year-old MacBooks to vintage computers, we believe every device deserves a chance to continue serving its purpose. Our repair services help keep technology out of landfills and in the hands of those who need it."
        },
        {
          title: "Open Source Software",
          description: "We're strong advocates for Linux and other open-source solutions. These technologies not only keep older devices running efficiently but also provide security advantages by giving users control over their systems. Our regular workshops help people learn how to use these powerful tools effectively."
        },
        {
          title: "Community Impact",
          description: "We create meaningful employment opportunities for those who might struggle in traditional job markets. Our innovative barter system allows people to exchange services (like haircuts) for technology, making computing accessible to everyone. We also provide hosting and cloud services for Swiss SMEs who want to keep their data in Switzerland."
        }
      ]
    },
    byTheNumbers: {
      title: "By the Numbers",
      environmentalImpact: [
        {
          number: "5+",
          description: "Years average device lifespan extension through our refurbishment program"
        },
        {
          number: "1000+",
          description: "Devices saved from landfills annually through repair and refurbishment"
        },
        {
          number: "75%",
          description: "Of donated equipment successfully refurbished and given a second life"
        }
      ],
      communityImpact: [
        {
          number: "20+",
          description: "People trained in open source and sustainable technology annually"
        },
        {
          number: "90%",
          description: "Of interns successfully transition to tech careers or further education"
        },
        {
          number: "10+",
          description: "Successful work reintegration cases through our program"
        }
      ]
    },
    ourStory: {
      title: "Our Story",
      content: "Founded in 2009, RevampIT started as a small repair shop with a big vision. What began as a simple idea - extending the life of technology - has grown into a movement that's changing how people think about their devices.\n\nToday, our team of 20 dedicated individuals works together to promote sustainable IT practices. We've become a trusted resource for both individuals and businesses looking to reduce their environmental impact while maintaining access to reliable technology.\n\nOur commitment to sustainability goes beyond just repairing devices. We're actively involved in climate demonstrations, sharing knowledge about sustainable digital alternatives, and working to change the conversation around technology consumption."
    },
    callToAction: {
      title: "Join Our Mission",
      description: "Whether you need a device repaired, want to learn about sustainable computing, or wish to support our cause, we welcome you to be part of our community. Together, we can make technology more sustainable and accessible for everyone.",
      buttonText: "Get Involved"
    }
  };

  try {
    // Create the About page entry
    const entry = await strapi.entityService.create('api::about.about', {
      data: aboutContent,
    });

    console.log('Successfully populated About page content');
    return entry;
  } catch (error) {
    console.error('Error populating content:', error);
  }
}

populateAboutContent(); 