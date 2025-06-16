# Application Architecture: One-Pager AI

This document provides a detailed overview of the technical architecture for the "One-Pager AI" application. Its purpose is to serve as a comprehensive guide for developers and a context-rich resource for AI assistants.

## 1. Overview

One-Pager AI is a web application designed to help users, particularly product managers, create, manage, and refine one-pager documents using AI-powered assistance. Users can create documents with multiple sections, reorder them, and leverage Google's Gemini AI to generate initial content and refine existing text for specific fields like titles or content bodies. The application features a real-time, interactive editing experience with a "Smart Toolbar" that provides contextual controls for AI suggestions.

## 2. Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (v15) with the App Router
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Backend & Database**: [Supabase](https://supabase.io/)
  - **Authentication**: Supabase Auth
  - **Database**: Supabase Postgres
  - **Serverless Functions**: Supabase Edge Functions (Deno runtime)
- **AI Integration**: [Google Gemini Pro API](https://ai.google.dev/)
- **UI & Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Drag & Drop**: [dnd-kit](https://dndkit.com/) for reordering document blocks.
- **Deployment**:
  - Frontend: Vercel (assumed, typical for Next.js)
  - Backend Functions: Supabase CLI

## 3. Project Structure

The project follows a standard Next.js App Router structure, with backend functions co-located in the `supabase` directory.

```
/
├── app/                  # Next.js App Router
│   ├── components/       # Reusable React components
│   │   └── SideBySideModal.tsx
│   ├── contexts/         # React Context for global state
│   │   └── AuthContext.tsx
│   ├── layout.tsx        # Root application layout
│   └── page.tsx          # Main page component, core UI logic
├── public/               # Static assets
├── supabase/             # Supabase configuration and functions
│   └── functions/
│       ├── generate-one-pager/ # Function to generate a new doc
│       │   └── index.ts
│       └── refine-with-ai/     # Function for AI-powered text refinement
│           └── index.ts
├── package.json          # Project dependencies and scripts
└── ... (config files)
```

## 4. Frontend Architecture

The frontend is a single-page application built with Next.js and React.

### Core Components

- **`app/page.tsx`**: This is the main component that renders the entire one-pager editor. It manages the application's core state, including the document's blocks, AI suggestions, and user interactions.
- **`SortableEditableBlock` (in `app/page.tsx`)**: A crucial component that renders an individual section (a "block") of the one-pager.
  - It handles local UI state like menu visibility.
  - It displays the block's title and content, making them editable.
  - It implements the "Smart Toolbar" logic, conditionally rendering either the standard `...` menu or the AI suggestion controls (`View`, `Accept`, `Reject`).
- **`SideBySideModal` (`app/components/SideBySideModal.tsx`)**: A modal component that displays a side-by-side comparison of the original text and the AI-suggested text, allowing the user to make an informed decision.

### State Management

- **Local Component State (`useState`, `useCallback`)**: The primary method for state management is React's built-in hooks within `app/page.tsx`.
- **Core Data Structures**:
  - **`Block`**: An object representing a section of the document.
    ```typescript
    type Block = {
      id: string;
      title: string;
      content: string;
      suggestion?: AiSuggestion | null; // Holds an active AI suggestion
    }
    ```
  - **`AiSuggestion`**: An object representing a pending AI suggestion for a specific field.
    ```typescript
    type AiSuggestion = {
      forField: 'title' | 'content';
      text: string; // The suggested text
      action: string; // The prompt action used (e.g., "Make More Concise")
    };
    ```
- **Authentication State (`app/contexts/AuthContext.tsx`)**:
  - A simple React Context that wraps the application.
  - It uses the Supabase client to manage the user's session state (`session`) and provides the Supabase client instance (`supabase`) to the rest of the app.
  - It listens for authentication state changes and triggers a router refresh to re-render the UI accordingly.

### UI & Styling

- **Tailwind CSS**: Used for all styling, following a utility-first approach.
- **dnd-kit**: Implements drag-and-drop functionality, allowing users to reorder the content blocks seamlessly.

## 5. Backend Architecture

The backend logic is implemented as serverless edge functions hosted on Supabase.

### Supabase Functions

- **Runtime**: Deno
- **`refine-with-ai`**:
  - **Purpose**: Takes a specific field from the document and a user-selected action, then uses an AI model to refine the text.
  - **Trigger**: Called from the frontend when a user selects a "Refine with AI" action.
  - **Inputs**: `documentContext` (the full document for context), `targetField` (the specific label and value to refine), and `specificAction` (the user's instruction).
  - **Process**: Constructs a detailed prompt for the Gemini API, including the full document context but explicitly telling the AI to *only* focus on and rewrite the `targetField`.
  - **Output**: Returns the `refinedText` as a JSON object.
- **`generate-one-pager`**:
  - **Purpose**: Generates a full one-pager structure based on a single product title.
  - **Trigger**: Called when the user clicks the "Generate" button.
  - **Input**: `title` (the document title).
  - **Process**: Uses a "Working Backwards" style prompt, instructing the AI to first internally imagine a press release and then generate the structured fields (`Problem Statement`, `Solution`, etc.) based on that thinking. The response format is enforced as JSON.
  - **Output**: Returns a `generatedOnePager` object containing an array of `fields`.

## 6. Data Flow: "Refine with AI" Feature

1.  **User Action**: The user clicks a "Refine with AI" option (e.g., "Make More Concise") for a specific field (e.g., the content of the "Problem Statement" block).
2.  **Frontend Request**: The `handleAiAction` function in `app/page.tsx` is called. It packages the `documentContext`, the `targetField`, and the `specificAction` into a request body.
3.  **Supabase Function Invocation**: The frontend uses `supabase.functions.invoke('refine-with-ai', { ... })`.
4.  **Backend Processing**: The `refine-with-ai` function receives the request, constructs the prompt, and sends it to the Google Gemini API.
5.  **AI Response**: The Gemini API returns the refined text.
6.  **Backend Response**: The Supabase function parses the AI response and sends the `refinedText` back to the frontend.
7.  **Frontend State Update**:
    - The `handleAiAction` function receives the `refinedText`.
    - It calls `setBlocks` to update the state of the specific block that was targeted. A new `suggestion` object is added to that block.
8.  **UI Re-render**:
    - React re-renders the `SortableEditableBlock`.
    - The block's input/textarea now displays the `suggestion.text`.
    - The "Smart Toolbar" appears, showing the `View`, `Accept`, and `Reject` icons because `block.suggestion` is now truthy.

## 7. Key Libraries & Dependencies

- `next`: React framework
- `@supabase/supabase-js`: Supabase client library
- `@supabase/ssr`: Supabase server-side rendering helpers
- `react`, `react-dom`: UI library
- `@dnd-kit/core`, `@dnd-kit/sortable`: Drag and drop functionality
- `tailwindcss`: Utility-first CSS framework
- `uuid`: For generating unique IDs for new blocks
- `typescript`: For static typing 