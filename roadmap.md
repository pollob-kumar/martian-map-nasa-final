# Roadmap — NASA competition polish (prompt-32)
## Direct Marswalk entry and copy cleanup (prompt-38)
- [x] Remove redundant brand headings and decorative labels without removing NASA credits or limitations
- [x] Send homepage timer and scroll entry directly to Marswalk, preserving globe exploration
- [x] Verify mobile hook, desktop/phone entry, and regressions (34 tests pass; no browser errors)

## App navigation and phone map (prompt-37)
- [x] Verify the mobile-hook error and preserve the rotating globe
- [x] Add three-second homepage entry, three-scroll entry, bottom page navigation, and Back controls
- [x] Fix phone Map & Route clipping and keep navigation buttons readable without hovering
- [x] Test desktop and phone flows and commit changes

- [x] Compare the 3 new uploads (identical to the already-merged versions)
- [x] Download real NASA MOLA terrain for Jezero with the backend's own (unchanged) pipeline
- [x] Run backend with live NASA DONKI solar-event feed
- [x] Save a snapshot of backend answers so the published app shows real NASA data when the server is offline
- [x] Screenshot every page and show the user

## Opening globe and navigation (prompt-33)
- [x] Verify the reported mobile-hook error
- [x] Open on the globe; add Mission Map buttons and downward scroll/touch entry
- [x] Add original backend source links with honest data status
- [x] Test desktop/mobile navigation and preserve Visor Exit

## Martian Map competition review (prompt-34)
- [x] Verify the reported mobile-hook error with its existing test and the running Mission Map
- [x] Review all content pages and prepare a focused improvement plan
- [x] Implement Martian Map branding, NASA-photo setup page, explicit globe entry, and clearer Visor controls
- [x] Replace generic demo banners with accurate simulated/derived source labels; organize Data Sources
- [x] Verify all content pages on desktop/phone, passing tests, and robot → Visor → tour → Exit flow

## Team identity and obstacle-aware crew (prompt-35)
- [x] Apply supplied logo, favicon package, and exact tagline
- [x] Replace black helmet-loading screen with a NASA-photo loading view
- [x] Make autonomous crew route around physical scene objects and test collision clearance
- [x] Verify desktop/phone identity layout, helmet loading, WALK activation, and the reported hook error; all 31 tests pass
