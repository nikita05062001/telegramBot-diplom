import { $apiWithoutToken } from "../axios/axios.js";

$apiWithoutToken;

export const Login = async (email = "", password = "") => {
  try {
    const response = await $apiWithoutToken.post("/auth/login", {
      email,
      password,
    }).catch((error) => {
      console.log(error.status);
      return error;
    });;
    if (response.status == 200) {
      return response.data;
    } else return null;
  } catch {
    return null;
  }
};
export const refreshLogin = async (refreshToken = "") => {
  try {
    const response = await $apiWithoutToken.post("/auth/login/access-token", {
     refreshToken
    }).catch((error) => {
      console.log(error.status);
      return error;
    });;
    if (response.status == 200) {
      return response.data;
    } else return null;
  } catch {
    return null;
  }
}


export const getOrders = async () => {
  const response = await $apiWithoutToken.get("/order/get-all").catch((error) => {
    console.log(error.status);
    return error;
  });;
  if (response.status == 200) {
    return response.data?.items;
  } else return null;
};

export const getFreelancers = async () => {
  const response = await $apiWithoutToken.get("/user/freelancers").catch((error) => {
    console.log(error.status);
    return error;
  });;
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
  ) .catch((error) => {
    console.log(error.status);
    return error;
  });
  if (response.status == 200) {
    return response.data;
  } else return false;
};

export const getMeProfile = async (user, chatid) => {
  const response = await $apiWithoutToken
    .get("/user/profile", {
      headers: {
        Authorization: `Bearer ${user[chatid]?.refresh}`,
      },
    })
    .then((res) => res.data)
    .catch((error) => {
      console.log(error.status);
      return error;
    });
  return response;
};

export const editMyProfile = async (user, chatid) => {
  const response = await $apiWithoutToken
    .put("/user/update", user[chatid].userInfo, {
      headers: {
        Authorization: `Bearer ${user[chatid]?.access}`,
      },
    })
    .then((res) => true)
    .catch((error) => {
      console.log(error.status);
      return false;
    });
  return response;
};

export const getRegions = async () => {
  try {
    const response = await $apiWithoutToken.get("/city/get-regions").catch((error) => {
      console.log(error.status);
      return error;
    });;
    if (response.status == 200) {
      return response.data;
    } else return false;
  } catch (e) {
    console.log(e);
  }
};
export const getCities = async (id) => {
  try {
    const response = await $apiWithoutToken.get(`/city/get-cities/${id}`).catch((error) => {
      console.log(error.status);
      return error;
    });;
    if (response.status == 200) {
      return response.data;
    } else return false;
  } catch (e) {
    console.log(e);
  }
};
export const getRegAndCity = async (id) => {
  try {
    const response = await $apiWithoutToken.get(`/city/get-by-id/${id}`).catch((error) => {
      console.log(error.status);
      return error;
    });;
    if (response.status == 200) {
      return response.data.name;
    } else return false;
  } catch (e) {
    console.log(e);
  }
};


