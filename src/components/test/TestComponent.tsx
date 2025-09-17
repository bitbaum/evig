'use client'

export default function TestComponent() {
  try {
    return (
      <div className="fixed top-10 right-10 z-[999] bg-green-500 text-white p-4 rounded">
        <div>✅ TestComponent rendered successfully</div>
      </div>
    )
  } catch (error) {
    console.error('TestComponent error:', error)
    return (
      <div className="fixed top-10 right-10 z-[999] bg-red-500 text-white p-4 rounded">
        ❌ TestComponent error
      </div>
    )
  }
}