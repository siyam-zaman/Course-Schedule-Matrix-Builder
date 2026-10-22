# 🚀 Release Notes — Course Schedule Matrix Builder v1.0.0

> **Release Tag:** `v1.0.0`  
> **Release Date:** October 22, 2026  
> **Status:** Stable / Initial Production Release  

---

## 🌟 What's New in v1.0.0

We are thrilled to announce the official **v1.0.0** release of **Course Schedule Matrix Builder**! 🎓📅

Planning course registration from dense, 20+ page university offering PDFs has always been tedious, slow, and prone to overlapping schedules. **Course Schedule Matrix Builder** turns this chaotic process into a modern, visual, and instantaneous drag-and-drop experience.

---

## ⚡ Highlights & Key Features

### 🔒 100% Client-Side Privacy First
- **Zero Server Uploads**: Text extraction, spatial coordinate grouping, and schedule analysis run completely inside your browser via dedicated Web Workers.
- **Data Protection**: Your university offering documents and selected academic schedules never leave your local device.

### 📄 Intelligent PDF Table Reconstruction
- **Spatial Coordinate Clustering**: Employs `pdfjs-dist` to group raw PDF text tokens along $X$ column boundaries and $Y$ line baselines.
- **Robust Multi-Page Parsing**: Seamlessly parses through multi-page tables, headers, sub-headers, and wrapped multi-line cell content (supporting up to 25 MB documents).
- **Interactive Progress Indicator**: Real-time worker-driven progress updates during parsing.

### 🛡️ Real-Time Time Conflict Engine
- **Instant Overlap Detection**: Every selected course section session is automatically analyzed against your active schedule.
- **Accurate Time Interval Parsing**: Converts complex 12-hour AM/PM formats (e.g., `08:30:AM - 09:50:AM`) to standard minute intervals.
- **Multi-Day Session Support**: Accurately maps recurring weekly patterns (e.g., `Sat, Tue` or `Sun, Wed`).
- **Visual Alert System**: Displays real-time conflict summary banners, highlights conflicting time slots in red, and flags specific section cards.

### 🚫 Export & Print Locking Mechanism
- **Conflict Prevention**: Export to CSV and Schedule Printing are disabled while active conflicts exist, preventing accidental registration in overlapping courses.
- **Print Protection (`@media print`)**: Hides conflicting schedule tables and displays clear resolution warnings if standard browser print (`Ctrl+P`) is triggered prematurely.

### 🎨 Dual-View Schedule Visualization
- **Official 14-Column Academic Matrix**:
  - Reconstructs standard university schedule tables: `sl`, `Program`, `Course Code`, `Title`, `Section`, `Room1`, `Room2`, `Day1`, `Day2`, `Time1`, `Time2`, `Faculty Name`, `Faculty Initial`, and `Credit`.
  - Calculates total registered credits automatically.
- **7-Day Visual Weekly Timetable**:
  - Interactive grid view (08:00 AM – 07:00 PM) showing course blocks, room numbers, instructor tags, and time slots.

### 🔍 Course Offering Browser & Interactive Picker
- **Course Offering Search Modal**: Search by course code, title, section, or instructor name; filter by academic program.
- **Course Code Input**: Add courses individually or paste multiple codes at once with automatic extraction.
- **Section Selection Cards**: Compare alternative sections with real-time conflict warnings before making a selection.

### 🧑‍🏫 Smart Faculty & Room Normalizer
- Decouples instructor names and initials cleanly.
- Properly handles unassigned courses, cleanly formatting placeholders as `"TBA"` without duplicate badges or broken tokens.

---

## 🛠️ Technical Stack & Architecture

- **Frontend Core**: [React 18.3](https://react.dev/) + [TypeScript 5.7](https://www.typescriptlang.org/)
- **Bundler & Tooling**: [Vite 6.1](https://vitejs.dev/) with Hot Module Replacement (HMR)
- **Styling**: [Tailwind CSS 3.4](https://tailwindcss.com/) with responsive design and customized print stylesheets
- **PDF Engine**: [PDF.js (`pdfjs-dist` v4.10)](https://mozilla.github.io/pdf.js/) running in background Web Workers
- **Iconography**: [Lucide React](https://lucide.dev/)
- **Testing**: [Vitest 3.0](https://vitest.dev/) with comprehensive unit test suites for interval math and conflict detection algorithms

---

## 🧪 Quality & Test Coverage

- ✅ Interval overlap logic (`doTimesOverlap`, `parseTimeRange`)
- ✅ 12-hour AM/PM time conversions and non-standard separator handling
- ✅ Multi-day session conflict matrix evaluation
- ✅ Faculty name & initial decoupling edge cases

---

## 📦 Getting Started

### Local Setup
```bash
# Clone the repository
git clone https://github.com/siyam-zaman/Course-Schedule-Matrix-Builder.git
cd Course-Schedule-Matrix-Builder

# Install dependencies
npm install

# Start development server
npm run dev
```

### Build for Production
```bash
npm run build
```

---

## 👥 Contributors & Feedback

Special thanks to everyone testing and providing feedback on early builds! 

If you encounter issues or have feature suggestions, please [open an issue](https://github.com/siyam-zaman/Course-Schedule-Matrix-Builder/issues) or submit a pull request.
