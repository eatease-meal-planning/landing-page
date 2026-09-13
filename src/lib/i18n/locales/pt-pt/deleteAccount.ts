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
      "O teu registo neste site e o teu endereço na lista de testers do teste fechado na Google Play Console, caso te tenhas inscrito aqui",
    ],
  },

  whatRemains: {
    title: "O que não é eliminado",
    items: [
      "Dois identificadores técnicos derivados da tua identidade: um hash unidirecional do teu endereço de email e outro do identificador do teu fornecedor de início de sessão. Nenhum deles é o endereço nem a conta em si, mas como os conseguimos recalcular para qualquer identidade continuam a ser dados pessoais e é assim que os tratamos. Guardamo-los durante 12 meses após o fim do teu período experimental, com uma finalidade única: impedir que a mesma pessoa receba um segundo período experimental gratuito. Nunca são usados para mais nada. Tens o direito de te opores — pede-o antes de eliminares a conta, no endereço no fim desta página, porque depois de a conta desaparecer o identificador do fornecedor deixa de poder ser associado a ti.",
      "O catálogo de receitas partilhado — receitas, ingredientes e respetivas traduções. Estes dados são comuns a todos os utilizadores, não estão associados à tua conta e não contêm nada de pessoal sobre ti.",
      "Registos de compra na posse da Google Play ou da Apple. Pertencem à loja de aplicações, não a nós, e têm de ser geridos junto delas.",
      "Cópias de segurança das nossas bases de dados, enquanto durar a janela de cópias do fornecedor. Nos dados ativos a eliminação é imediata; as cópias rodam segundo o calendário delas e nunca são usadas para repor uma conta eliminada.",
    ],
    note: "Guardamos o endereço IP de onde veio o pedido — na tabela que limita o ritmo destes formulários e no email interno que regista um pedido feito pelo formulário abaixo. Serve apenas para proteger os formulários de abusos, não está associado ao teu perfil, e apagamo-lo a pedido para o endereço abaixo.",
  },

  timing: {
    title: "Quanto tempo demora",
    body: "Há dois caminhos, com prazos diferentes. Se confirmares com o código que te enviamos por email, a eliminação acontece no momento em que confirmas: imediata, sem período de tolerância e sem forma de recuperar os dados. Se usares o formulário de pedido, tratamos dele à mão no prazo de 30 dias, como o RGPD exige — na prática muito antes.",
  },

  inApp: {
    title: "Mais rápido: eliminar dentro da aplicação",
    body: "Se ainda tiveres a Eatease instalada, podes eliminar a conta tu mesmo em Definições → Mais. Essa eliminação é instantânea, mas só alcança a app: o teu registo neste site e o teu endereço na lista de testers do teste fechado na Google Play Console ficam na mesma. Se te inscreveste aqui, usa também o formulário abaixo.",
  },

  selfService: {
    title: "Elimina a tua conta agora",
    intro: "Vamos enviar um código de seis dígitos para o endereço de email da tua conta, para confirmar que é teu. Não é eliminado nada até introduzires esse código e confirmares.",
    submit: "Enviar-me um código",
    submitting: "A enviar...",

    step2: {
      title: "Introduz o código",
      body: "Se existir uma conta com esse endereço, está um código de seis dígitos a caminho. Expira dentro de uma hora.",
      codeLabel: "Código de seis dígitos",
      codePlaceholder: "000000",
      submit: "Confirmar o código",
      submitting: "A verificar...",
      back: "Usar outro endereço",
      errorCode: "Esse código não é válido, ou já expirou. Confere o email e tenta de novo.",
    },

    step3: {
      title: "Último passo — isto não pode ser revertido",
      body: "Ao confirmares, a tua conta, os teus dados e as fotografias que carregaste são eliminados de imediato. Não há período de tolerância nem forma de recuperar seja o que for.",
      warningTrial: "Se quiseres que o registo do período experimental descrito acima também seja apagado, pede-o antes de confirmares, no endereço no fim desta página. Depois de a conta desaparecer, esse registo deixa de poder ser associado a ti.",
      warningTesters: "O teu endereço na lista de testers do teste fechado na Google Play Console somos nós que o retiramos à mão, e não no momento em que confirmas. Todo o resto é eliminado de imediato.",
      checkbox: "Percebo que isto é permanente e que os meus dados não podem ser recuperados.",
      submit: "Eliminar a minha conta para sempre",
      submitting: "A eliminar...",
      errorWaitlist: "Não conseguimos remover o teu registo neste site, por isso parámos antes de eliminar fosse o que fosse. A tua conta está intacta. Tenta de novo, ou escreve-nos para o endereço abaixo.",
    },

    done: {
      title: "A tua conta foi eliminada",
      body: "A tua conta, os teus dados e o que carregaste desapareceram, e o teu registo neste site foi removido primeiro. Fica o registo do período experimental descrito acima e o teu endereço na lista de testers, que retiramos à mão.",
    },
  },

  manual: {
    disclosure: "Não consigo aceder ao endereço de email da minha conta",
  },

  form: {
    title: "Pedir a eliminação por email",
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
    email: "privacy@eatease.eu",
  },
};
