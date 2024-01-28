import { Login, changePassword, getFreelancers, getOrders } from "./api/api.js";
import TelegramBot from "node-telegram-bot-api/src/telegram.js";
import commandList from "./commandList.js";
import options from "./options/optionsButton.js";
import { checkAuth } from "./options/checkAuth.js";
const token = "6257967035:AAHysxY65gmprn7FhtI2AJqgqqquz1D5rTo";
//const webAppUrl = "https://bot-front-pink.vercel.app/"

const bot = new TelegramBot(token, { polling: true });

//database
const firstEntryMap = new Map();
const authUsers = {};

let isProcessing = false;

// bot.onText(/.*/, (msg) => {
//   const chatId = msg.chat.id;

//   // Проверяем, является ли это первым входом пользователя
//   if (!firstEntryMap.has(chatId)) {
//     // Отправляем приветственное сообщение
//     bot.sendMessage(chatId, "Привет! Добро пожаловать в бота.");

//     // Помечаем, что пользователь уже вошел
//     firstEntryMap.set(chatId, true);
//   }
// });

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  if (isProcessing) return;
  bot.sendMessage(
    chatId,
    "Для авторизации, введите команду /authorization",
    options
  );
});
bot.onText(/\/authorization/, (msg) => {
  const chatId = msg.chat.id;
  if (isProcessing) return;
  if (checkAuth(authUsers, chatId)) {
    bot.sendMessage(chatId, "Вы уже авторизованы");
    return;
  }
  if (authUsers[chatId]?.count == 0) {
    bot.sendMessage(chatId, "Повторите попытку позже, вы заблокированы");
    return;
  }
  isProcessing = true;
  console.log(isProcessing);
  bot.sendMessage(chatId, "Введите ваш email:");

  bot.once("message", (msg) => {
    const email = msg.text;

    bot.sendMessage(chatId, "Введите ваш пароль:");

    bot.once("message", async (msg) => {
      const password = msg.text;
      const res = await Login(email, password);

      if (res) {
        bot.sendMessage(chatId, `Вы авторизовались`);
        authUsers[chatId] = {
          access: res.accessToken,
          refresh: res.refreshToken,
        };
        isProcessing = false;
        console.log(authUsers);
      } else {
        if (!authUsers[chatId]?.count) {
          authUsers[chatId] = {
            count: 4,
          };
          bot.sendMessage(
            chatId,
            `Ошибка, введены неверные данные, у вас осталось ${authUsers[chatId].count}`
          );
          isProcessing = false;
        } else {
          authUsers[chatId].count--;
          bot.sendMessage(
            chatId,
            `Ошибка, введены неверные данные, у вас осталось ${authUsers[chatId].count}`
          );
          if (authUsers[chatId].count == 0)
            bot.sendMessage(chatId, `авторизация временно заблокировано`);
          isProcessing = false;
        }
      }
    });
  });
});
bot.onText(/\/logout/, (msg) => {
  const chatId = msg.chat.id;
  if (isProcessing) return;
  if (authUsers[chatId]?.access) {
    delete authUsers[chatId];
    bot.sendMessage(chatId, `Вы вышли с аккаунта`);
  } else {
    bot.sendMessage(chatId, `Вы не были авторизованы`);
  }
});
bot.onText(/\/account/, (msg) => {
  const chatId = msg.chat.id;
  if (isProcessing) return;
  if (!checkAuth(authUsers, chatId)) {
    bot.sendMessage(
      chatId,
      "для начала авторизуйтесь, введите команду /authorization"
    );
    return;
  }
  const options = {
    reply_markup: {
      inline_keyboard: [
        [
          { text: "Изменить информацию о себе", callback_data: "edit_info" },
          { text: "Изменить пароль", callback_data: "change_password" },
          { text: "🔙 Назад", callback_data: "back" },
        ],
      ],
    },
  };
  bot.sendMessage(chatId, "Выберите действие:", options);
  bot.on("callback_query", (callbackQuery) => {
    const chatId = callbackQuery.message.chat.id;
    const action = callbackQuery.data;

    // Далее можно добавить логику обработки выбранного действия
    if (action === "edit_info") {
      // Логика для изменения информации о себе
      bot.sendMessage(chatId, "Вы выбрали изменение информации о себе.");
    } else if (action === "change_password") {
      // Логика для изменения пароля
      bot.sendMessage(chatId, "Введите ваш старый пароль:");

      bot.once("message", (msg) => {
        let oldPassword = msg.text;
        bot.sendMessage(chatId, "Введите ваш новый пароль:");

        bot.once("message", (msg) => {
          let newPassword = msg.text;
          bot.sendMessage(chatId, "Повторите ваш новый пароль:");

          bot.once("message", async (msg) => {
            let repeatNewPassword = msg.text;

            // Добавьте логику проверки и сохранения нового пароля
            if (newPassword === repeatNewPassword) {
              // Пароли совпадают, выполняйте необходимые действия
              let res = await changePassword(
                oldPassword,
                newPassword,
                authUsers,
                chatId
              );
              if (res) bot.sendMessage(chatId, "Пароль успешно изменен.");
              else bot.sendMessage(chatId, "Произошла ошибка");
            } else {
              bot.sendMessage(
                chatId,
                "Пароли не совпадают. Попробуйте еще раз."
              );
            }
          });
        });
      });
    }
  });
});

//OPTIONS BUTTON
bot.onText(/Последние заказы/, async (msg) => {
  const chatId = msg.chat.id;
  const res = await getOrders();
  res.forEach((item) => {
    const professions = item.ProfessionToOrder.reduce(
      (acc, prof) => acc + `${prof.Profession.name}, `,
      ""
    );
    bot.sendMessage(
      chatId,
      `заголовок: ${item.title} \n Создано: ${item.createdAt} \n Откликов: ${item.response} \n просмотров: ${item.views} \n категории: ${professions} \n ссылка: http://194.169.160.152:3000/orders/order/${item.id}`
    );
  });
});

bot.onText(/Фрилансеры/, async (msg) => {
  const chatId = msg.chat.id;
  const res = await getFreelancers();
  console.log(res);
});

bot.setMyCommands(commandList);
