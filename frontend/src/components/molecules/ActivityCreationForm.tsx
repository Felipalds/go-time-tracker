import React, { useState } from "react";
import { filterBySubstring } from "@/helpers/filterHelpers";
import { addTag as addTagHelper, removeTag as removeTagHelper } from "@/helpers/tagHelpers";

interface ActivityCreationFormProps {
  categories: string[];
  availableTags: string[];
  isStarting: boolean;
  onSubmit: () => void;
  onFormChange: (data: { name: string; mainCategory: string; tags: string[] }) => void;
}

export const ActivityCreationForm: React.FC<ActivityCreationFormProps> = ({
  categories,
  availableTags,
  isStarting,
  onSubmit,
  onFormChange,
}) => {
  const [activityName, setActivityName] = useState("");
  const [mainCategory, setMainCategory] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showTagDropdown, setShowTagDropdown] = useState(false);

  const filteredCategories = filterBySubstring(categories, mainCategory);
  const filteredTags = filterBySubstring(availableTags, tagInput, selectedTags);

  // Notify parent of form changes
  React.useEffect(() => {
    onFormChange({
      name: activityName,
      mainCategory,
      tags: selectedTags,
    });
  }, [activityName, mainCategory, selectedTags, onFormChange]);

  const handleSubmit = () => {
    onSubmit();
    // Reset form
    setActivityName("");
    setMainCategory("");
    setSelectedTags([]);
    setTagInput("");
  };

  const addTag = (tag: string) => {
    setSelectedTags(addTagHelper(selectedTags, tag));
    setTagInput("");
  };

  const removeTag = (tag: string) => {
    setSelectedTags(removeTagHelper(selectedTags, tag));
  };

  return (
    <div className="w-full max-w-sm flex flex-col gap-3 bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 backdrop-blur-xl z-50">
      {/* Activity Name */}
      <input
        type="text"
        className="w-full bg-white/[0.02] border border-white/[0.05] rounded-xl px-4 py-3 text-slate-50 text-sm placeholder:text-slate-600 focus:outline-none focus:border-indigo-400/40 focus:bg-white/[0.04]"
        placeholder="What are you working on?"
        value={activityName}
        onChange={(e) => setActivityName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            handleSubmit();
          }
        }}
        disabled={isStarting}
      />

      {/* Category */}
      <div className="relative z-50">
        <input
          type="text"
          className="w-full bg-white/[0.02] border border-white/[0.05] rounded-xl px-4 py-3 text-slate-50 text-sm placeholder:text-slate-600 focus:outline-none focus:border-indigo-400/40 focus:bg-white/[0.04]"
          placeholder="Category (e.g., Work, Study)"
          value={mainCategory}
          onChange={(e) => {
            setMainCategory(e.target.value);
            setShowCategoryDropdown(true);
          }}
          onFocus={() => setShowCategoryDropdown(true)}
          onBlur={() => setTimeout(() => setShowCategoryDropdown(false), 200)}
          onKeyDown={(e) => {
            if (e.key === "Tab" && showCategoryDropdown && filteredCategories.length > 0) {
              e.preventDefault();
              setMainCategory(filteredCategories[0]);
              setShowCategoryDropdown(false);
            } else if (e.key === "Enter") {
              e.preventDefault();
              if (showCategoryDropdown && filteredCategories.length > 0) {
                setMainCategory(filteredCategories[0]);
                setShowCategoryDropdown(false);
              } else {
                handleSubmit();
              }
            }
          }}
          disabled={isStarting}
        />
        {showCategoryDropdown && mainCategory && filteredCategories.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-slate-900 border border-white/10 rounded-lg overflow-hidden">
            {filteredCategories.slice(0, 5).map((cat, i) => (
              <div
                key={i}
                className="px-4 py-2 text-slate-400 text-sm hover:bg-slate-800 hover:text-slate-50 cursor-pointer"
                onClick={() => {
                  setMainCategory(cat);
                  setShowCategoryDropdown(false);
                }}
              >
                {cat}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tags */}
      <div className="relative z-40">
        <input
          type="text"
          className="w-full bg-white/[0.02] border border-white/[0.05] rounded-xl px-4 py-3 text-slate-50 text-sm placeholder:text-slate-600 focus:outline-none focus:border-indigo-400/40 focus:bg-white/[0.04]"
          placeholder="Add tags..."
          value={tagInput}
          onChange={(e) => {
            setTagInput(e.target.value);
            setShowTagDropdown(true);
          }}
          onFocus={() => setShowTagDropdown(true)}
          onBlur={() => setTimeout(() => setShowTagDropdown(false), 200)}
          onKeyDown={(e) => {
            if (e.key === "Tab" && showTagDropdown && filteredTags.length > 0 && tagInput) {
              e.preventDefault();
              addTag(filteredTags[0]);
              setShowTagDropdown(false);
            } else if (e.key === "Enter" && tagInput) {
              e.preventDefault();
              if (showTagDropdown && filteredTags.length > 0) {
                addTag(filteredTags[0]);
                setShowTagDropdown(false);
              } else {
                addTag(tagInput);
              }
            }
          }}
          disabled={isStarting}
        />
        {showTagDropdown && tagInput && filteredTags.length > 0 && (
          <div className="absolute z-40 w-full mt-1 bg-slate-900 border border-white/10 rounded-lg overflow-hidden">
            {filteredTags.slice(0, 5).map((tag, i) => (
              <div
                key={i}
                className="px-4 py-2 text-slate-400 text-sm hover:bg-slate-800 hover:text-slate-50 cursor-pointer"
                onClick={() => {
                  addTag(tag);
                  setShowTagDropdown(false);
                }}
              >
                {tag}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Selected Tags */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-2 justify-center">
          {selectedTags.map((tag, i) => (
            <span
              key={i}
              className="bg-pink-500/10 text-pink-400 border border-pink-500/20 px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-2"
            >
              {tag}
              <button
                onClick={() => removeTag(tag)}
                className="hover:text-white"
                disabled={isStarting}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
