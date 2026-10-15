# Stock And Shop Sync

Build a modern, responsive, single-page e-commerce website with an integrated inventory management panel for an academic assignment.

Storefront: Create a polished UI with sample products, product images, search, category filters, product cards, add-to-cart functionality, quantity controls, cart totals, and a checkout form with basic validation and a simulated order confirmation. Do not integrate real payments.

Inventory Panel: Provide a dedicated admin view accessible through a simple Store/Admin toggle. Allow adding, editing, and deleting products, updating stock and prices, and viewing inventory statistics (total products, total stock, low-stock items, and out-of-stock items).

Functionality: Use shared product and inventory state so changes instantly reflect across both views. Automatically update stock after simulated purchases, prevent purchases exceeding available stock, and persist products, cart, and relevant state using localStorage. Include sensible sample data and basic form validation.

Design: Use a clean, professional retail aesthetic, responsive layouts, consistent typography, polished product cards, clear navigation, and intuitive admin tables or cards. Include loading, empty, and error states where appropriate.

Technical Requirements: Use Lovable's existing React and TypeScript setup, reusable components, and minimal dependencies. Avoid unnecessary backend services, authentication systems, APIs, and complex features. Organize the code cleanly, ensure all buttons and forms work, and handle edge cases. Keep the project compatible with GitHub integration and Vercel deployment.

Execution: Implement the complete working application in one pass. Prioritize functional requirements, visual polish, and maintainable code. Do not add features beyond the specified scope. Verify that storefront operations, inventory changes, cart calculations, checkout, and localStorage persistence work correctly.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://stock-and-shop-sync.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/7907aabd-f5dd-48bc-9f00-72e3e19e4087).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
