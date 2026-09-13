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
      "Votre inscription sur ce site et votre adresse dans la liste des testeurs du test fermé, dans la Google Play Console, si vous vous y êtes inscrit",
    ],
  },

  whatRemains: {
    title: "Ce qui n'est pas supprimé",
    items: [
      "Deux identifiants techniques dérivés de votre identité : une empreinte à sens unique de votre adresse e-mail, et une autre de l'identifiant de votre fournisseur de connexion. Ni l'une ni l'autre n'est l'adresse ou le compte lui-même, mais comme nous pouvons les recalculer pour n'importe quelle identité, elles restent des données personnelles et nous les traitons comme telles. Nous les conservons 12 mois après la fin de votre période d'essai, dans un seul but : empêcher qu'une même personne obtienne un second essai gratuit. Elles ne servent à rien d'autre. Vous avez le droit de vous y opposer — demandez-le avant la suppression, à l'adresse en bas de cette page, car une fois le compte supprimé l'identifiant du fournisseur ne peut plus vous être rattaché.",
      "Le catalogue de recettes partagé — recettes, ingrédients et leurs traductions. Ces données sont communes à tous les utilisateurs, ne sont pas liées à votre compte et ne contiennent rien de personnel vous concernant.",
      "Les enregistrements d'achat détenus par Google Play ou Apple. Ils appartiennent à la boutique d'applications, pas à nous, et vous devez les gérer auprès d'elle.",
      "Les copies de sauvegarde de nos bases de données, pendant la durée de la fenêtre de sauvegarde du prestataire. La suppression prend effet immédiatement sur les données actives ; les sauvegardes tournent selon leur propre calendrier et ne sont jamais utilisées pour restaurer un compte supprimé.",
    ],
    note: "Nous conservons l'adresse IP d'où vient la demande — dans la table qui limite la cadence de ces formulaires, et dans l'e-mail interne qui enregistre une demande faite via le formulaire ci-dessous. Elle sert uniquement à protéger les formulaires contre les abus, n'est pas liée à votre profil, et nous l'effaçons sur demande à l'adresse ci-dessous.",
  },

  timing: {
    title: "Délai de traitement",
    body: "Il y a deux voies, avec des délais différents. Si vous confirmez avec le code que nous vous envoyons par e-mail, la suppression a lieu au moment où vous confirmez : immédiate, sans délai de grâce et sans possibilité de récupérer les données. Si vous utilisez le formulaire de demande, nous la traitons à la main sous 30 jours, comme l'exige le RGPD — en pratique bien plus vite.",
  },

  inApp: {
    title: "Plus rapide : supprimer depuis l'application",
    body: "Si Eatease est encore installée, vous pouvez supprimer votre compte vous-même dans Paramètres → Plus. Cette suppression est instantanée, mais elle n'atteint que l'application : votre inscription sur ce site et votre adresse dans la liste des testeurs du test fermé, dans la Google Play Console, y survivent. Si vous vous êtes inscrit ici, utilisez également le formulaire ci-dessous.",
  },

  selfService: {
    title: "Supprimer votre compte maintenant",
    intro: "Nous enverrons un code à six chiffres à l'adresse e-mail de votre compte, pour confirmer qu'elle est bien la vôtre. Rien n'est supprimé tant que vous n'avez pas saisi ce code et confirmé.",
    submit: "M'envoyer un code",
    submitting: "Envoi...",

    step2: {
      title: "Saisissez le code",
      body: "Si un compte existe pour cette adresse, un code à six chiffres est en route. Il expire dans une heure.",
      codeLabel: "Code à six chiffres",
      codePlaceholder: "000000",
      submit: "Confirmer le code",
      submitting: "Vérification...",
      back: "Utiliser une autre adresse",
      errorCode: "Ce code n'est pas valide, ou il a expiré. Vérifiez l'e-mail et réessayez.",
    },

    step3: {
      title: "Dernière étape — cette action est irréversible",
      body: "En confirmant, votre compte, vos données et les photos que vous avez envoyées sont supprimés immédiatement. Il n'y a ni délai de grâce ni moyen de récupérer quoi que ce soit.",
      warningTrial: "Si vous voulez que l'enregistrement de l'essai décrit plus haut soit lui aussi effacé, demandez-le avant de confirmer, à l'adresse en bas de cette page. Une fois le compte supprimé, cet enregistrement ne peut plus vous être rattaché.",
      warningTesters: "Votre adresse sur la liste des testeurs du test fermé dans la Google Play Console, c'est nous qui la retirons à la main, et pas au moment où vous confirmez. Tout le reste part immédiatement.",
      checkbox: "Je comprends que c'est définitif et que mes données ne pourront pas être récupérées.",
      submit: "Supprimer définitivement mon compte",
      submitting: "Suppression...",
      errorWaitlist: "Nous n'avons pas pu retirer votre inscription sur ce site, nous nous sommes donc arrêtés avant de supprimer quoi que ce soit. Votre compte est intact. Réessayez, ou écrivez-nous à l'adresse ci-dessous.",
    },

    done: {
      title: "Votre compte est supprimé",
      body: "Votre compte, vos données et vos envois ont disparu, et votre inscription sur ce site a été retirée en premier. Il reste l'enregistrement de l'essai décrit plus haut et votre adresse sur la liste des testeurs, que nous retirons à la main.",
    },
  },

  manual: {
    disclosure: "Je n'ai plus accès à l'adresse e-mail de mon compte",
  },

  form: {
    title: "Demander la suppression par e-mail",
    body: "Saisissez l'adresse e-mail du compte à supprimer. Nous vous enverrons un e-mail confirmant la réception de votre demande.",
    emailLabel: "Adresse e-mail",
    emailPlaceholder: "vous@exemple.com",
    reasonLabel: "Motif (facultatif)",
    reasonPlaceholder: "Dites-nous pourquoi vous partez, si vous le souhaitez.",
    submit: "Demander la suppression",
    submitting: "Envoi en cours...",
    successTitle: "Demande reçue",
    successBody: "Nous vous avons envoyé un e-mail de confirmation. Votre compte et vos données seront supprimés sous 30 jours. Si vous n'êtes pas à l'origine de cette demande, répondez à cet e-mail et nous l'annulerons : rien n'a encore été supprimé.",
    errorCaptcha: "Veuillez compléter la vérification de sécurité.",
    errorRateLimit: "Trop de tentatives. Patientez quelques minutes et réessayez.",
    errorGeneric: "Une erreur est survenue. Veuillez réessayer.",
    errorNetwork: "Échec de la connexion. Vérifiez votre réseau et réessayez.",
  },

  contact: {
    title: "Besoin d'aide ?",
    body: "Si vous n'avez plus accès à l'adresse e-mail de votre compte, ou si un point ci-dessus n'est pas clair, écrivez-nous et nous nous en occupons :",
    email: "privacy@eatease.eu",
  },
};
