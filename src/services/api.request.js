import axios from "axios";
import { GET_ERROR, USER_INFO } from "../utils/constants";
import {
  resolveDemoBlobRequest,
  resolveDemoRequest,
} from "./demo-router";

/**
 * DEMO showcase build — never call the live school API.
 * Flip to false only if you intentionally reconnect this copy (not recommended).
 */
export const DEMO_MODE = true;

// Kept for any UI that imports BASE_URL; live host is not used when DEMO_MODE is true.
export const BASE_URL = "https://demo.local/api";
export const BASE_URL_WITHOUT_API = BASE_URL.replace(/\/api$/, "");

const api = axios.create({
  baseURL: BASE_URL,
});

api.interceptors.request.use(
  (config) => {
    let userInfo;
    try {
      userInfo = JSON.parse(sessionStorage.getItem(USER_INFO));
    } catch (error) {
      console.warn("Failed to parse user info from sessionStorage:", error);
      userInfo = null;
    }

    if (userInfo?.token) {
      config.headers.Authorization = `Bearer ${userInfo.token}`;
    }

    if (config.url?.includes("test-fees")) {
      config.headers["Cache-Control"] = "no-cache, no-store, must-revalidate";
      config.headers["Pragma"] = "no-cache";
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export const getRequest = async (path, params = {}) => {
  if (DEMO_MODE) {
    try {
      const queryString = new URLSearchParams(params).toString();
      const fullPath = queryString ? `${path}?${queryString}` : path;
      return await resolveDemoRequest("GET", fullPath, params);
    } catch (error) {
      return GET_ERROR(error);
    }
  }

  try {
    const queryString = new URLSearchParams(params).toString();
    const fullPath = queryString ? `${path}?${queryString}` : path;
    const result = await api.get(fullPath);
    return result?.data;
  } catch (error) {
    return GET_ERROR(error);
  }
};

export const postRequest = async (path, body, isFormData = false) => {
  if (DEMO_MODE) {
    try {
      // FormData import is a no-op in demo; still acknowledge the call.
      const payload = isFormData ? {} : body?.bearerToken ? { username: body?.username } : body;
      return await resolveDemoRequest("POST", path, payload || {});
    } catch (error) {
      return GET_ERROR(error);
    }
  }

  try {
    const headers = isFormData
      ? { "Content-Type": "multipart/form-data" }
      : body?.bearerToken
        ? { Authorization: `Bearer ${body.bearerToken}` }
        : {};
    const result = await api.post(
      path,
      body?.bearerToken ? { username: body?.username } : body,
      { headers }
    );
    return result?.data;
  } catch (error) {
    return GET_ERROR(error);
  }
};

export const putRequest = async (path, body) => {
  if (DEMO_MODE) {
    try {
      return await resolveDemoRequest("PUT", path, body || {});
    } catch (error) {
      return GET_ERROR(error);
    }
  }

  try {
    const result = await api.put(path, body);
    return result?.data;
  } catch (error) {
    return GET_ERROR(error);
  }
};

export const patchRequest = async (path, body) => {
  if (DEMO_MODE) {
    try {
      return await resolveDemoRequest("PATCH", path, body || {});
    } catch (error) {
      return GET_ERROR(error);
    }
  }

  try {
    const result = await api.patch(path, body);
    return result?.data;
  } catch (error) {
    return GET_ERROR(error);
  }
};

export const deleteRequest = async (path) => {
  if (DEMO_MODE) {
    try {
      return await resolveDemoRequest("DELETE", path, {});
    } catch (error) {
      return GET_ERROR(error);
    }
  }

  try {
    const result = await api.delete(path);
    return result?.data;
  } catch (error) {
    return GET_ERROR(error);
  }
};

export const postBlobRequest = async (path, body = {}) => {
  if (DEMO_MODE) {
    try {
      return await resolveDemoBlobRequest(path, body);
    } catch (error) {
      return GET_ERROR(error);
    }
  }

  let userInfo;
  try {
    userInfo = JSON.parse(sessionStorage.getItem(USER_INFO));
  } catch (error) {
    console.warn("Failed to parse user info from sessionStorage:", error);
    userInfo = null;
  }

  try {
    const result = await api.post(path, body, {
      responseType: "blob",
      headers: userInfo?.token
        ? { Authorization: `Bearer ${userInfo.token}` }
        : {},
    });
    return result;
  } catch (error) {
    return GET_ERROR(error);
  }
};
