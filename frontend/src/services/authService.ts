import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  User,
} from "@/interfaces";

const API_URL = "http://localhost:8085/api";

export const authService = {
  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || "Registration failed");
    }

    const authResponse: AuthResponse = await response.json();
    localStorage.setItem("token", authResponse.token);
    return authResponse;
  },

  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || "Login failed");
    }

    const authResponse: AuthResponse = await response.json();
    localStorage.setItem("token", authResponse.token);
    return authResponse;
  },

  logout: () => {
    localStorage.removeItem("token");
  },

  getMe: async (): Promise<User> => {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("No token found");
    }

    const response = await fetch(`${API_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch user");
    }

    const data = await response.json();
    return data.user;
  },

  getToken: (): string | null => {
    return localStorage.getItem("token");
  },
};
