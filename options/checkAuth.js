export const checkAuth = (users, chatid) => {
  if (users[chatid]?.access) {
    return false;
  } else return true;
};
