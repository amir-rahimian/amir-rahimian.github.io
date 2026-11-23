# Website Design & Frontend Contract

**This file is the source of truth for all website UI work. Follow it before creating or changing any page.** Use semantic, modern **HTML + CSS + vanilla JavaScript only**.

## 1. Brand Palette

| Name | Hex | Purpose |
|---|---|---|
| Sky High | `#a3c4ed` | Light reflections, highlights |
| Blue Sonki | `#4c87cc` | Links, focus, interactive accents |
| Lapis Lazuli | `#2561a0` | Primary accent, ambient light |
| Ashenvale Nights | `#134270` | Deep blue atmosphere |
| Dark Eclipse | `#0c2641` | Background depth |
| Black Knight | `#030b14` | Main background |

**Color is for the environment, not the glass.** Never use these blues—or gray, opaque white, or solid black—as glass surface fills.

## 2. Visual Direction

Create a premium, quiet, dimensional interface: clear glass floating over a deep, atmospheric background. The environment supplies the color; UI surfaces supply transparency, blur, reflections, fine edges, and depth.

- Build the page background with layered radial/linear gradients using the brand palette. Keep visible variation behind glass so its transparency is obvious.
- Put headings, paragraphs, labels, metrics, and section content directly on the background whenever a container is not functionally needed.
- Use glass only where a surface improves containment or interaction: navigation, buttons, inputs, controls, compact panels, menus, and dialogs. **Do not turn every section or text block into a card.**
- Prefer whitespace, typography, alignment, and hierarchy over decorative containers.

## 3. Glass Material — Mandatory

A glass surface is **nearly colorless and visibly transparent**. Its identity comes from the real background showing through softly, not from a painted fill.

- Surface fill: start at `rgba(255,255,255,0.01–0.025)`. Keep it almost invisible. If a component looks gray, milky, blue, navy, or opaque, reduce the fill.
- Blur: use `backdrop-filter` and `-webkit-backdrop-filter`; typically `14–24px` for panels and `8–16px` for compact controls. Use stronger blur sparingly for dialogs. Blur must soften—not erase—the background.
- Rim: create a **thin, reflective gradient border**, brighter on the upper/leading edge and fading through transparent sections to a dimmer lower edge. Prefer a gradient pseudo-element with a masked center (`mask-composite: exclude`, plus the WebKit equivalent). Keep a subtle solid-border fallback.
- Reflection: add a very faint inner top highlight and optional lower-edge reflection. Shadows should be soft and dark, used only to separate layers. Avoid thick borders, white washes, hard outlines, and large glow halos.
- State changes may slightly brighten the rim, highlight, or shadow. Never turn a glass control into a solid-color block.

**Visual test:** put a vivid gradient or detailed image behind every glass variant. Its colors and shapes must remain recognizable through the surface, but visibly softened. If it reads as a colored rectangle, it is not correct glass.

### Canonical Material Foundation

Use this as the shared starting point; tune only when the real page background requires it.

```css
:root {
  --glass-fill: rgba(255, 255, 255, .012);
  --glass-blur: 20px;
  --glass-rim: rgba(255, 255, 255, .62);
}

.glass {
  position: relative;
  isolation: isolate;
  border: 1px solid rgba(255, 255, 255, .07);
  border-radius: 20px;
  background: var(--glass-fill);
  -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(140%);
  backdrop-filter: blur(var(--glass-blur)) saturate(140%);
  box-shadow: 0 18px 52px rgba(0,0,0,.28),
    inset 0 1px 0 rgba(255,255,255,.08);
}
.glass::before {
  position: absolute; z-index: 2; inset: 0; padding: 1px;
  border-radius: inherit; content: ""; pointer-events: none;
  background: linear-gradient(135deg, var(--glass-rim),
    rgba(163,196,237,.24) 18%, transparent 44%,
    rgba(255,255,255,.04) 68%, rgba(255,255,255,.25));
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask-composite: exclude;
}
.glass > * { position: relative; z-index: 1; }
```

Keep compact controls and dialogs as small variants of this material. Do not create a different glass recipe for every component.

## 4. Component Rules

- **Navigation:** one continuous glass bar where suitable; avoid a separate filled tile for every link.
- **Buttons, tabs, chips, icon controls:** transparent glass or text-only. Show priority with type, a brighter rim, or a restrained blue accent—not a solid fill.
- **Inputs/selects:** glass surface with a gradient rim; the editable control itself stays transparent. Use readable values, quiet placeholders, and a clear blue-accent focus state.
- **Cards/panels:** add only when content needs a boundary. Avoid glass inside glass; use spacing and subtle separators within a panel.
- **Menus/popovers/dialogs:** reuse the same material with slightly stronger blur and shadow for elevation; do not make overlays opaque.
- **Tables/data:** transparent cells and fine separators; never box every value.
- **Typography:** near-white primary text, softened white secondary text, and blue only for links, icons, focus, or short emphasis. Text does not need a glass container.
- All controls need visible hover, pressed, selected, disabled, and keyboard-focus states.

## 5. Pure HTML / CSS / JS Rules

- No frameworks, CSS libraries, component kits, build tools, or external dependencies unless explicitly requested.
- Inspect the existing project first. Preserve its structure, routes, content, assets, integrations, and working behavior; do not rewrite unrelated code.
- Define brand colors, glass fill/blur/rim, radius, spacing, and shadows as CSS custom properties in `:root`. Build one reusable `.glass` foundation with only a few purposeful variants.
- Keep structure in HTML, appearance in CSS, and behavior in JavaScript. Use semantic elements, clear class names, `addEventListener`, and `defer` where appropriate. Avoid inline event handlers and unnecessary JS.
- Use responsive Grid/Flexbox, `minmax()`, `clamp()`, and content-driven sizing. Test phone, tablet, and desktop widths; prevent horizontal overflow.
- Treat `backdrop-filter` as progressive enhancement. When unsupported, use a very subtle transparent fallback—not a gray or blue fake-glass panel.
- Limit the number and area of blurred surfaces; avoid nested glass and full-screen blur layers. Never animate `backdrop-filter` or `filter`; animate `transform` and `opacity` instead.
- Do not place `opacity`, `filter`, masks, or `will-change` on an ancestor of glass without checking its effect on the backdrop. Respect `prefers-reduced-motion`.
- Keep text contrast readable (WCAG: 4.5:1 for normal text, 3:1 for large text), and ensure keyboard operation, labels, and visible focus.

## 6. Agent Workflow & Definition of Done

Inspect the project, identify its entry points and existing behavior, then implement the requested UI with this contract. Reuse the shared material; do not invent extra sections or dependencies. Test interactions and responsive layouts before finishing.

- [ ] Glass is clear, nearly colorless, and visibly reveals the background.
- [ ] Blur, gradient rim, inner reflection, and shadow are subtle and consistent.
- [ ] No gray/blue/opaque card fills or unnecessary text cards remain.
- [ ] Brand colors create atmosphere and accents, never painted glass.
- [ ] All visible controls work; focus and responsive states are correct.
- [ ] No console errors, overflow, or excessive blur layers.

## References

- [MDN: `backdrop-filter`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/backdrop-filter)
- [web.dev: `backdrop-filter` and performance](https://web.dev/articles/backdrop-filter)
- [MDN: `mask-composite`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/mask-composite)
- [MDN: Color contrast](https://developer.mozilla.org/en-US/docs/Web/Accessibility/Guides/Understanding_WCAG/Perceivable/Color_contrast)
- [GitHub: Repository custom instructions](https://docs.github.com/en/copilot/how-tos/copilot-on-github/customize-copilot/add-custom-instructions/add-repository-instructions)
