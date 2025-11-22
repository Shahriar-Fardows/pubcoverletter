const CoverForm = () => {
  return (
    <section className="min-h-[70vh] w-full bg-slate-50 py-10">
      <div className="mx-auto w-full max-w-3xl px-4">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-2">
          <span className="inline-flex w-fit items-center rounded-full bg-slate-900 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-white">
            Cover Page Builder
          </span>
          <h1 className="text-2xl font-semibold text-slate-900">
            Assignment Cover Details
          </h1>
          <p className="max-w-xl text-sm text-slate-600">
            Fill in the information below. These details will be used to generate
            a clean, printable cover page for your assignment.
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <form className="space-y-6">
            {/* Cover Title */}
            <div className="space-y-1.5">
              <label
                htmlFor="coverTitle"
                className="block text-sm font-medium text-slate-900"
              >
                Cover Title
              </label>
              <input
                type="text"
                id="coverTitle"
                name="coverTitle"
                placeholder="Assignment"
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
              />
              <p className="text-xs text-slate-500">
                This text will appear as the main title on your cover page.
              </p>
            </div>

            {/* Course */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <label
                  htmlFor="courseName"
                  className="block text-sm font-medium text-slate-900"
                >
                  Course Name
                </label>
                <input
                  type="text"
                  id="courseName"
                  name="courseName"
                  placeholder="Calculus"
                  required
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                />
              </div>
              <div className="space-y-1.5">
                <label
                  htmlFor="courseCode"
                  className="block text-sm font-medium text-slate-900"
                >
                  Course Code
                </label>
                <input
                  type="text"
                  id="courseCode"
                  name="courseCode"
                  placeholder="MAT123"
                  required
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                />
              </div>
            </div>

            {/* Student */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <label
                  htmlFor="studentName"
                  className="block text-sm font-medium text-slate-900"
                >
                  Student Name
                </label>
                <input
                  type="text"
                  id="studentName"
                  name="studentName"
                  placeholder="John Doe"
                  required
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                />
              </div>
              <div className="space-y-1.5">
                <label
                  htmlFor="studentId"
                  className="block text-sm font-medium text-slate-900"
                >
                  Student ID
                </label>
                <input
                  type="text"
                  id="studentId"
                  name="studentId"
                  placeholder="2511086038"
                  required
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                />
              </div>
            </div>

            {/* Submission Date + Section */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <div className="space-y-1.5">
                  <label
                    htmlFor="submissionDate"
                    className="block text-sm font-medium text-slate-900"
                  >
                    Submission Date
                  </label>
                  <input
                    type="date"
                    id="submissionDate"
                    name="submissionDate"
                    required
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                  />
                </div>
                <label
                  htmlFor="leaveBlank"
                  className="flex items-center gap-2 text-xs text-slate-600"
                >
                  <input
                    type="checkbox"
                    id="leaveBlank"
                    name="leaveBlank"
                    className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                  />
                  <span>Leave blank on the cover page</span>
                </label>
              </div>
              <div className="space-y-1.5">
                <label
                  htmlFor="section"
                  className="block text-sm font-medium text-slate-900"
                >
                  Section
                </label>
                <input
                  type="text"
                  id="section"
                  name="section"
                  placeholder="2"
                  required
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                />
              </div>
            </div>

            {/* Teacher */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <label
                  htmlFor="teacherName"
                  className="block text-sm font-medium text-slate-900"
                >
                  Teacher Name
                </label>
                <input
                  type="text"
                  id="teacherName"
                  name="teacherName"
                  placeholder="John Doe"
                  required
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                />
              </div>
              <div className="space-y-1.5">
                <label
                  htmlFor="teacherPosition"
                  className="block text-sm font-medium text-slate-900"
                >
                  Teacher Position
                </label>
                <input
                  type="text"
                  id="teacherPosition"
                  name="teacherPosition"
                  placeholder="Lecturer"
                  required
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                />
              </div>
            </div>

            {/* Department */}
            <div className="space-y-1.5">
              <label
                htmlFor="department"
                className="block text-sm font-medium text-slate-900"
              >
                Department
              </label>
              <input
                type="text"
                id="department"
                name="department"
                placeholder="Computer Science and Engineering"
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
              />
            </div>

            {/* Submit (optional, jodi pore handle korar plan thake) */}
            <div className="pt-2">
              <button
                type="submit"
                className="w-full rounded-lg border-2 border-slate-900 bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white hover:text-slate-900"
              >
                Generate Cover Page
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
};

export default CoverForm;
