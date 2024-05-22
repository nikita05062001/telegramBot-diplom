import {
  Login,
  changeChatID,
  changePassword,
  createOrder,
  // createUser,
  editMyProfile,
  getCities,
  getFreelancers,
  getMeProfile,
  getOrders,
  getRegAndCity,
  getRegions,
  refreshLogin,
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
import checkAuthBan from "./options/checkAuthBan.js";



const token = "6257967035:AAHysxY65gmprn7FhtI2AJqgqqquz1D5rTo";
//const webAppUrl = "https://bot-front-pink.vercel.app/"

const bot = new TelegramBot(token, { polling: true });

//database

const authUsers = {};
const accountMessageId = {}
let isProcessing = false;


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
  const ban = checkAuthBan(authUsers, chatId);
  if ( ban != 'access') {
    bot.sendMessage(chatId, ban);
    return
  }
  isProcessing = true;
  bot.sendMessage(chatId, "Введите ваш email:");
  bot.once("message", (msg) => {
    const email = msg.text;
    bot.deleteMessage(chatId, msg.message_id)
    bot.sendMessage(chatId, "Введите ваш пароль:");

    bot.once("message", async (msg) => {
      const password = msg.text;
      bot.deleteMessage(chatId, msg.message_id)
      const res = await Login(email, password);

      if (res) {
        bot.sendMessage(chatId, `Вы авторизовались`);
        authUsers[chatId] = {
          access: res.accessToken,
          refresh: res.refreshToken,
          refreshTimer: Date.now() + 5 * 60 * 1000,
        };
        isProcessing = false;
        console.log(authUsers);
      } else {
        if (!authUsers[chatId]?.count) {
          authUsers[chatId] = {
            count: 2,
          };
          bot.sendMessage(
            chatId,
            `Ошибка, введены неверные данные, доступное кол-во попыток: ${authUsers[chatId].count}`
          );
          isProcessing = false;
        } else {
          authUsers[chatId].count--;
          if(authUsers[chatId].count!=0)
          bot.sendMessage(
            chatId,
            `Ошибка, введены неверные данные, у вас осталось ${authUsers[chatId].count}`
          );
          if (authUsers[chatId].count == 0)
          {
            bot.sendMessage(chatId, `авторизация заблокирована на 24 часа`);
            authUsers[chatId].ban = Date.now();
         
          }
          
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
      "Для начала авторизуйтесь, введите команду /authorization"
    );
    return;
  }
  bot.sendMessage(chatId, "Выберите действие:", optionsPickMenuProfile)
    .then((sentMessage) => {
      // Сохраняем message_id отправленного сообщения в объекте accountMessageId
      accountMessageId[chatId] = sentMessage.message_id;
      
    })
    .catch((error) => {
      console.error("Ошибка при отправке сообщения:", error);
    });
});

// ! Обработчик событий callback_query my_Accout
bot.on("callback_query", async (callbackQuery) => {
  const chatId = callbackQuery.message.chat.id;
  const action = callbackQuery.data;
  const messageId = callbackQuery.message.message_id;
  // Далее можно добавить логику обработки выбранного действия
  if (action === "edit_info") {
    // Логика для изменения информации о себе
    const res = await getMeProfile(authUsers, chatId);
    let access = authUsers[chatId]?.access;
    let refresh = authUsers[chatId]?.refresh;
    let refreshTimer = authUsers[chatId]?.refreshTimer;
    authUsers[chatId] = {
      access,
      refresh,
      refreshTimer,
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
    bot.deleteMessage(chatId, accountMessageId[chatId]);
    //! смена пароля
  } else if (action === "change_password") {
    // Логика для изменения пароля
    if (isProcessing) return;
    isProcessing = true;
    bot.sendMessage(chatId, "Введите ваш старый пароль:");
    bot.once("message", (msg) => {
      let oldPassword = msg.text;
      bot.deleteMessage(chatId, msg.message_id)
      bot.sendMessage(chatId, "Введите ваш новый пароль:");

      bot.once("message", (msg) => {
        let newPassword = msg.text;
        bot.deleteMessage(chatId, msg.message_id)
        bot.sendMessage(chatId, "Повторите ваш новый пароль:");

        bot.once("message", async (msg) => {
          let repeatNewPassword = msg.text;
          bot.deleteMessage(chatId, msg.message_id)
          // Добавьте логику проверки и сохранения нового пароля
          if (newPassword === repeatNewPassword) {
            // Пароли совпадают, выполняйте необходимые действия
            let res = await changePassword(
              oldPassword,
              newPassword,
              authUsers,
              chatId
            );
            console.log(res)
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
  //! смена миниописания
  else if (action.includes("description_edit")) {
    bot.sendMessage(chatId, "введите ваше новое описание");
    bot.once("message", (msg) => {
      let smallDescription = msg.text;
      authUsers[chatId].userInfo.smallDescription = smallDescription;
      const res = editMyProfile(authUsers, chatId);
      if (res) {
        bot.sendMessage(chatId, "Ваше мини-описание успешно изменено");
      } else {
        bot.sendMessage(chatId, "произошла ошибка");
      }})
  }
  //! назад в меню выбора
  else if (action.includes("back_edit")) {

  if (isProcessing) return;
  if (!checkAuth(authUsers, chatId)) {
    bot.sendMessage(
      chatId,
      "для начала авторизуйтесь, введите команду /authorization"
    );
    return;
  }
  bot.deleteMessage(chatId, messageId);
  bot.sendMessage(chatId, "Выберите действие:", optionsPickMenuProfile).then((sentMessage) => {
    // Сохраняем message_id отправленного сообщения в объекте accountMessageId
    accountMessageId[chatId] = sentMessage.message_id;
   
  })
  .catch((error) => {
    console.error("Ошибка при отправке сообщения:", error);
  });;
  }
});



// ! OPTIONS BUTTON
bot.onText(/Последние заказы📃/, async (msg) => {
  const chatId = msg.chat.id;
  const res = await getOrders();
  console.log(res)
  res
    .reverse()
    .slice(0, 10)
    .forEach((item) => {
      const professions = 'невыбрано'
      // const professions = item.ProfessionToOrder.reduce(
      //   (acc, prof) => acc + `${prof.Profession.name}, `,
      //   ""
      // );
      bot.sendMessage(
        chatId,
        `заголовок: ${item.title} \nСоздано: ${formatDate(
          item.createdAt
        )} \nОткликов: ${item.response} \nпросмотров: ${
          item.views
        } \nкатегории: ${
          !professions == "undefined," ? professions : "категории не указаны"
        } \nссылка: http://194.169.160.152/orders/order/${item.id}`
      );
    });
});

bot.onText(/Фрилансеры👨‍🏭/, async (msg) => {
  const chatId = msg.chat.id;
  const res = await getFreelancers();
  console.log(res)
  res
    .reverse()
    .slice(0, 10)
    .forEach((item) => {
      // const professions = item.ProfessionToUser.reduce(
      //   (acc, prof) => acc + `${prof.Profession.name}, `,
      //   ""
      // );
      const professions = 'невыбрано'
      console.log(professions || "ничего");
      bot.sendMessage(
        chatId,
        `Имя и Фамилия: ${item.name} ${
          item.surname
        } \nзарегистрирован: ${formatDate(item.createdAt)} \nОписание: ${
          item.smallDescription
        } \nсредняя оценка: ${"5"} \nнавыки: ${
          !professions == "undefined," ? professions : "навыки не указаны"
        } \nссылка: http://194.169.160.152/freelancers/freelancer/${item.id}`
      );
    });
});

bot.onText(/Подписаться-Отписаться на оповещения🚩/, async (msg) => {
  const chatId = msg.chat.id;
  if (!checkAuth(authUsers, chatId)) {
    bot.sendMessage(
      chatId,
      "Для начала авторизуйтесь, введите команду /authorization"
    );
    return;
  }
  const res = await changeChatID(authUsers, chatId);
  if(res.telegramChatID)
  bot.sendMessage(chatId, "Вы подписались на оповещения");
  else
  bot.sendMessage(chatId, "Вы отписались от оповещений");
});

bot.onText(/Создать заказ⚡/, async (msg) => {
  const chatId = msg.chat.id;
  if (!checkAuth(authUsers, chatId)) {
    bot.sendMessage(
      chatId,
      "Для начала авторизуйтесь, введите команду /authorization"
    );
    return;
  }
  bot.sendMessage(chatId, "Введите ваш заголовок");
  bot.once("message", (msg) => {
    const title = msg.text;
    bot.sendMessage(chatId, "Введите ваше описание:");
    bot.once("message", (msg) => {
      const description = msg.text;
      bot.sendMessage(chatId, "Введите вашу цену");
      bot.once("message", async (msg) => {
        const price = msg.text;
       const res = await createOrder(title,description,price, authUsers, chatId)
       console.log(res)
       if(res)
        bot.sendMessage(chatId, "Заказ создан");
      else bot.sendMessage(chatId, "произошла ошибка");
      })
    })
  }
  )
});

//! Обновление токена
setInterval(async () => {
  for (const userId in authUsers) {
    if (authUsers.hasOwnProperty(userId)) {
        const user = authUsers[userId];
        // if (user.refreshTimer && Date.now() >= user.refreshTimer) {
            // Если время таймера истекло, вызываем вашу функцию
              const refresh = user.refresh ? await refreshLogin(user.refresh) : '';

            // Устанавливаем новый таймер для пользователя (например, еще через 5 минут)
            if (refresh?.accessToken && refresh?.refreshToken) {
              authUsers[userId].access = refresh.accessToken;
              authUsers[userId].refresh = refresh.refreshToken;
              authUsers[userId].refreshTimer = Date.now() + 5 * 60 * 1000; // 5 минут * 60 секунд * 1000 миллисекунд
            }
      // }
    }
}
console.log(authUsers)
}, 50000)

bot.setMyCommands(commandList);
