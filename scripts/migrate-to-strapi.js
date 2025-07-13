#!/usr/bin/env node

/**
 * Strapi Content Migration Script
 * Migrates existing static page content to Strapi CMS
 * 
 * Usage: node scripts/migrate-to-strapi.js
 * Make sure Strapi is running and API permissions are enabled first.
 */

const fs = require('fs');
const path = require('path');

const STRAPI_URL = 'http://localhost:1337';
const API_TOKEN = '227ebe6baa2cc5cd5e469e27c4d17ba9f4a2580bd163c724cd6bf515bacbfa8350b6f7c1487b15abfdea94d5518ea2bb41faf9bf18111a6b9192485748a451364199163bb79b3ead8e96d839d33a2a44bc1a395cf0beb71f2d07369a9bacd99c53f0beb031beea8f331b99073896e22a275a604f82fdcde1e3588f757b0d3145';

async function strapiRequest(endpoint, method = 'GET', data = null) {
  const url = `${STRAPI_URL}/api${endpoint}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_TOKEN}`
    }
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status} - ${await response.text()}`);
  }
  return response.json();
}

// Static pages content extracted from your React components
const staticPages = [
  {
    title: 'Home Page', 
    slug: 'home',
    page_key: 'home',
    content: `# Giving Technology a Second Life

We refurbish, recycle, and redistribute technology to create a more sustainable future. Join us in our mission to reduce electronic waste and make technology accessible to everyone.

## Our Mission
Empowering Communities Through Sustainable Technology

We're committed to reducing electronic waste and making technology accessible to everyone.

### Features

**Sustainable Solutions**
We provide eco-friendly technology solutions that help reduce electronic waste.

**Community Driven**
Join our community of volunteers and make a difference in the world.

**Circular Economy**
We believe in giving technology a second life through refurbishment and recycling.

**Open Source**
We embrace open source principles, sharing knowledge and solutions with the community.

## Ready to make a difference?

Join our community of volunteers and help us create a more sustainable future through technology.`,
    excerpt: 'We refurbish, recycle, and redistribute technology to create a more sustainable future.',
    page_type: 'general',
    seo_title: 'RevampIT - Giving Technology a Second Life',
    seo_description: 'We refurbish, recycle, and redistribute technology to create a more sustainable future. Join us in reducing electronic waste.',
    show_in_navigation: true
  },
  {
    title: 'About Us',
    slug: 'about',
    page_key: 'about',
    content: `# Extending the Life of Technology

For 15 years, we've been fighting against the premature retirement of computers and promoting sustainable IT practices.

## Our Mission

At RevampIT, we believe in "Retirement Age 10 for Laptops!" We're a non-profit organization that has been transforming the way people think about technology since 2009. Our mission is simple but powerful: extend the life of IT devices and reduce electronic waste through repair, refurbishment, and sustainable practices.

Operating from our unique space in a former bank building, we've created a community hub where technology meets sustainability. Our approach combines hardware recycling with open-source software solutions, creating a holistic approach to sustainable computing that benefits both people and the planet.

## Our Impact

### Hardware Recycling
We repair and refurbish IT devices of all ages, giving them a second life and reducing electronic waste. From 11-year-old MacBooks to vintage computers, we believe every device deserves a chance to continue serving its purpose.

### Open Source Software
We're strong advocates for Linux and other open-source solutions. These technologies not only keep older devices running efficiently but also provide security advantages by giving users control over their systems.

### Community Impact
We create meaningful employment opportunities for those who might struggle in traditional job markets. Our innovative barter system allows people to exchange services for technology, making computing accessible to everyone.

## By the Numbers

### Environmental Impact
- **5+ years** average device lifespan extension
- **1000+ devices** saved from landfills annually  
- **75%** of donated equipment successfully refurbished

### Community Impact
- **20+ people** trained in sustainable technology annually
- **90%** of interns transition to tech careers
- **10+ successful** work reintegration cases

## Our Story

Founded in 2009, RevampIT started as a small repair shop with a big vision. What began as a simple idea - extending the life of technology - has grown into a movement that's changing how people think about their devices.

Today, our team of 20 dedicated individuals works together to promote sustainable IT practices. We've become a trusted resource for both individuals and businesses looking to reduce their environmental impact while maintaining access to reliable technology.`,
    excerpt: 'Learn about our 15-year mission to extend the life of IT devices and promote sustainable computing practices.',
    page_type: 'about',
    seo_title: 'About Us - RevampIT',
    seo_description: 'Learn about our mission to extend the life of IT devices and promote sustainable computing practices.',
    show_in_navigation: true
  }
];

async function migrateStaticPages() {
  console.log('🚀 Starting migration of static pages to Strapi...');
  
  for (const page of staticPages) {
    try {
      console.log(`📝 Creating static page: ${page.title}`);
      
      const result = await strapiRequest('/static-pages', 'POST', {
        data: page
      });
      
      console.log(`✅ Successfully created: ${page.slug} (ID: ${result.data.id})`);
    } catch (error) {
      console.error(`❌ Failed to create ${page.slug}:`, error.message);
    }
  }
}

async function createSampleBlogPosts() {
  console.log('📰 Creating sample blog posts...');
  
  const blogPosts = [
    {
      title: 'Welcome to Our New Blog',
      slug: 'welcome-to-our-new-blog',
      content: `# Welcome to Our New Blog

We're excited to launch our new blog where we'll share insights about sustainable technology, repair guides, and community stories.

## What to Expect

- Technical tutorials and repair guides
- Stories from our community members
- Updates on our sustainability initiatives
- Open source project announcements

Stay tuned for more content!`,
      excerpt: 'We\'re launching our new blog to share insights about sustainable technology and community stories.',
      status: 'published',
      published_at: new Date().toISOString(),
      view_count: 0
    },
    {
      title: 'How to Extend Your Laptop\'s Life by 5 Years',
      slug: 'extend-laptop-life-five-years',
      content: `# How to Extend Your Laptop's Life by 5 Years

Learn practical tips to keep your laptop running smoothly for years longer than expected.

## Key Maintenance Tips

1. **Keep it clean** - Regular cleaning prevents overheating
2. **Manage storage** - Keep 20% of your disk free
3. **Update regularly** - Security and performance improvements
4. **Use Linux** - Breathe new life into older hardware

## Battery Care

- Avoid extreme temperatures
- Don't let it fully discharge regularly
- Consider battery replacement after 3-4 years

Following these tips can easily add 5+ years to your laptop's useful life!`,
      excerpt: 'Learn practical tips to keep your laptop running smoothly for years longer than expected.',
      status: 'published',
      published_at: new Date().toISOString(),
      view_count: 0
    }
  ];

  for (const post of blogPosts) {
    try {
      console.log(`📝 Creating blog post: ${post.title}`);
      
      const result = await strapiRequest('/blog-posts', 'POST', {
        data: post
      });
      
      console.log(`✅ Successfully created blog post: ${post.slug} (ID: ${result.data.id})`);
    } catch (error) {
      console.error(`❌ Failed to create blog post ${post.slug}:`, error.message);
    }
  }
}

async function main() {
  try {
    // Test connection
    console.log('🔍 Testing Strapi connection...');
    await strapiRequest('/static-pages');
    console.log('✅ Connected to Strapi successfully!');
    
    await migrateStaticPages();
    await createSampleBlogPosts();
    
    console.log('\n🎉 Migration completed successfully!');
    console.log('👉 You can now edit your content at: http://localhost:1337/admin');
    
  } catch (error) {
    console.error('💥 Migration failed:', error.message);
    process.exit(1);
  }
}

main();