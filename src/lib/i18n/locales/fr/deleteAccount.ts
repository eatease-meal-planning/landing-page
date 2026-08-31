export const deleteAccount = {
  title: "Supprimer votre compte et vos données",
  intro: "Cette page vous permet de demander la suppression définitive de votre compte Eatease et de toutes les données personnelles associées. Lisez ce qui suit avant d'envoyer votre demande : la suppression est irréversible.",

  whatIsDeleted: {
    title: "Ce qui est supprimé",
    items: [
      "Votre compte et vos identifiants de connexion",
      "Votre profil, vos objectifs et vos préférences",
      "Les membres de la famille que vous avez ajoutés et leurs objectifs",
      "Les plans de repas et la répartition des portions",
      "Les listes de courses et leurs articles",
      "Les recettes favorites",
      "Les repas enregistrés et votre historique de macros",
      "Les objectifs de macros et les calculs mis en cache",
      "Les appareils enregistrés et les notifications",
      "Les enregistrements d'abonnement et les reçus d'achat",
      "Les photos que vous avez importées (profil, repas, recettes, documents)",
      "Votre inscription sur ce site, si vous vous y êtes inscrit",
    ],
  },

  whatRemains: {
    title: "Ce qui n'est pas supprimé",
    items: [
      "Un identifiant technique dérivé de votre adresse e-mail — une empreinte à sens unique, et non l'adresse elle-même. Comme nous pouvons la recalculer pour n'importe quelle adresse, elle reste une donnée personnelle et nous la traitons comme telle. Nous la conservons 12 mois après la fin de votre période d'essai, dans un seul but : empêcher qu'une même personne bénéficie d'un second essai gratuit. Elle ne sert à rien d'autre. Vous pouvez vous y opposer : écrivez-nous à l'adresse ci-dessous et nous la supprimerons.",
      "Le catalogue de recettes partagé — recettes, ingrédients et leurs traductions. Ces données sont communes à tous les utilisateurs, ne sont pas liées à votre compte et ne contiennent rien de personnel vous concernant.",
      "Les enregistrements d'achat détenus par Google Play ou Apple. Ils appartiennent à la boutique d'applications, pas à nous, et vous devez les gérer auprès d'elle.",
    ],
    note: "Des journaux techniques anonymes du serveur peuvent conserver une trace de la demande pendant une courte période, pour des raisons de sécurité. Ils ne permettent pas de vous identifier.",
  },

  timing: {
    title: "Délai de traitement",
    body: "Les demandes envoyées ici sont traitées manuellement sous 30 jours, comme l'exige le RGPD. En pratique, nous les traitons bien plus vite. Une fois traitée, la suppression est immédiate et irréversible : il n'y a ni délai de rétractation ni moyen de récupérer les données.",
  },

  inApp: {
    title: "Plus rapide : supprimer depuis l'application",
    body: "Si Eatease est encore installée, vous pouvez supprimer votre compte vous-même dans Paramètres → Plus. Cette suppression est instantanée et ne passe pas par ce formulaire.",
  },

  form: {
    title: "Demander la suppression",
    body: "Saisissez l'adresse e-mail du compte à supprimer. Nous vous enverrons un e-mail confirmant la réception de votre demande.",
    emailLabel: "Adresse e-mail",
    emailPlaceholder: "vous@exemple.com",
    reasonLabel: "Motif (facultatif)",
    reasonPlaceholder: "Dites-nous pourquoi vous partez, si vous le souhaitez.",
    submit: "Demander la suppression",
    submitting: "Envoi en cours...",
    successTitle: "Demande reçue",
    successBody: "Nous vous avons envoyé un e-mail de confirmation. Votre compte et vos données seront supprimés sous 30 jours. Si vous n'êtes pas à l'origine de cette demande, ignorez l'e-mail et rien ne se passera.",
    errorCaptcha: "Veuillez compléter la vérification de sécurité.",
    errorRateLimit: "Trop de tentatives. Patientez quelques minutes et réessayez.",
    errorGeneric: "Une erreur est survenue. Veuillez réessayer.",
    errorNetwork: "Échec de la connexion. Vérifiez votre réseau et réessayez.",
  },

  contact: {
    title: "Besoin d'aide ?",
    body: "Si vous n'avez plus accès à l'adresse e-mail de votre compte, ou si un point ci-dessus n'est pas clair, écrivez-nous et nous nous en occupons :",
  },
};
