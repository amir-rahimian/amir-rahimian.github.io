import { loadPortfolioData } from "./portfolio-data.js";

document.addEventListener("DOMContentLoaded", initApp);

const state = {
  data: null,
  lang: "fa",
  languageRequestId: 0,
  sectionObserver: null,
  revealObserver: null,
  scrollHandler: null,
  resizeHandler: null,
  lightbox: { images: [], index: 0, opener: null, title: "" },
};

async function initApp() {
  try {
    bindLanguageSwitcher();
    bindNavigationMenu();
    bindResumeMenu();
    bindContactForm();
    bindProjectGalleries();
    bindProjectLightbox();

    await setLanguage(getInitialLanguage());
  } catch (error) {
    console.error("Portfolio initialization failed:", error);
  }
}

function getInitialLanguage() {
  let savedLanguage;
  try {
    savedLanguage = localStorage.getItem("preferredLang");
  } catch (error) {
    console.warn("Could not read the saved language preference:", error);
  }

  if (savedLanguage === "fa" || savedLanguage === "en") {
    return savedLanguage;
  }

  const browserLanguage = navigator.language || "en";
  return browserLanguage.toLowerCase().startsWith("fa") ? "fa" : "en";
}

function bindLanguageSwitcher() {
  document.querySelectorAll(".lang-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const lang = button.dataset.lang;
      if (lang && lang !== state.lang) {
        setLanguage(lang).catch((error) => {
          console.error("Portfolio language switch failed:", error);
        });
      }
    });
  });
}

function bindNavigationMenu() {
  const menuButton = document.getElementById("menu-toggle");
  const navigation = document.getElementById("nav-links");
  if (!menuButton || !navigation) {
    return;
  }

  const setMenuOpen = (isOpen) => {
    document.getElementById("navbar")?.classList.toggle("menu-open", isOpen);
    menuButton.setAttribute("aria-expanded", String(isOpen));
    menuButton.setAttribute("aria-label", getNavigationMenuLabel(isOpen));
  };

  setMenuOpen(false);

  menuButton.addEventListener("click", () => {
    setMenuOpen(menuButton.getAttribute("aria-expanded") !== "true");
  });

  navigation.addEventListener("click", (event) => {
    if (event.target.closest(".nav-link")) {
      setMenuOpen(false);
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && menuButton.getAttribute("aria-expanded") === "true") {
      setMenuOpen(false);
      menuButton.focus();
    }
  });

  window.matchMedia("(min-width: 961px)").addEventListener("change", (event) => {
    if (event.matches) {
      setMenuOpen(false);
    }
  });
}

function bindResumeMenu() {
  const menu = document.getElementById("resume-menu");
  if (!menu) {
    return;
  }

  document.addEventListener("click", (event) => {
    if (!(event.target instanceof Element)) {
      return;
    }

    if (event.target.closest(".resume-link")) {
      menu.open = false;
    } else if (!menu.contains(event.target)) {
      menu.open = false;
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && menu.open) {
      menu.open = false;
      menu.querySelector("summary")?.focus();
    }
  });
}

function getNavigationMenuLabel(isOpen) {
  if (state.lang === "fa") {
    return isOpen ? "بستن فهرست" : "باز کردن فهرست";
  }

  return isOpen ? "Close navigation" : "Open navigation";
}

function bindProjectGalleries() {
  document.addEventListener("click", (event) => {
    if (!(event.target instanceof Element)) {
      return;
    }

    const zoom = event.target.closest("[data-gallery-zoom]");
    if (zoom) {
      const zoomGallery = zoom.closest("[data-project-gallery]");
      if (zoomGallery) {
        openProjectLightbox(zoomGallery);
      }
      return;
    }

    const control = event.target.closest("[data-gallery-step], [data-gallery-index]");
    const gallery = control?.closest("[data-project-gallery]");
    if (!control || !gallery) {
      return;
    }

    const images = [...gallery.querySelectorAll("[data-gallery-index]")];
    if (!images.length) {
      return;
    }

    const currentIndex = images.findIndex((image) => image.getAttribute("aria-pressed") === "true");
    const requestedIndex = control.hasAttribute("data-gallery-step")
      ? currentIndex + Number(control.dataset.galleryStep)
      : Number(control.dataset.galleryIndex);
    const nextIndex = (requestedIndex + images.length) % images.length;
    const selected = images[nextIndex];
    const mainImage = gallery.querySelector("[data-gallery-main]");
    const counter = gallery.querySelector("[data-gallery-counter]");

    if (!mainImage || !selected) {
      return;
    }

    mainImage.src = selected.dataset.src;
    mainImage.alt = selected.dataset.alt || "";
    mainImage.classList.remove("is-swapping");
    void mainImage.offsetWidth;
    mainImage.classList.add("is-swapping");
    images.forEach((image, index) => {
      const isSelected = index === nextIndex;
      image.setAttribute("aria-pressed", String(isSelected));
      image.classList.toggle("is-active", isSelected);
    });
    if (counter) {
      counter.textContent = `${nextIndex + 1} / ${images.length}`;
    }
  });
}

function bindProjectLightbox() {
  const overlay = document.getElementById("project-lightbox");
  if (!overlay) {
    return;
  }

  overlay.addEventListener("click", (event) => {
    if (!(event.target instanceof Element)) {
      return;
    }

    if (event.target === overlay || event.target.closest("[data-lightbox-close]")) {
      closeProjectLightbox();
      return;
    }

    const step = event.target.closest("[data-lightbox-step]");
    if (step) {
      stepProjectLightbox(Number(step.dataset.lightboxStep));
    }
  });

  document.addEventListener("keydown", (event) => {
    if (overlay.hidden) {
      return;
    }

    if (event.key === "Escape") {
      closeProjectLightbox();
    } else if (event.key === "ArrowRight") {
      stepProjectLightbox(1);
    } else if (event.key === "ArrowLeft") {
      stepProjectLightbox(-1);
    }
  });
}

function openProjectLightbox(gallery) {
  const overlay = document.getElementById("project-lightbox");
  const thumbnails = [...gallery.querySelectorAll("[data-gallery-index]")];
  if (!overlay || !thumbnails.length) {
    return;
  }

  state.lightbox.images = thumbnails.map((thumb) => ({
    src: thumb.dataset.src,
    alt: thumb.dataset.alt || "",
  }));
  state.lightbox.title =
    gallery.closest(".project-card")?.querySelector("h3")?.textContent.trim() || "";
  state.lightbox.opener = gallery.querySelector("[data-gallery-zoom]");

  const activeIndex = thumbnails.findIndex(
    (thumb) => thumb.getAttribute("aria-pressed") === "true"
  );
  setProjectLightboxIndex(activeIndex >= 0 ? activeIndex : 0);

  overlay.querySelector("[data-lightbox-close]")?.setAttribute(
    "aria-label",
    state.lang === "fa" ? "بستن" : "Close"
  );
  overlay.querySelector('[data-lightbox-step="-1"]')?.setAttribute(
    "aria-label",
    state.lang === "fa" ? "تصویر قبلی" : "Previous image"
  );
  overlay.querySelector('[data-lightbox-step="1"]')?.setAttribute(
    "aria-label",
    state.lang === "fa" ? "تصویر بعدی" : "Next image"
  );

  overlay.hidden = false;
  document.body.classList.add("lightbox-open");
  overlay.querySelector("[data-lightbox-close]")?.focus();
}

function setProjectLightboxIndex(index) {
  const { images } = state.lightbox;
  if (!images.length) {
    return;
  }

  const nextIndex = ((index % images.length) + images.length) % images.length;
  state.lightbox.index = nextIndex;
  const image = images[nextIndex];
  const preview = document.getElementById("lightbox-image");
  const caption = document.getElementById("lightbox-caption");

  if (preview) {
    preview.src = image.src;
    preview.alt = image.alt;
  }
  if (caption) {
    caption.textContent = `${state.lightbox.title} · ${nextIndex + 1} / ${images.length}`;
  }
}

function stepProjectLightbox(step) {
  if (!state.lightbox.images.length) {
    return;
  }

  setProjectLightboxIndex(state.lightbox.index + step);
}

function closeProjectLightbox() {
  const overlay = document.getElementById("project-lightbox");
  if (!overlay || overlay.hidden) {
    return;
  }

  overlay.hidden = true;
  document.body.classList.remove("lightbox-open");
  state.lightbox.opener?.focus();
  state.lightbox.images = [];
  state.lightbox.opener = null;
}

function bindContactForm() {
  const form = document.getElementById("contactForm");
  if (!form) {
    return;
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    if (!state.data) {
      return;
    }

    const name = document.getElementById("name")?.value.trim() || "";
    const email = document.getElementById("email")?.value.trim() || "";
    const message = document.getElementById("message")?.value.trim() || "";
    const subject =
      state.lang === "fa"
        ? `درخواست همکاری از ${name || "وب سایت"}`
        : `Portfolio Contact from ${name || "Website"}`;
    const body =
      state.lang === "fa"
        ? `نام: ${name}\nایمیل: ${email}\n\n${message}`
        : `Name: ${name}\nEmail: ${email}\n\n${message}`;

    window.location.href = `mailto:${state.data.site.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  });
}

async function setLanguage(lang) {
  if (state.data && lang === state.lang) {
    return;
  }

  const requestId = ++state.languageRequestId;
  const data = await loadPortfolioData(lang);
  if (requestId !== state.languageRequestId) {
    return;
  }

  state.data = data;
  state.lang = lang;
  const direction = state.lang === "fa" ? "rtl" : "ltr";

  closeProjectLightbox();

  document.documentElement.lang = state.lang;
  document.documentElement.dir = direction;
  document.body.setAttribute("dir", direction);
  const skipLink = document.querySelector(".skip-link");
  if (skipLink) {
    skipLink.textContent = state.lang === "fa" ? "رفتن به محتوای اصلی" : "Skip to content";
  }
  const menuButton = document.getElementById("menu-toggle");
  if (menuButton) {
    menuButton.setAttribute(
      "aria-label",
      getNavigationMenuLabel(menuButton.getAttribute("aria-expanded") === "true")
    );
  }
  try {
    localStorage.setItem("preferredLang", state.lang);
  } catch (error) {
    console.warn("Could not save the language preference:", error);
  }

  document.querySelectorAll(".lang-btn").forEach((button) => {
    button.classList.toggle("active", button.dataset.lang === state.lang);
    button.setAttribute("aria-pressed", String(button.dataset.lang === state.lang));
  });

  renderPage();
}

function renderPage() {
  renderMeta();
  renderBrand();
  renderNavigation();
  renderHero();
  renderSidebar();
  renderEducation();
  renderEmployment();
  renderProjects();
  renderContact();
  renderFooter();
  renderPersonSchema();
  initSectionObserver();
  initRevealObserver();
}

function renderMeta() {
  const site = state.data.site;
  const hero = state.data.hero;
  const pageTitle = site.name;
  const pageDescription = hero.summary;

  document.title = pageTitle;
  setMetaContent('meta[name="description"]', pageDescription);
  setMetaContent('meta[name="keywords"]', site.keywords);
  setMetaContent('meta[property="og:title"]', pageTitle);
  setMetaContent('meta[property="og:description"]', pageDescription);
}

function renderBrand() {
  const site = state.data.site;
  setText("#brand-name", site.name);
  setText("#brand-role", site.brandRole);

  const resumeSizes = state.data.resumeSizes || {};
  const resumeLinks = [
    {
      element: document.getElementById("resume-full-link"),
      href: site.resumeFullUrl,
      label: site.resumeFullLabel,
      size: resumeSizes.full,
    },
    {
      element: document.getElementById("resume-eco-link"),
      href: site.resumeEcoUrl,
      label: site.resumeEcoLabel,
      size: resumeSizes.eco,
    },
  ];

  setText("#resume-trigger-label", site.resumeTrigger);

  resumeLinks.forEach(({ element, href, label, size }) => {
    if (!element || !href) {
      return;
    }

    element.href = href;
    element.setAttribute("aria-label", size ? `${label} (${size})` : label);
    element.querySelector(".resume-link-label").textContent = label;
    element.querySelector(".resume-size").textContent = size || "";
  });
}

function renderNavigation() {
  const navContainer = document.getElementById("nav-links");
  if (!navContainer) {
    return;
  }

  const items = state.data.nav;
  navContainer.innerHTML = items
    .map(
      (item) => `
        <a class="nav-link" href="#${item.id}" data-section="${item.id}">
          ${escapeHtml(item.label)}
        </a>
      `
    )
    .join("");
}

function renderHero() {
  const hero = state.data.hero;
  const age = calculateAge(state.data.site.birthDate);

  setText("#hero-kicker", hero.kicker);
  setHTML("#hero-title", buildHeroTitle());
  document.getElementById("hero-title")?.setAttribute("dir", state.lang === "fa" ? "rtl" : "ltr");
  setText("#hero-role", hero.role);
  setText("#hero-summary", hero.summary);

  const primaryButton = document.getElementById("hero-primary-action");
  const secondaryButton = document.getElementById("hero-secondary-action");
  if (primaryButton) {
    primaryButton.textContent = hero.buttons.project;
  }
  if (secondaryButton) {
    secondaryButton.textContent = hero.buttons.hire;
  }

  setHTML(
    "#hero-badges",
    hero.badges.map((badge) => renderHeroBadge(badge, age)).join("")
  );

}

function renderSidebar() {
  const sidebarContent = document.getElementById("sidebar-content");
  if (!sidebarContent) {
    return;
  }

  const sidebar = state.data.sidebar;
  const stack = state.data.stack || {};
  const softSkills = (sidebar.softSkills || []).filter((skill) => String(skill).trim());
  const languages = (sidebar.languages || []).filter((language) => language && language.name);

  const stackSection = (className, title, items) =>
    items && items.length
      ? `
      <section class="sidebar-card ${className}">
        <h3>${escapeHtml(title)}</h3>
        <div class="stack-list">
          ${items.filter((item) => item && item.name).map(renderStackItem).join("")}
        </div>
      </section>
    `
      : "";

  sidebarContent.innerHTML = `
    <div class="sidebar-column-group">
      <section class="sidebar-card sidebar-card--contact">
        <h3>${escapeHtml(sidebar.contactTitle)}</h3>
        <div class="contact-list">
          ${renderContactList(sidebar, state.data.site)}
        </div>
      </section>

      ${softSkills.length
        ? `<section class="sidebar-card sidebar-card--skills">
            <h3>${escapeHtml(sidebar.softSkillsTitle)}</h3>
            <div class="skill-chip-list">
              ${softSkills.map((skill) => `<span class="skill-chip">${escapeHtml(skill)}</span>`).join("")}
            </div>
          </section>`
        : ""}

      ${languages.length
        ? `<section class="sidebar-card sidebar-card--languages">
            <h3>${escapeHtml(sidebar.languagesTitle)}</h3>
            <div class="language-card">
              ${languages.map((language) => renderLanguageBlock(language)).join("")}
            </div>
          </section>`
        : ""}

      ${stackSection("sidebar-card--programming", sidebar.programmingTitle, stack.programming)}
      ${stackSection("sidebar-card--tools", sidebar.toolsTitle, stack.tools)}
      ${stackSection("sidebar-card--systems", sidebar.systemsTitle, stack.systems)}
    </div>
  `;
}

function renderEducation() {
  const section = state.data.education;
  const list = document.getElementById("education-list");
  if (!list) {
    return;
  }

  setText("#education-kicker", section.kicker);
  setText("#education-title", section.title);
  setText("#education-description", section.description);

  list.innerHTML = section.items
    .map(
      (item, index) => `
        <article class="education-item">
          <div class="education-card">
            <span class="education-index" aria-hidden="true">${String(index + 1).padStart(2, "0")}</span>
            <div class="education-card-main">
              <span class="education-date">${escapeHtml(item.start)} <span aria-hidden="true">→</span> ${escapeHtml(item.end)}</span>
              <h3>${escapeHtml(item.degree)}</h3>
              <p>${escapeHtml(item.place)}</p>
              <div class="education-meta">
                <span>${escapeHtml(item.status)}</span>
                <span>${escapeHtml(item.grade)}</span>
              </div>
            </div>
          </div>
        </article>
      `
    )
    .join("");
}

function isCurrentRole(item) {
  const end = String(item.end_at || "").trim();
  return !end || /present|now|current|ongoing|اکنون|کنون/i.test(end);
}

function renderEmploymentCard(item, variant) {
  const details = (item.list_of_details || []).filter((line) => String(line).trim());
  const organization = String(item.organization_name || "").trim();
  const icon = String(item.organization_icon || "").trim();
  const range = [item.start_at, item.end_at].filter((value) => String(value || "").trim());
  const showDetails = variant === "current" && details.length;

  return `
    <article class="employment-card employment-card--${variant}">
      <div class="timeline-card">
        <div class="timeline-top">
          ${
            icon
              ? `<span class="timeline-logo"><img src="assets/img/${escapeHtml(
                  icon
                )}" alt="" loading="lazy" decoding="async"></span>`
              : ""
          }
          <div class="timeline-org">
            ${organization ? `<strong>${escapeHtml(organization)}</strong>` : ""}
            ${item.emp_type ? `<span class="timeline-type">${escapeHtml(item.emp_type)}</span>` : ""}
          </div>
        </div>
        ${
          range.length
            ? `<span class="timeline-range">
                ${range
                  .map((value) => `<span>${escapeHtml(value)}</span>`)
                  .join('<i aria-hidden="true">\u2192</i>')}
              </span>`
            : ""
        }
        <div class="timeline-title-block">
          <h3>${escapeHtml(item.title)}</h3>
          ${item.sub_title ? `<p class="timeline-subtitle">${escapeHtml(item.sub_title)}</p>` : ""}
        </div>
        ${
          showDetails
            ? `<ul class="timeline-details">
                ${details.map((line) => `<li>${escapeHtml(line)}</li>`).join("")}
              </ul>`
            : ""
        }
      </div>
    </article>
  `;
}

function renderEmployment() {
  const section = state.data.employment;
  const list = document.getElementById("employment-list");
  if (!list) {
    return;
  }

  setText("#employment-kicker", section.kicker);
  setText("#employment-title", section.title);
  setText("#employment-description", section.description);

  const items = section.items || [];
  const current = items.filter(isCurrentRole);
  const archived = items.filter((item) => !isCurrentRole(item));

  list.innerHTML = `
    ${
      current.length
        ? `<div class="employment-current">
            ${current.map((item) => renderEmploymentCard(item, "current")).join("")}
          </div>`
        : ""
    }
    ${
      archived.length
        ? `<div class="employment-archive">
            <div class="employment-track">
              ${archived.map((item) => renderEmploymentCard(item, "archive")).join("")}
            </div>
          </div>`
        : ""
    }
  `;
}

function renderProjects() {
  const section = state.data.projects;
  const list = document.getElementById("projects-list");
  if (!list) {
    return;
  }

  setText("#projects-kicker", section.kicker);
  setText("#projects-title", section.title);
  setText("#projects-description", section.description);

  list.innerHTML = section.items
    .map(
      (item) => `
        <article class="project-entry">
          <span class="project-date-mark" aria-hidden="true">${escapeHtml(item.date)}</span>
          <div class="project-card">
            <div class="project-card-layout">
              ${renderProjectGallery(item)}
              <div class="project-card-body">
                ${
                  item.role
                    ? `<div class="project-meta">
                        <span class="project-role">${escapeHtml(item.role)}</span>
                      </div>`
                    : ""
                }
                <h3>${escapeHtml(item.title)}</h3>
                <p class="project-summary">${escapeHtml(item.summary)}</p>
                ${renderProjectTech(item)}
              </div>
            </div>
          </div>
        </article>
      `
    )
    .join("");
}

function renderProjectGallery(item) {
  const gallery = (state.data.projectGalleries?.[item.key] || []).filter(
    (image) => typeof image === "string" && image.trim()
  );
  const label = state.lang === "fa" ? "تصاویر پروژه" : "Project images";
  const previous = state.lang === "fa" ? "تصویر قبلی" : "Previous image";
  const next = state.lang === "fa" ? "تصویر بعدی" : "Next image";
  const zoomLabel = state.lang === "fa" ? "نمایش تمام صفحه" : "View image full screen";

  if (!gallery.length) {
    return "";
  }

  return `
    <div class="project-gallery" data-project-gallery>
      <div class="gallery-stage">
        <img data-gallery-main src="assets/img/${escapeHtml(gallery[0])}" alt="${escapeHtml(
    item.title
  )} 1" loading="lazy" decoding="async">
        <span class="gallery-counter" data-gallery-counter aria-live="polite">1 / ${gallery.length}</span>
        <button class="gallery-arrow gallery-arrow--prev" type="button" data-gallery-step="-1"
          aria-label="${previous}">&lsaquo;</button>
        <button class="gallery-arrow gallery-arrow--next" type="button" data-gallery-step="1"
          aria-label="${next}">&rsaquo;</button>
        <button class="gallery-zoom" type="button" data-gallery-zoom
          aria-label="${zoomLabel}"></button>
      </div>
      <div class="gallery-thumbnails" role="group" aria-label="${escapeHtml(label)}">
        ${gallery
          .map(
            (image, index) => `
              <button class="gallery-thumbnail${index === 0 ? " is-active" : ""}" type="button"
                  data-gallery-index="${index}" data-src="assets/img/${escapeHtml(image)}"
                  data-alt="${escapeHtml(item.title)} ${index + 1}" aria-label="${escapeHtml(item.title)} ${
              index + 1
            }"
                  aria-pressed="${index === 0}">
                <img src="assets/img/${escapeHtml(image)}" alt="" loading="lazy" decoding="async">
              </button>
            `
          )
          .join("")}
      </div>
    </div>
  `;
}

function renderProjectTech(item) {
  const tools = Array.isArray(item.tools)
    ? item.tools.filter((entry) => typeof entry === "string" && entry.trim())
    : [];
  if (!tools.length) {
    return "";
  }

  const label = state.lang === "fa" ? "ابزارها و زبان ها" : "Tools & languages";

  return `
    <div class="project-tools">
      <span class="project-tools-label">${label}</span>
      <ul class="project-tech">
        ${tools.map((entry) => renderProjectToolChip(entry)).join("")}
      </ul>
    </div>
  `;
}

function renderProjectToolChip(entry) {
  const stackEntry = stackIconIndex().get(String(entry).trim().toLowerCase());
  const icon = stackEntry && typeof stackEntry.icon === "string" ? stackEntry.icon.trim() : "";

  return `<li class="project-tech-item">${
    icon
      ? `<img src="assets/img/${escapeHtml(icon)}" alt="" loading="lazy" decoding="async">`
      : ""
  }<span>${escapeHtml(entry)}</span></li>`;
}

function stackIconIndex() {
  const index = new Map();

  Object.values(state.data.stack || {}).forEach((group) => {
    if (!Array.isArray(group)) {
      return;
    }
    group.forEach((entry) => {
      const name =
        entry && typeof entry.name === "string" ? entry.name.trim().toLowerCase() : "";
      if (name) {
        index.set(name, entry);
      }
    });
  });

  return index;
}

function renderContact() {
  const section = state.data.contact;

  setText("#contact-kicker", section.kicker);
  setText("#contact-title", section.title);
  setText("#contact-description", section.description);
  const contacts = contactEntries(state.data.sidebar, state.data.site);
  setHTML(
    "#contact-actions",
    (section.actions || [])
      .map((action) => {
        const entry = contacts.find((contact) => contact.key === action.key);
        if (!entry) {
          return "";
        }

        return `
          <a class="contact-link" href="${escapeHtml(entry.href)}" ${
            entry.href.startsWith("http") ? 'target="_blank" rel="noopener"' : ""
          }>
            ${entry.icon ? `<img src="assets/img/${escapeHtml(entry.icon)}" alt="${escapeHtml(action.label)}">` : ""}
            <span>${escapeHtml(action.label)}</span>
          </a>
        `;
      })
      .join("")
  );

  setText("#contact-card-label", section.cardLabel);
  setText("#contact-card-title", section.cardTitle);
  setText("#contact-card-text", section.cardText);
  setText("#label-name", section.form.name);
  setText("#label-email", section.form.email);
  setText("#label-message", section.form.message);
  setText("#submit-button", section.form.submit);

  setPlaceholder("#name", section.form.name);
  setPlaceholder("#email", section.form.email);
  setPlaceholder("#message", section.form.message);
}

function initRevealObserver() {
  state.revealObserver?.disconnect();

  const revealTargets = document.querySelectorAll(
    ".section-heading, .education-item, .employment-card, .project-entry, .sidebar-card, .contact-copy, .contact-card"
  );
  revealTargets.forEach((element) => element.classList.add("reveal-ready"));
  if (!("IntersectionObserver" in window)) {
    revealTargets.forEach((element) => element.classList.add("is-visible"));
    return;
  }

  state.revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
  );

  revealTargets.forEach((element) => state.revealObserver.observe(element));
}

function renderFooter() {
  setText("#footer-copy", state.data.footer);
}

function renderPersonSchema() {
  const site = state.data.site;
  const schemaScript = document.getElementById("person-schema");
  if (!schemaScript) {
    return;
  }

  const schema = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: site.name,
    email: site.email,
    telephone: site.phone,
    url: "https://amir-rahimian.github.io/",
    image: "https://amir-rahimian.github.io/assets/img/portfolioIcon.png",
    jobTitle: site.brandRole,
    sameAs: [site.github, site.linkedin],
    address: {
      "@type": "PostalAddress",
      addressLocality: site.location,
      addressCountry: "IR",
    },
  };

  schemaScript.textContent = JSON.stringify(schema, null, 2);
}

function initSectionObserver() {
  if (state.sectionObserver) {
    state.sectionObserver.disconnect();
    state.sectionObserver = null;
  }

  if (state.scrollHandler) {
    window.removeEventListener("scroll", state.scrollHandler, { passive: true });
    state.scrollHandler = null;
  }
  if (state.resizeHandler) {
    window.removeEventListener("resize", state.resizeHandler);
    state.resizeHandler = null;
  }

  const navLinks = [...document.querySelectorAll(".nav-link")];
  const sectionIds = new Set(navLinks.map((link) => link.dataset.section));
  const sections = [...document.querySelectorAll("section[id], aside[id]")].filter((section) =>
    sectionIds.has(section.id)
  );
  if (!sections.length || !navLinks.length) {
    return;
  }

  const setActiveLink = (id) => {
    navLinks.forEach((link) => {
      const isActive = link.dataset.section === id;
      link.classList.toggle("active", isActive);
      if (isActive) {
        link.setAttribute("aria-current", "location");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  };

  if ("IntersectionObserver" in window) {
    const rootMarginTop = Math.round(window.innerHeight * 0.2);
    const rootMarginBottom = Math.round(window.innerHeight * 0.65);
    state.sectionObserver = new IntersectionObserver(
      (entries) => {
        const visibleSections = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        if (visibleSections.length) {
          setActiveLink(visibleSections[0].target.id);
        }
      },
      {
        rootMargin: `-${rootMarginTop}px 0px -${rootMarginBottom}px 0px`,
      }
    );
    sections.forEach((section) => state.sectionObserver.observe(section));
    state.resizeHandler = () => {
      state.sectionObserver?.disconnect();
      state.sectionObserver = null;
      initSectionObserver();
    };
    window.addEventListener("resize", state.resizeHandler);
    return;
  }

  const updateActiveSection = () => {
    const offset = 140;
    let activeId = sections[0]?.id || "";
    let bestDistance = Number.POSITIVE_INFINITY;

    sections.forEach((section) => {
      const rect = section.getBoundingClientRect();
      const distance = Math.abs(rect.top - offset);

      if (rect.top <= offset && rect.bottom > offset) {
        activeId = section.id;
        return;
      }

      if (distance < bestDistance) {
        bestDistance = distance;
        activeId = section.id;
      }
    });

    setActiveLink(activeId);
  };

  updateActiveSection();

  let scrollScheduled = false;
  state.scrollHandler = () => {
    if (scrollScheduled) {
      return;
    }
    scrollScheduled = true;
    window.requestAnimationFrame(() => {
      updateActiveSection();
      scrollScheduled = false;
    });
  };
  window.addEventListener("scroll", state.scrollHandler, { passive: true });
  state.resizeHandler = updateActiveSection;
  window.addEventListener("resize", state.resizeHandler);
}

function buildHeroTitle() {
  const title = state.data.hero.title || {};
  const rows = [
    [
      { text: title.starter, className: "hero-title-small" },
      { text: title.first, className: "hero-title-big" },
    ],
    [
      { text: title.last, className: "hero-title-medium" },
      { text: title.ender, className: "hero-title-small" },
    ],
  ];

  return rows
    .map(
      (row) => `
        <span class="hero-title-row">
          ${row
            .filter((line) => String(line.text ?? "").trim())
            .map(
              (line) =>
                `<span class="hero-title-line ${line.className}">${escapeHtml(line.text)}</span>`
            )
            .join("")}
        </span>
      `
    )
    .join("");
}

function renderHeroBadge(badge, age) {
  const label = String(badge.text || "").replace("{age}", age).trim();
  if (!label) {
    return "";
  }

  const dot = `<i class="badge-dot" aria-hidden="true"></i>`;

  if (badge.icon) {
    return `
      <div class="hero-badge">
        ${dot}
        <img src="assets/img/${escapeHtml(badge.icon)}" alt="" aria-hidden="true">
        <span>${escapeHtml(label)}</span>
      </div>
    `;
  }

  return `<div class="hero-badge">${dot}<span>${escapeHtml(label)}</span></div>`;
}

function contactEntries(sidebar, site) {
  const labels = sidebar.contactLabels || {};
  const icons = state.data.contactIcons || {};
  const handle = (url) => `@${String(url).split("/").filter(Boolean).pop()}`;

  return [
    { key: "email", value: site.email, href: site.email ? `mailto:${site.email}` : "" },
    {
      key: "phone",
      value: site.phone,
      href: site.phone ? `tel:${String(site.phone).replace(/[^\d+]/g, "")}` : "",
    },
    { key: "github", value: site.github ? handle(site.github) : "", href: site.github },
    { key: "linkedin", value: site.linkedin ? handle(site.linkedin) : "", href: site.linkedin },
  ]
    .filter((entry) => entry.value && entry.href)
    .map((entry) => ({
      ...entry,
      label: labels[entry.key] || entry.key,
      icon: icons[entry.key] || "",
    }));
}

function renderContactList(sidebar, site) {
  return contactEntries(sidebar, site)
    .map(
      (item) => `
        <div class="contact-item">
          <div class="contact-icon-wrap">
            ${item.icon ? `<img src="assets/img/${escapeHtml(item.icon)}" alt="" aria-hidden="true">` : ""}
          </div>
          <div>
            <span>${escapeHtml(item.label)}</span>
            <a href="${escapeHtml(item.href)}" ${
              item.href.startsWith("http") ? 'target="_blank" rel="noopener"' : ""
            }>${escapeHtml(item.value)}</a>
          </div>
        </div>
      `
    )
    .join("");
}

function renderLanguageBlock(language) {
  const details = language.details.length
    ? `
      <div class="language-details">
        ${language.details
          .map(
            (detail) => `
              <div class="detail-row">
                <span>${escapeHtml(detail.label)}</span>
                <div class="progress"><span style="width: ${escapeHtml(detail.value)}%;"></span></div>
                <span>${escapeHtml(detail.value)}%</span>
              </div>
            `
          )
          .join("")}
      </div>
    `
    : "";

  return `
    <div class="language-block">
      <div class="language-head">
        <strong>${escapeHtml(language.name)}</strong>
        <span class="language-level">${escapeHtml(language.level)}</span>
        <span class="language-value">${escapeHtml(language.value)}%</span>
      </div>
      <div class="progress"><span style="width: ${escapeHtml(language.value)}%;"></span></div>
      ${details}
    </div>
  `;
}

function renderStackItem(item) {
  return `
    <div class="stack-group">
      <div class="stack-item">
        <img src="assets/img/${escapeHtml(item.icon)}" alt="${escapeHtml(item.name)}">
        <div class="stack-meta">
          <div class="stack-name-row">
            <strong>${escapeHtml(item.name)}</strong>
            <span>${escapeHtml(item.value)}%</span>
          </div>
          <div class="progress"><span style="width: ${escapeHtml(item.value)}%;"></span></div>
        </div>
      </div>
    </div>
  `;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function calculateAge(birthDate) {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  const hasBirthdayPassed =
    monthDiff > 0 || (monthDiff === 0 && today.getDate() >= birth.getDate());

  if (!hasBirthdayPassed) {
    age -= 1;
  }

  return age;
}

function setMetaContent(selector, content) {
  const element = document.querySelector(selector);
  if (element) {
    element.setAttribute("content", content);
  }
}

function setText(selector, value) {
  const element = document.querySelector(selector);
  if (element) {
    element.textContent = value;
  }
}

function setHTML(selector, value) {
  const element = document.querySelector(selector);
  if (element) {
    element.innerHTML = value;
  }
}

function setPlaceholder(selector, value) {
  const element = document.querySelector(selector);
  if (element) {
    element.setAttribute("placeholder", value);
  }
}
