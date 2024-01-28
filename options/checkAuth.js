export const checkAuth = (users, chatid) => {
  if (users[chatid]?.access) {
    return true;
  } else return false;
};
