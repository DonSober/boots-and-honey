"use client"

import * as React from "react"
import { ChevronDownIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DateTimePickerProps {
  date?: Date
  onDateChange?: (date: Date | undefined) => void
  className?: string
  required?: boolean
}

export function DateTimePicker({ date, onDateChange, className, required }: DateTimePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [time, setTime] = React.useState("10:30:00")

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (selectedDate && time) {
      const [hours, minutes, seconds] = time.split(":")
      selectedDate.setHours(
        Number.parseInt(hours),
        Number.parseInt(minutes),
        Number.parseInt(seconds || "0")
      )
      onDateChange?.(selectedDate)
    } else {
      onDateChange?.(selectedDate)
    }
    setOpen(false)
  }

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = e.target.value
    setTime(newTime)
    if (date && newTime) {
      const [hours, minutes, seconds] = newTime.split(":")
      const newDate = new Date(date)
      newDate.setHours(
        Number.parseInt(hours),
        Number.parseInt(minutes),
        Number.parseInt(seconds || "0")
      )
      onDateChange?.(newDate)
    }
  }

  return (
    <div className={`flex gap-4 mt-1 ${className}`}>
      <div className="flex flex-col gap-3 flex-1">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={`w-full justify-between font-normal h-[40px] px-3 py-2 text-sm border rounded-md focus:outline-[0.5px] focus:outline-blue-600 bg-white hover:bg-gray-50 shadow-none text-[rgba(77,84,97,1)] ${
                required && !date ? 'border-red-300' : 'border-gray-300'
              }`}
              required={required}
            >
              {date ? date.toLocaleDateString() : "Select date"}
              <ChevronDownIcon className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto overflow-hidden p-0 shadow-none border border-gray-200" align="start">
            <Calendar
              mode="single"
              selected={date}
              captionLayout="dropdown"
              onSelect={handleDateSelect}
              disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
              fromYear={new Date().getFullYear()}
              toYear={new Date().getFullYear() + 1}
            />
          </PopoverContent>
        </Popover>
      </div>
      <div className="w-32">
        <Input
          type="time"
          step="1"
          value={time}
          onChange={handleTimeChange}
          required={required}
          className={`bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none h-[40px] px-3 py-2 text-sm font-normal border rounded-md focus:outline-[0.5px] focus:outline-blue-600 shadow-none text-[rgba(77,84,97,1)] ${
            required && !date ? 'border-red-300' : 'border-gray-300'
          }`}
        />
      </div>
    </div>
  )
}