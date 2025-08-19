// src/utils/authUtils.js
export const getUserPayloadFromToken = () => {
  const token = localStorage.getItem('token');
  if (!token) {
    console.warn('No token found in localStorage.');
    return null;
  }
  try {
    // Basic JWT decoding (payload is the second part)
    const payloadBase64 = token.split('.')[1];
    if (!payloadBase64) {
      console.error('Invalid token format: Missing payload.');
      return null;
    }
    const decodedPayload = atob(payloadBase64);
    const payload = JSON.parse(decodedPayload);
    return payload;
  } catch (error) {
    console.error("Failed to decode token or parse payload:", error);
    return null;
  }
};
