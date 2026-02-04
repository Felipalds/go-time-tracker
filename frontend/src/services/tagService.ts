import { api } from "./api";
import type { Tag } from "@/interfaces";

export const tagService = {
  getAll: () => api.get<{ tags: Tag[] }>("/tags"),
};
