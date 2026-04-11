# Quality Checklists

## Responsive QA

Validate each critical page at `320px`, `375px`, `768px`, and `1024px`.

- Navigation can be opened and closed with one hand on mobile.
- Header, sidebar, and content never overlap in a way that hides actions.
- No horizontal zoom is required to submit forms or trigger primary actions.
- Wide tables either scroll horizontally or switch to stacked cards on mobile.
- Primary actions remain visible without requiring precision tapping.
- Forms keep labels, inputs, and error states readable on small screens.

## Security QA

- Sensitive routes require authentication.
- Admin-only actions require admin role.
- Vendor flows cannot access another vendor's resources by changing IDs in the URL.
- Controllers persist only validated payloads.
- External links opened in new tabs use `rel="noopener noreferrer"`.
- Automation endpoints reject requests without the configured automation token.
- Stock and permuta endpoints do not expose inventory to guests.

## Functional Smoke Tests

- Create a service with multiple line items as admin and vendor.
- Create a product sale and confirm stock changes to `vendido`.
- Search stock by IMEI, serial number, and code.
- Open sale and service PDFs from the correct owner account.
- Verify auth flows with `php artisan test`.
- Verify frontend bundle health with `npm run build`.
