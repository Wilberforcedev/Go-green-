# Go Green Mates

Go Green Mates helps people discover community environmental activities, take part, and understand the impact they make.

## Impact Hub prototype

The Impact Hub is an interactive front-end prototype for four core journeys:

- **Discover activities:** search and filter sample tree-planting, clean-up, learning and clean-energy activities by category and location.
- **Understand Green Points:** see how points are earned after attendance is confirmed, with a clear explanation that points are participation records rather than cash.
- **Track personal impact:** review joined activities, organizer-confirmed actions and the associated sample impact measures.
- **Organizer check-in:** confirm attendance in a simple organizer view and see how confirmations update the participant dashboard.

### Demo limitations

The activity catalog, point values, and reward examples are sample content. Sign-ups, confirmations, and points are saved in the current browser's local storage. They do not sync between devices and do not provide secure identity or organizer verification. The reward cards are concepts, not live offers. Before using this for real participants, connect authenticated participant and organizer accounts to a shared backend, add audit history and abuse protection, and verify the activity and impact data with local partners.

## Run locally

Requirements: Node.js 18+ and npm.

```bash
npm install
npm run dev
```

The Vite development server prints its local URL after startup.

## Build and checks

```bash
npm run typecheck
npm run lint
npm run build
```

## Stack

- React 18 and TypeScript
- Vite
- Tailwind CSS
- Lucide icons
- Supabase client dependency is present for future backend integration; the current Impact Hub does not connect to Supabase.
