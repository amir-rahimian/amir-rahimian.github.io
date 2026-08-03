document.addEventListener("DOMContentLoaded", initApp);

const state = {
  data: null,
  lang: "fa",
  sectionObserver: null,
  scrollHandler: null,
  resizeHandler: null,
  heroPortraitReady: false,
};

async function initApp() {
  try {
    const response = await fetch("assets/js/data.json");
    if (!response.ok) {
      throw new Error(`Failed to load data.json: ${response.status}`);
    }

    state.data = await response.json();

    bindLanguageSwitcher();
    bindSmoothScroll();
    bindContactForm();

    setLanguage(getInitialLanguage());
  } catch (error) {
    console.error("Portfolio initialization failed:", error);
  }
}

function getInitialLanguage() {
  const savedLanguage = localStorage.getItem("preferredLang");
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
        setLanguage(lang);
      }
    });
  });
}

function bindSmoothScroll() {
  document.addEventListener("click", (event) => {
    const link = event.target.closest('a[href^="#"]');
    if (!link) {
      return;
    }

    const targetId = link.getAttribute("href");
    if (!targetId || targetId === "#") {
      return;
    }

    const section = document.querySelector(targetId);
    if (!section) {
      return;
    }

    event.preventDefault();
    const top = section.getBoundingClientRect().top + window.scrollY - 120;
    window.scrollTo({ top, behavior: "smooth" });
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

function setLanguage(lang) {
  state.lang = lang === "en" ? "en" : "fa";
  const direction = state.lang === "fa" ? "rtl" : "ltr";

  document.documentElement.lang = state.lang;
  document.documentElement.dir = direction;
  document.body.setAttribute("dir", direction);
  localStorage.setItem("preferredLang", state.lang);

  document.querySelectorAll(".lang-btn").forEach((button) => {
    button.classList.toggle("active", button.dataset.lang === state.lang);
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
}

function renderMeta() {
  const site = state.data.site;
  const hero = state.data.hero[state.lang];
  const pageTitle = state.lang === "fa" ? site.nameFa : site.nameEn;
  const pageDescription = hero.summary;
  const pageKeywords =
    state.lang === "fa"
      ? "امیر رحیمیان, پورتفولیو, توسعه دهنده اندروید, طراح رابط کاربری, یزد"
      : "Amir Rahimian, Portfolio, Android Developer, UI UX Designer, Yazd";

  document.title = pageTitle;
  setMetaContent('meta[name="description"]', pageDescription);
  setMetaContent('meta[name="keywords"]', pageKeywords);
  setMetaContent('meta[property="og:title"]', pageTitle);
  setMetaContent('meta[property="og:description"]', pageDescription);
}

function renderBrand() {
  const site = state.data.site;
  setText("#brand-name", state.lang === "fa" ? site.nameFa : site.nameEn);
  setText("#brand-role", state.lang === "fa" ? site.brandRoleFa : site.brandRoleEn);

  const resumeLink = document.getElementById("resume-link");
  if (resumeLink) {
    resumeLink.href = site.resumeUrl;
    resumeLink.textContent = state.lang === "fa" ? "دانلود رزومه" : "Download Resume";
  }
}

function renderNavigation() {
  const navContainer = document.getElementById("nav-links");
  if (!navContainer) {
    return;
  }

  const items = state.data.nav[state.lang];
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
  const hero = state.data.hero[state.lang];
  const age = calculateAge(state.data.site.birthDate);

  setText("#hero-kicker", hero.kicker);
  setHTML("#hero-title", buildHeroTitle(state.lang));
  setText("#hero-role", hero.role);
  setText("#hero-summary", hero.summary);
  setContainerHTML("#hero-facts", "");

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

  loadHeroPortrait();
}

function renderSidebar() {
  const sidebarContent = document.getElementById("sidebar-content");
  if (!sidebarContent) {
    return;
  }

  const sidebar = state.data.sidebar[state.lang];
  const capabilities = state.data.sidebar.capabilities;

  sidebarContent.innerHTML = `
    <div class="sidebar-column-group">
      <section class="sidebar-card">
        <h3>${sidebar.contactTitle}</h3>
        <div class="contact-list">
          ${sidebar.contacts.map(renderContactItem).join("")}
        </div>
      </section>

      <section class="sidebar-card">
        <h3>${sidebar.softSkillsTitle}</h3>
        <div class="skill-chip-list">
          ${sidebar.softSkills
            .map((skill) => `<span class="skill-chip">${skill}</span>`)
            .join("")}
        </div>
      </section>

      <section class="sidebar-card">
        <h3>${sidebar.languagesTitle}</h3>
        <div class="language-card">
          ${sidebar.languages.map((language) => renderLanguageBlock(language)).join("")}
        </div>
      </section>

      <section class="sidebar-card">
        <h3>${sidebar.programmingTitle}</h3>
        <div class="stack-list">
          ${capabilities.programming.map(renderStackItem).join("")}
        </div>
      </section>

      <section class="sidebar-card">
        <h3>${sidebar.toolsTitle}</h3>
        <div class="stack-list">
          ${capabilities.tools.map(renderStackItem).join("")}
        </div>
      </section>

      <section class="sidebar-card">
        <h3>${sidebar.systemsTitle}</h3>
        <div class="stack-list">
          ${capabilities.systems.map(renderStackItem).join("")}
        </div>
      </section>
    </div>
  `;
}

function renderEducation() {
  const section = state.data.education[state.lang];
  const list = document.getElementById("education-list");
  if (!list) {
    return;
  }

  setText("#education-kicker", section.kicker);
  setText("#education-title", section.title);
  setText("#education-description", section.description);

  list.innerHTML = section.items
    .map(
      (item) => `
        <article class="education-item">
          <div class="education-card">
            <h3>${item.degree}</h3>
            <p>${item.place}</p>
          </div>
          <div class="education-link">
            <span>${item.start}<br>${item.end}</span>
          </div>
          <div class="education-card">
            <h3>${item.status}</h3>
            <p>${item.grade}</p>
          </div>
        </article>
      `
    )
    .join("");
}

function renderEmployment() {
  const section = state.data.employment[state.lang];
  const list = document.getElementById("employment-list");
  if (!list) {
    return;
  }

  setText("#employment-kicker", section.kicker);
  setText("#employment-title", section.title);
  setText("#employment-description", section.description);

  list.innerHTML = section.items
    .map(
      (item, index) => `
        <article class="timeline-entry ${index % 2 === 0 ? "timeline-entry--left" : "timeline-entry--right"}">
          <div class="timeline-card">
            <h3>${item.title}</h3>
            <p>${item.subtitle}</p>
            <div class="timeline-lines">
              ${item.lines.map((line) => `<span>${line}</span>`).join("")}
            </div>
          </div>
          <div class="timeline-date">${item.date}</div>
        </article>
      `
    )
    .join("");
}

function renderProjects() {
  const section = state.data.projects[state.lang];
  const list = document.getElementById("projects-list");
  if (!list) {
    return;
  }

  setText("#projects-kicker", section.kicker);
  setText("#projects-title", section.title);
  setText("#projects-description", section.description);

  list.innerHTML = section.items
    .map(
      (item, index) => `
        <article class="project-entry ${index % 2 === 0 ? "project-entry--left" : "project-entry--right"}">
          <div class="project-card">
            <div class="project-card-body">
              <h3>${item.title}</h3>
              <span class="project-role">${item.role}</span>
              <p>${item.summary}</p>
            </div>
          </div>
          <div class="project-date">${item.date}</div>
          <div class="project-card-media">
            <img src="assets/img/${item.image}" alt="${item.title}">
          </div>
        </article>
      `
    )
    .join("");
}

function renderContact() {
  const section = state.data.contact[state.lang];

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

function renderFooter() {
  setText("#footer-copy", state.data.footer[state.lang]);
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
    name: state.lang === "fa" ? site.nameFa : site.nameEn,
    email: site.email,
    telephone: site.phone,
    url: "https://amir-rahimian.github.io/",
    image: "https://amir-rahimian.github.io/assets/img/portfolioIcon.png",
    jobTitle: state.lang === "fa" ? site.brandRoleFa : site.brandRoleEn,
    sameAs: [site.github, site.linkedin],
    address: {
      "@type": "PostalAddress",
      addressLocality: state.lang === "fa" ? site.locationFa : site.locationEn,
      addressCountry: "IR",
    },
  };

  schemaScript.textContent = JSON.stringify(schema, null, 2);
}

function initSectionObserver() {
  if (state.sectionObserver) {
    state.sectionObserver.disconnect();
  }

  if (state.scrollHandler) {
    window.removeEventListener("scroll", state.scrollHandler, { passive: true });
  }
  if (state.resizeHandler) {
    window.removeEventListener("resize", state.resizeHandler);
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
      link.classList.toggle("active", link.dataset.section === id);
    });
  };

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

  state.scrollHandler = () => updateActiveSection();
  state.resizeHandler = () => updateActiveSection();

  window.addEventListener("scroll", state.scrollHandler, { passive: true });
  window.addEventListener("resize", state.resizeHandler);
}

function loadHeroPortrait() {
  const portrait = document.getElementById("hero-portrait");
  if (!portrait || state.heroPortraitReady) {
    return;
  }

  portrait.style.opacity = "0";
  const gif = new Image();
  gif.src = portrait.dataset.gifSrc || "assets/img/face.gif";

  gif.onload = () => {
    window.requestAnimationFrame(() => {
      portrait.src = gif.src;
      portrait.style.opacity = "1";
      state.heroPortraitReady = true;
    });
  };
}

function buildHeroTitle(lang) {
  const lines =
    lang === "fa"
      ? [
          { text: "من", className: "hero-title-small" },
          { text: "امیرحسین", className: "hero-title-big" },
          { text: "رحیمیان", className: "hero-title-medium" },
          { text: "علی آباد", className: "hero-title-small" },
        ]
      : [
          { text: "I am", className: "hero-title-small" },
          { text: "AmirHossein", className: "hero-title-big" },
          { text: "Rahimian", className: "hero-title-medium" },
          { text: "Aliabad", className: "hero-title-small" },
        ];

  return lines
    .map(
      (line) =>
        `<span class="hero-title-line ${line.className}">${line.text}</span>`
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
        <img src="assets/img/${badge.icon}" alt="${label}">
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
        <img src="assets/img/${item.icon}" alt="${item.label}">
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
