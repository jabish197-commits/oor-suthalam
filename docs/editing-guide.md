# Editing Oor Suthalam

The active frontend is `client/oor-suthalam`. The backend is `server`.
Open the MERN folder in VS Code. Avoid editing `node_modules` or `dist`.

## Where to change each feature

| Change | File relative to MERN |
| --- | --- |
| Homepage sections, search and wording | `client/oor-suthalam/src/pages/public/Home.jsx` |
| Header, menu links, account menu, logout | `client/oor-suthalam/src/components/common/Navbar.jsx` |
| Navbar bus drawing | `client/oor-suthalam/src/components/common/NavJourney.jsx` |
| Bottom mobile navigation links | `client/oor-suthalam/src/components/common/MobileNavigation.jsx` |
| Plane animation path and speed | `client/oor-suthalam/src/components/common/TravelAnimation.jsx` |
| Destination card contents | `client/oor-suthalam/src/components/destinations/DestinationCard.jsx` |
| Destination search and filters | `client/oor-suthalam/src/pages/public/Destinations.jsx` |
| Destination details page | `client/oor-suthalam/src/pages/public/DestinationDetails.jsx` |
| Package list and details | `client/oor-suthalam/src/pages/public/Packages.jsx`, `PackageDetails.jsx` |
| Login and registration | `client/oor-suthalam/src/pages/auth/Login.jsx`, `Register.jsx` |
| Traveler pages | `client/oor-suthalam/src/pages/traveler/` |
| Booking refresh and cancellation UI | `client/oor-suthalam/src/components/bookings/BookingList.jsx` |
| Admin pages | `client/oor-suthalam/src/pages/admin/` |
| Admin add/edit form and save messages | `client/oor-suthalam/src/components/common/CatalogManager.jsx` |
| Destination photo picker and preview | `client/oor-suthalam/src/components/common/PhotoUpload.jsx` |
| Frontend URL routes | `client/oor-suthalam/src/routes/AppRoutes.jsx` |
| Frontend requests to backend | `client/oor-suthalam/src/services/` |
| User session state | `client/oor-suthalam/src/context/AuthContext.jsx` |

## Colours and layout

CSS currently has several layers. Later rules with the same specificity override
earlier ones. Search for the component's class before adding another rule.
Prefer changing the existing matching rule instead of appending a new override.

| Stylesheet | Purpose |
| --- | --- |
| `client/oor-suthalam/src/assets/styles.css` | Original shared controls, forms, authentication and layout |
| `client/oor-suthalam/src/assets/traveler.css` | Public/traveler design, desktop and responsive base |
| `client/oor-suthalam/src/assets/mobile-app.css` | Mobile interface, drawer, bottom bar; recent shared navbar refinements also live here |
| `client/oor-suthalam/src/assets/admin.css` | Admin workspace |

Most mobile rules use `@media (max-width: 800px)`. Check both a phone-sized
viewport and desktop after changing them. `.travel-site` scopes traveler styles;
`.admin-shell` scopes admin styles. Keep those scopes to avoid accidental changes.

The mobile drawer must stay a single vertical scrolling list. Keep
`travel-menu-content` as its inner container. Do not give the drawer a CSS column
count: a fixed-height multicolumn layout can push links into a second column.

The original banner is `client/oor-suthalam/public/images/travel-banner.png`.
The login banner is `travel-banner1.png` in the same directory. Navbar logo is
`client/oor-suthalam/public/logo.png`. Logo white is blended by CSS; the original
image itself has not been edited.

## Backend request flow

1. Frontend service sends a request through `services/api.js`.
2. Vite proxies `/api` to the backend in development.
3. `server/src/routes/index.js` selects the resource router.
4. Authentication, permissions and validation run before the controller.
5. The controller uses a Mongoose model to read or update MongoDB.

| Change | Backend location |
| --- | --- |
| Express setup, CORS and photo serving | `server/src/app.js` |
| Startup | `server/src/server.js` |
| Database connection | `server/src/config/db.js` |
| Account/login operations | `server/src/controllers/authController.js` |
| Destination/package operations | `server/src/controllers/destinationController.js`, `packageController.js` |
| Photo validation and resizing | `server/src/controllers/imageController.js` |
| Input validation | `server/src/validators/index.js` |
| Database fields | `server/src/models/` |
| Itinerary generation | `server/src/services/itineraryService.js` |

Uploaded images are stored in `server/uploads/` and exposed through `/api/uploads/`.
That folder is ignored by Git. Back it up with the database when moving the app.

## Local development commands

Run these from MERN:

```powershell
npm run dev:local
npm run build
npm test
npm run format
npm run format:check
```

Keep the development terminal running while using the site. Use the exact Vite
address printed there; another project might already occupy a port.
`npm run dev` still uses the Atlas configuration. `dev:local` explicitly uses
the separate local database `oor_suthalam_local` without rewriting Atlas settings.

Run local maintenance commands from `server`:

```powershell
npm run db:check:local
npm run admin:local -- your-registered-email@example.com
npm run password:reset:local -- your-registered-email@example.com
npm run catalog:local
```

Register before promoting or resetting an account. Enter passwords privately in
the reset prompt. Do not put passwords in source code or command arguments.
The starter catalog command preserves existing records and photos. Edit actual
destination content and photos through the admin website; changing the seed file
does not update existing database records.

## A practical editing routine

1. Find the feature in the table above.
2. Change its JSX for structure, its scoped CSS for appearance, or its service and
   controller for data behaviour.
3. Save and check the browser. Check errors in the terminal and browser console.
4. Run `npm run format`, then the build and relevant tests.

Formatting makes code consistently readable; it does not change functionality or
prove how code was originally authored. CSS layers still need gradual
consolidation rather than more appended overrides.

## Flights, international itineraries and travel partners

- `/flights`: authenticated flight enquiry form and request history. Admins review
  enquiries at `/admin/flights`. No airline provider is connected; this does not
  search live fares, reserve seats, issue tickets or collect payments.
- `/packages?type=flight`: flight-based itinerary requests. A quote-only package
  has `priceMode: quote`; zero is a storage placeholder, never a free offer.
  Quote requests cannot be confirmed as priced bookings. Agree the actual fare
  separately before making any commercial commitment.
- `/traveler/bookings`: travelers can request another package, date or group size.
  `/admin/changes` approves or rejects the proposal. Approval recalculates the
  price on the server, resets the booking to pending and clears partner assignment
  so the new itinerary is not silently sent to an old provider.
- `/partners`: travel company applications and a directory of approved companies.
  Normal users retain the traveler role; approved partnership is a separate
  permission, not a self-selected admin/operator role.
- `/admin/partners`: admin reviews companies and assigns booking requests.
  Approved partners see only assigned itinerary, date, headcount and status.
  Traveler contact details are not shared. No emails or external messages are sent.
- Local catalog import: `npm --prefix server run catalog:international:local`.
  Adds missing destination and package records without changing existing photos.
  Photo uploads remain in Manage Destinations. International fares are on request.

Feature code: `pages/public/Flights.jsx`, `pages/public/Partners.jsx`,
`components/bookings/BookingChangeForm.jsx`, `pages/admin/BookingChanges.jsx`
inside the active frontend source; matching controllers, routes and models are
under `server/src`. Existing live bus tracking and payment integrations are not
part of this implementation.

### Admin messages and live updates

- Admin inbox: `/admin/messages`. Sidebar and top-bar envelope icons open it.
- Contact enquiries remain in MongoDB; the inbox lists the most recent 200 and supports search.
- `server/src/services/realtime.js` attaches Socket.IO to the HTTP server at `/api/socket.io`. Connections require a valid administrator session cookie and an allowed Origin.
- After a successful enquiry save, `inquiryController.js` emits an invalidation event. The client fetches the protected inbox again; reconnecting also refreshes saved messages.
- `client/oor-suthalam/src/context/AdminMessagesContext.jsx` manages the connection; `pages/admin/Messages.jsx` renders the inbox. The badge counts loaded messages, not unread messages.
- Vite proxies WebSockets through `/api`. Production reverse proxies must forward `/api/socket.io` HTTP polling and WebSocket upgrades to the backend.
- This inbox does not send email or provide two-way chat. If disconnected, use Refresh.

### Gmail SMTP replies

1. Enable 2-Step Verification for the sending Google account, then create a Google App Password (if available for your account).
2. In `server/.env`, set `SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=465`, `SMTP_USER` to the sending Gmail address, and `SMTP_PASS` to its App Password. Leave `SMTP_FROM` blank to use SMTP_USER, or use an authorized sending address. Never put these values in client/VITE variables or commit them.
3. Restart the backend, run `npm run smtp:check` from server. This verifies authentication without sending email.
4. Open Admin → Messages → Reply by email, write the subject/body and click Send email reply. The recipient is taken from the stored enquiry, never from a browser-supplied recipient.
5. Reply history distinguishes accepted, failed and unconfirmed sends. Accepted means SMTP accepted the message, not that it reached the inbox. Timeouts can be ambiguous: check Gmail Sent mail before creating another reply. Repeated request IDs do not send twice.

Email replies are outbound only. Replies sent back to your Gmail account appear in Gmail, not automatically in the website inbox. Existing contact form submissions still arrive through Socket.IO. Keep TLS verification enabled.

### Quotes and travel assistant

- References: TravelTriangle FAQ and agent quote workflow (`https://traveltriangle.com/faqs`, `https://traveltriangle.com/faq/registration-process`) informed explicit inclusions/exclusions and traveler approval. Pickyourtrail itineraries (`https://pickyourtrail.com/itineraries`) informed clear editable travel plans. These are feature references, not copied designs or provider integrations.
- Quote UI: `src/components/bookings/QuotePanel.jsx`; quote validation and ownership checks: `server/src/controllers/quoteController.js`. Admin offers a total INR price for the whole group with terms and expiry. Traveler accepts/declines the current version. Package confirmation remains an admin action; accepting a flight quote does not issue tickets. No automatic quote emails or payment collection.
- Assistant page: `/assistant`, requires login. `client/oor-suthalam/src/pages/public/TravelAssistant.jsx` renders recent topics, new/delete chat, typed input, English/Tamil microphone input and opt-in spoken replies. CSS: `assets/assistant.css`.
- History model: `server/src/models/ChatConversation.js`; API: `server/src/routes/chatRoutes.js`. All reads/writes/deletes are scoped to the signed-in owner. Latest 100 chats shown, up to 40 turns each. Topic uses the first message. Context to Gemini uses the last 12 messages. No live bus inventory or booking tools are connected.
- Gemini requests: `server/src/services/assistantService.js`. Set `GEMINI_API_KEY` privately in server/.env and choose a model available to your Google account using `GEMINI_MODEL`. Never add the key to frontend/VITE variables or paste it in chat. The initially documented model is configurable; actual key/model access still requires verification.
- User messages are stored in your database and sent to Google Gemini to generate answers. Browser speech recognition may send audio to its speech service. Mic starts only on click; transcript is reviewed before Send; playback is opt-in. Browser support and installed Tamil/English voices vary; typed chat always remains available. This is turn-based voice input and speech playback, not the Gemini Live streaming audio API.

### Voice recording update

The assistant microphone now uses `hooks/useVoiceRecorder.js` and MediaRecorder instead of the browser's speech recognition service. On first recording, the user confirms that stopped audio is sent to Google for transcription; Cancel discards it. Clips stop after 30 seconds, are limited to 4 MB, and are not stored by this app. `POST /api/chats/transcribe` requires authentication and rate limits audio uploads. `server/src/services/transcriptionService.js` returns a transcript; the user reviews it before sending a chat message. Recordings do not automatically create a booking or send chat text.

Reply language and optional auto-play are inside the small composer Settings button. Each AI reply has a Listen button. Playback uses browser voices; Tamil requires an available Tamil voice, otherwise the text remains readable. Suggestions and Explore packages are in the menu beneath the composer. Actual provider transcription was verified with a synthetic English recording; user-microphone permission and Tamil playback must be tested in the user's browser.

Reply audio: server/src/services/speechService.js generates WAV speech when the browser has no matching voice. POST /api/chats/:id/speech accepts a saved assistant messageId and checks conversation ownership. Optional server setting GEMINI_TTS_MODEL defaults to gemini-3.1-flash-tts-preview. Generated audio uses Gemini quota; audio is not saved to disk. TravelAssistant.jsx handles playback and cancellation.


## Tamil Nadu budget planner

- Catalog: server/src/data/tamilNaduCatalog.js — town coordinates, activities, quieter-discovery flags and access notes.
- Cost rules: server/src/services/budgetPlannerService.js — explicit planning assumptions, group room sharing, estimated return travel and 10% contingency. These are not supplier rates or live quotes.
- Frontend: client/oor-suthalam/src/pages/traveler/TripPlanner.jsx and src/assets/budget-planner.css. The starting-town list must match originCities.
- Save flow: server/src/controllers/tripController.js recalculates costs server-side and rejects over-budget trips. Trip model stores the breakdown as a snapshot. Recommendations support 1–4 days and 1–20 travelers.
- Local migration: node server/scripts/focusTamilNaduLocal.js. It explicitly targets oor_suthalam_local, preserves uploaded images and historical trips/bookings, and archives non-Tamil-Nadu and superseded packages. Never run this against production by changing its URI without reviewing a backup and migration. Atlas was not changed.
- Photos remain optional and can be uploaded in admin. Town coordinates and discovery flags are editable there.
- Flight UI routes, navigation and API mount were retired; historical flight documents remain in the database.
- Place references: Namakkal district Kolli Hills page, Cuddalore district Pichavaram page, Tenkasi district Courtallam page, and Mayiladuthurai district Tharangambadi page. No real-time entry fees, access status or transport availability are implied.

Homepage: ScenicHero.jsx and scenic-hero.css control the real video banner. Home.jsx, tamil-nadu-home.css control budget entry and category/discovery sections. Media source and license are in docs/media-credits.md. Admin sessions now redirect to /admin from public and traveler pages; loginRedirect.js and PublicLayout.jsx enforce this navigation separation.

Homepage finishing: useScrollReveal.js reveals homepage sections/cards once as they enter the viewport and respects reduced motion. ScenicHero.jsx uses misty-forest.mp4; brightness and overlays are in scenic-hero.css. The hero has no budget/explore buttons or stock-footage label, and the repeated Hello greeting is removed. PlannerHelp.jsx shows a compact tip once per browser session for eight seconds, with an information button to reopen it. Detailed assumptions remain available under How estimates work.


## Current feature map (November 2026)
- Home.jsx: minimal homepage: editable coastal video, search and six featured destinations. Budget form lives only in Plan trip.
- SiteAppearance.jsx + siteSettingsRoutes.js + SiteSettings model: admin-only MP4 upload (30 MB), optional cover photo and persistent homepage media settings. No external media URLs accepted. Default clip license is in media-credits.md.
- ManageGalleries.jsx + destinationController.updateGallery: per-destination place names, captions and uploaded photos; PlaceGallery.jsx renders them. The initial activity cards intentionally show Photo coming soon until you upload real images. Clear an entire gallery by saving an empty configured gallery.
- TripPlanner.jsx + suggestFromBudget in budgetPlannerService.js: budget is the only required user input. Optional settings allow origin, group size, style and duration. Defaults: one traveler from Chennai; duration is suggested between 1 and 4 days. These are cost assumptions, not live fares or machine-learning price forecasts.
- travelKnowledgeService.js: answers catalog, budget, inclusions and distance questions using actual active Tamil Nadu records and deterministic cost calculations. Gemini handles other conversation. ChatConversation stores trip option cards with replies. This is runtime grounding, not retraining Gemini.
- AdminAssistant.jsx + adminAssistantController.js: admin-only, read-only counts and latest booking names/status. These database summaries are not sent to Gemini. No booking writes or automatic confirmations.
- useCurrentLocation.js, distance.js, DestinationLocation.jsx: location requested only on a click. Client-side nearest ordering and straight-line distances. Destination map uses OpenStreetMap; road-directions link opens Google Maps. Chat sends location only to this app for distance calculation, not as model context. Location-derived replies are excluded from Gemini conversation context; cloud audio for them requires an explicit confirmation.
- MobileNavigation.jsx: Saved replaces Bookings; My bookings remains available from Profile and traveler navigation.
- SearchFilters.jsx + discovery-filters.css: compact search/category controls; quieter places and near-me actions live under Options. useScrollReveal.js also animates Explore cards on entry and respects reduced motion.


November 5 updates: Kerala catalog is server/src/data/keralaCatalog.js; local additive importer is server/scripts/addKeralaLocal.js. Public catalog, planner and assistant accept Tamil Nadu and Kerala. DestinationCard auto-cycles visible galleries without controls. Photo import report: docs/destination-photo-import.json. weatherService.js fetches Open-Meteo current estimates, caches ten minutes and fails honestly. Inquiry.readAt and PATCH /inquiries/:id/read drive the unread admin badge. Saved count comes from the current AuthContext user. Mobile inputs use 16px text to prevent browser focus zoom.
