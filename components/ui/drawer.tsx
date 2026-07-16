"use client"

import * as React from "react"
import { Drawer as DrawerPrimitive } from "@base-ui/react/drawer"

import { cn } from "@/lib/utils"

type Direction = "right" | "bottom"

const DirectionContext = React.createContext<Direction>("bottom")

function Drawer({
  direction = "bottom",
  ...props
}: Omit<DrawerPrimitive.Root.Props, "swipeDirection"> & {
  direction?: Direction
}) {
  return (
    <DirectionContext.Provider value={direction}>
      <DrawerPrimitive.Root
        data-slot="drawer"
        swipeDirection={direction === "right" ? "right" : "down"}
        {...props}
      />
    </DirectionContext.Provider>
  )
}

function DrawerTrigger({ ...props }: DrawerPrimitive.Trigger.Props) {
  return <DrawerPrimitive.Trigger data-slot="drawer-trigger" {...props} />
}

function DrawerClose({ ...props }: DrawerPrimitive.Close.Props) {
  return <DrawerPrimitive.Close data-slot="drawer-close" {...props} />
}

const TRANSITION =
  "transition-transform duration-[450ms] ease-[cubic-bezier(0.32,0.72,0,1)] data-swiping:duration-0 data-ending-style:duration-[calc(var(--drawer-swipe-strength)*400ms)]"

function DrawerContent({
  className,
  children,
  ...props
}: DrawerPrimitive.Popup.Props) {
  const direction = React.useContext(DirectionContext)

  return (
    <DrawerPrimitive.Portal>
      {/* z-200 clears PublicNav, which is sticky at z-100 — a drawer that the
          site header punches through isn't a drawer. */}
      <DrawerPrimitive.Backdrop
        data-slot="drawer-backdrop"
        className="fixed inset-0 z-200 min-h-dvh bg-black opacity-[calc(0.4*(1-var(--drawer-swipe-progress)))] transition-opacity duration-[450ms] ease-[cubic-bezier(0.32,0.72,0,1)] data-swiping:duration-0 data-ending-style:opacity-0 data-starting-style:opacity-0"
      />
      <DrawerPrimitive.Viewport
        className={cn(
          "fixed inset-0 z-200 flex",
          direction === "right" ? "items-stretch justify-end" : "items-end"
        )}
      >
        <DrawerPrimitive.Popup
          data-slot="drawer-content"
          className={cn(
            "flex flex-col bg-background outline-hidden",
            TRANSITION,
            direction === "right"
              ? [
                  "h-full w-full max-w-xl border-l",
                  "[transform:translateX(var(--drawer-swipe-movement-x))]",
                  "data-ending-style:[transform:translateX(100%)]",
                  "data-starting-style:[transform:translateX(100%)]",
                ]
              : [
                  "max-h-[92vh] w-full rounded-t-xl border-t",
                  "[transform:translateY(var(--drawer-swipe-movement-y))]",
                  "data-ending-style:[transform:translateY(100%)]",
                  "data-starting-style:[transform:translateY(100%)]",
                ],
            className
          )}
          {...props}
        >
          {direction === "bottom" ? (
            <div
              aria-hidden
              className="mx-auto mt-3 h-1.5 w-12 shrink-0 rounded-full bg-muted"
            />
          ) : null}
          <DrawerPrimitive.Content className="flex min-h-0 flex-1 flex-col">
            {children}
          </DrawerPrimitive.Content>
        </DrawerPrimitive.Popup>
      </DrawerPrimitive.Viewport>
    </DrawerPrimitive.Portal>
  )
}

function DrawerHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="drawer-header"
      className={cn("flex flex-col gap-1 p-4 text-left", className)}
      {...props}
    />
  )
}

function DrawerFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="drawer-footer"
      className={cn("mt-auto flex flex-col gap-2 p-4", className)}
      {...props}
    />
  )
}

function DrawerTitle({ className, ...props }: DrawerPrimitive.Title.Props) {
  return (
    <DrawerPrimitive.Title
      data-slot="drawer-title"
      className={cn("font-heading text-base font-semibold", className)}
      {...props}
    />
  )
}

function DrawerDescription({
  className,
  ...props
}: DrawerPrimitive.Description.Props) {
  return (
    <DrawerPrimitive.Description
      data-slot="drawer-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

export {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
}
