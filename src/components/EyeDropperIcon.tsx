interface EyeDropperIconProps {
  className?: string
}

export default function EyeDropperIcon({ className = "w-4 h-4" }: EyeDropperIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M2 22 16 8" />
      <path d="M10.5 12.5 8 15l-1.5-1.5L9 11" />
      <path d="M16.5 7.5 14 10l1.5 1.5L18 9" />
      <path d="M17 3 21 7" />
      <path d="M10.2 13.8 8.7 15.3a2.1 2.1 0 0 1-3 0 2.1 2.1 0 0 1 0-3l1.5-1.5" />
    </svg>
  )
}
