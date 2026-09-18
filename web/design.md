# Design system

> **Required first step:** complete this document before implementing product
> features or introducing new UI patterns. Replace every `[Fill in]` value,
> remove this notice when the system is approved, and keep later decisions here.

This document is the single source of truth for the product's visual language,
interaction model, and component decisions. It complements HeroUI; it does not
replace HeroUI's accessible primitives.

## Mandatory design rules

These rules apply to every product task, including when this template still has
unresolved placeholders. Keep them when completing or updating this document.

- **Every word must add information.** Never add filler copy, decorative labels,
  generic slogans, redundant headings, or descriptions that repeat what is
  already clear. Text must help users understand content, make a decision, take
  an action, or understand a state. Remove text that serves none of these
  purposes; preserve necessary instructions and accessible labels.
- **Every border or line must have a purpose.** Avoid unnecessary card outlines,
  panel borders, dividers, and decorative rules. Establish hierarchy with spacing,
  alignment, typography, and grouping first. Use a border or separator only when
  it materially improves comprehension or control recognition. Preserve visible
  focus indicators and boundaries needed for accessibility.
- **Treat space as part of the design.** Use a consistent spacing scale and
  deliberate padding, gaps, margins, and line heights. Keep related elements
  closer together than unrelated groups. Balance density and breathing room;
  avoid cramped controls, arbitrary gaps, and oversized empty areas. Check
  alignment, readable line lengths, and spacing at mobile and desktop widths,
  including when text wraps or expands.

## 1. Product foundation

- Product name: [Fill in]
- One-sentence promise: [Fill in]
- Primary audience: [Fill in]
- Key user needs: [Fill in]
- Brand personality: [Fill in]
- Words and patterns to avoid: [Fill in]

## 2. Visual direction

- Design principles, in priority order: [Fill in]
- Reference products or visual inspirations: [Fill in]
- What makes this product recognisable: [Fill in]
- Density: [Fill in: compact, balanced, or spacious]
- Shape language: [Fill in: sharp, soft, or mixed]

## 3. Foundations

### Color

Define semantic tokens, not component-specific colors.

| Token        | Light value | Dark value | Usage              |
| ------------ | ----------- | ---------- | ------------------ |
| `background` | [Fill in]   | [Fill in]  | App canvas         |
| `foreground` | [Fill in]   | [Fill in]  | Primary text       |
| `surface`    | [Fill in]   | [Fill in]  | Cards and panels   |
| `accent`     | [Fill in]   | [Fill in]  | Primary action     |
| `muted`      | [Fill in]   | [Fill in]  | Secondary text     |
| `danger`     | [Fill in]   | [Fill in]  | Destructive states |

Contrast requirements: [Fill in]

### Typography

- Display family and weights: [Fill in]
- Body family and weights: [Fill in]
- Code family: [Fill in]
- Type scale: [Fill in]
- Line-height rules: [Fill in]
- Maximum readable line length: [Fill in]

### Spacing, shape, and elevation

- Base spacing unit: [Fill in]
- Spacing scale: [Fill in]
- Border radii: [Fill in]
- Border treatment: [Fill in]
- Shadow/elevation levels: [Fill in]
- Focus ring treatment: [Fill in]

### Motion

- Motion principles: [Fill in]
- Duration scale: [Fill in]
- Easing curves: [Fill in]
- Reduced-motion behavior: [Fill in]

## 4. Component system

Use HeroUI v3 components first. Document any wrapper or new primitive before
adding it to the codebase.

| Component/pattern | HeroUI primitive | Approved variants | Usage guidance |
| ----------------- | ---------------- | ----------------- | -------------- |
| Button            | `Button`         | [Fill in]         | [Fill in]      |
| Link              | `Link`           | [Fill in]         | [Fill in]      |
| Card              | `Card`           | [Fill in]         | [Fill in]      |
| Form field        | [Fill in]        | [Fill in]         | [Fill in]      |
| Feedback          | [Fill in]        | [Fill in]         | [Fill in]      |

Component rules:

- Composition rule: [Fill in]
- Loading and pending states: [Fill in]
- Empty states: [Fill in]
- Error states: [Fill in]
- Destructive actions: [Fill in]
- Responsive behavior: [Fill in]

## 5. Accessibility and content

- Keyboard interaction expectations: [Fill in]
- Screen-reader and semantic HTML requirements: [Fill in]
- Minimum contrast target: [Fill in]
- Localization and text expansion rules: [Fill in]
- Voice and tone: [Fill in]
- Content examples: [Fill in]

## 6. Layout and responsive behavior

- Container widths: [Fill in]
- Breakpoints: [Fill in]
- Navigation behavior by breakpoint: [Fill in]
- Mobile-first exceptions: [Fill in]
- Table/data-density strategy: [Fill in]

## 7. Decision log

Record meaningful deviations from HeroUI defaults or previously approved
patterns.

| Date         | Decision  | Reason    | Owner     |
| ------------ | --------- | --------- | --------- |
| [YYYY-MM-DD] | [Fill in] | [Fill in] | [Fill in] |

- 2026-09-18: Require informative copy, purposeful borders, and deliberate spacing
  for every product task. Keep these permanent rules in this document and enforce
  them through the main agent instructions to prevent visual and content clutter.

## 8. Review checklist

- [ ] All `[Fill in]` placeholders are resolved.
- [ ] Tokens are semantic and have light/dark values where needed.
- [ ] Keyboard, focus, contrast, and reduced-motion behavior are defined.
- [ ] Approved HeroUI primitives and variants are listed.
- [ ] A representative page has been checked at mobile and desktop widths.
- [ ] Every piece of copy adds useful information; filler and repetition are removed.
- [ ] Every border, divider, and line has a functional or accessibility purpose.
- [ ] Spacing, grouping, alignment, and text wrapping are deliberate at mobile and desktop widths.
- [ ] The team has approved this document before feature implementation.
