export const deleteAccount = {
  title: "Eliminar a tua conta e dados",
  intro: "Nesta página podes pedir a eliminação permanente da tua conta Eatease e de todos os dados pessoais associados. Lê o que se segue antes de submeteres — a eliminação não pode ser revertida.",

  whatIsDeleted: {
    title: "O que é eliminado",
    items: [
      "A tua conta e credenciais de acesso",
      "O teu perfil, objetivos e preferências",
      "Os membros da família que adicionaste e os respetivos objetivos",
      "Planos de refeições e atribuição de doses",
      "Listas de compras e os respetivos artigos",
      "Receitas favoritas",
      "Refeições registadas e o teu histórico de macros",
      "Alvos de macros e cálculos em cache",
      "Dispositivos registados e notificações",
      "Registos de subscrição e recibos de compra",
      "Fotografias que carregaste (perfil, refeições, receitas, documentos)",
      "O teu registo neste site, caso te tenhas inscrito aqui",
    ],
  },

  whatRemains: {
    title: "O que não é eliminado",
    items: [
      "Um identificador técnico derivado do teu endereço de email — um hash unidirecional, não o endereço em si. Como o conseguimos recalcular para qualquer endereço, continua a ser um dado pessoal e é assim que o tratamos. Guardamo-lo durante 12 meses após o fim do teu período experimental, com uma finalidade única: impedir que a mesma pessoa receba um segundo período experimental gratuito. Nunca é usado para mais nada. Tens o direito de te opor — escreve para o endereço abaixo e nós removemo-lo.",
      "O catálogo de receitas partilhado — receitas, ingredientes e respetivas traduções. Estes dados são comuns a todos os utilizadores, não estão associados à tua conta e não contêm nada de pessoal sobre ti.",
      "Registos de compra na posse da Google Play ou da Apple. Pertencem à loja de aplicações, não a nós, e têm de ser geridos junto delas.",
    ],
    note: "Registos técnicos anónimos do servidor podem guardar vestígio do pedido durante um curto período, por motivos de segurança. Não te identificam.",
  },

  timing: {
    title: "Quanto tempo demora",
    body: "Os pedidos submetidos aqui são processados manualmente no prazo de 30 dias, conforme exigido pelo RGPD. Na prática tratamos deles bastante mais depressa. Uma vez processada, a eliminação é imediata e irreversível — não há período de recuperação nem forma de repor os dados.",
  },

  inApp: {
    title: "Mais rápido: eliminar dentro da aplicação",
    body: "Se ainda tiveres a Eatease instalada, podes eliminar a conta tu mesmo em Definições → Mais. Essa eliminação é instantânea e não passa por este formulário.",
  },

  form: {
    title: "Pedir a eliminação",
    body: "Indica o endereço de email da conta que queres eliminar. Enviamos-te um email a confirmar que recebemos o pedido.",
    emailLabel: "Endereço de email",
    emailPlaceholder: "tu@exemplo.com",
    reasonLabel: "Motivo (opcional)",
    reasonPlaceholder: "Diz-nos porque estás a sair, se quiseres.",
    submit: "Pedir a eliminação",
    submitting: "A enviar...",
    successTitle: "Pedido recebido",
    successBody: "Enviámos-te um email a confirmar. A tua conta e os teus dados serão eliminados no prazo de 30 dias. Se não foste tu a fazer este pedido, responde a esse email e nós cancelamo-lo — ainda não foi eliminado nada.",
    errorCaptcha: "Completa a verificação de segurança.",
    errorRateLimit: "Demasiadas tentativas. Aguarda alguns minutos e tenta novamente.",
    errorGeneric: "Algo correu mal. Tenta novamente.",
    errorNetwork: "A ligação falhou. Verifica a tua rede e tenta novamente.",
  },

  contact: {
    title: "Precisas de ajuda?",
    body: "Se não conseguires aceder ao endereço de email da tua conta, ou se algo acima não estiver claro, escreve-nos e nós tratamos disso:",
  },
};
