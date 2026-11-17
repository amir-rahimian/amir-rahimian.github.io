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
};

let employmentPathFrame = 0;
let employmentPathObserver = null;

async function initApp() {
  try {
    bindLanguageSwitcher();
    bindNavigationMenu();
    bindResumeMenu();
    bindContactForm();
    bindPointerLighting();
    bindProjectGalleries();
    window.addEventListener("resize", scheduleEmploymentPath);
    const employmentList = document.getElementById("employment-list");
    employmentList?.addEventListener("transitionend", (event) => {
      if (event.target instanceof Element && event.target.classList.contains("timeline-entry")) {
        scheduleEmploymentPath();
      }
    });
    if (employmentList && "ResizeObserver" in window) {
      employmentPathObserver = new ResizeObserver(scheduleEmploymentPath);
      employmentPathObserver.observe(employmentList);
    }

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

function bindPointerLighting() {
  document.addEventListener("pointermove", (event) => {
    if (event.pointerType === "touch" || !(event.target instanceof Element)) {
      return;
    }

    const element = event.target.closest(".hero-visual");
    if (!element) {
      return;
    }

    const bounds = element.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width) * 100;
    const y = ((event.clientY - bounds.top) / bounds.height) * 100;
    element.style.setProperty("--pointer-x", `${x}%`);
    element.style.setProperty("--pointer-y", `${y}%`);
  });
}

function bindProjectGalleries() {
  document.addEventListener("click", (event) => {
    if (!(event.target instanceof Element)) {
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
  const nextLanguage = lang === "en" ? "en" : "fa";
  if (state.data && nextLanguage === state.lang) {
    return;
  }

  const requestId = ++state.languageRequestId;
  const data = await loadPortfolioData(nextLanguage);
  if (requestId !== state.languageRequestId) {
    return;
  }

  state.data = data;
  state.lang = nextLanguage;
  const direction = state.lang === "fa" ? "rtl" : "ltr";

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
  setMetaContent('meta[name="keywords"]', state.data.seo.keywords);
  setMetaContent('meta[property="og:title"]', pageTitle);
  setMetaContent('meta[property="og:description"]', pageDescription);
}

function renderBrand() {
  const site = state.data.site;
  setText("#brand-name", site.name);
  setText("#brand-role", site.brandRole);

  const resumeLinks = [
    {
      element: document.getElementById("resume-full-link"),
      href: site.resumeFullUrl,
      label: state.lang === "fa" ? "نسخه کامل" : "Full size",
      size: "5.2 MB",
      description: state.lang === "fa" ? "دانلود رزومه کامل، ۵٫۲ مگابایت" : "Download full-size resume, 5.2 MB",
    },
    {
      element: document.getElementById("resume-eco-link"),
      href: site.resumeEcoUrl,
      label: state.lang === "fa" ? "نسخه کم‌حجم" : "Eco",
      size: "1.7 MB",
      description: state.lang === "fa" ? "دانلود رزومه کم‌حجم، ۱٫۷ مگابایت" : "Download eco resume, 1.7 MB",
    },
  ];

  setText("#resume-trigger-label", state.lang === "fa" ? "دریافت رزومه" : "Get CV");
  document.getElementById("resume-options")?.setAttribute(
    "aria-label",
    state.lang === "fa" ? "انتخاب نسخه رزومه" : "Choose a resume version"
  );

  resumeLinks.forEach(({ element, href, label, size, description }) => {
    if (!element || !href) {
      return;
    }

    element.href = href;
    element.setAttribute("aria-label", description);
    element.querySelector(".resume-link-label").textContent = label;
    element.querySelector(".resume-size").textContent = size;
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
          ${item.label}
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
    primaryButton.textContent = hero.buttons.primary;
  }
  if (secondaryButton) {
    secondaryButton.textContent = hero.buttons.secondary;
  }

  setContainerHTML(
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
  const capabilities = state.data.sidebar.capabilities;

  sidebarContent.innerHTML = `
    <div class="sidebar-column-group">
      <section class="sidebar-card sidebar-card--contact">
        <h3>${sidebar.contactTitle}</h3>
        <div class="contact-list">
          ${sidebar.contacts.map(renderContactItem).join("")}
        </div>
      </section>

      <section class="sidebar-card sidebar-card--skills">
        <h3>${sidebar.softSkillsTitle}</h3>
        <div class="skill-chip-list">
          ${sidebar.softSkills
            .map((skill) => `<span class="skill-chip">${skill}</span>`)
            .join("")}
        </div>
      </section>

      <section class="sidebar-card sidebar-card--languages">
        <h3>${sidebar.languagesTitle}</h3>
        <div class="language-card">
          ${sidebar.languages.map((language) => renderLanguageBlock(language)).join("")}
        </div>
      </section>

      <section class="sidebar-card sidebar-card--programming">
        <h3>${sidebar.programmingTitle}</h3>
        <div class="stack-list">
          ${capabilities.programming.map(renderStackItem).join("")}
        </div>
      </section>

      <section class="sidebar-card sidebar-card--tools">
        <h3>${sidebar.toolsTitle}</h3>
        <div class="stack-list">
          ${capabilities.tools.map(renderStackItem).join("")}
        </div>
      </section>

      <section class="sidebar-card sidebar-card--systems">
        <h3>${sidebar.systemsTitle}</h3>
        <div class="stack-list">
          ${capabilities.systems.map(renderStackItem).join("")}
        </div>
      </section>
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
              <span class="education-date">${item.start} <span aria-hidden="true">→</span> ${item.end}</span>
              <h3>${item.degree}</h3>
              <p>${item.place}</p>
              <div class="education-meta">
                <span>${item.status}</span>
                <span>${item.grade}</span>
              </div>
            </div>
          </div>
        </article>
      `
    )
    .join("");
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

  list.innerHTML = section.items
    .map(
      (item, index) => {
        const row = Math.floor(index / 2);
        const isLeft = row % 2 === 0 ? index % 2 === 0 : index % 2 !== 0;
        return `
        <article class="timeline-entry ${isLeft ? "timeline-entry--left" : "timeline-entry--right"}">
          <div class="timeline-card">
            <span class="timeline-date">${item.date}</span>
            <div class="timeline-card-heading">
              <h3>${item.title}</h3>
              <p class="timeline-subtitle">${item.subtitle}</p>
            </div>
            <div class="timeline-lines">
              ${item.lines.map((line) => `<span>${line}</span>`).join("")}
            </div>
          </div>
        </article>
      `;
      }
    )
    .join("");
  scheduleEmploymentPath();
}

function scheduleEmploymentPath() {
  cancelAnimationFrame(employmentPathFrame);
  employmentPathFrame = requestAnimationFrame(drawEmploymentPath);
}

function drawEmploymentPath() {
  const timeline = document.getElementById("employment-list");
  if (!timeline) {
    return;
  }

  const entries = [...timeline.querySelectorAll(".timeline-entry")];
  if (entries.length < 2) {
    return;
  }

  let svg = timeline.querySelector(".timeline-path");
  if (!svg) {
    svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.classList.add("timeline-path");
    svg.setAttribute("aria-hidden", "true");
    timeline.prepend(svg);
  }

  const bounds = timeline.getBoundingClientRect();
  const width = bounds.width;
  const height = bounds.height;
  if (!width || !height) {
    return;
  }
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  svg.setAttribute("width", String(width));
  svg.setAttribute("height", String(height));
  const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
  const marker = document.createElementNS("http://www.w3.org/2000/svg", "marker");
  marker.setAttribute("id", "employment-arrow");
  marker.setAttribute("viewBox", "0 0 8 8");
  marker.setAttribute("markerWidth", "8");
  marker.setAttribute("markerHeight", "8");
  marker.setAttribute("refX", "7");
  marker.setAttribute("refY", "4");
  marker.setAttribute("orient", "auto");
  marker.setAttribute("markerUnits", "userSpaceOnUse");
  const arrowHead = document.createElementNS("http://www.w3.org/2000/svg", "path");
  arrowHead.setAttribute("d", "M 1 1 L 7 4 L 1 7");
  arrowHead.setAttribute("class", "timeline-arrow-head");
  marker.append(arrowHead);
  defs.append(marker);
  svg.replaceChildren(defs);

  entries.slice(0, -1).forEach((entry, index) => {
    const currentCard = entry.querySelector(".timeline-card");
    const nextCard = entries[index + 1].querySelector(".timeline-card");
    if (!currentCard || !nextCard) {
      return;
    }

    const currentRect = currentCard.getBoundingClientRect();
    const nextRect = nextCard.getBoundingClientRect();
    const current = {
      left: currentRect.left - bounds.left,
      top: currentRect.top - bounds.top,
      width: currentRect.width,
      height: currentRect.height,
      right: currentRect.right - bounds.left,
    };
    const next = {
      left: nextRect.left - bounds.left,
      top: nextRect.top - bounds.top,
      width: nextRect.width,
      height: nextRect.height,
      right: nextRect.right - bounds.left,
    };
    const sameRow = Math.abs(current.top - next.top) < 2;
    const isMobile = window.matchMedia("(max-width: 700px)").matches;
    const start = isMobile
      ? {
            x: current.left + current.width / 2,
            y: current.top + current.height,
        }
      : sameRow
        ? {
              x: current.left < next.left ? current.right : current.left,
              y: current.top + current.height / 2,
          }
        : {
              x: current.left + current.width / 2,
              y: current.top + current.height,
          };
    const end = isMobile
      ? {
            x: next.left + next.width / 2,
            y: next.top,
        }
      : sameRow
        ? {
              x: current.left < next.left ? next.left : next.right,
              y: next.top + next.height / 2,
          }
        : {
              x: next.left + next.width / 2,
              y: next.top,
          };

    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", `M ${start.x} ${start.y} L ${end.x} ${end.y}`);
    path.setAttribute("class", "timeline-connection");
    path.setAttribute("marker-end", "url(#employment-arrow)");
    svg.append(path);
  });
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
          <div class="project-card">
            <span class="project-date">${item.date}</span>
            <div class="project-card-layout">
              ${renderProjectGallery(item)}
              <div class="project-card-body">
                <h3>${item.title}</h3>
                <span class="project-role">${item.role}</span>
                <p>${item.summary}</p>
              </div>
            </div>
          </div>
        </article>
      `
    )
    .join("");
}

function renderProjectGallery(item) {
  const gallery = item.gallery?.length
    ? item.gallery
    : [item.image.replace(/\.png$/i, ".webp")];
  const label = state.lang === "fa" ? "تصاویر پروژه" : "Project images";
  const previous = state.lang === "fa" ? "تصویر قبلی" : "Previous image";
  const next = state.lang === "fa" ? "تصویر بعدی" : "Next image";

  return `
    <div class="project-gallery" data-project-gallery>
      <div class="gallery-stage">
        <img data-gallery-main src="assets/img/${gallery[0]}" alt="${item.title} 1" loading="lazy" decoding="async">
        <span class="gallery-counter" data-gallery-counter aria-live="polite">1 / ${gallery.length}</span>
      </div>
      <div class="gallery-navigation">
        <button class="gallery-arrow" type="button" data-gallery-step="-1" aria-label="${previous}">‹</button>
        <div class="gallery-thumbnails" role="group" aria-label="${label}">
          ${gallery
            .map(
              (image, index) => `
                <button class="gallery-thumbnail${index === 0 ? " is-active" : ""}" type="button"
                    data-gallery-index="${index}" data-src="assets/img/${image}"
                    data-alt="${item.title} ${index + 1}" aria-label="${item.title} ${index + 1}"
                    aria-pressed="${index === 0}">
                  <img src="assets/img/${image}" alt="" loading="lazy" decoding="async">
                </button>
              `
            )
            .join("")}
        </div>
        <button class="gallery-arrow" type="button" data-gallery-step="1" aria-label="${next}">›</button>
      </div>
    </div>
  `;
}

function renderContact() {
  const section = state.data.contact;

  setText("#contact-kicker", section.kicker);
  setText("#contact-title", section.title);
  setText("#contact-description", section.description);
  setContainerHTML(
    "#contact-actions",
    section.actions
      .map(
        (action) => `
          <a class="contact-link" href="${action.href}" ${
            action.href.startsWith("http") ? 'target="_blank" rel="noopener"' : ""
          }>
            <img src="assets/img/${action.icon}" alt="${action.label}">
            <span>${action.label}</span>
          </a>
        `
      )
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
    ".section-heading, .education-item, .timeline-entry, .project-entry, .sidebar-card, .contact-copy, .contact-card"
  );
  revealTargets.forEach((element) => element.classList.add("reveal-ready"));
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!("IntersectionObserver" in window) || prefersReducedMotion) {
    revealTargets.forEach((element) => element.classList.add("is-visible"));
    drawEmploymentPath();
    return;
  }

  state.revealObserver = new IntersectionObserver(
    (entries, observer) => {
      let employmentChanged = false;
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          employmentChanged = employmentChanged || entry.target.classList.contains("timeline-entry");
          observer.unobserve(entry.target);
        }
      });
      if (employmentChanged) {
        scheduleEmploymentPath();
      }
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
  return [state.data.hero.title.slice(0, 2), state.data.hero.title.slice(2)]
    .map(
      (row) => `
        <span class="hero-title-row">
          ${row
            .map((line) => `<span class="hero-title-line ${line.className}">${line.text}</span>`)
            .join("")}
        </span>
      `
    )
    .join("");
}

function renderHeroBadge(badge, age) {
  const label = (badge.text || badge.label || badge.value || "")
    .replace("{age}", age)
    .trim();

  if (badge.icon) {
    return `
      <div class="hero-badge">
        <img src="assets/img/${badge.icon}" alt="" aria-hidden="true">
        <span>${label}</span>
      </div>
    `;
  }

  return `<div class="hero-badge">${label}</div>`;
}

function renderContactItem(item) {
  return `
    <div class="contact-item">
      <div class="contact-icon-wrap">
        <img src="assets/img/${item.icon}" alt="" aria-hidden="true">
      </div>
      <div>
        <span>${item.label}</span>
        <a href="${item.href}" ${
          item.href.startsWith("http") ? 'target="_blank" rel="noopener"' : ""
        }>${item.value}</a>
      </div>
    </div>
  `;
}

function renderLanguageBlock(language) {
  const details = language.details.length
    ? `
      <div class="language-details">
        ${language.details
          .map(
            (detail) => `
              <div class="detail-row">
                <span>${detail.label}</span>
                <div class="progress"><span style="width: ${detail.value}%;"></span></div>
                <span>${detail.value}%</span>
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
        <strong>${language.name}</strong>
        <span class="language-level">${language.level}</span>
        <span class="language-value">${language.value}%</span>
      </div>
      <div class="progress"><span style="width: ${language.value}%;"></span></div>
      ${details}
    </div>
  `;
}

function renderStackItem(item) {
  return `
    <div class="stack-group">
      <div class="stack-item">
        <img src="assets/img/${item.icon}" alt="${item.name}">
        <div class="stack-meta">
          <div class="stack-name-row">
            <strong>${item.name}</strong>
            <span>${item.value}%</span>
          </div>
          <div class="progress"><span style="width: ${item.value}%;"></span></div>
        </div>
      </div>
    </div>
  `;
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

function setContainerHTML(selector, value) {
  setHTML(selector, value);
}

function setPlaceholder(selector, value) {
  const element = document.querySelector(selector);
  if (element) {
    element.setAttribute("placeholder", value);
  }
}
