import * as React from "react"

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface SelectScrollableProps {
  value?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  className?: string
  items: Array<{
    id: string
    name: string
    group?: string
  }>
  groupBy?: string
}

export function SelectScrollable({ 
  value, 
  onValueChange, 
  placeholder = "Select an option",
  className,
  items,
  groupBy
}: SelectScrollableProps) {
  if (groupBy) {
    // Group items by the specified field
    const groupedItems = items.reduce((acc, item) => {
      const group = (item as any)[groupBy] || 'Other'
      if (!acc[group]) acc[group] = []
      acc[group].push(item)
      return acc
    }, {} as Record<string, typeof items>)

    return (
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className={className}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(groupedItems).map(([groupName, groupItems]) => (
            <SelectGroup key={groupName}>
              <SelectLabel>{groupName}</SelectLabel>
              {groupItems.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.name}
                </SelectItem>
              ))}
            </SelectGroup>
          ))}
        </SelectContent>
      </Select>
    )
  }

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {items.map((item) => (
            <SelectItem key={item.id} value={item.id}>
              {item.name}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}