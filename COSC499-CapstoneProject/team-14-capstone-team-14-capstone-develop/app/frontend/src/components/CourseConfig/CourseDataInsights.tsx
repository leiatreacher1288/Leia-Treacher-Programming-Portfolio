export const CourseDataInsights = () => {
  return (
    <div className="w-full">
      <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
        <span>📊</span> Course Insights
      </h2>

      {/* Responsive grid that actually works */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {/* Exam With Highest Score Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex flex-col h-[250px]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-600 truncate pr-2">
              Exam With Highest Score
            </span>
            <span className="text-green-500 flex-shrink-0">📈</span>
          </div>

          <div className="flex-1 overflow-hidden">
            <h3 className="text-xl font-bold text-gray-900 truncate">
              Midterm
            </h3>
            <p className="text-green-600 font-semibold">80%</p>
            <p className="text-xs text-gray-500 mt-1 line-clamp-2">
              5% more than second highest exam
            </p>
          </div>

          <div className="mt-auto pt-3">
            <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
              <div
                className="bg-green-500 h-2 rounded-full transition-all"
                style={{ width: '80%' }}
              ></div>
            </div>
            <button className="w-full px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors">
              View Insight
            </button>
          </div>
        </div>

        {/* Most Missed Question Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex flex-col h-[250px]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-600 truncate pr-2">
              Most Missed Question on Midterm
            </span>
            <span className="text-orange-500 flex-shrink-0">🎯</span>
          </div>

          <div className="flex-1 overflow-hidden">
            <h3 className="text-xl font-bold text-gray-900 truncate">
              Question 5
            </h3>
            <p className="text-orange-600 font-semibold">30% miss rate</p>
          </div>

          <div className="mt-auto pt-3">
            <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
              <div
                className="bg-orange-500 h-2 rounded-full transition-all"
                style={{ width: '30%' }}
              ></div>
            </div>
            <button className="w-full px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors">
              View Insight
            </button>
          </div>
        </div>

        {/* Exams Awaiting Results Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex flex-col h-[250px]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-600 truncate pr-2">
              Exams Awaiting Results
            </span>
            <span className="text-yellow-500 flex-shrink-0">⏳</span>
          </div>

          <div className="flex-1 overflow-hidden">
            <h3 className="text-xl font-bold text-gray-900">2</h3>
            <p className="text-yellow-600 font-semibold text-sm">
              exams awaiting results
            </p>
            <p className="text-xs text-gray-500 mt-1 line-clamp-2">
              Missing results for: Final Exam, Quiz 4: Strings
            </p>
          </div>

          <div className="mt-auto pt-3">
            <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
              <div
                className="bg-yellow-500 h-2 rounded-full transition-all"
                style={{ width: '40%' }}
              ></div>
            </div>
            <button className="w-full px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors">
              View Insight
            </button>
          </div>
        </div>

        {/* Total Variants Generated Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex flex-col h-[250px]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-600 truncate pr-2">
              Total Variants Generated
            </span>
            <span className="text-purple-500 flex-shrink-0">🔄</span>
          </div>

          <div className="flex-1 overflow-hidden">
            <h3 className="text-xl font-bold text-gray-900">150</h3>
            <p className="text-purple-600 font-semibold text-sm line-clamp-2">
              across all courses this term
            </p>
          </div>

          <div className="mt-auto pt-3">
            <div className="bg-purple-100 rounded-full w-16 h-16 mx-auto mb-3 flex items-center justify-center">
              <span className="text-xl font-bold text-purple-600">150</span>
            </div>
            <button className="w-full px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors">
              View Insight
            </button>
          </div>
        </div>

        {/* Students Passing Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex flex-col h-[250px]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-600 truncate pr-2">
              Number of Students Passing this semester
            </span>
            <span className="text-green-500 flex-shrink-0">✅</span>
          </div>

          <div className="flex-1 overflow-hidden">
            <h3 className="text-xl font-bold text-gray-900">99/100</h3>
            <p className="text-green-600 font-semibold text-sm">Summer 2025</p>
          </div>

          <div className="mt-auto pt-3">
            <div className="relative w-20 h-20 mx-auto mb-3">
              <svg className="w-20 h-20 transform -rotate-90">
                <circle
                  cx="40"
                  cy="40"
                  r="36"
                  stroke="#e5e7eb"
                  strokeWidth="8"
                  fill="none"
                />
                <circle
                  cx="40"
                  cy="40"
                  r="36"
                  stroke="#10b981"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 36 * 0.99} ${2 * Math.PI * 36}`}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-bold">99%</span>
              </div>
            </div>
            <button className="w-full px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors">
              View Insight
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
