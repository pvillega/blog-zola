// Mock for astrowind:config virtual module used in tests
export const I18N = {
  language: 'en',
  textDirection: 'ltr',
};

export const SITE = {
  name: 'Pere Villega',
  site: 'https://perevillega.com',
  base: '/',
  trailingSlash: false,
};

export const METADATA = {
  title: {
    default: 'Pere Villega',
    template: '%s — Pere Villega',
  },
  description: 'Principal Engineer & Technical Consultant. Software Engineering, Architecture, and Freelance Services.',
};

export const APP_BLOG = {
  isEnabled: true,
  postsPerPage: 10,
};

export const UI = {
  theme: 'system',
};
