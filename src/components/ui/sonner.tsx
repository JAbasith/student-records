"use client";

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      position="top-right"
      richColors
      closeButton
      expand
      gap={12}
      offset={16}
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--normal-shadow": "0 18px 48px rgba(15, 23, 42, 0.12)",
          "--border-radius": "calc(var(--radius) * 1.5)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:shadow-[0_18px_48px_rgba(15,23,42,0.12)] group-[.toaster]:border-border/70 group-[.toaster]:bg-popover group-[.toaster]:text-popover-foreground group-[.toaster]:rounded-2xl group-[.toaster]:px-4 group-[.toaster]:py-3 group-[.toaster]:backdrop-blur-xl",
          content: "flex flex-col gap-1",
          title: "text-sm font-semibold leading-5 text-popover-foreground",
          description: "text-sm leading-5 text-muted-foreground",
          closeButton:
            "group-[.toast]:border-border/70 group-[.toast]:bg-background group-[.toast]:text-muted-foreground group-[.toast]:hover:bg-muted group-[.toast]:hover:text-foreground",
          success: "group-[.toast]:border-[color:var(--brand-button)]/30",
          error: "group-[.toast]:border-[color:var(--destructive)]/30",
          info: "group-[.toast]:border-[color:var(--primary)]/30",
          warning: "group-[.toast]:border-[color:var(--chart-3)]/30",
          loading: "group-[.toast]:border-border/70",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
