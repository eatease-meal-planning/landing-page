/** The `emails.closedTestInvite` block, as every locale defines it. */
export type InviteCopy = {
  subject: string;
  greeting: string;
  intro: string;
  instructionsTitle: string;
  step1: string;
  step2: string;
  cta: string;
  ctaDownload: string;
  downloadNote: string;
  fallbackNote: string;
  feedbackNote: string;
  signOff: string;
};

/** The `emails` module of one locale, narrowed to what the invite needs. */
export type LocaleEmails = {
  teamName: string;
  privacyPolicy: string;
  closedTestInvite: InviteCopy;
};

export type RenderTemplate = (
  templateName: string,
  vars: Record<string, string>,
  escapeKeys?: string[],
) => string;

export type InviteRecipient = {
  email: string;
  name: string;
  locale: string;
};

/** What `resend.emails.send()` resolves to — it does not reject. */
export type SendResult = {
  data?: { id?: string } | null;
  error?: { message?: string } | null;
};

export type InviteDeps = {
  /** Resolves a locale's email copy; must fall back loudly, not silently. */
  loadCopy: (locale: string) => Promise<LocaleEmails>;
  /**
   * `renderEmail` from `./email`, injected rather than imported.
   *
   * Node resolves ESM specifiers literally, so a bare `./email` cannot be
   * loaded by the `.mjs` script that drives this. Taking it as a dependency
   * keeps this module import-free and runnable from both sides.
   */
  renderTemplate: RenderTemplate;
  sendEmail: (msg: { to: string; subject: string; html: string }) => Promise<SendResult>;
  /** Records `closed_test_invited_at`. Only ever called after a clean send. */
  markInvited: (email: string) => Promise<void>;
  optInUrl: string;
  /**
   * The Play Store listing. Read from the Console like the opt-in link, not
   * rebuilt from it — a derived URL would go silently wrong the day Google
   * changes the shape, while a copied one just stops being copied.
   *
   * It only resolves for someone who has already opted in, which is why the
   * email states the order.
   */
  downloadUrl: string;
  siteUrl: string;
  dryRun?: boolean;
  onProgress?: (line: string) => void;
  wait?: (ms: number) => Promise<void>;
  delayMs?: number;
};

export type InviteOutcome = {
  email: string;
  status: "sent" | "failed" | "dry-run";
  locale: string;
  id?: string;
  error?: string;
};

export type InviteSummary = {
  total: number;
  sent: number;
  failed: number;
  outcomes: InviteOutcome[];
};

/**
 * First name only, with parenthesised notes dropped.
 *
 * "Ricardo Mineiro (primo da Mara)" → "Ricardo"
 */
export function getFirstName(fullName: string): string {
  if (!fullName) return "";
  const clean = fullName.replace(/\(.*?\)/g, "").trim();
  return clean.split(/[\s,]+/)[0] || "";
}

/**
 * Fills `{name}` in the locale's greeting, or drops the placeholder when we
 * have no name — "Olá {name}," with an empty name would read "Olá ,".
 */
export function buildGreeting(template: string, firstName: string): string {
  if (firstName) return template.replace("{name}", firstName);
  return template.replace(/[\s,]*\{name\}/, "").trim() || template;
}

/** Renders the opt-in email for one recipient. The name is HTML-escaped. */
export function renderInvite(args: {
  emails: LocaleEmails;
  recipient: InviteRecipient;
  optInUrl: string;
  downloadUrl: string;
  siteUrl: string;
  renderTemplate: RenderTemplate;
}): { subject: string; html: string } {
  const { emails, recipient, optInUrl, downloadUrl, siteUrl, renderTemplate } = args;
  const t = emails.closedTestInvite;

  const html = renderTemplate(
    "google-play-console-link.html",
    {
      subject:            t.subject,
      greeting:           buildGreeting(t.greeting, getFirstName(recipient.name)),
      intro:              t.intro,
      instructions_title: t.instructionsTitle,
      step_1:             t.step1,
      step_2:             t.step2,
      cta_label:          t.cta,
      play_store_url:     optInUrl,
      download_label:     t.ctaDownload,
      download_note:      t.downloadNote,
      download_url:       downloadUrl,
      fallback_note:      t.fallbackNote,
      feedback_note:      t.feedbackNote,
      sign_off:           t.signOff,
      team:               emails.teamName,
      privacy_policy:     emails.privacyPolicy,
      site_url:           siteUrl,
    },
    ["greeting"],
  );

  return { subject: t.subject, html };
}

/**
 * Mails the opt-in link to each recipient and records who received it.
 *
 * The ordering here is the whole point of the function. `resend.emails.send()`
 * resolves `{ data, error }` instead of rejecting, so a send that failed looks
 * exactly like one that worked unless `error` is inspected. Marking
 * `closed_test_invited_at` on such a send would hide that person from every
 * later run — permanently, and silently. So `markInvited` runs only after a
 * clean result, per contact, immediately: a run that dies halfway leaves the
 * rest still NULL and simply resumes.
 */
export async function sendInvites(
  recipients: InviteRecipient[],
  deps: InviteDeps,
): Promise<InviteSummary> {
  const log = deps.onProgress ?? (() => {});
  const wait = deps.wait ?? ((ms: number) => new Promise<void>((r) => setTimeout(r, ms)));
  const delayMs = deps.delayMs ?? 400;

  const outcomes: InviteOutcome[] = [];

  for (let i = 0; i < recipients.length; i++) {
    const recipient = recipients[i];
    const counter = `[${i + 1}/${recipients.length}]`;

    const emails = await deps.loadCopy(recipient.locale);
    const { subject, html } = renderInvite({
      emails,
      recipient,
      optInUrl: deps.optInUrl,
      downloadUrl: deps.downloadUrl,
      siteUrl: deps.siteUrl,
      renderTemplate: deps.renderTemplate,
    });

    if (deps.dryRun) {
      log(`${counter} [DRY RUN] ${recipient.email} [${recipient.locale}] — "${subject}"`);
      outcomes.push({ email: recipient.email, status: "dry-run", locale: recipient.locale });
      continue;
    }

    let result: SendResult;
    try {
      result = await deps.sendEmail({ to: recipient.email, subject, html });
    } catch (err) {
      result = { error: { message: err instanceof Error ? err.message : String(err) } };
    }

    if (result.error) {
      const message = result.error.message ?? JSON.stringify(result.error);
      log(`${counter} FALHOU ${recipient.email} — ${message} (fica por convidar)`);
      outcomes.push({
        email: recipient.email,
        status: "failed",
        locale: recipient.locale,
        error: message,
      });
    } else {
      // Only now, and only for this contact.
      await deps.markInvited(recipient.email);
      log(`${counter} OK ${recipient.email} [${recipient.locale}] — id ${result.data?.id ?? "?"}`);
      outcomes.push({
        email: recipient.email,
        status: "sent",
        locale: recipient.locale,
        id: result.data?.id,
      });
    }

    if (i < recipients.length - 1 && delayMs > 0) await wait(delayMs);
  }

  return {
    total: recipients.length,
    // Only real sends count. A dry run that reported "sent" would be this
    // module claiming something it did not do.
    sent: outcomes.filter((o) => o.status === "sent").length,
    failed: outcomes.filter((o) => o.status === "failed").length,
    outcomes,
  };
}

/**
 * Parses the hand-kept contacts CSV (`index,email,name`, header optional).
 *
 * Only the import script uses this — once those rows are in `contacts` the CSV
 * is retired, and this exists to make that one migration reproducible.
 */
export function parseContactsCsv(content: string): { email: string; name: string }[] {
  const lines = content.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return [];

  const headers = lines[0].toLowerCase().split(",").map((h) => h.trim());
  const hasHeader = headers.some((h) => h === "email" || h === "mail");

  let emailCol = headers.indexOf("email");
  let nameCol = headers.findIndex((h) => h === "name" || h === "nome");

  if (!hasHeader) {
    // No header: "a@b.com,Name" or the "index,email,name" shape we ship.
    const first = lines[0].split(",").map((p) => p.trim());
    emailCol = first[0].includes("@") ? 0 : 1;
    nameCol = emailCol + 1;
  }

  const rows: { email: string; name: string }[] = [];
  const seen = new Set<string>();

  for (const line of lines.slice(hasHeader ? 1 : 0)) {
    const parts = line.split(",").map((p) => p.trim());
    const email = (parts[emailCol] ?? "").toLowerCase();
    if (!email.includes("@")) continue;
    if (seen.has(email)) continue;
    seen.add(email);

    // The name is last, so a name containing a comma keeps its tail.
    const name = nameCol >= 0 ? parts.slice(nameCol).join(", ").trim() : "";
    rows.push({ email, name });
  }

  return rows;
}
