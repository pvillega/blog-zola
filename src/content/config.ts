import { z, defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';

const metadataDefinition = () =>
  z
    .object({
      title: z.string().optional(),
      ignoreTitleTemplate: z.boolean().optional(),

      canonical: z.string().url().optional(),

      robots: z
        .object({
          index: z.boolean().optional(),
          follow: z.boolean().optional(),
        })
        .optional(),

      description: z.string().optional(),

      openGraph: z
        .object({
          url: z.string().optional(),
          siteName: z.string().optional(),
          images: z
            .array(
              z.object({
                url: z.string(),
                width: z.number().optional(),
                height: z.number().optional(),
              })
            )
            .optional(),
          locale: z.string().optional(),
          type: z.string().optional(),
        })
        .optional(),

      twitter: z
        .object({
          handle: z.string().optional(),
          site: z.string().optional(),
          cardType: z.string().optional(),
        })
        .optional(),
    })
    .optional();

const postCollection = defineCollection({
  loader: glob({ pattern: ['*.md', '*.mdx'], base: 'src/data/post' }),
  schema: z.object({
    publishDate: z.date().optional(),
    updateDate: z.date().optional(),
    draft: z.boolean().optional(),

    title: z.string(),
    excerpt: z.string().optional(),
    image: z.string().optional(),

    // Support both single category and categories array
    category: z.string().optional(),
    categories: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional(),
    author: z.string().optional(),

    // Series support
    series: z.string().optional(),
    seriesOrder: z.number().optional(),

    metadata: metadataDefinition(),
  }),
});

// Series collection for series metadata
const seriesCollection = defineCollection({
  loader: glob({ pattern: ['*.md', '*.yaml'], base: 'src/data/series' }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    image: z.string().optional(),
  }),
});

// Services collection for productised services
const servicesCollection = defineCollection({
  loader: glob({ pattern: ['*.md', '*.yaml'], base: 'src/data/services' }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    type: z.enum(['time-based', 'deliverable', 'custom']).optional(),
    price: z.object({
      amount: z.number(),
      currency: z.string().default('EUR'),
    }).optional(),
    duration: z.string().optional(),
    includes: z.array(z.string()).optional(),
    stripeLink: z.string().optional(),
    featured: z.boolean().optional(),
    order: z.number().optional(),
  }),
});

// Projects collection for portfolio
const projectsCollection = defineCollection({
  loader: glob({ pattern: ['*.md', '*.mdx'], base: 'src/data/projects' }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    image: z.string().optional(),
    tags: z.array(z.string()).optional(),
    featured: z.boolean().optional(),
    caseStudy: z.boolean().optional(),
    link: z.string().optional(),
    github: z.string().optional(),
    publishDate: z.date().optional(),
  }),
});

export const collections = {
  post: postCollection,
  series: seriesCollection,
  services: servicesCollection,
  projects: projectsCollection,
};
