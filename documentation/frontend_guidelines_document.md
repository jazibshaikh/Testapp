# Frontend Guideline Document

This document lays out the frontend setup for **Testapp**, covering architecture, design principles, styling, component organization, state handling, routing, performance tweaks, testing, and a final recap. It’s written in everyday language so anyone—technical or not—can follow along.

## 1. Frontend Architecture

**Core Frameworks & Libraries**
- **Next.js**: Our main framework. It builds on React and gives us:
  - Server-side rendering (SSR) for faster first-page loads.
  - File-based routing: just add a file under `pages/` and you get a new route.
  - Built-in API routes (for simple backend calls) and automatic code splitting.
- **React**: Powers UI as reusable components (buttons, cards, menus).
- **TypeScript**: Adds basic type checking to catch errors early and improve editor autocompletion.
- **SCSS**: A CSS pre-processor that lets us use variables, nesting, and mixins for cleaner styles.

**Directory Structure**
```
/src
  /components   # Reusable UI parts (atoms, molecules, organisms)
  /pages        # Each file = one route (Next.js handles routing)
  /styles       # Global SCSS files, variables, mixins
  /contexts     # React Context providers for shared state
  /hooks        # Custom React hooks
  /utils        # Helpers and constants
/public         # Static assets (images, favicon)
```

**How It Scales, Stays Maintainable, and Runs Fast**
- **Scalability**: File-based routing and component folders let teams add features without changing core config.
- **Maintainability**: Clear separation—styles in `styles/`, logic in `hooks/`, UI in `components/`—reduces confusion.
- **Performance**: Next.js automatically splits code by page, and we can further optimize with lazy loading and image optimization.

## 2. Design Principles

**1. Usability**
- Simple navigation and clear labeling.
- Components that behave the way users expect (for example, buttons have hover states).

**2. Accessibility**
- Semantic HTML (use `<button>` for buttons, `<nav>` for navigation, etc.).
- ARIA labels where needed (for custom components).
- Contrast ratios that meet WCAG AA standards.

**3. Responsiveness**
- Mobile-first layout using Flexbox or CSS Grid.
- Breakpoints for small (≤ 480px), medium (481–1024px), and large (> 1024px) screens.

**4. Consistency**
- Shared style variables (colors, font sizes) so every page looks like part of the same app.
- Reusable component library for UI building blocks.

## 3. Styling and Theming

**Approach & Methodology**
- **SCSS Modules + BEM**:
  - We use SCSS for nesting and variables.
  - Follow the BEM naming pattern (`block__element--modifier`) inside module files.
- **Global Styles** in `styles/globals.scss` for resets, typefaces, and utility classes.

**Theming**
- One central file (`styles/_theme.scss`) defines colors, font stacks, and spacing units.
- Themes are switched by applying a class (e.g., `.theme-dark`) to `<body>` and using SCSS mixins.

**Visual Style**
- **Modern Flat Design**: Clean edges, clear typography, minimal shadows.

**Color Palette**
| Name         | Hex     | Usage                 |
|--------------|---------|-----------------------|
| Primary      | #0070F3 | Buttons, links        |
| Secondary    | #7928CA | Highlights, accents   |
| Accent       | #79FFE1 | Callouts, badges      |
| Background   | #F5F5F5 | Page backgrounds      |
| Surface      | #FFFFFF | Cards, modals         |
| Text Primary | #333333 | Body text             |
| Text Secondary | #666666 | Subheadings, captions |
| Error        | #E00E0E | Form errors, alerts   |

**Font**
- **Inter**, sans-serif for body and headings.
- Load via a self-hosted font file or Google Fonts in `_document.js`.

## 4. Component Structure

**Organization**
- `/components/atoms` – basic UI elements (Button, Input).
- `/components/molecules` – small groups (FormField, Card).
- `/components/organisms` – larger sections (Header, Footer).
- `/components/templates` – page layouts combining organisms and molecules.

**Reusability & Maintainability**
- Every component:
  - Lives in its own folder with `Component.tsx`, `Component.module.scss`, and `Component.test.tsx`.
  - Accepts props for dynamic content and styling tweaks.
- Shared utilities and types go in `/utils` and `/types`.

## 5. State Management

**Local State**
- Use `useState` and `useReducer` for component-level needs (toggles, form inputs).

**Global/Shared State**
- **React Context API** for app-wide settings (theme, authenticated user).
- Provide typed context in `/contexts`, consume via custom hooks (e.g., `useAuth()`).

**When to Scale Up**
- If state logic grows complex, introduce **Redux Toolkit** for structure, middleware, and dev-tools support.

## 6. Routing and Navigation

**Next.js File-Based Routing**
- Pages live in `src/pages/`.  `src/pages/about.tsx` ⇒ `/about` route.
- Dynamic routes via brackets: `src/pages/posts/[id].tsx` ⇒ `/posts/123`.

**Linking Between Pages**
- Use `next/link` for client-side transitions:
  ```
  import Link from 'next/link';
  <Link href="/about"><a>About</a></Link>
  ```
- Preload key pages by default for snappy feels.

**Custom App Shell**
- `_app.tsx` wraps pages with shared layout (Header, Footer) and context providers.
- `_document.tsx` for global `<head>` tags (fonts, meta).

## 7. Performance Optimization

**Built-In Next.js Features**
- **Automatic code splitting** by page.
- **Image optimization** with `<Image>` component (lazy loading, responsive sizes).

**Lazy Loading & Dynamic Imports**
- Heavy components only load when needed:
  ```ts
  const Chart = dynamic(() => import('../components/Chart'), { ssr: false });
  ```

**Asset Optimization**
- Compress images via build step or online tools.
- Serve SVGs as React components when possible.

**Caching & Compression**
- Leverage HTTP caching headers (set in custom server or hosting config).
- Gzip or Brotli compression for JS and CSS.

## 8. Testing and Quality Assurance

**Unit & Component Tests**
- **Jest** for logic tests.
- **React Testing Library** for rendering components and simulating user events.

**End-to-End (E2E) Tests**
- **Cypress** for full-app scenarios (e.g., form submission, navigation).

**Linting & Formatting**
- **ESLint** with a shared TypeScript/React config.
- **Prettier** for consistent code style.
- **Husky** pre-commit hooks to run `eslint --fix` and `prettier --write` before commits.

**Continuous Integration**
- **GitHub Actions** workflow runs `install → lint → test → build` on every push/PR.
- Failing checks prevent merges to `main`.

## 9. Conclusion and Overall Frontend Summary

Testapp’s frontend combines the power of Next.js, React, TypeScript, and SCSS to deliver a **scalable**, **maintainable**, and **performant** foundation. Our design principles ensure the app is **usable**, **accessible**, and **responsive** on all devices. A clear component hierarchy, simple state patterns, and file-based routing keep development friction low. Performance hooks like code splitting, image optimization, and caching help pages load quickly.

With automated testing, linting, and CI/CD in place, teams can confidently iterate on features, knowing that standards are enforced and regressions are caught early. This setup aligns perfectly with Testapp’s goal: **clone once, run one command, and focus on building real features immediately**.