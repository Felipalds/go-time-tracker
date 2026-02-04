import React, { useState, useEffect } from "react";
import type { Activity } from "@/interfaces";

interface EditActivityDialogProps {
  activity: Activity;
  categories: string[];
  availableTags: string[];
  onSave: (
    id: number,
    data: { name: string; main_category_name: string; tag_names: string[] },
  ) => void;
  onClose: () => void;
}

export const EditActivityDialog: React.FC<EditActivityDialogProps> = ({
  activity,
  categories,
  availableTags,
  onSave,
  onClose,
}) => {
  const [name, setName] = useState(activity.name);
  const [category, setCategory] = useState(activity.main_category?.name || "");
  const [selectedTags, setSelectedTags] = useState<string[]>(
    activity.tags?.map((t) => t.name) || [],
  );
  const [tagInput, setTagInput] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  const handleSave = async () => {
    if (!name.trim() || !category.trim()) return;

    setSaving(true);
    await onSave(activity.id, {
      name: name.trim(),
      main_category_name: category.trim(),
      tag_names: selectedTags,
    });
    setSaving(false);
  };

  const addTag = (tag: string) => {
    if (tag && !selectedTags.includes(tag)) {
      setSelectedTags([...selectedTags, tag]);
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    setSelectedTags(selectedTags.filter((t) => t !== tag));
  };

  const filteredCategories = categories.filter(
    (c) => c.toLowerCase().includes(category.toLowerCase()) && c !== category,
  );

  const filteredTags = availableTags.filter(
    (t) =>
      t.toLowerCase().includes(tagInput.toLowerCase()) &&
      !selectedTags.includes(t),
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-slate-900 border border-white/10 rounded-2xl p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-semibold text-slate-50 mb-6">
          Edit Activity
        </h2>

        <div className="flex flex-col gap-4">
          {/* Activity Name */}
          <div>
            <label className="block text-sm text-slate-400 mb-2">Name</label>
            <input
              type="text"
              className="w-full bg-white/[0.02] border border-white/[0.08] rounded-xl px-4 py-3 text-slate-50 text-sm placeholder:text-slate-600 focus:outline-none focus:border-indigo-400/40 focus:bg-white/[0.04]"
              placeholder="Activity name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Category */}
          <div className="relative">
            <label className="block text-sm text-slate-400 mb-2">
              Category
            </label>
            <input
              type="text"
              className="w-full bg-white/[0.02] border border-white/[0.08] rounded-xl px-4 py-3 text-slate-50 text-sm placeholder:text-slate-600 focus:outline-none focus:border-indigo-400/40 focus:bg-white/[0.04]"
              placeholder="Category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
            {category && filteredCategories.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-slate-800 border border-white/10 rounded-lg overflow-hidden max-h-40 overflow-y-auto">
                {filteredCategories.slice(0, 5).map((cat, i) => (
                  <div
                    key={i}
                    className="px-4 py-2 text-slate-400 text-sm hover:bg-slate-700 hover:text-slate-50 cursor-pointer"
                    onClick={() => setCategory(cat)}
                  >
                    {cat}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tags */}
          <div className="relative">
            <label className="block text-sm text-slate-400 mb-2">Tags</label>
            <input
              type="text"
              className="w-full bg-white/[0.02] border border-white/[0.08] rounded-xl px-4 py-3 text-slate-50 text-sm placeholder:text-slate-600 focus:outline-none focus:border-indigo-400/40 focus:bg-white/[0.04]"
              placeholder="Add tags..."
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && tagInput) {
                  e.preventDefault();
                  addTag(tagInput);
                }
              }}
            />
            {tagInput && filteredTags.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-slate-800 border border-white/10 rounded-lg overflow-hidden max-h-40 overflow-y-auto">
                {filteredTags.slice(0, 5).map((tag, i) => (
                  <div
                    key={i}
                    className="px-4 py-2 text-slate-400 text-sm hover:bg-slate-700 hover:text-slate-50 cursor-pointer"
                    onClick={() => addTag(tag)}
                  >
                    {tag}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Selected Tags */}
          {selectedTags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedTags.map((tag, i) => (
                <span
                  key={i}
                  className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-2"
                >
                  {tag}
                  <button
                    onClick={() => removeTag(tag)}
                    className="hover:text-white"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-6 justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !name.trim() || !category.trim()}
            className="px-5 py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-purple-500/30"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
};
