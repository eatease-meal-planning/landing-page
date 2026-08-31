export const deleteAccount = {
  title: "Eliminar tu cuenta y tus datos",
  intro: "En esta página puedes solicitar la eliminación permanente de tu cuenta de Eatease y de todos los datos personales asociados. Lee lo siguiente antes de enviar la solicitud: la eliminación no se puede deshacer.",

  whatIsDeleted: {
    title: "Qué se elimina",
    items: [
      "Tu cuenta y tus credenciales de acceso",
      "Tu perfil, tus objetivos y tus preferencias",
      "Los miembros de la familia que añadiste y sus objetivos",
      "Planes de comidas y asignación de raciones",
      "Listas de la compra y sus artículos",
      "Recetas favoritas",
      "Comidas registradas y tu historial de macros",
      "Objetivos de macros y cálculos en caché",
      "Dispositivos registrados y notificaciones",
      "Registros de suscripción y recibos de compra",
      "Fotos que subiste (perfil, comidas, recetas, documentos)",
      "Tu registro en este sitio web, si te inscribiste aquí",
    ],
  },

  whatRemains: {
    title: "Qué no se elimina",
    items: [
      "Un identificador técnico derivado de tu dirección de correo: un hash unidireccional, no la dirección en sí. Como podemos recalcularlo para cualquier dirección, sigue siendo un dato personal y lo tratamos como tal. Lo conservamos durante 12 meses tras el fin de tu periodo de prueba, con una única finalidad: impedir que la misma persona reciba un segundo periodo de prueba gratuito. Nunca se usa para nada más. Tienes derecho a oponerte: escríbenos a la dirección de abajo y lo eliminaremos.",
      "El catálogo de recetas compartido: recetas, ingredientes y sus traducciones. Estos datos son comunes a todos los usuarios, no están vinculados a tu cuenta y no contienen nada personal sobre ti.",
      "Los registros de compra en poder de Google Play o Apple. Pertenecen a la tienda de aplicaciones, no a nosotros, y debes gestionarlos allí.",
    ],
    note: "Los registros técnicos anónimos del servidor pueden conservar rastro de la solicitud durante un breve periodo, por motivos de seguridad. No te identifican.",
  },

  timing: {
    title: "Cuánto tarda",
    body: "Las solicitudes enviadas aquí se procesan manualmente en un plazo de 30 días, como exige el RGPD. En la práctica las atendemos mucho antes. Una vez procesada, la eliminación es inmediata e irreversible: no hay periodo de gracia ni forma de recuperar los datos.",
  },

  inApp: {
    title: "Más rápido: eliminar desde la aplicación",
    body: "Si todavía tienes Eatease instalada, puedes eliminar tu cuenta tú mismo en Ajustes → Más. Esa eliminación es instantánea y no pasa por este formulario.",
  },

  form: {
    title: "Solicitar la eliminación",
    body: "Introduce la dirección de correo de la cuenta que quieres eliminar. Te enviaremos un correo confirmando que hemos recibido la solicitud.",
    emailLabel: "Dirección de correo electrónico",
    emailPlaceholder: "tu@ejemplo.com",
    reasonLabel: "Motivo (opcional)",
    reasonPlaceholder: "Cuéntanos por qué te vas, si quieres.",
    submit: "Solicitar la eliminación",
    submitting: "Enviando...",
    successTitle: "Solicitud recibida",
    successBody: "Te hemos enviado un correo de confirmación. Tu cuenta y tus datos se eliminarán en un plazo de 30 días. Si no has sido tú quien ha hecho esta solicitud, ignora el correo y no ocurrirá nada.",
    errorCaptcha: "Completa la verificación de seguridad.",
    errorRateLimit: "Demasiados intentos. Espera unos minutos y vuelve a intentarlo.",
    errorGeneric: "Algo ha salido mal. Inténtalo de nuevo.",
    errorNetwork: "Fallo de conexión. Comprueba tu red e inténtalo de nuevo.",
  },

  contact: {
    title: "¿Necesitas ayuda?",
    body: "Si no puedes acceder al correo electrónico de tu cuenta, o si algo de lo anterior no queda claro, escríbenos y nos encargamos:",
  },
};
