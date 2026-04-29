import { useMemo } from "react";

function GanttChart({ rows, isCriticalTask, getDueDateInfo, onDiscuss, onUpdate }) {
  const timeline = useMemo(() => {
    const datedRows = rows.filter(
      (row) => row.startDate && row.startDate !== "-" && row.dueDate && row.dueDate !== "-"
    );

    const fallbackStart = new Date();
    fallbackStart.setDate(fallbackStart.getDate() - 3);
    fallbackStart.setHours(0, 0, 0, 0);

    const fallbackEnd = new Date();
    fallbackEnd.setDate(fallbackEnd.getDate() + 14);
    fallbackEnd.setHours(0, 0, 0, 0);

    const start =
      datedRows.length > 0
        ? new Date(
            Math.min(
              ...datedRows.map((row) => new Date(`${row.startDate}T00:00:00`).getTime())
            )
          )
        : fallbackStart;

    const end =
      datedRows.length > 0
        ? new Date(
            Math.max(
              ...datedRows.map((row) => new Date(`${row.dueDate}T23:59:59`).getTime())
            )
          )
        : fallbackEnd;

    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    const totalDays = Math.max(
      1,
      Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
    );

    const markers = Array.from({ length: totalDays }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      return {
        key: date.toISOString(),
        label: date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
      };
    });

    return { start, totalDays, markers };
  }, [rows]);

  const renderBar = (row) => {
    if (!row.startDate || row.startDate === "-" || !row.dueDate || row.dueDate === "-") {
      return <span className="gantt-missing-dates">Set start and due dates to show timeline.</span>;
    }

    const start = new Date(`${row.startDate}T00:00:00`);
    const end = new Date(`${row.dueDate}T00:00:00`);
    const offsetDays = Math.max(
      0,
      Math.round((start.getTime() - timeline.start.getTime()) / (1000 * 60 * 60 * 24))
    );
    const durationDays = Math.max(
      1,
      Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
    );
    const left = (offsetDays / timeline.totalDays) * 100;
    const width = (durationDays / timeline.totalDays) * 100;
    const dueInfo = getDueDateInfo(row);
    const critical = isCriticalTask(row);

    const handleDragStart = (e, type) => {
      e.stopPropagation();
      const startX = e.clientX;
      const initialStart = new Date(start);
      const initialEnd = new Date(end);

      const handleMouseMove = (moveEvent) => {
        const deltaX = moveEvent.clientX - startX;
        const pixelsPerDay = moveEvent.target.closest(".gantt-timeline-head")?.offsetWidth / timeline.totalDays || 40;
        const deltaDays = Math.round(deltaX / pixelsPerDay);

        if (deltaDays === 0) return;

        let newStart = initialStart;
        let newEnd = initialEnd;

        if (type === "move") {
          newStart = new Date(initialStart);
          newStart.setDate(initialStart.getDate() + deltaDays);
          newEnd = new Date(initialEnd);
          newEnd.setDate(initialEnd.getDate() + deltaDays);
        } else if (type === "resize-start") {
          newStart = new Date(initialStart);
          newStart.setDate(initialStart.getDate() + deltaDays);
          if (newStart > initialEnd) newStart = initialEnd;
        } else if (type === "resize-end") {
          newEnd = new Date(initialEnd);
          newEnd.setDate(initialEnd.getDate() + deltaDays);
          if (newEnd < initialStart) newEnd = initialStart;
        }

        const formatDate = (d) => d.toISOString().split("T")[0];
        if (formatDate(newStart) !== row.startDate || formatDate(newEnd) !== row.dueDate) {
          onUpdate(row.id, { start_date: formatDate(newStart), due_date: formatDate(newEnd) });
        }
      };

      const handleMouseUp = () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    };

    return (
      <div className="gantt-track">
        <div
          className={`gantt-bar ${row.status.toLowerCase().replace(/\s+/g, "-")} ${dueInfo.className} ${
            critical ? "critical" : ""
          } interactive`}
          style={{ left: `${left}%`, width: `${Math.max(width, 4)}%` }}
          onMouseDown={(e) => handleDragStart(e, "move")}
          title={`${row.taskName}: ${row.startDate} to ${row.dueDate}`}
        >
          <div className="resize-handle start" onMouseDown={(e) => handleDragStart(e, "resize-start")} />
          <span>{row.taskId}</span>
          <div className="resize-handle end" onMouseDown={(e) => handleDragStart(e, "resize-end")} />
        </div>
      </div>
    );
  };

  return (
    <div className="gantt-board">
      <div className="gantt-header">
        <div className="gantt-task-meta-head">Task</div>
        <div className="gantt-timeline-head">
          {timeline.markers.map((marker) => (
            <span key={marker.key}>{marker.label}</span>
          ))}
        </div>
      </div>
      <div className="gantt-body">
        {rows.map((row) => {
          const dueInfo = getDueDateInfo(row);
          const critical = isCriticalTask(row);

          return (
            <div key={row.id} className={`gantt-row ${critical ? "critical" : ""}`}>
              <div className="gantt-task-meta">
                <p className="gantt-task-id">{row.taskId}</p>
                <h3>{row.taskName}</h3>
                <div className="gantt-task-tags">
                  <span>{row.project}</span>
                  <span>{row.status}</span>
                  <span>{row.priority}</span>
                  <span>{dueInfo.label}</span>
                  <button type="button" className="task-link-chip" onClick={() => onDiscuss(row)}>
                    Discuss
                  </button>
                </div>
              </div>
              <div className="gantt-row-track">{renderBar(row)}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default GanttChart;
