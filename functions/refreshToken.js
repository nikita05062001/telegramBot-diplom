import { refreshLogin } from "../api/api";

const checkUserTimers = (authUsers) => {
    for (const userId in authUsers) {
        if (authUsers.hasOwnProperty(userId)) {
            const user = authUsers[userId];
            if (user?.refreshTimer && Date.now() >= user?.refreshTimer) {
                // Если время таймера истекло, вызываем вашу функцию
             const refresh =  refreshLogin(user.refresh);
                // Устанавливаем новый таймер для пользователя (например, еще через 5 минут)
                authUsers[userId].access = refresh.accessToken;
                authUsers[userId].refresh = refresh.refreshToken;
                authUsers[userId].refreshTimer = Date.now() + 5 * 60 * 1000; // 5 минут * 60 секунд * 1000 миллисекунд
            }
        }
    }
    console.log(authUsers)
}

export default checkUserTimers