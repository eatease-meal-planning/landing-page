import { describe, expect, it, vi } from "vitest";
import { renderEmail } from "./email";
import {
  buildGreeting,
  getFirstName,
  parseContactsCsv,
  sendInvites,
  type InviteRecipient,
  type LocaleEmails,
  type SendResult,
} from "./closedTestInvite";

const emails: LocaleEmails = {
  teamName: "A equipa Eatease",
  privacyPolicy: "Política de Privacidade",
  closedTestInvite: {
    subject: "O teu acesso está pronto",
    greeting: "Olá {name},",
    intro: "intro",
    instructionsTitle: "Como começar:",
    step1: "passo 1",
    step2: "passo 2",
    cta: "Aceder ao teste",
    ctaDownload: "Transferir a app",
    downloadNote: "Só funciona depois de aceitares o convite no passo 1.",
    fallbackNote: "fallback",
    feedbackNote: "feedback",
    signOff: "Até breve,",
  },
};

function recipient(over: Partial<InviteRecipient> = {}): InviteRecipient {
  return { email: "a@b.com", name: "Ricardo Rato", locale: "pt-pt", ...over };
}

function deps(sendResults: SendResult[]) {
  const marked: string[] = [];
  let call = 0;
  return {
    marked,
    deps: {
      loadCopy: async () => emails,
      renderTemplate: renderEmail,
      sendEmail: async () => sendResults[call++] ?? { data: { id: "x" } },
      markInvited: async (email: string) => {
        marked.push(email);
      },
      optInUrl: "https://play.google.com/apps/testing/com.eatease.app",
      downloadUrl: "https://play.google.com/store/apps/details?id=com.eatease.app",
      siteUrl: "https://eatease.eu",
      delayMs: 0,
    },
  };
}

describe("getFirstName", () => {
  it("drops parenthesised notes and keeps the first token", () => {
    expect(getFirstName("Ricardo Mineiro (primo da Mara)")).toBe("Ricardo");
    expect(getFirstName("Miguel Soares,")).toBe("Miguel");
    expect(getFirstName("")).toBe("");
  });
});

describe("buildGreeting", () => {
  it("fills the placeholder when there is a name", () => {
    expect(buildGreeting("Olá {name},", "Inês")).toBe("Olá Inês,");
  });

  it("drops the placeholder and its comma when there is no name", () => {
    // "Olá ," is the failure this guards against.
    expect(buildGreeting("Olá {name},", "")).toBe("Olá,");
    expect(buildGreeting("Hi {name},", "")).toBe("Hi,");
  });
});

describe("sendInvites", () => {
  it("marks a contact as invited only after a clean send", async () => {
    const { marked, deps: d } = deps([{ data: { id: "re_1" } }]);
    const summary = await sendInvites([recipient()], d);

    expect(marked).toEqual(["a@b.com"]);
    expect(summary.sent).toBe(1);
    expect(summary.failed).toBe(0);
  });

  it("does NOT mark a contact when Resend answers with an error", async () => {
    // resend.emails.send() resolves { error } instead of rejecting. Marking
    // here would hide this person from every future run, silently.
    const { marked, deps: d } = deps([{ error: { message: "domain not verified" } }]);
    const summary = await sendInvites([recipient()], d);

    expect(marked).toEqual([]);
    expect(summary.failed).toBe(1);
    expect(summary.outcomes[0].error).toBe("domain not verified");
  });

  it("does NOT mark a contact when the send throws", async () => {
    const marked: string[] = [];
    const summary = await sendInvites([recipient()], {
      loadCopy: async () => emails,
      renderTemplate: renderEmail,
      sendEmail: async () => {
        throw new Error("ECONNRESET");
      },
      markInvited: async (email: string) => {
        marked.push(email);
      },
      optInUrl: "https://play.google.com/apps/testing/x",
      downloadUrl: "https://play.google.com/store/apps/details?id=x",
      siteUrl: "https://eatease.eu",
      delayMs: 0,
    });

    expect(marked).toEqual([]);
    expect(summary.failed).toBe(1);
  });

  it("keeps going after a failure and marks only the ones that went out", async () => {
    const { marked, deps: d } = deps([
      { data: { id: "re_1" } },
      { error: { message: "rate limited" } },
      { data: { id: "re_3" } },
    ]);
    const summary = await sendInvites(
      [
        recipient({ email: "one@b.com" }),
        recipient({ email: "two@b.com" }),
        recipient({ email: "three@b.com" }),
      ],
      d,
    );

    expect(marked).toEqual(["one@b.com", "three@b.com"]);
    expect(summary).toMatchObject({ total: 3, sent: 2, failed: 1 });
  });

  it("sends nothing and marks nothing in dry-run", async () => {
    const { marked, deps: d } = deps([]);
    const sendEmail = vi.fn(d.sendEmail);
    const summary = await sendInvites([recipient()], { ...d, sendEmail, dryRun: true });

    expect(sendEmail).not.toHaveBeenCalled();
    expect(marked).toEqual([]);
    expect(summary.outcomes[0].status).toBe("dry-run");
    // A dry run must not report a send it did not make.
    expect(summary.sent).toBe(0);
  });

  it("renders the recipient's locale copy, escaping the name", async () => {
    let sentHtml = "";
    await sendInvites([recipient({ name: "Ana <b>Silva</b>" })], {
      loadCopy: async () => emails,
      renderTemplate: renderEmail,
      sendEmail: async (msg) => {
        sentHtml = msg.html;
        return { data: { id: "re_1" } };
      },
      markInvited: async () => {},
      optInUrl: "https://play.google.com/apps/testing/com.eatease.app",
      downloadUrl: "https://play.google.com/store/apps/details?id=com.eatease.app",
      siteUrl: "https://eatease.eu",
      delayMs: 0,
    });

    expect(sentHtml).toContain("Olá Ana,");
    expect(sentHtml).not.toContain("<b>Silva</b>");
    expect(sentHtml).toContain("https://play.google.com/apps/testing/com.eatease.app");
    expect(sentHtml).toContain("https://play.google.com/store/apps/details?id=com.eatease.app");
    expect(sentHtml).not.toContain("{{");
  });

  it("puts the opt-in link before the download link", async () => {
    // The store listing does not resolve until the invite is accepted, so the
    // email must not present them the other way round.
    let sentHtml = "";
    await sendInvites([recipient()], {
      loadCopy: async () => emails,
      renderTemplate: renderEmail,
      sendEmail: async (msg) => {
        sentHtml = msg.html;
        return { data: { id: "re_1" } };
      },
      markInvited: async () => {},
      optInUrl: "https://play.google.com/apps/testing/com.eatease.app",
      downloadUrl: "https://play.google.com/store/apps/details?id=com.eatease.app",
      siteUrl: "https://eatease.eu",
      delayMs: 0,
    });

    expect(sentHtml.indexOf("apps/testing")).toBeLessThan(sentHtml.indexOf("store/apps/details"));
    expect(sentHtml).toContain("Só funciona depois de aceitares o convite no passo 1.");
  });
});

describe("parseContactsCsv", () => {
  it("reads the index,email,name shape with a header", () => {
    const rows = parseContactsCsv("index,email,name\n1,A@B.com,Ricardo Rato\n2,c@d.com,Inês");
    expect(rows).toEqual([
      { email: "a@b.com", name: "Ricardo Rato" },
      { email: "c@d.com", name: "Inês" },
    ]);
  });

  it("keeps a name that contains a comma", () => {
    const rows = parseContactsCsv("index,email,name\n1,a@b.com,Rato, Ricardo");
    expect(rows[0].name).toBe("Rato, Ricardo");
  });

  it("skips duplicates and lines without an email", () => {
    const rows = parseContactsCsv("index,email,name\n1,a@b.com,X\n2,a@b.com,Y\n3,,Z\n\n");
    expect(rows).toEqual([{ email: "a@b.com", name: "X" }]);
  });

  it("works without a header row", () => {
    expect(parseContactsCsv("a@b.com,Ricardo")).toEqual([{ email: "a@b.com", name: "Ricardo" }]);
    expect(parseContactsCsv("1,a@b.com,Ricardo")).toEqual([{ email: "a@b.com", name: "Ricardo" }]);
  });
});
