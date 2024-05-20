export const options = {
  reply_markup: {
    keyboard: [["Последние заказы📃"], ["Фрилансеры👨‍🏭"], ["Подписаться на оповещения о новых заказах🚩"] , ["Создать заказ⚡"]],
    one_time_keyboard: true,
  },
};

export const optionsEditProfile = {
  reply_markup: {
    inline_keyboard: [
      [
        { text: "Изменить имя", callback_data: "name_edit" },
        { text: "Изменить фамилию", callback_data: "surname_edit" },
        
      ],
      [
        { text: "изменить регион и город", callback_data: "region_edit" },
        {
          text: "изменить мини-описание",
          callback_data: "description_edit",
        },
      ],
      [
        {
          text: "Назад",
          callback_data: "back_edit",
        },
      ]
    ],
    resize_keyboard: true,
  },
};

export const optionsPickMenuProfile = {
  reply_markup: {
    inline_keyboard: [
      [
        { text: "Изменить информацию о себе", callback_data: "edit_info" },
        { text: "Изменить пароль", callback_data: "change_password" },
      ],
    ],
  },
};
