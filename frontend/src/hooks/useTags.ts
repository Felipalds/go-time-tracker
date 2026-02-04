import { useQuery } from "@tanstack/react-query";
import { tagService } from "@/services/tagService";

export const useTags = () => {
  return useQuery({
    queryKey: ["tags"],
    queryFn: () => tagService.getAll(),
    select: (data) => data.tags.map((t) => t.name),
  });
};
