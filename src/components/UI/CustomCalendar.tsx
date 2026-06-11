import React, { useState, useRef, useEffect } from "react";
import { getDaysInMonth, getFirstDayOfMonth, isToday } from "../../utils/onlineFormHelpers";

interface CustomCalendarProps {
  selectedDate: number | null;
  onSelectDate: (timestamp: number) => void;
  onClose: () => void;
}

const CustomCalendar: React.FC<CustomCalendarProps> = ({ selectedDate, onSelectDate, onClose }) => {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date(selectedDate || Date.now()));
  const [showYearSelector, setShowYearSelector] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);

  // Close on outside click logic found in original files
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  return (
    <div ref={calendarRef} className="absolute z-50 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl p-4 w-72">
      {/* Header: Month/Year and Navigation */}
      <div className="flex justify-between items-center mb-4">
        <button 
          onClick={() => setCurrentMonth(new Date(year, month - 1))} 
          className="p-1 hover:bg-gray-100 rounded"
          type="button"
        >
          ←
        </button>
        <div 
          className="font-bold cursor-pointer hover:text-blue-600" 
          onClick={() => setShowYearSelector(!showYearSelector)}
        >
          {currentMonth.toLocaleString("default", { month: "long" })} {year}
        </div>
        <button 
          onClick={() => setCurrentMonth(new Date(year, month + 1))} 
          className="p-1 hover:bg-gray-100 rounded"
          type="button"
        >
          →
        </button>
      </div>

      {showYearSelector ? (
        /* Year Selector Grid */
        <div className="grid grid-cols-3 gap-2 h-48 overflow-y-auto">
          {Array.from({ length: 20 }, (_, i) => year - 10 + i).map(y => (
            <button 
              key={y} 
              onClick={() => { 
                setCurrentMonth(new Date(y, month)); 
                setShowYearSelector(false); 
              }}
              className={`p-2 text-sm rounded ${y === year ? "bg-blue-500 text-white" : "hover:bg-gray-100"}`}
              type="button"
            >
              {y}
            </button>
          ))}
        </div>
      ) : (
        /* Days Grid */
        <div className="grid grid-cols-7 gap-1 text-center">
          {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(d => (
            <div key={d} className="text-xs font-bold text-gray-400">{d}</div>
          ))}
          {Array(firstDay).fill(null).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}
          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
            const date = new Date(year, month, day);
            const isSelected = selectedDate && new Date(selectedDate).toDateString() === date.toDateString();
            return (
              <button 
                key={day} 
                onClick={() => onSelectDate(date.getTime())}
                className={`p-2 text-sm rounded-full ${
                  isSelected 
                    ? "bg-blue-600 text-white" 
                    : isToday(date) 
                      ? "text-blue-600 font-bold" 
                      : "hover:bg-gray-100"
                }`}
                type="button"
              >
                {day}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CustomCalendar;