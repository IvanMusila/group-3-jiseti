import axios from "axios";

const API = axios.create({
  baseURL:"https://jiseti-backend-zt8g.onrender.com/api/v1"
});

export const setAuthToken = token => {
  if (token) API.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  else delete API.defaults.headers.common["Authorization"];
};
  
export default API;
