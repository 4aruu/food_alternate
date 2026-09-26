import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";
import Icon from "@/components/AppIcon";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        success: "bg-success text-success-foreground hover:bg-success/90",
        warning: "bg-warn text-warn-foreground hover:bg-warn/90",
        danger: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        primary: "bg-primary text-primary-foreground hover:bg-primary/90",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
        xs: "h-7 rounded-md px-2 text-xs",
        xl: "h-11 rounded-md px-8 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

const Button = React.forwardRef(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      children,
      loading = false,
      iconName = null,
      iconPosition = "left",
      iconSize = null,
      fullWidth = false,
      disabled = false,
      icon,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button";
    const iconSizeMap = { xs: 12, sm: 14, default: 16, lg: 18, xl: 20, icon: 16 };
    const calculatedIconSize = iconSize || iconSizeMap?.[size] || 16;

    const LoadingSpinner = () => (
      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3.824 7.938l3-2.647z"
        />
      </svg>
    );

    const namedIcon = iconName ? (
      <Icon
        name={iconName}
        size={calculatedIconSize}
        className={cn(children && iconPosition === "left" && "mr-0", children && iconPosition === "right" && "ml-0")}
      />
    ) : icon;

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }), fullWidth && "w-full")}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <LoadingSpinner />}
        {namedIcon && iconPosition !== "right" && namedIcon}
        {children}
        {namedIcon && iconPosition === "right" && namedIcon}
      </Comp>
    );
  }
);

Button.displayName = "Button";

export { Button, buttonVariants };
export default Button;
