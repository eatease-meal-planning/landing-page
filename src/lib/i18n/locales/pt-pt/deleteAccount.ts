export const deleteAccount = {
  title: "Eliminar a sua conta e dados",
  intro: "Nesta página pode pedir a eliminação permanente da sua conta Eatease e de todos os dados pessoais associados. Leia o que se segue antes de submeter — a eliminação não pode ser revertida.",

  whatIsDeleted: {
    title: "O que é eliminado",
    items: [
      "A sua conta e credenciais de acesso",
      "O seu perfil, objetivos e preferências",
      "Os membros da família que adicionou e os respetivos objetivos",
      "Planos de refeições e atribuição de doses",
      "Listas de compras e os seus artigos",
      "Receitas favoritas",
      "Refeições registadas e o seu histórico de macros",
      "Alvos de macros e cálculos em cache",
      "Dispositivos registados e notificações",
      "Registos de subscrição e recibos de compra",
      "Fotografias que carregou (perfil, refeições, receitas, documentos)",
      "O seu registo neste site, caso se tenha inscrito aqui",
    ],
  },

  whatRemains: {
    title: "O que não é eliminado",
    items: [
      "Um identificador técnico derivado do seu endereço de email — um hash unidirecional, não o endereço em si. Como o conseguimos recalcular para qualquer endereço, continua a ser um dado pessoal e é assim que o tratamos. Guardamo-lo durante 12 meses após o fim do seu período experimental, com uma finalidade única: impedir que a mesma pessoa receba um segundo período experimental gratuito. Nunca é usado para mais nada. Tem o direito de se opor — escreva para o endereço abaixo e nós removemo-lo.",
      "O catálogo de receitas partilhado — receitas, ingredientes e respetivas traduções. Estes dados são comuns a todos os utilizadores, não estão associados à sua conta e não contêm nada de pessoal sobre si.",
      "Registos de compra na posse da Google Play ou da Apple. Pertencem à loja de aplicações, não a nós, e têm de ser geridos junto delas.",
    ],
    note: "Registos técnicos anónimos do servidor podem guardar vestígio do pedido durante um curto período, por motivos de segurança. Não o identificam.",
  },

  timing: {
    title: "Quanto tempo demora",
    body: "Os pedidos submetidos aqui são processados manualmente no prazo de 30 dias, conforme exigido pelo RGPD. Na prática tratamos deles bastante mais depressa. Uma vez processada, a eliminação é imediata e irreversível — não há período de recuperação nem forma de repor os dados.",
  },

  inApp: {
    title: "Mais rápido: eliminar dentro da aplicação",
    body: "Se ainda tiver a Eatease instalada, pode eliminar a conta você mesmo em Definições → Mais. Essa eliminação é instantânea e não passa por este formulário.",
  },

  form: {
    title: "Pedir a eliminação",
    body: "Indique o endereço de email da conta que pretende eliminar. Enviaremos um email a confirmar que recebemos o pedido.",
    emailLabel: "Endereço de email",
    emailPlaceholder: "voce@exemplo.com",
    reasonLabel: "Motivo (opcional)",
    reasonPlaceholder: "Diga-nos porque está a sair, se quiser.",
    submit: "Pedir a eliminação",
    submitting: "A enviar...",
    successTitle: "Pedido recebido",
    successBody: "Enviámos-lhe um email a confirmar. A sua conta e dados serão eliminados no prazo de 30 dias. Se não foi você que fez este pedido, ignore o email e nada acontecerá.",
    errorCaptcha: "Complete a verificação de segurança.",
    errorRateLimit: "Demasiadas tentativas. Aguarde alguns minutos e tente novamente.",
    errorGeneric: "Algo correu mal. Tente novamente.",
    errorNetwork: "A ligação falhou. Verifique a sua rede e tente novamente.",
  },

  contact: {
    title: "Precisa de ajuda?",
    body: "Se não conseguir aceder ao endereço de email da sua conta, ou se algo acima não estiver claro, escreva-nos e nós tratamos disso:",
  },
};
