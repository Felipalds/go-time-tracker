import { api } from "./api";
import type { Category } from "@/interfaces";

export const categoryService = {
  getAll: () => api.get<{ categories: Category[] }>("/categories"),
};
