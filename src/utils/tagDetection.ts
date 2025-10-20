import { Job } from '../types/job';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * JOB TAG DETECTION SYSTEM
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Automatically categorize jobs by detecting keywords in title/description.
 *
 * Tag categories:
 * - Platforms: Webflow, Shopify, WordPress, etc.
 * - Technologies: React, Node.js, API, etc.
 * - Services: CRO, SEO, E-commerce, etc.
 * - Project Types: Custom App, Website, Portal, etc.
 * - Excluded: Go High Level, Bubble, etc. (for filtering)
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */

export interface TagCategory {
  category: string;
  tags: {
    name: string;
    keywords: string[];
    priority: number; // Higher priority tags appear first
  }[];
}

/**
 * Tag definition with keywords and priority
 */
export const TAG_DEFINITIONS: TagCategory[] = [
  // ═══════════════════════════════════════════════════════════════════════════
  // PLATFORMS (Web builders, CMS, E-commerce)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    category: 'Platform',
    tags: [
      {
        name: 'Webflow',
        keywords: ['webflow', 'webflow site', 'webflow website', 'webflow development'],
        priority: 100,
      },
      {
        name: 'Shopify',
        keywords: ['shopify', 'shopify store', 'shopify site', 'shopify plus', 'shopify development'],
        priority: 90,
      },
      {
        name: 'WordPress',
        keywords: ['wordpress', 'wp', 'wordpress site', 'wordpress theme', 'wordpress plugin'],
        priority: 80,
      },
      {
        name: 'Wix',
        keywords: ['wix', 'wix site', 'wix website'],
        priority: 70,
      },
      {
        name: 'Squarespace',
        keywords: ['squarespace', 'squarespace site'],
        priority: 70,
      },
      {
        name: 'WooCommerce',
        keywords: ['woocommerce', 'woo commerce'],
        priority: 85,
      },
      {
        name: 'Framer',
        keywords: ['framer', 'framer site', 'framer website'],
        priority: 75,
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // EXCLUDED PLATFORMS (Jobs we don't want)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    category: 'Excluded Platform',
    tags: [
      {
        name: 'Go High Level',
        keywords: ['go high level', 'gohighlevel', 'go highlevel', ' ghl ', 'ghl automation'],
        priority: 200, // High priority for filtering
      },
      {
        name: 'Bubble.io',
        keywords: ['bubble.io', 'bubble io', 'bubble app', 'bubble no-code'],
        priority: 200,
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // TECHNOLOGIES (Frontend, Backend, APIs)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    category: 'Technology',
    tags: [
      {
        name: 'React',
        keywords: ['react', 'react.js', 'reactjs', 'react native', 'next.js', 'nextjs'],
        priority: 95,
      },
      {
        name: 'Vue',
        keywords: ['vue', 'vue.js', 'vuejs', 'nuxt'],
        priority: 90,
      },
      {
        name: 'Node.js',
        keywords: ['node', 'node.js', 'nodejs', 'express', 'express.js'],
        priority: 90,
      },
      {
        name: 'Python',
        keywords: ['python', 'django', 'flask', 'fastapi'],
        priority: 85,
      },
      {
        name: 'JavaScript',
        keywords: ['javascript', 'js', 'typescript', 'ts'],
        priority: 80,
      },
      {
        name: 'API',
        keywords: ['api', 'rest api', 'restful api', 'graphql', 'api integration'],
        priority: 88,
      },
      {
        name: 'Database',
        keywords: ['database', 'postgresql', 'postgres', 'mysql', 'mongodb', 'firebase', 'supabase'],
        priority: 82,
      },
      {
        name: 'AWS',
        keywords: ['aws', 'amazon web services', 'ec2', 's3', 'lambda'],
        priority: 78,
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // PROJECT TYPES (What kind of project is this?)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    category: 'Project Type',
    tags: [
      {
        name: 'Custom App',
        keywords: ['custom app', 'web app', 'web application', 'saas', 'platform', 'custom platform'],
        priority: 100,
      },
      {
        name: 'Portal',
        keywords: ['portal', 'client portal', 'dashboard', 'admin panel', 'user portal'],
        priority: 95,
      },
      {
        name: 'E-commerce',
        keywords: ['ecommerce', 'e-commerce', 'online store', 'shop', 'shopping cart'],
        priority: 92,
      },
      {
        name: 'Website',
        keywords: ['website', 'site', 'landing page', 'web page'],
        priority: 70, // Lower priority - most jobs mention this
      },
      {
        name: 'Redesign',
        keywords: ['redesign', 'rebuild', 'revamp', 'refresh', 'modernize'],
        priority: 85,
      },
      {
        name: 'Migration',
        keywords: ['migration', 'migrate', 'move from', 'convert from', 'switch from'],
        priority: 88,
      },
      {
        name: 'Marketplace',
        keywords: ['marketplace', 'multi-vendor', 'vendor platform'],
        priority: 93,
      },
      {
        name: 'CRM',
        keywords: ['crm', 'customer relationship', 'sales pipeline'],
        priority: 87,
      },
      {
        name: 'Booking System',
        keywords: ['booking', 'reservation', 'appointment', 'scheduling'],
        priority: 85,
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SERVICES (What specific service is needed?)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    category: 'Service',
    tags: [
      {
        name: 'CRO',
        keywords: ['cro', 'conversion rate optimization', 'conversion optimization', 'increase conversions'],
        priority: 95,
      },
      {
        name: 'SEO',
        keywords: ['seo', 'search engine optimization', 'organic search', 'google ranking'],
        priority: 90,
      },
      {
        name: 'Performance',
        keywords: ['page speed', 'performance', 'optimization', 'core web vitals', 'loading speed'],
        priority: 88,
      },
      {
        name: 'UI/UX',
        keywords: ['ui/ux', 'user experience', 'user interface', 'ux design', 'ui design'],
        priority: 85,
      },
      {
        name: 'Automation',
        keywords: ['automation', 'automate', 'workflow automation', 'zapier', 'make.com'],
        priority: 92,
      },
      {
        name: 'Integration',
        keywords: ['integration', 'integrate', 'third-party', '3rd party', 'api integration'],
        priority: 90,
      },
      {
        name: 'Analytics',
        keywords: ['analytics', 'tracking', 'google analytics', 'data tracking', 'metrics'],
        priority: 80,
      },
      {
        name: 'Payment',
        keywords: ['payment', 'stripe', 'paypal', 'checkout', 'payment gateway'],
        priority: 87,
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // FEATURES (Specific features mentioned)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    category: 'Feature',
    tags: [
      {
        name: 'Authentication',
        keywords: ['authentication', 'auth', 'login', 'sign up', 'user accounts'],
        priority: 85,
      },
      {
        name: 'CMS',
        keywords: ['cms', 'content management', 'blog', 'dynamic content'],
        priority: 82,
      },
      {
        name: 'Search',
        keywords: ['search', 'search functionality', 'filters', 'filtering'],
        priority: 78,
      },
      {
        name: 'Real-time',
        keywords: ['real-time', 'realtime', 'live updates', 'websocket'],
        priority: 90,
      },
      {
        name: 'Multi-language',
        keywords: ['multi-language', 'multilingual', 'internationalization', 'i18n'],
        priority: 80,
      },
      {
        name: 'Responsive',
        keywords: ['responsive', 'mobile-friendly', 'mobile responsive'],
        priority: 75,
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // INDUSTRY (What industry is this for?)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    category: 'Industry',
    tags: [
      {
        name: 'SaaS',
        keywords: ['saas', 'software as a service', 'saas startup', 'saas platform'],
        priority: 95,
      },
      {
        name: 'Fintech',
        keywords: ['fintech', 'financial', 'finance', 'banking'],
        priority: 92,
      },
      {
        name: 'Healthcare',
        keywords: ['healthcare', 'health', 'medical', 'telemedicine'],
        priority: 88,
      },
      {
        name: 'Real Estate',
        keywords: ['real estate', 'property', 'listings'],
        priority: 85,
      },
      {
        name: 'Education',
        keywords: ['education', 'learning', 'course', 'edtech'],
        priority: 85,
      },
      {
        name: 'Nonprofit',
        keywords: ['nonprofit', 'non-profit', 'charity', 'ngo'],
        priority: 80,
      },
    ],
  },
];

/**
 * Detect tags for a job based on title and description
 */
export function detectJobTags(job: Partial<Job>): string[] {
  const text = `${job.title || ''} ${job.description || ''}`.toLowerCase();
  const detectedTagsByCategory = new Map<string, { name: string; priority: number }[]>();

  // Check each tag definition and group by category
  for (const category of TAG_DEFINITIONS) {
    const categoryTags: { name: string; priority: number }[] = [];

    for (const tag of category.tags) {
      // Check if any keyword matches
      const hasMatch = tag.keywords.some(keyword => {
        // Handle space-wrapped keywords (like " ghl ")
        if (keyword.startsWith(' ') && keyword.endsWith(' ')) {
          return text.includes(keyword);
        }
        return text.includes(keyword.toLowerCase());
      });

      if (hasMatch) {
        categoryTags.push({ name: tag.name, priority: tag.priority });
      }
    }

    if (categoryTags.length > 0) {
      detectedTagsByCategory.set(category.category, categoryTags);
    }
  }

  // Collect all detected tags across all categories
  const allTags: { name: string; priority: number; category: string }[] = [];

  for (const [categoryName, tags] of detectedTagsByCategory.entries()) {
    // Sort tags by priority within each category (highest first)
    const sortedTags = tags.sort((a, b) => b.priority - a.priority);

    // Add category to each tag for filtering logic
    allTags.push(...sortedTags.map(t => ({ ...t, category: categoryName })));
  }

  // Sort all tags by priority (highest first)
  allTags.sort((a, b) => b.priority - a.priority);

  // LIMIT TO MAX 2 TAGS TOTAL
  // Prioritize Project Type and Platform tags, exclude generic "Website"
  const filtered = allTags.filter(t => {
    // Exclude generic "Website" tag if we have more specific tags
    if (t.name === 'Website') {
      const hasSpecificProjectType = allTags.some(other =>
        other.category === 'Project Type' && other.name !== 'Website' && other.priority > 70
      );
      return !hasSpecificProjectType;
    }
    return true;
  });

  // Take top 2 tags overall
  return filtered
    .slice(0, 2)
    .map(t => t.name);
}

/**
 * Get tags by category
 */
export function getTagsByCategory(tags: string[]): Map<string, string[]> {
  const tagsByCategory = new Map<string, string[]>();

  for (const category of TAG_DEFINITIONS) {
    const categoryTags = tags.filter(tag =>
      category.tags.some(t => t.name === tag)
    );

    if (categoryTags.length > 0) {
      tagsByCategory.set(category.category, categoryTags);
    }
  }

  return tagsByCategory;
}

/**
 * Check if job has any excluded platform tags
 */
export function hasExcludedPlatformTag(tags: string[]): boolean {
  const excludedCategory = TAG_DEFINITIONS.find(c => c.category === 'Excluded Platform');
  if (!excludedCategory) return false;

  const excludedTagNames = excludedCategory.tags.map(t => t.name);
  return tags.some(tag => excludedTagNames.includes(tag));
}

/**
 * Get all available tags (for filtering UI)
 */
export function getAllTags(): { category: string; tags: string[] }[] {
  return TAG_DEFINITIONS.map(category => ({
    category: category.category,
    tags: category.tags.map(t => t.name),
  }));
}
