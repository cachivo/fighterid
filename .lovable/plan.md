

# Add "Open HUD" Button to Fight Control Panel

## What
Add a button next to each fight card in the **Live Events Control** page (`/admin/live-events`) that opens the HUD public display (`/hud/fight/{fightId}`) in a new browser tab.

## Changes

### `src/pages/admin/LiveEventsControl.tsx`
- Import `Monitor` icon from lucide-react
- Add a new button next to the existing "Ver" button inside each `FightCard`, between the AI stats dialog and the "Ver" button:

```tsx
<Button 
  size="sm" 
  variant="outline"
  onClick={() => window.open(`/hud/fight/${fight.id}`, '_blank')}
>
  <Monitor className="mr-2 h-3 w-3" />
  HUD
</Button>
```

Single file, ~3 lines added.

