import type { Category } from "./Category";
import type { Tag } from "./Tag";

export interface Activity {
  id: number;
  name: string;
  main_category: Category;
  sub_category?: Category | null;
  tags?: Tag[];
  total_seconds?: number;
  total_formatted?: string;
  entry_count?: number;
  intervals_rewarded?: number;
}
