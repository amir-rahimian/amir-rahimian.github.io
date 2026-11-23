const dataDirectory = new URL("../data/", import.meta.url);
const supportedLanguages = new Set(["en", "fa"]);
const localeCache = new Map();
let sharedDataPromise;

async function fetchJson(filename) {
  const response = await fetch(new URL(filename, dataDirectory));
  if (!response.ok) {
    throw new Error(`Failed to load ${filename}: ${response.status}`);
  }

  return response.json();
}

function loadSharedData() {
  if (!sharedDataPromise) {
    sharedDataPromise = fetchJson("common.json").catch((error) => {
      sharedDataPromise = null;
      throw error;
    });
  }

  return sharedDataPromise;
}

function loadLocaleData(language) {
  if (!supportedLanguages.has(language)) {
    throw new Error(`Unsupported portfolio language: ${language}`);
  }

  if (!localeCache.has(language)) {
    const localePromise = fetchJson(`${language}.json`).catch((error) => {
      localeCache.delete(language);
      throw error;
    });
    localeCache.set(language, localePromise);
  }

  return localeCache.get(language);
}

export async function loadPortfolioData(language) {
  const [shared, localized] = await Promise.all([
    loadSharedData(),
    loadLocaleData(language),
  ]);

  return {
    ...localized,
    site: { ...localized.site, ...shared.profile },
    stack: shared.stack,
    resumeSizes: shared.resumeSizes,
    contactIcons: shared.contactIcons,
    projectGalleries: shared.projectGalleries,
  };
}
