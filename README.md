# Artisan Frontend

Artisan is a full-stack e-commerce marketplace platform for artisans to sell their hand-crafted goods and for buyers to discover unique products. This repository contains the React-based frontend of the platform.

## 🚀 Key Features

- **Storefront & Discovery**: Browse unique artisan products, search by keywords, and filter by categories.
- **Authentication**: Secure registration and login for both Buyers and Sellers.
- **Product Details**: Comprehensive view of artisan products with high-quality images, descriptions, and ratings.
- **Reviews & Ratings**: Integrated feedback system for buyers to share their experiences.
- **Shopping Cart**: Real-time cart management with seamless addition and removal of items.
- **Order Management**: Streamlined checkout process and order history tracking.
- **Seller Dashboard**: Dedicated space for artisans to manage their listings, inventory, and track sales.
- **Responsive Design**: Optimized for a premium experience across desktops, tablets, and mobile devices.

## 🛠️ Tech Stack

- **Core**: [React 18](https://react.dev/) + [Vite](https://vitejs.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [Shadcn UI](https://ui.shadcn.com/) (Radix UI, Lucide React)
- **Data Fetching**: [TanStack Query v5](https://tanstack.com/query/latest) (React Query)
- **Routing**: [React Router v6](https://reactrouter.com/)
- **State Management**: React Context API (Auth, Cart)
- **Forms**: React Hook Form + [Zod](https://zod.dev/)
- **Feedback**: [Sonner](https://sonner.emilkowal.ski/) (Toasts)
- **Charts**: [Recharts](https://recharts.org/) (Seller analytics)
- **Testing**: [Vitest](https://vitest.dev/) (Unit/Integration), [Playwright](https://playwright.test/) (End-to-End)

## 📁 Project Structure

```text
src/
├── components/   # Reusable UI components (shadcn/ui + custom)
├── contexts/     # Auth and Cart context providers
├── hooks/        # Custom React hooks
├── lib/          # API layer and utility functions
├── pages/        # Application routes (Home, Listings, Dashboard, etc.)
└── test/         # Testing utilities and setups
```

## 🚦 Getting Started

### Prerequisites

- Node.js (v18+)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd Artisan-Frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   Create a `.env` file in the root directory and set the API base URL:
   ```env
   VITE_API_URL=http://localhost:8084
   ```

### Running Locally

```bash
npm run dev
```
The app will be available at `http://localhost:5173`.

## 📜 Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts the development server. |
| `npm run build` | Builds the project for production. |
| `npm run preview` | Previews the production build locally. |
| `npm run lint` | Runs ESLint to check for code quality issues. |
| `npm run test` | Runs unit and integration tests using Vitest. |

## 🧪 Testing

- **Unit/Integration**: Run `npm run test` to execute Vitest tests.
- **E2E**: Use Playwright for end-to-end testing (run `npx playwright test`).

