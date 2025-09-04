"use client"

import React, { RefObject } from "react"
import { ArrowDown } from "lucide-react"
import { useElementVisibility } from "@/hooks/useElementVisibility"

interface ProductWithQuantity {
  id: string
  type: string
  name: string
  description: string | null
  price_per_bundle: number
  features: string | null
  features_array: string[]
  quantity: number
  icon: React.ComponentType<{ className?: string }>
  created_at: string
  updated_at: string
}

interface FloatingCartProps {
  products: ProductWithQuantity[]
  deliverySelected: boolean
  total: number
  orderSummaryRef: RefObject<HTMLDivElement | null>
}

export function FloatingCart({
  products,
  deliverySelected,
  total,
  orderSummaryRef
}: FloatingCartProps) {
  // Filter products with quantity > 0
  const cartItems = products.filter(product => product.quantity > 0)
  const hasItems = cartItems.length > 0 || deliverySelected

  // Check if order summary is visible
  const isOrderSummaryVisible = useElementVisibility(orderSummaryRef)

  // Don't render if no items OR if order summary is visible
  if (!hasItems || isOrderSummaryVisible) return null

  const handleScrollToSummary = () => {
    orderSummaryRef.current?.scrollIntoView({ 
      behavior: 'smooth',
      block: 'start'
    })
  }

  return (
    <button
      onClick={handleScrollToSummary}
      className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-40 md:bottom-6 bg-white/80 text-white p-2 rounded-full shadow-sm hover:bg-white hover:scale-105 transition-all duration-200 flex items-center gap-2 min-w-fit group backdrop-blur-md"
      title="View order summary"
    >
      <div className="flex p-1 bg-[rgba(77,84,97,1)] rounded-full">
        <ArrowDown className="w-4 h-4 text-white stroke-2"/>
      </div>
      <div className="inline-flex px-1 space-x-1">
        <span className="hidden inline text-sm text-[rgba(127,138,148,1)] font-medium self-center">
          Total:
        </span>
        <span className="hidden inline text-sm text-[rgba(77,84,97,1)] font-semibold self-center">
          ${total.toFixed(2)}
        </span>
      </div>
    </button>
  )
}