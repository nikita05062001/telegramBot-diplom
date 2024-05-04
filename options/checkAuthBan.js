const checkAuthBan = (authUsers, chatId) => {
    if (authUsers[chatId]?.ban && Date.now() - authUsers[chatId]?.ban < 24 * 60 * 60 * 1000) {
        // Если прошло менее 24 часов с предыдущей попытки авторизации
        const remainingTime = 24 * 60 * 60 * 1000 - (Date.now() - authUsers[chatId]?.ban);
        const remainingHours = Math.floor(remainingTime / (60 * 60 * 1000));
        const remainingMinutes = Math.floor((remainingTime % (60 * 60 * 1000)) / (60 * 1000));
        const res = `Вы не можете авторизоваться, пожалуйста, подождите ${remainingHours} часов и ${remainingMinutes} минут.`
      return  res
    }
    else return 'access'
}
export default checkAuthBan