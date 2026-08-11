function ScheduledTaskCard({ task, myEmployeeId, onStart }) {
  const staffNames = Array.isArray(task.assigned_staff) ? task.assigned_staff : [];
  const staffIds = Array.isArray(task.assigned_staff_ids) ? task.assigned_staff_ids : [];
  const isAssigned = staffIds.includes(myEmployeeId);

  return (
    <div className="p-4 rounded-lg border border-gray-100 bg-gray-50/50 hover:bg-gray-50 transition-colors">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-bold text-gray-800">#{task.no_kamar}</span>
        <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-yellow-100 text-yellow-700">
          Dijadwalkan
        </span>
      </div>
      <p className="text-sm font-medium text-gray-700 mb-1">{task.title}</p>
      <p className="text-xs text-gray-500 mb-2">
        <i className="fa-regular fa-calendar mr-1"></i>
        {task.scheduled_date}
      </p>
      {staffNames.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {staffNames.map((name, idx) => {
            const nameIsMe = staffIds[idx] === myEmployeeId;
            return (
              <span
                key={idx}
                className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${
                  nameIsMe
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {name}
                {nameIsMe && ' (Anda)'}
              </span>
            );
          })}
        </div>
      )}
      {isAssigned && (
        <button
          onClick={() => onStart(task.schedule_id)}
          className="mt-3 w-full inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors"
        >
          <i className="fa-solid fa-play"></i>
          Mulai Sekarang
        </button>
      )}
    </div>
  );
}

export default ScheduledTaskCard;
