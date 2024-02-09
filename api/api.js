import { $apiWithoutToken } from "../axios/axios.js";

$apiWithoutToken;

export const Login = async (email = "", password = "") => {
  try {
    const response = await $apiWithoutToken.post("/auth/login", {
      email,
      password,
    });
    if (response.status == 200) {
      return response.data;
    } else return null;
  } catch {
    return null;
  }
};

export const getOrders = async () => {
  const response = await $apiWithoutToken.get("/order/get-all");
  if (response.status == 200) {
    return response.data?.items;
  } else return null;
};

export const getFreelancers = async () => {
  const response = await $apiWithoutToken.get("/user/freelancers");
  if (response.status == 200) {
    return response.data?.items;
  } else return null;
};

export const changePassword = async (
  oldPassword,
  newPassword,
  user,
  chatid
) => {
  const response = await $apiWithoutToken.put(
    "/user/change-password",
    {
      oldPassword,
      newPassword,
    },
    {
      headers: {
        Authorization: `Bearer ${user[chatid]?.access}`,
      },
    }
  );
  if (response.status == 200) {
    return true;
  } else return false;
};

export const getMeProfile = async (user, chatid) => {
  try {
    const response = await $apiWithoutToken.get("/user/profile", {
      headers: {
        Authorization: `Bearer ${user[chatid]?.refresh}`,
      },
    });
    if (response.status == 200) {
      return response.data;
    } else return false;
  } catch (e) {
    console.log(e);
  }
};

export const editMyProfile = async (user, chatid, userInfo) => {
  try {
    const response = await $apiWithoutToken.put("/user/update", userInfo, {
      headers: {
        Authorization: `Bearer ${user[chatid]?.refresh}`,
      },
    });
    if (response.status == 200) {
      return true;
    } else return false;
  } catch (e) {
    console.log(e);
  }
};
