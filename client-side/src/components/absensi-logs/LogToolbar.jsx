
function LogToolbar({ selectedPeriod, selectedWeek, availablePeriods, onSelectPeriod, onSelectWeek, totalFilteredLogs }) {
  return (
    <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 mb-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Periode
          </label>
          <select
            value={selectedPeriod}
            onChange={(e) => onSelectPeriod(e.target.value)}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-gray-700"
          >
            <option value="">Semua Periode</option>
            {availablePeriods.map((period) => {
              const [year, month] = period.split('-');
              const monthName = new Date(Number(year), Number(month) - 1, 1).toLocaleDateString('id-ID', { month: 'long' });
              return (
                <option key={period} value={period}>
                  {monthName} {year}
                </option>
              );
            })}
          </select>
        </div>

        <span className="text-xs text-gray-400 md:ml-auto">
          Menampilkan <span className="font-semibold text-gray-600">{totalFilteredLogs}</span> log
        </span>
      </div>

      {selectedPeriod && (
        <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-gray-200">
          <button
            onClick={() => onSelectWeek('all')}
            className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold border transition-colors ${
              selectedWeek === 'all'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}
          >
            Semua Minggu
          </button>
          {[1, 2, 3, 4].map((week) => (
            <button
              key={week}
              onClick={() => onSelectWeek(String(week))}
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold border transition-colors ${
                selectedWeek === String(week)
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              Minggu {week}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default LogToolbar;
