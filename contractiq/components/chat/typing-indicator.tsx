export default function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="bg-line-100 border border-line-200 rounded-xl rounded-bl-sm px-4 py-3 flex gap-1 items-center">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-ink-400 inline-block animate-bounce"
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </div>
    </div>
  )
}
