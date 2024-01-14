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
