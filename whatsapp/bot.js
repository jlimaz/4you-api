const venom = require('venom-bot');
const axios = require('axios');
require('dotenv').config();

const userLastMessage = {};
const userMessageHistory = {};
const CONVERSATION_TIMEOUT = 30 * 60 * 1000;
const HISTORY_LIMIT = 10;

venom
  .create(
    'session-4you',
    undefined,
    undefined,
    {
      headless: true
    }
  )
  .then((client) => {
    console.log('Venom client created');
    start(client);
  })
  .catch((error) => {
    console.error('Venom error:', error);
  });

function start(client) {
  console.log('Client is ready!');

  client.onMessage(async (message) => {
    if (message.body && message.isGroupMsg === false) {
      try {
        const now = Date.now();
        const lastTime = userLastMessage[message.from] || 0;
        userLastMessage[message.from] = now;

        if (now - lastTime > CONVERSATION_TIMEOUT) {
          userMessageHistory[message.from] = [];
          const menuText =
            '🌷 Olá! Eu sou sua assistente virtual de apoio à mulher.\n\n' +
            'Estou aqui para te ouvir e te ajudar, com respeito, sigilo e carinho. 💜\n\n' +
            'Como posso te apoiar hoje?\n\n' +
            '1️⃣ Preciso de ajuda agora\n' +
            '2️⃣ Quero entender meus direitos e opções\n' +
            '3️⃣ Falar com a rede de apoio\n\n' +
            '📩 Responda com o número da opção desejada. Estou com você!';

          await client.sendText(message.from, menuText);
          return;
        }

        if (!userMessageHistory[message.from]) {
          userMessageHistory[message.from] = [];
        }

        if (['1', '2', '3'].includes(message.body.trim())) {
          let reply = '';
          switch (message.body.trim()) {
            case '1':
              reply = 'Entendo. Estou aqui com você. 💜 Por favor, me diga com o que você precisa de ajuda neste momento. Tudo o que disser será tratado com cuidado e respeito.';
              break;
            case '2':
              reply = 'Claro! Posso te informar sobre os sinais de risco, seus direitos e como acessar a rede de proteção. Me diga sobre o que você gostaria de saber.';
              break;
            case '3':
              reply = 'Tudo bem. Vou te conectar com a rede de apoio disponível no Distrito Federal. Você prefere saber os locais próximos a você ou falar com alguém agora?';
              break;
          }
          userMessageHistory[message.from].push({ role: 'user', content: message.body });
          userMessageHistory[message.from].push({ role: 'assistant', content: reply });
          userMessageHistory[message.from] = userMessageHistory[message.from].slice(-HISTORY_LIMIT);
          await client.sendText(message.from, reply);
          return;
        }


        userMessageHistory[message.from].push({ role: 'user', content: message.body });
        userMessageHistory[message.from] = userMessageHistory[message.from].slice(-HISTORY_LIMIT);

        const systemPrompt = "Você é um assistente virtual no WhatsApp criado para apoiar a prevenção à violência contra a mulher no Distrito Federal. Sua missão é acolher, orientar e informar mulheres em situação de vulnerabilidade de forma segura, respeitosa e confidencial.\n\n" +
          "Suas responsabilidades:\n" +
          "Ajudar na identificação precoce de situações de risco, com base no Formulário Nacional de Avaliação de Risco (CNJ/CNMP n. 05/2020).\n\n" +
          "Oferecer suporte emocional e informativo, utilizando uma linguagem clara, empática e sem julgamentos.\n\n" +
          "Informar com sensibilidade sobre canais de denúncia e proteção, incentivando a autonomia da mulher para tomar decisões com segurança.\n\n" +
          "Apresentar a rede de proteção do DF com geolocalização, incluindo delegacias, centros de apoio e serviços públicos disponíveis.\n\n" +
          "Direcionar para a Delegacia Eletrônica da Polícia Civil do DF, quando apropriado.\n\n" +
          "Garantir total respeito à privacidade e à autodeterminação da usuária. Nenhuma informação deve ser armazenada ou compartilhada sem consentimento.\n\n" +
          "Agir sempre como um apoio, nunca como substituto de ajuda profissional, jurídica ou psicológica.\n\n" +
          "Estilo e tom:\n" +
          "Sempre acolhedor(a), respeitoso(a) e empático(a).\n\n" +
          "Nunca pressiona ou julga. Ouve com atenção e orienta com carinho.\n\n" +
          "Evita termos técnicos, burocráticos ou linguagem fria.\n\n" +
          "Responde de forma objetiva, mas humana.\n\n" +
          "Formatação e compatibilidade com WhatsApp:\n" +
          "Suas respostas devem estar otimizadas para o WhatsApp.\n\n" +
          "Não utilize markdown, LaTeX, ou formatações incompatíveis (como códigos ou listas complexas). Mas você pode utilizar a formatação do própio whatsapp, como, por exemplo, negrito, que deve ser feito da seguinte forma: *Texto a ficar em negrito*.\n\n" +
          "Prefira estruturas simples e diretas, como:\n" +
          "Emojis para acolhimento ou destaque (com moderação, ex: 💜👋⚠️)\n" +
          "Quebra de linha entre parágrafos para facilitar leitura.\n" +
          "Uso de números para menus ou listas curtas (ex: \"1. ...\", \"2. ...\")\n\n" +
          "Observações finais:\n" +
          "Sempre se certifique de que a usuária saiba que ela está no controle da conversa.\n\n" +
          "Em caso de emergência, forneça um caminho rápido, discreto e seguro para acesso imediato à ajuda.\n\n" +
          "Você é um ponto de apoio seguro e empático, que respeita profundamente a dignidade de cada mulher que buscar ajuda.";

        const response = await axios.post(
          'http://localhost:5000/api/chat',
          {
            message: message.body,
            systemPrompt,
            history: userMessageHistory[message.from]
          }
        );

        const reply = response.data.reply;
        userMessageHistory[message.from].push({ role: 'assistant', content: reply });
        userMessageHistory[message.from] = userMessageHistory[message.from].slice(-HISTORY_LIMIT);
        await client.sendText(message.from, reply);
      } catch (error) {
        console.error('Error sending message to the server:', error);
        await client.sendText(message.from, 'Sorry, I could not process your request.');
      }
    }
  });
}