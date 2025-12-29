'use client';

import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

export interface FormFieldProps {
  label: string;
  name: string;
  required?: boolean;
  error?: string;
  description?: string;
  className?: string;
  children: React.ReactNode;
}

export function FormField({
  label,
  name,
  required = false,
  error,
  description,
  className,
  children,
}: FormFieldProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <Label htmlFor={name}>
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
      {children}
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  name: string;
  required?: boolean;
  error?: string;
  description?: string;
}

export function FormInput({
  label,
  name,
  required,
  error,
  description,
  className,
  ...props
}: FormInputProps) {
  return (
    <FormField
      label={label}
      name={name}
      required={required}
      error={error}
      description={description}
    >
      <Input
        id={name}
        name={name}
        className={cn(error && 'border-destructive', className)}
        {...props}
      />
    </FormField>
  );
}

export interface FormTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  name: string;
  required?: boolean;
  error?: string;
  description?: string;
}

export function FormTextarea({
  label,
  name,
  required,
  error,
  description,
  className,
  ...props
}: FormTextareaProps) {
  return (
    <FormField
      label={label}
      name={name}
      required={required}
      error={error}
      description={description}
    >
      <Textarea
        id={name}
        name={name}
        className={cn(error && 'border-destructive', className)}
        {...props}
      />
    </FormField>
  );
}

export interface FormSelectProps {
  label: string;
  name: string;
  required?: boolean;
  error?: string;
  description?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  children: React.ReactNode;
}

export function FormSelect({
  label,
  name,
  required,
  error,
  description,
  value,
  onValueChange,
  placeholder,
  disabled,
  children,
}: FormSelectProps) {
  return (
    <FormField
      label={label}
      name={name}
      required={required}
      error={error}
      description={description}
    >
      <Select value={value} onValueChange={onValueChange} disabled={disabled}>
        <SelectTrigger id={name} className={error && 'border-destructive'}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>{children}</SelectContent>
      </Select>
    </FormField>
  );
}


