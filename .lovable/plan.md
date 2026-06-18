## Make header logo larger

In `src/components/AppShell.tsx`, increase the size of the logo container and image in the header.

### Changes
- Bump the logo wrapper from its current small size (~h-10 w-10) to roughly `h-14 w-14` (mobile) / `h-16 w-16` (desktop).
- Scale the inner `<img>` to fill the new wrapper.
- Keep rounded-2xl shadow styling and existing alignment so the app title stays vertically centered next to it.

No other components, routes, or logic touched.