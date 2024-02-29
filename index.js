import {
  Login,
  changePassword,
  editMyProfile,
  getCities,
  getFreelancers,
  getMeProfile,
  getOrders,
  getRegAndCity,
  getRegions,
} from "./api/api.js";
import TelegramBot from "node-telegram-bot-api/src/telegram.js";
import commandList from "./commandList.js";
import {
  options,
  optionsEditProfile,
  optionsPickMenuProfile,
} from "./options/optionsButton.js";
import { checkAuth } from "./options/checkAuth.js";
import formatDate from "./functions/formatDate.js";

const token = "6257967035:AAHysxY65gmprn7FhtI2AJqgqqquz1D5rTo";
//const webAppUrl = "https://bot-front-pink.vercel.app/"

const bot = new TelegramBot(token, { polling: true });

//database

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
  bot.sendMessage(chatId, "Выберите действие:", optionsPickMenuProfile);
});

// ! Обработчик событий callback_query my_Accout
bot.on("callback_query", async (callbackQuery) => {
  const chatId = callbackQuery.message.chat.id;
  const action = callbackQuery.data;

  // Далее можно добавить логику обработки выбранного действия
  if (action === "edit_info") {
    // Логика для изменения информации о себе
    const res = await getMeProfile(authUsers, chatId);
    let access = authUsers[chatId]?.access;
    let refresh = authUsers[chatId]?.refresh;
    authUsers[chatId] = {
      access,
      refresh,
      userInfo: {
        email: res?.email || "",
        login: res?.login || "",
        password: res?.password || "",
        phone: res?.phone || "",
        dateBorn: res?.dateBorn || "",
        avatarPath: res?.avatarPath || "",
        name: res?.name || "",
        surname: res?.surname || "",
        title: res?.title || "",
        smallDescription: res?.smallDescription || "",
        description: res?.description || "",
        cv: res?.cv || "",
        rating: res?.rating || "",
        cityId: res?.cityId || "",
        regionId: res?.regionId || "",
      },
    };
    const nameCity = await getRegAndCity(res.cityId);
    const nameRegion = await getRegAndCity(res.regionId);
    bot.sendMessage(
      chatId,
      `Имя: ${res.name} \nФамилия: ${res.surname} \nТелефон:${
        res.phone || " Не указано"
      } \nМини-Описание: ${
        res.smallDescription
      } \nРегион: ${nameRegion} \nГород: ${nameCity}`,
      optionsEditProfile
    );
    //! смена пароля
  } else if (action === "change_password") {
    // Логика для изменения пароля
    if (isProcessing) return;
    isProcessing = true;
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
            bot.sendMessage(chatId, "Пароли не совпадают. Попробуйте еще раз.");
          }
          isProcessing = false;
        });
      });
    });
    //! изменение имени
  } else if (action === "name_edit") {
    bot.sendMessage(chatId, "введите ваше новое имя");
    bot.once("message", (msg) => {
      let name = msg.text;
      authUsers[chatId].userInfo.name = name;
      const res = editMyProfile(authUsers, chatId);
      if (res) {
        bot.sendMessage(chatId, "Ваше имя успешно изменено");
      } else {
        bot.sendMessage(chatId, "произошла ошибка");
      }
      console.log(authUsers);
    });
    //! изменение фамилии
  } else if (action === "surname_edit") {
    bot.sendMessage(chatId, "введите вашу новую фамилию");
    bot.once("message", (msg) => {
      let surname = msg.text;
      authUsers[chatId].userInfo.surname = surname;
      const res = editMyProfile(authUsers, chatId);
      if (res) {
        bot.sendMessage(chatId, "Ваше фамилия успешно изменено");
      } else {
        bot.sendMessage(chatId, "произошла ошибка");
      }
    });
    //! выбор региона
  } else if (action === "region_edit") {
    const res = await getRegions();
    const optionsRegions = {
      reply_markup: {
        inline_keyboard: [[]],
      },
    };
    let massiveNum = 0;
    res.forEach((e, i) => {
      if (i % 3 == 0) {
        massiveNum++;
        optionsRegions.reply_markup.inline_keyboard[massiveNum] = [];
      }
      let input = {
        text: e.name,
        callback_data: `region-${e.id}`,
      };
      optionsRegions.reply_markup.inline_keyboard[massiveNum].push(input);
    });
    console.log(optionsRegions.reply_markup.inline_keyboard);
    bot.sendMessage(chatId, "выберите регион", optionsRegions);
    //! выбор города
  } else if (action.includes("region-")) {
    let idRegion = action.match(/\d+/g).join("");
    authUsers[chatId].userInfo.regionId = +idRegion;
    const res = await getCities(idRegion);
    const optionCities = {
      reply_markup: {
        inline_keyboard: [[]],
      },
    };
    let massiveNum = 0;
    res.forEach((e, i) => {
      if (i % 4 == 0) {
        massiveNum++;
        optionCities.reply_markup.inline_keyboard[massiveNum] = [];
      }
      let input = {
        text: e.name,
        callback_data: `city-${e.id}`,
      };
      optionCities.reply_markup.inline_keyboard[massiveNum].push(input);
    });
    console.log(optionCities.reply_markup.inline_keyboard);
    bot.sendMessage(chatId, "выберите город", optionCities);
  }
  //! подтверждение выбора региона и города
  else if (action.includes("city-")) {
    let idCity = action.match(/\d+/g).join("");
    authUsers[chatId].userInfo.cityId = +idCity;
    console.log(authUsers);
    const res = editMyProfile(authUsers, chatId);
    if (res) {
      bot.sendMessage(chatId, "Ваш регион и город изменен");
    } else {
      bot.sendMessage(chatId, "произошла ошибка");
    }
  }
});

// ! OPTIONS BUTTON
bot.onText(/Последние заказы📃/, async (msg) => {
  const chatId = msg.chat.id;
  const res = await getOrders();
  res
    .reverse()
    .slice(0, 10)
    .forEach((item) => {
      const professions = item.ProfessionToOrder.reduce(
        (acc, prof) => acc + `${prof.Profession.name}, `,
        ""
      );
      bot.sendMessage(
        chatId,
        `заголовок: ${item.title} \nСоздано: ${formatDate(
          item.createdAt
        )} \nОткликов: ${item.response} \nпросмотров: ${
          item.views
        } \nкатегории: ${
          !professions == "undefined," ? professions : "категории не указаны"
        } \nссылка: http://194.169.160.152:3000/orders/order/${item.id}`
      );
    });
});

bot.onText(/Фрилансеры👨‍🏭/, async (msg) => {
  const chatId = msg.chat.id;
  const res = await getFreelancers();
  res
    .reverse()
    .slice(0, 10)
    .forEach((item) => {
      const professions = item.ProfessionToUser.reduce(
        (acc, prof) => acc + `${prof.Profession.name}, `,
        ""
      );
      console.log(professions || "ничего");
      bot.sendMessage(
        chatId,
        `Имя и Фамилия: ${item.name} ${
          item.surname
        } \nзарегистрирован: ${formatDate(item.createdAt)} \nОписание: ${
          item.smallDescription
        } \nсредняя оценка: ${"5"} \nнавыки: ${
          !professions == "undefined," ? professions : "навыки не указаны"
        } \nссылка: http://194.169.160.152:3000/orders/order/${item.id}`
      );
    });
});

bot.setMyCommands(commandList);
