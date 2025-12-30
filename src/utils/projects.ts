import { getCollection, render } from 'astro:content';
import type { CollectionEntry } from 'astro:content';
import type { Project } from '~/types';
import { cleanSlug } from './permalinks';

const getNormalizedProject = async (project: CollectionEntry<'projects'>): Promise<Project> => {
  const { id, data } = project;
  const { Content } = await render(project);

  const {
    title,
    description,
    image,
    tags: rawTags = [],
    featured = false,
    caseStudy = false,
    link,
    github,
    publishDate = new Date(),
  } = data;

  const slug = cleanSlug(id);

  const tags = rawTags.map((tag: string) => ({
    slug: cleanSlug(tag),
    title: tag,
  }));

  return {
    id: id,
    slug: slug,
    title: title,
    description: description,
    image: image,
    tags: tags,
    featured: featured,
    caseStudy: caseStudy,
    link: link,
    github: github,
    publishDate: publishDate,
    Content: Content,
  };
};

const load = async function (): Promise<Array<Project>> {
  const projects = await getCollection('projects');
  const normalizedProjects = projects.map(async (project) => await getNormalizedProject(project));

  const results = (await Promise.all(normalizedProjects))
    .sort((a, b) => b.publishDate.valueOf() - a.publishDate.valueOf());

  return results;
};

let _projects: Array<Project>;

/** Fetch all projects */
export const fetchProjects = async (): Promise<Array<Project>> => {
  if (!_projects) {
    _projects = await load();
  }

  return _projects;
};

/** Find projects by slugs */
export const findProjectsBySlugs = async (slugs: Array<string>): Promise<Array<Project>> => {
  if (!Array.isArray(slugs)) return [];

  const projects = await fetchProjects();

  return slugs.reduce(function (r: Array<Project>, slug: string) {
    projects.some(function (project: Project) {
      return slug === project.slug && r.push(project);
    });
    return r;
  }, []);
};

/** Get featured projects */
export const getFeaturedProjects = async (): Promise<Array<Project>> => {
  const projects = await fetchProjects();
  return projects.filter((project) => project.featured);
};

/** Get projects by tag */
export const getProjectsByTag = async (tagSlug: string): Promise<Array<Project>> => {
  const projects = await fetchProjects();
  return projects.filter((project) =>
    Array.isArray(project.tags) && project.tags.find((tag) => tag.slug === tagSlug)
  );
};

/** Get all unique tags from projects */
export const getAllProjectTags = async (): Promise<Array<{ slug: string; title: string; count: number }>> => {
  const projects = await fetchProjects();
  const tagMap = new Map<string, { slug: string; title: string; count: number }>();

  projects.forEach((project) => {
    if (Array.isArray(project.tags)) {
      project.tags.forEach((tag) => {
        const existing = tagMap.get(tag.slug);
        if (existing) {
          existing.count++;
        } else {
          tagMap.set(tag.slug, { ...tag, count: 1 });
        }
      });
    }
  });

  return Array.from(tagMap.values()).sort((a, b) => b.count - a.count);
};

/** Get static paths for project detail pages */
export const getStaticPathsProjects = async () => {
  return (await fetchProjects()).flatMap((project) => ({
    params: {
      slug: project.slug,
    },
    props: { project },
  }));
};

/** Get related projects based on tags */
export async function getRelatedProjects(originalProject: Project, maxResults: number = 3): Promise<Project[]> {
  const allProjects = await fetchProjects();
  const originalTagsSet = new Set(originalProject.tags ? originalProject.tags.map((tag) => tag.slug) : []);

  const projectsWithScores = allProjects.reduce((acc: { project: Project; score: number }[], iteratedProject: Project) => {
    if (iteratedProject.slug === originalProject.slug) return acc;

    let score = 0;

    if (iteratedProject.tags) {
      iteratedProject.tags.forEach((tag) => {
        if (originalTagsSet.has(tag.slug)) {
          score += 1;
        }
      });
    }

    acc.push({ project: iteratedProject, score });
    return acc;
  }, []);

  projectsWithScores.sort((a, b) => b.score - a.score);

  const selectedProjects: Project[] = [];
  let i = 0;
  while (selectedProjects.length < maxResults && i < projectsWithScores.length) {
    if (projectsWithScores[i].score > 0) {
      selectedProjects.push(projectsWithScores[i].project);
    }
    i++;
  }

  return selectedProjects;
}
