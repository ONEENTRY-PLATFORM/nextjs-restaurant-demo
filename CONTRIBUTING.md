# Contributing to Next.js Restaurant Demo (OneEntry)

Thanks for your interest in contributing! 🚀
This repository is a **reference restaurant storefront** built with **Next.js 16**, **React 19**, and the **OneEntry Headless CMS**.

We welcome bug fixes, improvements, and enhancements that help frontend developers better understand how to use OneEntry for hospitality / food-service projects.

---

## 🧩 What You Can Contribute

- Bug fixes
- UI/UX improvements
- Code refactoring
- Documentation improvements
- Performance optimizations
- Examples of best practices (Next.js App Router, RTK Query, caching, etc.)

Check open Issues labeled:

- `good first issue`
- `help wanted`
- `documentation`

---

## 🚀 Getting Started

### 1) Fork the repository

### 2) Clone your fork

```bash
git clone https://github.com/YOUR_USERNAME/nextjs-restaurant-demo.git
cd nextjs-restaurant-demo
```

### 3) Install dependencies

```bash
npm install
```

### 4) Configure environment variables

Copy `.env.example` to `.env.local` and fill in the values (see [README.md](README.md#environment-variables)).

```bash
cp .env.example .env.local
```

### 5) Run the project

```bash
npm run dev
```

Open <http://localhost:3000> in your browser.

---

## 🔁 Contribution Flow

1. **Create or comment on an Issue first** — for non-trivial changes, agree on the approach before writing code.
2. Fork the repository.
3. Create a new branch:

   ```bash
   git checkout -b feature/your-feature-name
   ```

4. Make your changes.
5. Ensure linting, types, and tests pass:

   ```bash
   npm run lint
   npm run tsc
   npm test
   ```

6. Open a Pull Request to `main`.

---

## 📏 Code Style Guidelines

- Follow the existing project structure.
- Respect ESLint and Prettier rules.
- Prefer clear, readable code over clever solutions.
- Keep TypeScript types strict — no `any` without a justified reason.
- Add JSDoc blocks to exported components, hooks, and utilities.
- Avoid introducing breaking changes without discussion.

---

## ✅ Pull Request Checklist

- [ ] Changes are scoped and self-contained.
- [ ] `npm run lint` passes.
- [ ] `npm run tsc` passes.
- [ ] `npm test` passes.
- [ ] README / docs are updated if behavior changed.
- [ ] Screenshots attached for visual changes.

---

## ❗ Important Notes

- This is a **demo / reference project**, not a production storefront.
- Keep PRs focused and reasonably sized — split large changes into smaller PRs when possible.
- Large changes or architectural shifts should be discussed in an Issue first.

---

Thanks for contributing and helping improve the OneEntry ecosystem! ❤️
