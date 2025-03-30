import axios from "axios";

const BACKEND_URL = "http://127.0.0.1:8000";  // Python Backend URL

/**
 * Calls the root API endpoint of the Python backend.
 * Verifies if the backend is running and accessible.
 */
export const checkBackendHealth = async () => {
  try {
    const response = await axios.get(`${BACKEND_URL}/`);
    console.log("✅ Backend Health Check:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Backend not reachable:", error);
    throw new Error("Backend unreachable");
  }
};

/**
 * Utility function to test the Python backend connectivity
 */
export const testBackendConnection = async () => {
  try {
    const data = await checkBackendHealth();
    console.log("Backend is running:", data);
    return data;
  } catch (error) {
    console.error("Failed to connect to backend:", error);
    return null;
  }
};
