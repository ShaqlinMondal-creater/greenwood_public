import { postBlobRequest, postRequest } from "../../../services/api.request";

export const getScholarshipApplications = async () =>
  await postRequest("/student/scholarship/list");

export const updateScholarshipStatus = async (body) =>
  await postRequest("/student/scholarship/update-status", body);

const filenameFromHeader = (disposition, fallback) => {
  if (!disposition) return fallback;
  const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(disposition);
  return match ? decodeURIComponent(match[1].trim()) : fallback;
};

const triggerBrowserDownload = (blob, filename) => {
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
};

const readBlobJson = async (blob) => {
  try {
    return JSON.parse(await blob.text());
  } catch {
    return null;
  }
};

const handleCompressedResponse = async (response, fallbackName) => {
  if (response?.code && response?.code !== 200) {
    if (response?.data instanceof Blob) {
      const json = await readBlobJson(response.data);
      if (json) return json;
    }
    return response;
  }

  const blob = response?.data;
  if (!(blob instanceof Blob)) {
    return { code: 500, message: "Invalid file response." };
  }

  if ((blob.type || "").includes("application/json")) {
    return (
      (await readBlobJson(blob)) || {
        code: 500,
        message: "Failed to compress file.",
      }
    );
  }

  const headerName = filenameFromHeader(
    response?.headers?.["content-disposition"] ||
      response?.headers?.["Content-Disposition"],
    fallbackName
  );
  const typedName =
    headerName ||
    ((blob.type || "").includes("pdf")
      ? `${String(fallbackName).replace(/\.[^.]+$/, "")}.pdf`
      : (blob.type || "").includes("zip")
        ? `${String(fallbackName).replace(/\.[^.]+$/, "")}.zip`
        : `${String(fallbackName).replace(/\.[^.]+$/, "")}.jpg`);

  triggerBrowserDownload(blob, typedName);
  return { code: 200 };
};

export const downloadCompressedScholarshipFile = async (body) => {
  const response = await postBlobRequest(
    "/student/scholarship/compress-file",
    body
  );
  return handleCompressedResponse(
    response,
    `${body?.file_name || "document"}`
  );
};

export const downloadCompressedScholarshipZip = async (body) => {
  const response = await postBlobRequest(
    "/student/scholarship/compress-all",
    body
  );
  return handleCompressedResponse(
    response,
    `${body?.student_name || "scholarship"}-documents.zip`
  );
};

const previewBlobCache = new Map();

export const previewScholarshipFile = async (fileUrl) => {
  const key = String(fileUrl || "").trim();
  if (!key) return null;
  if (previewBlobCache.has(key)) {
    return previewBlobCache.get(key);
  }

  const pending = (async () => {
    const response = await postBlobRequest("/student/scholarship/preview-file", {
      file_url: key,
    });
    const blob = response?.data;
    if (!(blob instanceof Blob) || blob.size < 32) {
      previewBlobCache.delete(key);
      return null;
    }
    if ((blob.type || "").includes("json")) {
      previewBlobCache.delete(key);
      return null;
    }
    return blob;
  })();

  previewBlobCache.set(key, pending);
  return pending;
};
