import axios from "axios";

const host = "http://194.169.160.152:7777";
const dev = "http://localhost:7777";

export const URL = `${dev}/api`;

export const $apiWithToken = axios.create({
  withCredentials: true,
  baseURL: URL,
});

export const $apiWithoutToken = axios.create({
  withCredentials: true,
  baseURL: URL,
});

// $apiWithToken.interceptors.request.use((config) => {
//   config.headers.Authorization = `Bearer ${Cookies.get("accessToken")}`;
//   return config;
// });
