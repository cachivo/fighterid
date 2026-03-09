

## Plan: Fix Live Streaming — Admin Input + Public Display

### Problems Found

1. **Admin input doesn't accept iframe HTML**: User pastes `<iframe src="https://www.youtube.com/embed/fLM55VyN9Ts?si=..." ...></iframe>` but the input expects a plain URL. Need to extract `src` from iframe tags.

2. **Public page `/en-vivo` only shows events with `state === 'live'`**: The query filters by `eq('state', 'live')` but streaming can be enabled on any event regardless of state (finished, scheduled, etc.). Should filter by `meta->live_stream->is_streaming` being true, not by event state.

3. **Admin filters also tied to event state**: The "En Vivo" filter checks `e.state === 'live'` instead of checking if `is_streaming` is true.

### Changes

**`src/pages/admin/LiveStreaming.tsx`**
- Update `convertToEmbedUrl` to detect and extract `src` from pasted `<iframe>` HTML tags
- Add a "streaming" filter that checks `meta.live_stream.is_streaming` instead of event state
- Add helper text telling admins they can paste iframe code, embed URL, or normal YouTube link

**`src/pages/EnVivo.tsx`**
- Remove the `eq('state', 'live')` filter — instead fetch all events and filter client-side by `meta.live_stream.is_streaming === true`
- This way any event (finished, scheduled, live) with streaming enabled will show

### Updated convertToEmbedUrl

```tsx
function convertToEmbedUrl(input: string): string {
  if (!input) return '';
  // Extract src from <iframe> tag
  const iframeMatch = input.match(/src="([^"]+)"/);
  if (iframeMatch) input = iframeMatch[1];
  // Already an embed URL
  if (input.includes('/embed/')) return input;
  // youtube.com/watch?v=VIDEO_ID
  const watchMatch = input.match(/youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/);
  if (watchMatch) return `https://www.youtube.com/embed/${watchMatch[1]}`;
  // youtu.be/VIDEO_ID
  const shortMatch = input.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
  if (shortMatch) return `https://www.youtube.com/embed/${shortMatch[1]}`;
  // youtube.com/live/VIDEO_ID
  const liveMatch = input.match(/youtube\.com\/live\/([a-zA-Z0-9_-]+)/);
  if (liveMatch) return `https://www.youtube.com/embed/${liveMatch[1]}`;
  return input;
}
```

### Files

| File | Change |
|------|--------|
| `src/pages/admin/LiveStreaming.tsx` | Parse iframe HTML, fix filters, add helper text |
| `src/pages/EnVivo.tsx` | Remove state filter, show any event with `is_streaming: true` |

