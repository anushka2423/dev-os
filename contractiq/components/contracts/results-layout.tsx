interface ResultsLayoutProps {
  leftPanel: React.ReactNode
  rightPanel: React.ReactNode
}

export default function ResultsLayout({ leftPanel, rightPanel }: ResultsLayoutProps) {
  return (
    <div className="flex h-full overflow-hidden">
      {/* Left: PDF / text viewer */}
      <div className="flex-[55] overflow-y-auto bg-bg-page border-r border-line-200">
        {leftPanel}
      </div>
      {/* Right: key terms panel */}
      <div className="flex-[45] overflow-y-auto bg-bg-surface">
        {rightPanel}
      </div>
    </div>
  )
}
