# 👋 Rahul Gangwar — Portfolio

A modern, responsive developer portfolio built with **Next.js 16**, **React 19**, and **Framer Motion**. Features smooth scroll animations, an admin dashboard, project detail pages with Excalidraw architecture diagrams, and a fully responsive design across all devices.

🔗 **Live:** [rahulgangwar.vercel.app](https://rahulgangwar.vercel.app)

---

## ✨ Features

- **Responsive Design** — Optimized for Desktop, Tablet, and Mobile (down to 360px)
- **Smooth Animations** — Framer Motion `whileInView` scroll-triggered animations
- **Smooth Scrolling** — Lenis for buttery-smooth page scroll
- **Project Showcase** — Dynamic project cards with detail pages
- **Excalidraw Integration** — Upload & render system architecture diagrams inside project pages
- **GitHub Stats** — Live GitHub profile, contribution graph, top languages & recent activity
- **Contact Form** — Functional contact form with server-side API route
- **Admin Dashboard** — JWT-authenticated admin panel with:
  - Project management (add/edit/delete)
  - Architecture diagram uploads
  - Premium UI toggle controls
- **SEO Optimized** — Proper meta tags, semantic HTML, and heading hierarchy
- **SSR Hydration Fix** — Custom `HydrationGate` to prevent Framer Motion blink/flash on load

---

## 🛠️ Tech Stack

| Category       | Technology                                      |
| -------------- | ----------------------------------------------- |
| **Framework**  | Next.js 16 (App Router)                         |
| **Frontend**   | React 19, Framer Motion, Lucide Icons           |
| **Styling**    | Vanilla CSS (custom design system)              |
| **Scrolling**  | Lenis (smooth scroll)                           |
| **Auth**       | JWT (jsonwebtoken)                              |
| **Diagrams**   | Excalidraw (embedded viewer)                    |
| **Deployment** | Vercel                                          |

---

## 📁 Project Structure

```
rahull2509-Portfolio/
├── app/                    # Next.js App Router pages & layouts
│   ├── api/                # API routes (auth, contact, projects, settings)
│   ├── admin/              # Admin login & dashboard pages
│   ├── project/[id]/       # Dynamic project detail pages
│   ├── layout.jsx          # Root layout
│   ├── page.jsx            # Home page
│   └── globals.css         # Global styles & design tokens
├── data/                   # JSON data files (projects, settings)
├── public/                 # Static assets (images, resume, fonts)
├── src/
│   ├── components/         # UI components (Hero, About, Skills, etc.)
│   ├── context/            # React contexts (Auth, Project)
│   ├── hooks/              # Custom hooks
│   ├── lib/                # Utility functions
│   ├── providers/          # Context providers
│   └── views/              # Page-level views (ProjectDetail, Admin)
├── vercel.json             # Vercel deployment config
└── package.json
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** >= 18
- **npm** or **yarn**

### Installation

```bash
# Clone the repo
git clone https://github.com/rahull2509/rahull2509-Portfolio.git
cd rahull2509-Portfolio

# Install dependencies
npm install
```

### Environment Variables

Create a `.env.local` file in the root:

```env
ADMIN_EMAIL=your-admin-email@gmail.com
ADMIN_PASSWORD=your-admin-password
JWT_SECRET=your-jwt-secret-key
GITHUB_TOKEN=your-github-personal-access-token
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
npm run build
npm start
```

---

## 📱 Responsive Breakpoints

| Breakpoint | Target Device        |
| ---------- | -------------------- |
| `1024px`   | Tablets (landscape)  |
| `768px`    | Tablets (portrait)   |
| `480px`    | Mobile phones        |
| `360px`    | Small Android phones |

---

## 📂 Featured Projects

| Project               | Tech Stack                              |
| --------------------- | --------------------------------------- |
| **iNotebook**         | MongoDB, Express.js, React.js, Node.js  |
| **E-Commerce Web App**| React.js, JavaScript, REST APIs, CSS3   |
| **Newsly**            | React.js, TypeScript, News API, Tailwind|

---

## 🔐 Admin Panel

Access the admin dashboard at `/admin`:

- **Login** with configured admin credentials
- **Manage projects** — add, edit, or delete projects
- **Upload architecture diagrams** — `.excalidraw` files render inline on project detail pages
- **Toggle premium UI** — control advanced visual effects

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

## 🤝 Contact

- **Email:** rahulgangwar2625@gmail.com
- **LinkedIn:** [linkedin.com/in/rahul-gangwar-b7b1b42a0](https://linkedin.com/in/rahul-gangwar-b7b1b42a0)
- **GitHub:** [github.com/rahull2509](https://github.com/rahull2509)

---

<p align="center">Built with ❤️ by Rahul Gangwar</p>
