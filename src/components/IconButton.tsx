interface IconButtonProps {
  onClick?: () => void
  children: React.ReactNode
  title?: string
  type?: 'button' | 'submit' | 'reset'
}

export default function IconButton({ 
  onClick, 
  children, 
  title, 
  type = 'button'
}: IconButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      title={title}
      className="w-8 h-8 shrink-0 rounded border border-gray-500 bg-gray-600 hover:bg-gray-500 transition-colors flex items-center justify-center cursor-pointer text-white px-0"
    >
      {children}
    </button>
  )
}
