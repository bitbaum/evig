# Revamp-it Website Blueprint – Version 2 (English)

## Overall Vision

Our website will spotlight what we do best—by keeping things simple, engaging, and mission-driven:

- **Repair Hardware:** We extend the life of devices by fixing and modifying them.
- **Accept & Process Donations:** We welcome donated hardware for repair, resale, or donation to those in need.
- **Linux & Open Source Installations:** Older machines get a new lease on life with optimized Linux installations.
- **Sell Refurbished Devices:** Our webshop offers affordable, quality-refurbished hardware.
- **Secure Recycling:** When hardware can't be reused, we recycle it safely and securely.
- **Host Workshops:** We offer hands-on workshops on Linux, open source, Bitcoin, and AI to empower our community.

Our mission is clear: to empower communities and reduce e-waste through sustainable IT—all in a modern, easy-to-navigate experience.

## Site Architecture and Navigation

The main navigation bar will include:
1. **Home**
2. **About Us**
3. **Offerings** – This covers service details (IT repairs, Linux & open source support, workshops, consulting)
4. **Projects** – Highlighting our key initiatives (Kivitendo, Linuxola, etc.)
5. **Wiki** – Detailed guides, FAQs, technical documentation
6. **Volunteer & Donate** – Information on how to get involved
7. **Webshop** – External link to the current Joomla/Kivitendo webshop.
8. **Terms & Conditions (AGB)**

## Page-by-Page Content and Structure

### 1. Home Page

**Purpose:**  
Immediate orientation and engagement. Convey our mission and drive users toward taking action.

**Content Sections:**
- **Hero Area:**  
  - Engaging full-width banner with high-quality imagery of recycled hardware or community events.
  - Strong headline: "Revamp-it: Sustainable IT for a Better Future."
  - Subheadline briefly explaining our mission.
  - Prominent CTAs: "Learn More", "Volunteer/Donate", and "Shop" (external link).

- **Quick Overview of Services:**  
  - Use icon-based cards summarizing key offerings: Hardware Recycling, Linux Support, Workshops, Consulting.
  - Each card links to the Offerings page for detailed information.

- **Impact & Testimonials:**  
  - Present data points and testimonials from partners/customers to build trust.
  
- **Latest News/Blog Snippet:**  
  - A preview of recent blog posts or announcements, with a "Read More" link.

### 2. About Us Page

**Purpose:**  
Build trust by sharing Revamp-it's story, mission, and the faces behind the organization.

**Content Sections:**
- **Our Story:**  
  - Narrative description of our founding, history, and evolution.
  
- **Mission & Values:**  
  - Clearly describe our commitment to sustainability, community service, and open source.
  - Bullet points of core values.

- **Team Profiles:**  
  - Photos and bios of key team members.

### 3. Offerings Page

**Purpose:**  
Provide detailed information about our services and encourage user engagement.

**Content Sections:**
- **Introduction:**  
  - A brief overview of our service philosophy.

- **Service Details:**  
  Each service is described in its own section or card:
  - **Hardware Recycling & Repairs**
  - **Linux & Open Source Support**
  - **Workshops & Courses**
  - **Consulting & Web Services**
  
- **Call-to-Action:**  
  - Encourage visitors to contact us for more details.

### 4. Projects Page

**Purpose:**  
Showcase current and past projects, emphasizing impact and innovation.

**Content Sections:**
- **Overview:**  
  - Short intro explaining how projects drive our mission.
  
- **Featured Projects:**  
  - **Kivitendo Modus CH**
  - **Linuxola**
  - **FreieComputer**
  - **Pilot Projects**

### 5. Wiki Page

**Purpose:**  
Serve as a repository of detailed documentation, troubleshooting guides, and technical resources.

**Content Sections:**
- **Content Organization:**  
  - Categorize content into sections like User Guides, Developer Docs, and FAQs.
  
- **Detailed Articles:**  
  - Each article should include a summary, detailed instructions, and media.

### 6. Volunteer & Donate Page

**Purpose:**  
Encourage community involvement by making it easy to donate or become a volunteer.

**Content Sections:**
- **Call-to-Action:**  
  - Prominent messaging: "Make a Difference Today."
  
- **Donation Options:**  
  - Information on how to donate.
  
- **Volunteer Opportunities:**  
  - Describe volunteer roles and how to apply.
  
- **Impact Stories:**  
  - Testimonials and case studies.

### 7. Webshop (External Link to Kivitendo/Joomla)

**Purpose:**  
Provide a simple link to the current Joomla/Kivitendo system for e-commerce transactions. The integration of an on-site webshop with MedusaJS is planned for a future phase.
  
**Implementation (Current Phase):**  
- In the main navigation and/or footer, include a button labeled "Shop" that points to the URL of the current Kivitendo/Joomla webshop.
- A brief note may be added on the site or on the linked webshop indicating future plans for an integrated solution.

### 8. Terms & Conditions (AGB) Page

**Purpose:**  
Display all legal and transactional details.

**Content Sections:**
- **Full Legal Text:**  
  - Include detailed AGB text.
- **FAQs and Contact Info:**  
  - Provide instructions for obtaining additional support.

## Design & Technology Decisions

1. **Modern Frontend (Next.js/React/TypeScript):**  
   - Build all pages as React components with TypeScript.
   - Utilize Next.js for performance, SEO benefits, and API route capabilities to interact with backends.

2. **Tailwind CSS for Styling:**  
   - Use Tailwind for consistent, responsive design.
   - Custom theming to match Revamp-it's branding.

3. **Headless CMS for Content Management (Strapi):**  
   - Integrate with Strapi (headless CMS) for all website content (pages, workshops, blog, etc.).
   - Strapi will provide a user-friendly interface for non-developers to update content across multiple languages.

4. **Headless E-commerce Platform (MedusaJS - Future Phase):**
   - Implementation of MedusaJS as the backend for all e-commerce functionalities is planned for a future phase, at which point it will replace the external webshop link.

5. **Modular Architecture:**  
   - Clearly separate API interactions (with Strapi), frontend components, pages, and styles. MedusaJS integration will follow this pattern in the future.
   - Follow best practices for state management.

6. **Focus on UX/UI:**  
   - Implement accessibility best practices.
   - Ensure responsive layouts for all devices.

7. **Localization Support (Strapi & Next.js i18n):**  
   - Utilize Strapi's robust internationalization features for managing content in German, English, French, and Italian.
   - Next.js i18n will handle routing and locale detection, with the frontend fetching appropriately localized content from Strapi.

## Next Steps (Initial Focus)

1. **Set Up Project Environment:**  
   - Initialize Next.js project with TypeScript.
   - Configure Tailwind CSS and other dependencies.

2. **Backend Setup (Strapi):**
   - Install and configure Strapi for content management. Define content types and localization for all planned languages.

3. **Develop Core Components & Layouts:**  
   - Create reusable UI components for Next.js.
   - Implement responsive master layouts.

4. **Content Migration to Strapi:**  
   - Plan and execute migration of existing website content into Strapi.

5. **Frontend Development & Strapi Integration:**
   - Develop Next.js pages, fetching data from Strapi for content.
   - Implement the language switching mechanism.
   - Ensure the external webshop link is correctly placed and functional.

6. **Testing & Deployment (Initial Site):**  
   - Implement testing strategy for the content site.
   - Set up CI/CD pipeline and deploy the initial Strapi-powered multilingual site.

**(Future Phase) Next Steps for MedusaJS Integration:**
- Detailed planning for MedusaJS setup and configuration.
- Plan and execute migration of product data from Kivitendo/Joomla into MedusaJS.
- Develop Next.js frontend components and pages for the integrated webshop.
- Integrate MedusaJS with payment gateways and other necessary e-commerce services.
- Rigorous testing of the e-commerce platform before going live.

---

*End of Blueprint* 