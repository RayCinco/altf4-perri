import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-8 w-full min-w-0 rounded-lg border border-[#001D3F] bg-[#000919] px-2.5 py-1 text-base text-white transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-white placeholder:text-[#c0c6cc] focus-visible:border-[#054E98] focus-visible:ring-3 focus-visible:ring-[#054E98]/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-[#0a1a3a] disabled:opacity-50 aria-invalid:border-[#054E98] aria-invalid:ring-3 aria-invalid:ring-[#054E98]/20 md:text-sm dark:bg-[#000919] dark:disabled:bg-[#0a1a3a] dark:aria-invalid:border-[#054E98]/50 dark:aria-invalid:ring-[#054E98]/40",
        className
      )}
      {...props}
    />
  )
}

export { Input }