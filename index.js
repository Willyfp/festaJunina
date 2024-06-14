const { Client, LocalAuth } = require("whatsapp-web.js");
const fs = require("fs");
const JSDOM = require("jsdom").JSDOM;

// Inicialize o cliente WhatsApp
const client = new Client({
  authStrategy: new LocalAuth(),
  webVersionCache: {
    type: "remote",
    remotePath:
      "https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html",
  },
});

// Função para enviar mensagem
async function sendMessage(chatId, message) {
  await client.sendMessage(chatId, message);
}

// Função para registrar confirmação
function registerConfirmation(name, confirmation, content) {
  try {
    const data = fs.readFileSync("confirmations.html", "utf8");

    const dom = new JSDOM(data);

    console.log(dom.window.document.getElementById("confirmacoes-body"));

    const tableBody = dom.window.document.getElementById("confirmacoes-body");
    const newRow = tableBody.insertRow();

    const newCellName = newRow.insertCell();
    newCellName.textContent = name.split("/")[0];

    const newCellNumber = newRow.insertCell();
    newCellNumber.textContent = name.split("/")[1];

    const newCellPeople = newRow.insertCell();
    newCellPeople.textContent = confirmation;

    const newCellFood = newRow.insertCell();
    newCellFood.textContent = content;

    const editedHTML = dom.window.document.documentElement.outerHTML;

    fs.writeFileSync("confirmations.html", editedHTML);

    // const newData = `<span class="math-inline">${name}</span>: ${confirmation} pessoas e prato: ${content}<br>`;
  } catch (error) {
    console.log(error);
  }
}

// Evento de autenticação
client.on("qr", (qr) => {
  console.log("QR Code:", qr);
});

// Evento de conexão
client.on("ready", () => {
  console.log("Conectado com sucesso!");
});

var food = false;

var alreadyReplied = false;

var confirmation = [];
// Evento de mensagem recebida
client.on("message", async (msg) => {
  const chat = await msg.getChat();

  const chatId = msg.from;
  const content = msg.body;
  if (!chat.isGroup) {
    if (content.includes("Arraiá do Columbia")) {
      chat.sendMessage(
        "Olá, bem vindo ao Arraiá do Columbia! Por favor, confirme a quantidade de pessoas que irão com você."
      );

      alreadyReplied = chatId;
    } else if (
      alreadyReplied === chatId &&
      Number.isInteger(parseInt(content))
    ) {
      food = true;

      confirmation = [
        ...confirmation,
        {
          chatId,
          content,
        },
      ];

      chat.sendMessage(
        `Qual prato você pretende levar para a nossa confraternização? 🍲🥘🍛`
      );
    } else if (food && alreadyReplied === chatId) {
      const contact = await msg.getContact();

      const name = contact.pushname;

      chat.sendMessage(
        `Obrigado por sua confirmação, ${name}! Vamos adorar sua presença na nossa festa junina! 🎉🎊`
      );

      registerConfirmation(
        name + `/${contact.number}`,
        confirmation.find((c) => c.chatId === alreadyReplied).content,
        content
      );

      alreadyReplied = false;
      food = false;
    } else if (
      alreadyReplied === chatId &&
      !Number.isInteger(parseInt(content))
    ) {
      chat.sendMessage("Por favor, digite um número válido!");
    }
  }
});

// Inicie o cliente WhatsApp
client.initialize();
