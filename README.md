# ChiChoc-Habitat

A trust-first property platform for Côte d'Ivoire — verified listings, KYC-gated
agents, on-site photo capture, and human approval before anything goes public.

Built with **Laravel 13 + Inertia 3 + React 19 + Tailwind CSS 4**, with a dark
glassmorphism design system.

## Requirements

- PHP 8.3+ with `pdo_sqlite` (or PostgreSQL) enabled
- Composer 2
- Node 20+

## First run

```bash
composer install
cp .env.example .env      # skip if .env already exists
php artisan key:generate
php artisan migrate
php artisan db:seed --class=AccessControlSeeder
npm install
```

The first access-control seed creates the bootstrap admin (`admin` /
`admin1234`). It only sets that initial password when creating the account;
re-running the seeder does not reset a password changed in the admin profile.

## Running the app

```bash
npm run dev
```

This is the only command you need. It starts **both** processes:

| Service | URL | Purpose |
|---|---|---|
| Laravel | http://localhost:8000 | The application |
| Vite | http://localhost:5173 | Assets + hot reload |

Open **http://localhost:8000** — not 5173. Port 5173 only serves compiled CSS/JS;
it contains no application.

Other scripts:

| Command | What it does |
|---|---|
| `npm run dev` | Laravel + Vite together (recommended) |
| `npm run serve` | Laravel only, on port 8000 |
| `npm run dev:assets` | Vite only, on port 5173 |
| `npm run build` | Production build into `public/build` |

## Screens

| Route | Screen |
|---|---|
| `/` | Landing — preloader, hero, search, listings, how it works, insights |
| `/properties` | Search with filters, grid/list/map views, pagination |
| `/properties/{slug}` | Property detail with the verification panel |
| `/account` | Customer dashboard — saved, offers, chats (deal receipt) |
| `/agent/kyc` | Agent KYC wizard |
| `/agent/listings/create` | Guided capture with GPS lock and checklist |
| `/agent` | Agent workspace |
| `/admin` | Staff control panel and permission-gated resources |

## Staff roles and organization access

The control panel uses Spatie Laravel Permission for additive role and direct
permission grants. The permission tables use the `rbac_` prefix because this
application already has a separate `permissions` catalog for its editable
permission matrix.

Create branches and departments under **Admin → Organization**, then edit a
staff account to assign one or more roles and its branch/department profile.
Only administrators can change role assignments or the permission matrix.
Department heads and branch managers see staff only inside their assigned
department or branch; general managers receive the explicit
`manage_all_departments` permission to oversee all branches. Staff profile
queries are globally scoped and policies independently verify access.

## Troubleshooting: blank page

A blank page at http://localhost:8000 means Laravel is rendering `@vite` pointers
to a dev server that is not running.

1. Run `npm run dev` (not `npm run dev:assets`) so Laravel is served too.
2. If you only want built assets, run `npm run build` — it removes a stale
   `public/hot` file first.
3. Force-clear it with `npm run clean:hot`, then reload.

Vite is pinned with `strictPort` on 5173, so it fails loudly instead of silently
moving to another port and leaving 8000 pointing at the wrong place.

## Design system

Tokens live in `resources/css/app.css`: void `#090C10`, glass surfaces at
`rgba(255,255,255,0.05)`, hairline borders at 10%, neon accent `#66BB6A`,
headings `#E8F5E9`, body `#A5D6A7`. Motion is one spring (stiffness 300 /
damping 30) exported from `resources/js/lib/motion.js`.

## Project layout

```
app/Http/Controllers     Inertia page controllers
app/Support              DemoInventory — showcase data (swap for Eloquent)
resources/js/Pages       Inertia pages (React)
resources/js/Components  Design-system components
resources/js/Layouts     Site and console shells
resources/css/app.css    Design tokens and utilities
routes/web.php           Web routes
```
