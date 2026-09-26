import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef(
  ({ className, type = "text", label, description, error, required = false, id, ...props }, ref) => {
    const inputId = id || React.useId();
    const baseInputClasses =
      "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

    if (type === "checkbox") {
      return (
        <input
          type="checkbox"
          className={cn("h-4 w-4 rounded border border-input bg-background text-primary", className)}
          ref={ref}
          id={inputId}
          {...props}
        />
      );
    }

    if (type === "radio") {
      return (
        <input
          type="radio"
          className={cn("h-4 w-4 rounded-full border border-input bg-background text-primary", className)}
          ref={ref}
          id={inputId}
          {...props}
        />
      );
    }

    const field = (
      <input
        type={type}
        className={cn(baseInputClasses, error && "border-destructive focus-visible:ring-destructive", className)}
        ref={ref}
        id={inputId}
        {...props}
      />
    );

    if (!label && !description && !error) {
      return field;
    }

    return (
      <div className="space-y-2">
        {label && (
          <label
            htmlFor={inputId}
            className={cn(
              "text-sm font-medium leading-none",
              error ? "text-destructive" : "text-foreground"
            )}
          >
            {label}
            {required && <span className="text-destructive ml-1">*</span>}
          </label>
        )}
        {field}
        {description && !error && <p className="text-sm text-muted-foreground">{description}</p>}
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";

export { Input };
export default Input;
