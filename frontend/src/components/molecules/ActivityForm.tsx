import React from "react";
import { Input } from "../atoms/Input";
import { Badge } from "../atoms/Badge";
import { AutocompleteInput } from "./AutocompleteInput";

interface ActivityFormProps {
  categories: string[];
  tags: string[];
  activityName: string;
  mainCategory: string;
  subCategory: string;
  selectedTags: string[];
  onActivityNameChange: (value: string) => void;
  onMainCategoryChange: (value: string) => void;
  onSubCategoryChange: (value: string) => void;
  onTagsChange: (tags: string[]) => void;
  disabled?: boolean;
}

export const ActivityForm: React.FC<ActivityFormProps> = ({
  categories,
  tags: availableTags,
  activityName,
  mainCategory,
  subCategory,
  selectedTags,
  onActivityNameChange,
  onMainCategoryChange,
  onSubCategoryChange,
  onTagsChange,
  disabled = false,
}) => {
  const [tagInput, setTagInput] = React.useState("");

  const handleAddTag = (tag: string) => {
    if (tag && !selectedTags.includes(tag)) {
      onTagsChange([...selectedTags, tag]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    onTagsChange(selectedTags.filter((tag) => tag !== tagToRemove));
  };

  return (
    <div className="w-full max-w-3xl space-y-6">
      <Input
        label="Activity Name *"
        placeholder="What are you working on?"
        value={activityName}
        onChange={(e) => onActivityNameChange(e.target.value)}
        disabled={disabled}
        className="text-pixel-lg"
      />

      <div className="grid grid-cols-2 gap-6">
        <AutocompleteInput
          label="Main Category *"
          placeholder="Work, Study, etc."
          value={mainCategory}
          onChange={onMainCategoryChange}
          suggestions={categories}
          disabled={disabled}
        />

        <AutocompleteInput
          label="Sub Category"
          placeholder="Frontend, Backend, etc."
          value={subCategory}
          onChange={onSubCategoryChange}
          suggestions={categories}
          disabled={disabled}
        />
      </div>

      <div>
        <AutocompleteInput
          label="Tags"
          placeholder="Add tags..."
          value={tagInput}
          onChange={setTagInput}
          onSelect={handleAddTag}
          suggestions={availableTags}
          disabled={disabled}
        />

        {selectedTags.length > 0 && (
          <div className="flex flex-wrap gap-3 mt-3">
            {selectedTags.map((tag, index) => (
              <Badge
                key={index}
                color="purple"
                onRemove={() => handleRemoveTag(tag)}
              >
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
