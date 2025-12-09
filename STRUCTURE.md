# ThryvLoop Project Structure

## Folder Organization

```
thryvloop/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── page.js            # Landing page
│   │   ├── layout.js          # Root layout
│   │   ├── globals.css        # Base styles & variables
│   │   ├── auth/
│   │   │   ├── signin/
│   │   │   │   └── page.js    # Sign in page
│   │   │   └── signup/
│   │   │       └── page.js    # Sign up page
│   │   └── dashboard/
│   │       └── page.js         # Main dashboard
│   ├── components/             # Reusable components
│   │   └── layout/
│   │       ├── Navbar.js      # Navigation component
│   │       ├── Navbar.css
│   │       ├── Footer.js      # Footer component
│   │       └── Footer.css
│   └── styles/                # Page-specific styles
│       ├── landing.css        # Landing page styles
│       ├── auth.css           # Auth pages styles
│       └── dashboard.css      # Dashboard styles
```

## Page Structure

### Landing Page (`/`)
- Uses `Navbar` and `Footer` components
- Imports `landing.css` for styling
- Contains: Hero, Features, Solutions, Resources, Pricing sections

### Sign Up Page (`/auth/signup`)
- Standalone auth page
- Uses `auth.css` for styling
- Form with email, password, and social login options

### Sign In Page (`/auth/signin`)
- Standalone auth page
- Uses `auth.css` for styling
- Form with email, password, and social login options

### Dashboard (`/dashboard`)
- Uses `Navbar` with `variant="app"` for app-specific navigation
- Uses `dashboard.css` for styling
- Main application interface

## Component Variants

### Navbar
- `variant="landing"` - For landing page (light background)
- `variant="app"` - For application pages (dark background)

## CSS Organization

- **globals.css**: Base reset, CSS variables, shared button styles
- **landing.css**: All landing page section styles
- **auth.css**: Authentication page styles
- **dashboard.css**: Dashboard and app interface styles
- **Component CSS**: Each component has its own CSS file (Navbar.css, Footer.css)

## Path Aliases

The project uses `@/` alias for imports:
- `@/components/*` - Component imports
- `@/styles/*` - Style imports

## Next Steps

You can now:
1. Add more dashboard pages (tasks, analytics, settings, etc.)
2. Create additional components as needed
3. Add authentication logic
4. Implement API routes
5. Add state management if needed

