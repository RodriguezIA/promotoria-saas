import * as React from "react"

const AvatarContext = React.createContext<{ size?: string }>({})

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string | null
  alt?: string
  size?: "sm" | "md" | "lg" | "xl"
  fallback?: React.ReactNode
}

const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, src, alt = "Avatar", size = "md", fallback, ...props }, ref) => {
    const [imageError, setImageError] = React.useState(false)

    const sizeMap = {
      sm: "w-8 h-8",
      md: "w-10 h-10",
      lg: "w-16 h-16",
      xl: "w-32 h-32",
    }

    return (
      <div
        ref={ref}
        className={`relative inline-flex items-center justify-center rounded-full bg-muted text-muted-foreground overflow-hidden flex-shrink-0 ${sizeMap[size]} ${className}`}
        {...props}
      >
        {src && !imageError ? (
          <img
            src={src}
            alt={alt}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="flex items-center justify-center w-full h-full">
            {fallback}
          </div>
        )}
      </div>
    )
  }
)
Avatar.displayName = "Avatar"

export { Avatar }
