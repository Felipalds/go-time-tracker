import { useQuery } from "@tanstack/react-query";
import { categoryService } from "@/services/categoryService";

export const useCategories = () => {
  return useQuery({
    queryKey: ["categories"],
    queryFn: () => categoryService.getAll(),
    select: (data) => data.categories.map((c) => c.name),
  });
};
