import React, { useState } from 'react';
import { Input } from '../atoms/Input';
import { Badge } from '../atoms/Badge';
import { AutocompleteInput } from './AutocompleteInput';

interface ActivityFormProps {
  categories: string[];
  tags: string[];
  onSubmit: (data: {
    name: string;
    mainCategory: string;
    subCategory: string;
    tags: string[];
  }) => void;
  disabled?: boolean;
}

export const ActivityForm: React.FC<ActivityFormProps> = ({
  categories,
  tags: availableTags,
  onSubmit,
  disabled = false,
}) => {
  const [name, setName] = useState('');
  const [mainCategory, setMainCategory] = useState('');
  const [subCategory, setSubCategory] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !mainCategory.trim()) return;

    onSubmit({
      name: name.trim(),
      mainCategory: mainCategory.trim(),
      subCategory: subCategory.trim(),
      tags: selectedTags,
    });

    // Reset form
    setName('');
    setMainCategory('');
    setSubCategory('');
    setSelectedTags([]);
    setTagInput('');
  };

  const handleAddTag = (tag: string) => {
    if (tag && !selectedTags.includes(tag)) {
      setSelectedTags([...selectedTags, tag]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setSelectedTags(selectedTags.filter(tag => tag !== tagToRemove));
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto space-y-4">
      <Input
        label="Activity Name"
        placeholder="What are you working on?"
        value={name}
        onChange={(e) => setName(e.target.value)}
        disabled={disabled}
        required
      />

      <div className="grid grid-cols-2 gap-4">
        <AutocompleteInput
          label="Main Category"
          placeholder="Work, Study, etc."
          value={mainCategory}
          onChange={setMainCategory}
          suggestions={categories}
          disabled={disabled}
          required
        />

        <AutocompleteInput
          label="Sub Category (optional)"
          placeholder="Frontend, Backend, etc."
          value={subCategory}
          onChange={setSubCategory}
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
          <div className="flex flex-wrap gap-2 mt-2">
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
    </form>
  );
};
