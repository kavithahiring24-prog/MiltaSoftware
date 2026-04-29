import { useState, useMemo } from "react";

function CalendarView({ tasks, onTaskClick }) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const daysInMonth = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const days = new Date(year, month + 1, 0).getDate();
    
    const calendarDays = [];
    // Padding for previous month
    for (let i = 0; i < firstDay; i++) {
      calendarDays.push(null);
    }
    // Days of current month
    for (let i = 1; i <= days; i++) {
      calendarDays.push(new Date(year, month, i));
    }
    return calendarDays;
  }, [currentDate]);

  const monthName = currentDate.toLocaleString("default", { month: "long" });
  const year = currentDate.getFullYear();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const getTasksForDate = (date) => {
    if (!date) return [];
    const dateStr = date.toISOString().split("T")[0];
    return tasks.filter(t => t.dueDate === dateStr || t.startDate === dateStr);
  };

  return (
    <div className="calendar-view">
      <header className="calendar-header">
        <h2>{monthName} {year}</h2>
        <div className="calendar-controls">
          <button className="secondary-btn" onClick={handlePrevMonth}>Previous</button>
          <button className="secondary-btn" onClick={() => setCurrentDate(new Date())}>Today</button>
          <button className="secondary-btn" onClick={handleNextMonth}>Next</button>
        </div>
      </header>
      <div className="calendar-grid">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
          <div key={day} className="calendar-day-head">{day}</div>
        ))}
        {daysInMonth.map((date, index) => (
          <div key={index} className={`calendar-day ${!date ? "empty" : ""} ${date?.toDateString() === new Date().toDateString() ? "today" : ""}`}>
            {date && (
              <>
                <span className="day-number">{date.getDate()}</span>
                <div className="day-tasks">
                  {getTasksForDate(date).map(task => (
                    <div 
                      key={task.id} 
                      className={`calendar-task-pill ${task.status.toLowerCase().replace(/\s+/g, "-")}`}
                      onClick={() => onTaskClick(task)}
                      title={task.taskName}
                    >
                      {task.taskName}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default CalendarView;
