"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

type ImageLoadingStatus = "loading" | "loaded" | "error"

const AvatarContext = React.createContext<{
    imageLoadingStatus: ImageLoadingStatus
    onImageLoadingStatusChange: (status: ImageLoadingStatus) => void
} | null>(null)

const Avatar = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
    const [status, setStatus] = React.useState<ImageLoadingStatus>("error")

    return (
        <AvatarContext.Provider value={{
            imageLoadingStatus: status,
            onImageLoadingStatusChange: setStatus
        }}>
            <div
                ref={ref}
                className={cn(
                    "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
                    className
                )}
                {...props}
            />
        </AvatarContext.Provider>
    )
})
Avatar.displayName = "Avatar"

const AvatarImage = React.forwardRef<
    HTMLImageElement,
    React.ImgHTMLAttributes<HTMLImageElement>
>(({ className, src, ...props }, ref) => {
    const context = React.useContext(AvatarContext)

    React.useEffect(() => {
        if (!src || typeof src !== 'string') {
            context?.onImageLoadingStatusChange("error")
            return
        }

        let mounted = true
        const img = new Image()
        img.src = src
        img.onload = () => {
            if (mounted) context?.onImageLoadingStatusChange("loaded")
        }
        img.onerror = () => {
            if (mounted) context?.onImageLoadingStatusChange("error")
        }
        return () => {
            mounted = false
        }
    }, [src])

    if (context?.imageLoadingStatus !== "loaded") return null

    return (
        <img
            ref={ref}
            src={src}
            className={cn("aspect-square h-full w-full object-cover", className)}
            {...props}
        />
    )
})
AvatarImage.displayName = "AvatarImage"

const AvatarFallback = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
    const context = React.useContext(AvatarContext)

    if (context?.imageLoadingStatus === "loaded") return null

    return (
        <div
            ref={ref}
            className={cn(
                "flex h-full w-full items-center justify-center rounded-full bg-muted",
                className
            )}
            {...props}
        />
    )
})
AvatarFallback.displayName = "AvatarFallback"

export { Avatar, AvatarImage, AvatarFallback }
