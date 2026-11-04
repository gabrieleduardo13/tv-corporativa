<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Application architecture
- Use the shared MediaProvider and Shell at the root for programming state and navigation across all CMS pages; keeps controls synchronized.
- Persist signed-in media in owner-scoped tv_slides rows and private tv-media storage; signed-out examples are session-only demonstrations, not real account data.
- Keep media thumbnails and the upload/edit dialog as shared presentation modules so all programming surfaces use consistent controls.
- Keep `/player` inside the shared MediaProvider but outside Shell so TV playback shares programming state without administrative chrome.
