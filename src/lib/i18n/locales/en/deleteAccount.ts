export const deleteAccount = {
  title: "Delete your account and data",
  intro: "This page lets you request the permanent deletion of your Eatease account and all personal data associated with it. Read what follows before you submit — the deletion cannot be undone.",

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
      "Your registration on this website, if you signed up here",
    ],
  },

  whatRemains: {
    title: "What is not deleted",
    items: [
      "A technical identifier derived from your email address — a one-way hash, not the address itself. Because we can recalculate it for any address, it still counts as personal data and we treat it as such. We keep it for 12 months after your trial ends, for a single purpose: stopping the same person from being granted a second free trial. It is never used for anything else. You have the right to object — write to the address below and we will remove it.",
      "The shared recipe catalogue — recipes, ingredients and their translations. This data is common to all users, is not linked to your account and contains nothing personal about you.",
      "Purchase records held by Google Play or Apple. Those belong to the app store, not to us, and you have to manage them there.",
    ],
    note: "Anonymous server logs may keep a technical trace of the request for a short period, for security purposes. They do not identify you.",
  },

  timing: {
    title: "How long it takes",
    body: "Requests submitted here are processed manually within 30 days, as required by the GDPR. In practice we handle them much sooner. Once processed, the deletion is immediate and irreversible — there is no grace period and no way to recover the data.",
  },

  inApp: {
    title: "Faster: delete from inside the app",
    body: "If you still have Eatease installed, you can delete your account yourself in Settings → More. That deletion is instant and does not go through this form.",
  },

  form: {
    title: "Request deletion",
    body: "Enter the email address of the account you want deleted. We will email you to confirm we received the request.",
    emailLabel: "Email address",
    emailPlaceholder: "you@example.com",
    reasonLabel: "Reason (optional)",
    reasonPlaceholder: "Tell us why you are leaving, if you want to.",
    submit: "Request deletion",
    submitting: "Sending...",
    successTitle: "Request received",
    successBody: "We have emailed you to confirm. Your account and data will be deleted within 30 days. If you did not make this request, simply ignore the email and nothing will happen.",
    errorCaptcha: "Please complete the security check.",
    errorRateLimit: "Too many attempts. Please wait a few minutes and try again.",
    errorGeneric: "Something went wrong. Please try again.",
    errorNetwork: "Connection failed. Please check your network and try again.",
  },

  contact: {
    title: "Need help?",
    body: "If you cannot access the email address on your account, or anything above is unclear, write to us and we will handle it:",
  },
};
