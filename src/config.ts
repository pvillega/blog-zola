export const SITE = {
  website: "https://perevillega.com/",
  author: "Pere Villega",
  profile: "https://perevillega.com/",
  desc: "Pere Villega's blog",
  title: "Pere Villega",
  ogImage: "social_cards/index.png",
  lightAndDarkMode: true,
  postPerIndex: 5,
  postPerPage: 5,
  scheduledPostMargin: 15 * 60 * 1000, // 15 minutes
  showArchives: false,
  showBackButton: true,
  editPost: {
    enabled: false,
    text: "Edit page",
    url: "",
  },
  dynamicOgImage: true,
  dir: "ltr",
  lang: "en",
  timezone: "Europe/Zurich",
} as const;
