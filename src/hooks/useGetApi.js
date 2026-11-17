import { toast } from "react-toastify";
import { useState, useEffect } from "react";

import useAuth from "./useAuth";

export const useGetApi = ({
  apiFunction,
  body = {},
  dependencies = [],
  debounceDelay = 0,
  skip = false,
}) => {
  const { logout } = useAuth();

  const [dataList, setDataList] = useState(null);
  const [dataCount, setDataCount] = useState(0);
  const [allResponse, setAllResponse] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  const fetchData = async () => {
    if (skip || !apiFunction) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setIsError(false);
    try {
      const response = await apiFunction(body);
      setIsLoading(false);

      if (response?.code === 200) {
        setDataList(
          typeof response?.data === "object"
            ? response?.data || null
            : response?.data || []
        );
        setDataCount(
          Number(response?.total) ||
            Number(response?.count) ||
            Number(response?.total_records) ||
            0
        );
        setAllResponse(response || {});
      } else if (response?.code === 401) {
        logout(response);
      } else {
        setIsError(true);
        setErrorMessage(response?.message || "Some error occurred.");
        toast.error(response?.message || "Some error occurred.");
      }
    } catch (error) {
      setIsLoading(false);
      setIsError(true);
      const message = error?.message || "Some error occurred.";
      setErrorMessage(message);
      toast.error(message);
    }
  };

  useEffect(() => {
    let timer = null;

    if (skip || !apiFunction) {
      setIsLoading(false);
      return;
    }

    // Debounce text filters (name search + parent name) the same way
    if (body?.search || body?.parent_search || body?.fee_name) {
      timer = setTimeout(fetchData, debounceDelay);
    } else {
      fetchData();
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [...dependencies]);

  return {
    dataList,
    dataCount: Number(dataCount),
    isLoading,
    isError,
    refetch: fetchData,
    allResponse,
    errorMessage,
  };
};
