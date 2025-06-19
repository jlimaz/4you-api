const { Client, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const axios = require('axios');
require('dotenv').config();

const client = new Client();

client.on('qr', (qr) => {
  qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
  console.log('Client is ready!');
});

client.on('message', async (message) => {
  if (message.body) {
    try {
      const response = await axios.post(
        'http://localhost:5000/api/chat',
        { message: message.body }
      );

      const reply = response.data.reply;
      client.sendMessage(message.from, reply);
    } catch (error) {
      console.error('Error sending message to the server:', error);
      client.sendMessage(message.from, 'Sorry, I could not process your request.');
    }
  }
});

client.initialize();