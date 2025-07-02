
import React from 'react';
import { Calendar } from "@/components/ui/calendar";

interface CalendarViewProps {
  selectedDate?: Date;
  onDateSelect?: (date: Date | undefined) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ 
  selectedDate, 
  onDateSelect 
}) => {
  return (
    <div className="p-4">
      <Calendar
        mode="single"
        selected={selectedDate}
        onSelect={onDateSelect}
        className="rounded-md border"
      />
    </div>
  );
};

export default CalendarView;
