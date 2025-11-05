/**
 * Card Component
 * کامپوننت کارت
 */

"use client";

export default function Card({
  children,
  className = "",
  padding = "default",
  hover = false,
  ...props
}) {
  const paddingClasses = {
    none: "",
    sm: "p-4",
    default: "p-6",
    lg: "p-8",
  };

  const hoverClass = hover
    ? "hover:shadow-lg hover:scale-[1.02] transition-all duration-200"
    : "";

  return (
    <div
      className={`
        bg-[var(--color-bg-default)] 
        border border-[var(--color-border)]
        rounded-xl 
        shadow-[var(--shadow-sm)]
        ${paddingClasses[padding]}
        ${hoverClass}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
}




