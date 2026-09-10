/**
 * Route handlers read configuration at module scope — `new Resend(process.env
 * .RESEND_API_KEY)` throws outright when the key is missing — so the values
 * have to exist before the module under test is imported.
 *
 * These are deliberately obvious fakes. A test that needs a variable *absent*
 * (the CONFIG_MISSING_* paths) deletes it with `vi.stubEnv(name, undefined)`.
 */
process.env.RESEND_API_KEY = "re_test_key";
process.env.RESEND_FROM_EMAIL = "noreply@test.invalid";
process.env.RESEND_WELCOME_EMAIL = "operator@test.invalid";
process.env.DELETION_REQUEST_TO_EMAIL = "privacy@test.invalid";
process.env.NEXT_PUBLIC_SITE_URL = "https://test.invalid";
