# Shopping List Application - Claude Code Documentation

## Project Overview

This is a Next.js-based shopping list application with AI-powered categorization, built with TypeScript, Prisma, and TailwindCSS. The app allows users to manage shopping items organized by categories, with features for adding, editing, deleting, and AI-assisted categorization.

## Tech Stack

- **Framework**: Next.js 15.5.5 (App Router)
- **Language**: TypeScript 5.9.3
- **Database**: Prisma ORM with PostgreSQL
- **Styling**: TailwindCSS 4.1.14
- **UI Components**: Radix UI primitives
- **State Management**: TanStack Query (React Query) 5.90.3
- **Authentication**: Custom JWT-based auth with jose
- **AI Integration**: Vercel AI SDK 5.0.72
- **Drag & Drop**: @dnd-kit
- **Deployment**: Vercel

## Project Structure

```
├── app/                          # Next.js App Router pages
│   ├── (loggedin)/              # Protected routes group
│   │   ├── layout.tsx           # Protected layout
│   │   ├── page.tsx             # Main shopping list page
│   │   ├── list/page.tsx        # Shopping list view
│   │   ├── pantry/page.tsx      # Pantry management
│   │   └── profile/page.tsx     # User profile
│   ├── layout.tsx               # Root layout
│   └── manifest.ts              # PWA manifest
├── components/                   # React components
│   ├── ui/                      # Reusable UI components (Radix-based)
│   ├── pantry/                  # Pantry-specific components
│   ├── shopping-list.tsx        # Main shopping list component
│   ├── shopping-list-item.tsx   # Individual item component
│   ├── shopping-list-input.tsx  # Add item input
│   ├── category-list.tsx        # Category management
│   └── category-list-item.tsx   # Individual category component
├── hooks/                       # Custom React hooks
│   ├── use-shopping-list.tsx    # Shopping list state management
│   ├── use-categories.tsx       # Category state management
│   ├── use-pantry.tsx          # Pantry state management
│   └── use-*.tsx               # Other utility hooks
├── server/                      # Server actions and utilities
│   ├── shopping-items.actions.ts # Shopping item CRUD operations
│   ├── categories.actions.ts    # Category CRUD operations
│   ├── pantry.actions.ts       # Pantry CRUD operations
│   ├── auth.actions.ts         # Authentication actions
│   └── prisma.ts               # Prisma client setup
├── services/                    # External services
│   └── ai.ts                   # AI categorization service
└── lib/                        # Utility libraries
    └── utils.ts                # Common utilities
```

## Key Features

### 1. Shopping List Management
- Add items individually or via AI-powered bulk input
- Edit item names inline
- Delete individual items
- **NEW**: Delete all items in a category group with corner delete button
- Automatic AI categorization of new items
- Real-time updates with optimistic UI

### 2. Category Management
- Create custom categories with descriptions
- Drag-and-drop reordering
- AI uses category descriptions for better item categorization
- Delete entire categories (affects categorization only)

### 3. Pantry Management
- Track items in different pantry areas
- Set expiration dates
- Manage quantities

### 4. AI Integration
- Automatic item categorization using category descriptions
- Bulk item generation from natural language prompts
- Uses Vercel AI SDK for LLM integration

## Development Commands

```bash
# Development
npm run dev                    # Start development server with env pull

# Building
npm run build                 # Build for production (includes DB push)

# Linting
npm run lint                  # Run ESLint checks

# Database
npx prisma db push           # Push schema changes to database
npx prisma studio           # Open Prisma Studio
```

## Recent Implementation: Category Group Delete Button

### What was added:
- Delete button in the top-right corner of each category group
- Server action `deleteItemsByCategory` to delete all items in a specific category
- Hook `useShoppingListDeleteItemsByCategory` for optimistic updates
- Toast notifications for success/error feedback
- Proper loading states and error handling

### Files modified:
1. `server/shopping-items.actions.ts:111-124` - Added `deleteItemsByCategory` server action
2. `hooks/use-shopping-list.tsx:8,104-117` - Added import and hook for category deletion
3. `components/shopping-list.tsx:4,7-10,21-41,67-84` - Added UI button and delete functionality

### Technical details:
- Uses Trash2 icon from Lucide React
- Button is positioned absolute in top-right corner of category header
- Includes hover effects (text-muted-foreground → text-destructive)
- Optimistic updates remove category immediately from UI
- Server action deletes all items with matching categoryId and userId
- Proper error handling with rollback on failure

## Database Schema

The app uses Prisma with the following key models:

```prisma
model User {
  id            Int            @id @default(autoincrement())
  email         String         @unique
  passwordHash  String
  shoppingItems ShoppingItem[]
  categories    Category[]
  pantryItems   PantryItem[]
}

model Category {
  id            Int            @id @default(autoincrement())
  name          String
  description   String?
  sortIndex     Int            @default(0)
  userId        Int
  user          User           @relation(fields: [userId], references: [id])
  shoppingItems ShoppingItem[]
}

model ShoppingItem {
  id         Int      @id @default(autoincrement())
  name       String
  categoryId Int
  userId     Int
  createdAt  DateTime @default(now())
  category   Category @relation(fields: [categoryId], references: [id])
  user       User     @relation(fields: [userId], references: [id])
}
```

## State Management

The app uses TanStack Query for server state management with custom hooks:

- `useShoppingListItems()` - Fetches and caches shopping items
- `useShoppingListAddItem()` - Adds single items
- `useShoppingListAddMultiItem()` - Adds multiple items via AI
- `useShoppingListDeleteItem()` - Deletes individual items
- `useShoppingListDeleteItemsByCategory()` - **NEW**: Deletes all items in category
- `useShoppingListDeleteAllItems()` - Deletes all items

All hooks include optimistic updates for immediate UI feedback.

## Authentication

Custom JWT-based authentication using the `jose` library:
- Server-side session validation in `server/utils.ts:requireAuth()`
- Protected routes wrapped in `(loggedin)` group
- Authentication actions in `server/auth.actions.ts`

## AI Integration

The AI service (`services/ai.ts`) provides:
- Item categorization based on category descriptions
- Bulk shopping list generation from natural language
- Integration with Vercel AI SDK

## Deployment

The app is deployed on Vercel with:
- Automatic builds on push
- Environment variables for database and AI API keys
- PWA support with manifest and service worker

## Environment Variables

Required environment variables:
```
DATABASE_URL="postgresql://..."
JWT_SECRET="your-jwt-secret"
OPENAI_API_KEY="sk-..."  # For AI features
```

## Contributing

1. Follow the existing code patterns and conventions
2. Use TypeScript strictly
3. Follow the component structure in `/components`
4. Use server actions for data mutations
5. Include proper error handling and loading states
6. Run `npm run lint` before committing
7. Test optimistic updates work correctly