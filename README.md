# [Nishant's Portfolio](https://nishantapatil3.github.io/)

A modern, minimalist personal portfolio and blog built with performance and aesthetics in mind.

## ✨ Features

- **Dynamic Theme System**: Seamless switching between Dark and Light modes with:
  - Automatic synchronization with system preferences.
  - Persistent theme selection via `localStorage`.
  - Zero-flicker loading (FOUC prevention).
  - Cross-tab synchronization.
- **Responsive Design**: Fully optimized for mobile, tablet, and desktop viewing.
- **Minimalist Aesthetic**: Clean typography and UI elements using Vanilla CSS and SVG icons.
- **Integrated Blog**: A built-in blog system supporting markdown-based posts and automated imports.
- **Static Site Performance**: Fast loading times leveraging Vite's optimized build process.

## 🛠️ Technology Stack

- **Core**: HTML5, Vanilla JavaScript (ESM)
- **Styling**: Vanilla CSS (Modern CSS variables and Flexbox/Grid)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Icons**: Custom SVG

## 🚀 Local Development

To get the project running locally:

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Start Dev Server**:
   ```bash
   npm run dev
   ```

3. **Access the Site**:
   - Main Portfolio: [http://localhost:5173](http://localhost:5173)
   - Writing/Blog: [http://localhost:5173/posts/](http://localhost:5173/posts/)

## 📦 Build and Deployment

Generate a production-ready static site:

```bash
npm run build
```

Preview the production build:
```bash
npm run preview
```

## ✍️ Writing and Content

The blog system is designed to be simple and extendable. You can add new posts by creating a markdown file in the `public/posts/` directory.

Detailed instructions on adding posts, importing from Medium/Outshift, and organizing content can be found in [public/posts/README.md](public/posts/README.md).

## 📄 License

This project is licensed under the Apache License 2.0. See the [LICENSE](LICENSE) file for details.
