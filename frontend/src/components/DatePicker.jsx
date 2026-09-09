import React, { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function DatePicker({
  value,
  onChange,
  min = '',
  max = '',
  placeholder = 'Select Date',
  className = '',
  required = false,
  disabled = false,
  align = 'left'
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(() => {
    if (value) return new Date(value);
    return new Date();
  });
  
  const triggerRef = useRef(null);
  const dropdownRef = useRef(null);

  // Sync internal view date with value if value changes
  useEffect(() => {
    if (value) {
      const parsed = new Date(value);
      if (!isNaN(parsed.getTime())) {
        setCurrentDate(parsed);
      }
    }
  }, [value]);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleMonthChange = (e) => {
    const newMonth = parseInt(e.target.value, 10);
    setCurrentDate(new Date(year, newMonth, 1));
  };

  const handleYearChange = (e) => {
    const newYear = parseInt(e.target.value, 10);
    setCurrentDate(new Date(newYear, month, 1));
  };

  // Generate years list (e.g. 100 years back to 10 years forward)
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let y = currentYear + 10; y >= currentYear - 100; y--) {
    years.push(y);
  }

  // Get calendar days info
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday

  // Helper to format Date to YYYY-MM-DD
  const toYYYYMMDD = (d) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  // Format date for UI display (e.g., "Aug 15, 2026")
  const formatDateDisplay = (dateStr) => {
    if (!dateStr) return '';
    const dateObj = new Date(dateStr);
    if (isNaN(dateObj.getTime())) return dateStr;
    
    return dateObj.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const handleDaySelect = (day) => {
    const selected = new Date(year, month, day);
    const dateStr = toYYYYMMDD(selected);
    onChange(dateStr);
    setIsOpen(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange('');
  };

  // Check if a day in current month/year is disabled
  const isDayDisabled = (day) => {
    const targetDate = new Date(year, month, day);
    const dateStr = toYYYYMMDD(targetDate);
    
    if (min && dateStr < min) return true;
    if (max && dateStr > max) return true;
    return false;
  };

  // Check if a day is today
  const isToday = (day) => {
    const today = new Date();
    return today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
  };

  // Check if a day is selected
  const isSelected = (day) => {
    if (!value) return false;
    const valDate = new Date(value);
    return valDate.getDate() === day && valDate.getMonth() === month && valDate.getFullYear() === year;
  };

  // Generate grid days
  const calendarCells = [];
  // Add empty spaces for padding of previous month
  for (let i = 0; i < firstDayIndex; i++) {
    calendarCells.push(<div key={`empty-${i}`} className="h-8 w-8" />);
  }
  // Add actual days
  for (let day = 1; day <= daysInMonth; day++) {
    const disabledDay = isDayDisabled(day);
    const todayClass = isToday(day) ? 'border border-primary-500 text-primary-500 font-bold' : '';
    const selectedClass = isSelected(day) 
      ? 'bg-primary-500 text-white font-medium hover:bg-primary-600 shadow-md shadow-primary-500/20' 
      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800';
    
    calendarCells.push(
      <button
        key={`day-${day}`}
        type="button"
        disabled={disabledDay}
        onClick={() => handleDaySelect(day)}
        className={`h-8 w-8 text-xs rounded-lg transition-all duration-150 flex items-center justify-center ${todayClass} ${selectedClass} ${
          disabledDay ? 'opacity-25 cursor-not-allowed hover:bg-transparent text-slate-400' : ''
        }`}
      >
        {day}
      </button>
    );
  }

  return (
    <div className="relative w-full">
      {/* Input button trigger */}
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between w-full text-left transition-all duration-200 cursor-pointer ${
          disabled ? 'opacity-50 cursor-not-allowed bg-slate-50 dark:bg-slate-900/20' : ''
        } ${className}`}
      >
        <span className={value ? 'text-slate-800 dark:text-slate-100' : 'text-slate-400 dark:text-slate-500'}>
          {value ? formatDateDisplay(value) : placeholder}
        </span>
        <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500">
          {value && !disabled && (
            <span
              onClick={handleClear}
              className="p-0.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
              title="Clear date"
            >
              <X className="w-3.5 h-3.5" />
            </span>
          )}
          <CalendarIcon className="w-4 h-4" />
        </div>
      </button>

      {/* Hidden input for HTML form submission / reference validity */}
      <input
        type="hidden"
        value={value || ''}
        required={required}
      />

      {/* Calendar Dropdown popover */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className={`absolute z-[9999] mt-1.5 w-[280px] p-3.5 bg-white dark:bg-[#0E0F17] border border-slate-200 dark:border-neutral-800 rounded-2xl shadow-2xl shadow-black/50 backdrop-blur-xl animate-in fade-in slide-in-from-top-1 duration-150 ${align === 'right' ? 'right-0' : 'left-0'}`}
        >
          {/* Header selectors */}
          <div className="flex items-center justify-between gap-1 mb-3.5">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors text-slate-500 dark:text-slate-400"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1">
              {/* Month Dropdown */}
              <select
                value={month}
                onChange={handleMonthChange}
                className="px-2 py-1 text-xs font-semibold bg-transparent border-0 rounded-lg text-slate-850 dark:text-slate-105 cursor-pointer focus:ring-1 focus:ring-primary-500/30 outline-none"
              >
                {MONTHS.map((mName, idx) => (
                  <option key={mName} value={idx} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">
                    {mName}
                  </option>
                ))}
              </select>

              {/* Year Dropdown */}
              <select
                value={year}
                onChange={handleYearChange}
                className="px-2 py-1 text-xs font-semibold bg-transparent border-0 rounded-lg text-slate-850 dark:text-slate-105 cursor-pointer focus:ring-1 focus:ring-primary-500/30 outline-none"
              >
                {years.map((y) => (
                  <option key={y} value={y} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors text-slate-500 dark:text-slate-400"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Weekdays row */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
              <span key={d} className="text-[10px] font-bold text-slate-400 uppercase tracking-wider h-6 flex items-center justify-center">
                {d}
              </span>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarCells}
          </div>

          {/* Today button */}
          <div className="mt-3.5 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
            <button
              type="button"
              onClick={() => {
                const today = new Date();
                setCurrentDate(today);
                handleDaySelect(today.getDate());
              }}
              className="text-[11px] font-semibold text-primary-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
            >
              Today
            </button>
            
            {value && (
              <button
                type="button"
                onClick={handleClear}
                className="text-[11px] font-semibold text-slate-450 hover:text-slate-650 dark:hover:text-slate-350 transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
