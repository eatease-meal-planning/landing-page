export const deleteAccount = {
  title: "Delete your account and data",
  intro: "This page lets you permanently delete your Eatease account and all personal data associated with it. Read what follows before you start — the deletion cannot be undone.",

  whatIsDeleted: {
    title: "What gets deleted",
    items: [
      "Your account and sign-in credentials",
      "Your profile, goals and preferences",
      "Family members you added and their goals",
      "Meal plans and portion assignments",
      "Shopping lists and their items",
      "Favourite recipes",
      "Logged meals and your macro history",
      "Macro targets and cached calculations",
      "Registered devices and notifications",
      "Subscription records and purchase receipts",
      "Photos you uploaded (profile, meals, recipes, documents)",
      "Your registration on this website, and your address on the closed-test tester list in the Google Play Console, if you signed up here",
    ],
  },

  whatRemains: {
    title: "What is not deleted",
    items: [
      "Two technical identifiers derived from your identity: a one-way hash of your email address, and one of your sign-in provider identifier. Neither is the address or the account itself, but because we can recalculate them for any identity they still count as personal data and we treat them as such. We keep them for 12 months after your trial ends, for a single purpose: stopping the same person from being granted a second free trial. They are never used for anything else. You have the right to object — ask us before you delete, using the address at the bottom of this page, because once the account is gone the provider identifier can no longer be traced back to you.",
      "The shared recipe catalogue — recipes, ingredients and their translations. This data is common to all users, is not linked to your account and contains nothing personal about you.",
      "Purchase records held by Google Play or Apple. Those belong to the app store, not to us, and you have to manage them there.",
      "Backup copies of our databases, for as long as the provider's backup window lasts. Deletion takes effect immediately in the live data; backups roll over on their own schedule and are never used to bring a deleted account back.",
    ],
    note: "We keep the IP address the request came from — in the table that rate-limits these forms, and in the internal email that records a request made through the form below. We keep it to protect the forms from abuse. It is not linked to your profile, and we will erase it on request at the address below.",
  },

  timing: {
    title: "How long it takes",
    body: "There are two ways to do this, with different timings. If you confirm with the code we email you, the deletion happens the moment you confirm: immediate, with no grace period and no way to recover the data. If you use the request form instead, we process it by hand within 30 days, as the GDPR requires — in practice much sooner.",
  },

  inApp: {
    title: "Faster: delete from inside the app",
    body: "If you still have Eatease installed, you can delete your account yourself in Settings → More. That deletion is instant, but it only reaches the app: your registration on this website and your address on the closed-test tester list in the Google Play Console both survive it. If you signed up here, use this page as well.",
  },

  selfService: {
    title: "Delete your account now",
    intro: "We will email a six-digit code to the address on your account, to confirm it is yours. Nothing is deleted until you enter that code and confirm.",
    submit: "Email me a code",
    submitting: "Sending...",

    step2: {
      title: "Enter the code",
      body: "If an account exists for that address, a six-digit code is on its way. It expires in one hour.",
      codeLabel: "Six-digit code",
      codePlaceholder: "000000",
      submit: "Confirm the code",
      submitting: "Checking...",
      back: "Use a different address",
      errorCode: "That code is not valid, or it has expired. Check the email and try again.",
    },

    step3: {
      title: "Last step — this cannot be undone",
      body: "Confirming deletes your account, your data and the photos you uploaded, straight away. There is no grace period and no way to recover any of it.",
      warningTrial: "If you want the trial record described above erased as well, ask us before you confirm, at the address at the bottom of this page. Once the account is gone, that record can no longer be traced back to you.",
      warningTesters: "Your address on the closed-test tester list in the Google Play Console is removed by hand, by us, and not at the moment you confirm. Everything else goes immediately.",
      checkbox: "I understand this is permanent and that my data cannot be recovered.",
      submit: "Delete my account permanently",
      submitting: "Deleting...",
      errorRegistration: "We could not remove your registration on this website, so we stopped before deleting anything. Your account is untouched. Please try again, or write to us at the address below.",
    },

    done: {
      title: "Your account is deleted",
      body: "Your account, your data and your uploads are gone, and your registration on this website was removed first. What remains is the trial record described above and your address on the closed-test tester list, which we remove by hand.",
    },
  },

  manual: {
    disclosure: "I cannot access the email address on my account",
  },

  form: {
    title: "Request deletion by email",
    body: "Enter the email address of the account you want deleted. We will email you to confirm we received the request.",
    emailLabel: "Email address",
    emailPlaceholder: "you@example.com",
    reasonLabel: "Reason (optional)",
    reasonPlaceholder: "Tell us why you are leaving, if you want to.",
    submit: "Request deletion",
    submitting: "Sending...",
    successTitle: "Request received",
    successBody: "We have emailed you to confirm. Your account and data will be deleted within 30 days. If you did not make this request, reply to that email and we will cancel it — nothing has been deleted yet.",
    errorCaptcha: "Please complete the security check.",
    errorRateLimit: "Too many attempts. Please wait a few minutes and try again.",
    errorGeneric: "Something went wrong. Please try again.",
    errorNetwork: "Connection failed. Please check your network and try again.",
  },

  contact: {
    title: "Need help?",
    body: "If you cannot access the email address on your account, or anything above is unclear, write to us and we will handle it:",
    email: "privacy@eatease.eu",
  },
};
