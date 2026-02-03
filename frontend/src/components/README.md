# Components - Atomic Design Structure

This project follows the Atomic Design methodology for organizing components.

## Structure

### 🔹 atoms/
Basic building blocks - the smallest components.
- Buttons
- Input fields
- Labels
- Icons
- Typography components

**Example**: `Button.tsx`, `Input.tsx`, `Label.tsx`

### 🔸 molecules/
Simple combinations of atoms working together.
- Search bar (input + button)
- Form field (label + input + error message)
- Card header (icon + title)

**Example**: `SearchBar.tsx`, `FormField.tsx`

### 🔶 organisms/
Complex UI components made of molecules and atoms.
- Navigation bar
- Sidebar
- Forms
- Data tables

**Example**: `Navbar.tsx`, `Sidebar.tsx`, `TimerCard.tsx`

### 🔷 templates/
Page layouts without real content - the skeleton/structure.
- Main layout
- Dashboard layout
- Auth layout

**Example**: `MainLayout.tsx`, `DashboardLayout.tsx`

### 📄 pages/
Actual pages with real content and data.
Located in `src/pages/` instead of here.

**Example**: `HomePage.tsx`, `DashboardPage.tsx`

## UI Components from Shadcn

Shadcn components go in `components/ui/` and serve as our base atoms.
We can wrap or extend them in our own atoms if needed.

## Guidelines

1. Keep atoms small and focused
2. Molecules should be simple combinations
3. Organisms can be complex but should be reusable
4. Templates define layout structure
5. Pages consume everything and handle data
