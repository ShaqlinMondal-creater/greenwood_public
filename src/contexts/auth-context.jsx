import { createContext, useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import useSessionStorage from "../hooks/useSessionStorage";
import { loginApi, loginAsStudentApi } from "../services/auth.service";
import { toast } from "react-toastify";
import { IS_LOGGED_IN, USER_INFO } from "../utils/constants";
import { DEMO_MODE } from "../services/api.request";
import authJson from "../demo-data/auth.json";

const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const count = useRef(0);
  const demoSynced = useRef(false);

  const [isLoggedIn, setIsLoggedIn, removeLoggedIn] = useSessionStorage(
    IS_LOGGED_IN,
    false
  );
  const [userInfo, setUserInfo, removeUserInfo] = useSessionStorage(
    USER_INFO,
    null
  );
  const [isLoading, setIsLoading] = useState(false);

  // If already logged in with an old session, refresh demo admin profile once.
  // Does NOT auto-login — logout must reach the login page.
  useEffect(() => {
    if (!DEMO_MODE || demoSynced.current || !isLoggedIn) return;
    demoSynced.current = true;
    const demoUser = authJson?.data;
    if (!demoUser) return;
    if (userInfo?.token !== demoUser.token || userInfo?.access_to !== "all") {
      setUserInfo(demoUser);
    }
  }, [isLoggedIn]);

  const accessTo =
    DEMO_MODE && isLoggedIn
      ? ["all"]
      : userInfo?.access_to?.split(",").filter(Boolean) || [];

  const login = async (formData) => {
    let response;
    setIsLoading(true);
    if (formData?.username && formData?.bearerToken) {
      response = await loginAsStudentApi(
        { username: formData?.username },
        { bearerToken: formData?.bearerToken }
      );
    } else {
      response = await loginApi(formData);
    }
    setIsLoading(false);

    if (response?.code == 200 && response?.status) {
      setIsLoggedIn(true);
      setUserInfo(response?.data);
      toast.success(response?.message || "Login Success");
      count.current = 0;
      demoSynced.current = false;
    } else {
      toast.error(response?.message);
    }
  };

  const logout = (response = null) => {
    removeLoggedIn();
    removeUserInfo();
    setIsLoggedIn(false);
    setUserInfo(null);
    demoSynced.current = false;
    if (response && count.current === 0) {
      toast.error(response?.message || "Unauthorized");
      count.current = count.current + 1;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        userInfo,
        isLoggedIn,
        setIsLoggedIn,
        login,
        logout,
        isLoading,
        accessTo,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export { AuthContext };

export default AuthProvider;
