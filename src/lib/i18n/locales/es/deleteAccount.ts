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
      "Tu registro en este sitio web y tu dirección en la lista de testers de la prueba cerrada en la Google Play Console, si te inscribiste aquí",
    ],
  },

  whatRemains: {
    title: "Qué no se elimina",
    items: [
      "Dos identificadores técnicos derivados de tu identidad: un hash unidireccional de tu dirección de correo y otro del identificador de tu proveedor de inicio de sesión. Ninguno es la dirección ni la cuenta en sí, pero como podemos recalcularlos para cualquier identidad siguen siendo datos personales y así los tratamos. Los conservamos durante 12 meses tras el fin de tu periodo de prueba, con una única finalidad: impedir que la misma persona reciba una segunda prueba gratuita. Nunca se usan para nada más. Tienes derecho a oponerte — pídelo antes de eliminar la cuenta, en la dirección que aparece al final de esta página, porque una vez eliminada la cuenta el identificador del proveedor ya no se puede asociar a ti.",
      "El catálogo de recetas compartido: recetas, ingredientes y sus traducciones. Estos datos son comunes a todos los usuarios, no están vinculados a tu cuenta y no contienen nada personal sobre ti.",
      "Los registros de compra en poder de Google Play o Apple. Pertenecen a la tienda de aplicaciones, no a nosotros, y debes gestionarlos allí.",
      "Copias de seguridad de nuestras bases de datos, mientras dure la ventana de copias del proveedor. La eliminación es inmediata en los datos activos; las copias rotan según su propio calendario y nunca se usan para recuperar una cuenta eliminada.",
    ],
    note: "Conservamos la dirección IP desde la que se hizo la petición — en la tabla que limita el ritmo de estos formularios y en el correo interno que registra una petición hecha con el formulario de abajo. La guardamos solo para proteger los formularios del abuso, no está vinculada a tu perfil, y la borramos si nos lo pides en la dirección de abajo.",
  },

  timing: {
    title: "Cuánto tarda",
    body: "Hay dos caminos, con plazos distintos. Si confirmas con el código que te enviamos por correo, la eliminación ocurre en el momento en que confirmas: inmediata, sin periodo de gracia y sin forma de recuperar los datos. Si usas el formulario de solicitud, la tramitamos a mano en un plazo de 30 días, como exige el RGPD — en la práctica mucho antes.",
  },

  inApp: {
    title: "Más rápido: eliminar desde la aplicación",
    body: "Si todavía tienes Eatease instalada, puedes eliminar tu cuenta tú mismo en Ajustes → Más. Esa eliminación es instantánea, pero solo alcanza la app: tu registro en este sitio web y tu dirección en la lista de testers de la prueba cerrada en la Google Play Console siguen ahí. Si te inscribiste aquí, usa también el formulario de abajo.",
  },

  selfService: {
    title: "Elimina tu cuenta ahora",
    intro: "Enviaremos un código de seis dígitos a la dirección de tu cuenta para confirmar que es tuya. No se elimina nada hasta que introduzcas ese código y confirmes.",
    submit: "Enviarme un código",
    submitting: "Enviando...",

    step2: {
      title: "Introduce el código",
      body: "Si existe una cuenta con esa dirección, un código de seis dígitos va de camino. Caduca en una hora.",
      codeLabel: "Código de seis dígitos",
      codePlaceholder: "000000",
      submit: "Confirmar el código",
      submitting: "Comprobando...",
      back: "Usar otra dirección",
      errorCode: "Ese código no es válido o ha caducado. Revisa el correo e inténtalo de nuevo.",
    },

    step3: {
      title: "Último paso — esto no se puede deshacer",
      body: "Al confirmar se eliminan de inmediato tu cuenta, tus datos y las fotos que subiste. No hay periodo de gracia ni forma de recuperar nada.",
      warningTrial: "Si también quieres que borremos el registro de la prueba descrito arriba, pídelo antes de confirmar, en la dirección que aparece al final de esta página. Una vez eliminada la cuenta, ese registro ya no se puede asociar a ti.",
      warningTesters: "Tu dirección en la lista de probadores de la prueba cerrada en la Google Play Console la quitamos a mano nosotros, y no en el momento en que confirmas. Todo lo demás se elimina de inmediato.",
      checkbox: "Entiendo que esto es permanente y que mis datos no se podrán recuperar.",
      submit: "Eliminar mi cuenta para siempre",
      submitting: "Eliminando...",
      errorRegistration: "No hemos podido eliminar tu registro en este sitio web, así que paramos antes de borrar nada. Tu cuenta está intacta. Inténtalo de nuevo o escríbenos a la dirección de abajo.",
    },

    done: {
      title: "Tu cuenta está eliminada",
      body: "Tu cuenta, tus datos y lo que subiste han desaparecido, y tu registro en este sitio web se eliminó primero. Queda el registro de la prueba descrito arriba y tu dirección en la lista de probadores, que quitamos a mano.",
    },
  },

  manual: {
    disclosure: "No puedo acceder a la dirección de correo de mi cuenta",
  },

  form: {
    title: "Solicitar la eliminación por correo",
    body: "Introduce la dirección de correo de la cuenta que quieres eliminar. Te enviaremos un correo confirmando que hemos recibido la solicitud.",
    emailLabel: "Dirección de correo electrónico",
    emailPlaceholder: "tu@ejemplo.com",
    reasonLabel: "Motivo (opcional)",
    reasonPlaceholder: "Cuéntanos por qué te vas, si quieres.",
    submit: "Solicitar la eliminación",
    submitting: "Enviando...",
    successTitle: "Solicitud recibida",
    successBody: "Te hemos enviado un correo de confirmación. Tu cuenta y tus datos se eliminarán en un plazo de 30 días. Si no has sido tú quien ha hecho esta solicitud, responde a ese correo y la cancelaremos: todavía no se ha eliminado nada.",
    errorCaptcha: "Completa la verificación de seguridad.",
    errorRateLimit: "Demasiados intentos. Espera unos minutos y vuelve a intentarlo.",
    errorGeneric: "Algo ha salido mal. Inténtalo de nuevo.",
    errorNetwork: "Fallo de conexión. Comprueba tu red e inténtalo de nuevo.",
  },

  contact: {
    title: "¿Necesitas ayuda?",
    body: "Si no puedes acceder al correo electrónico de tu cuenta, o si algo de lo anterior no queda claro, escríbenos y nos encargamos:",
    email: "privacy@eatease.eu",
  },
};
