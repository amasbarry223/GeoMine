'use client';

import React, { useState, KeyboardEvent } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { FormField } from './FormField';
import { cn } from '@/lib/utils';

export interface TagsInputProps {
  label?: string;
  name: string;
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  maxTags?: number;
  allowDuplicates?: boolean;
  suggestions?: string[];
  className?: string;
  error?: string;
  description?: string;
}

export function TagsInput({
  label = 'Tags',
  name,
  value = [],
  onChange,
  placeholder = 'Ajouter un tag (Entrée pour valider)',
  maxTags,
  allowDuplicates = false,
  suggestions = [],
  className,
  error,
  description,
}: TagsInputProps) {
  const [tagInput, setTagInput] = useState('');
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);

  const handleAddTag = (tag: string) => {
    const trimmedTag = tag.trim();
    if (!trimmedTag) return;

    // Check max tags
    if (maxTags && value.length >= maxTags) {
      return;
    }

    // Check duplicates
    if (!allowDuplicates && value.includes(trimmedTag)) {
      return;
    }

    onChange([...value, trimmedTag]);
    setTagInput('');
    setFilteredSuggestions([]);
  };

  const handleRemoveTag = (tagToRemove: string) => {
    onChange(value.filter((tag) => tag !== tagToRemove));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag(tagInput);
    } else if (e.key === 'Escape') {
      setTagInput('');
      setFilteredSuggestions([]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    setTagInput(input);

    // Filter suggestions
    if (input.trim() && suggestions.length > 0) {
      const filtered = suggestions.filter(
        (suggestion) =>
          suggestion.toLowerCase().includes(input.toLowerCase()) &&
          !value.includes(suggestion)
      );
      setFilteredSuggestions(filtered.slice(0, 5));
    } else {
      setFilteredSuggestions([]);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleAddTag(suggestion);
  };

  return (
    <FormField
      label={label}
      name={name}
      error={error}
      description={description}
      className={className}
    >
      <div className="space-y-2">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              value={tagInput}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className={cn(error && 'border-destructive')}
            />
            {filteredSuggestions.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-popover border rounded-md shadow-md">
                {filteredSuggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full text-left px-3 py-2 hover:bg-muted text-sm"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleAddTag(tagInput)}
            disabled={!tagInput.trim() || (maxTags ? value.length >= maxTags : false)}
          >
            Ajouter
          </Button>
        </div>

        {value.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {value.map((tag) => (
              <Badge key={tag} variant="secondary" className="gap-1">
                {tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="ml-1 hover:text-destructive transition-colors"
                  aria-label={`Supprimer le tag ${tag}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}

        {maxTags && (
          <p className="text-xs text-muted-foreground">
            {value.length}/{maxTags} tags maximum
          </p>
        )}
      </div>
    </FormField>
  );
}


