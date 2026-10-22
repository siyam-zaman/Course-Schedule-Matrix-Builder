# 📅 Course Schedule Matrix Builder

<div align="center">

![Course Schedule Matrix Builder](https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-6.1-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Vitest](https://img.shields.io/badge/Vitest-3.0-6E9F18?style=for-the-badge&logo=vitest&logoColor=white)
![Privacy](https://img.shields.io/badge/Privacy-100%25%20Client--Side-10B981?style=for-the-badge)

<p align="center">
  <b>A modern, high-performance web application to parse university course offering PDFs, detect scheduling conflicts in real-time, pick sections, and generate official 14-column schedule matrices and weekly timetables.</b>
</p>

[Key Features](#-key-features) • [How It Works](#-how-it-works) • [Supported Format](#-table-structure) • [Getting Started](#-getting-started) • [Testing](#-testing) • [Architecture](#-architecture)

</div>

---

## 🌟 Overview

Planning course registration manually from a 20+ page university schedule PDF is tedious and error-prone. **Course Schedule Matrix Builder** simplifies this process into a seamless, interactive workflow:

1. **Upload** your university course offering PDF (up to 25 MB).
2. **Specify** the courses you plan to take.
3. **Pick sections** with immediate visual feedback on instructors, rooms, and schedules.
4. **Instant Conflict Detection**: Overlapping class sessions are immediately flagged in red.
5. **Export & Print**: Export an official 14-column matrix or print directly to PDF once conflicts are resolved.

> **🔒 100% Client-Side Privacy**: All PDF text extraction, table reconstruction, and conflict analysis occur locally in your browser via Web Workers. No documents or personal student data are ever uploaded to any server.

---

## ✨ Key Features

- **⚡ Blazing Fast PDF Table Reconstruction**:
  - Employs `pdfjs-dist` inside dedicated Web Workers with real-time percentage progress.
  - Groups raw text tokens by spatial coordinates ($X$ column boundaries, $Y$ line clustering).
  - Handles multi-page documents, repeated headers, sub-headers, and wrapped cell content.

- **🛡️ Real-Time Time Conflict Engine**:
  - Automatically compares every session across all selected sections.
  - Accurately converts 12-hour AM/PM formats (e.g. `08:30:AM - 09:50:AM`) to standard minute intervals.
  - Multi-day expansion (e.g., `Sat, Tue` or `Sun, Wed`).
  - Highlights overlapping rows and specific conflicting class time cells in bold red.

- **🚫 Export & Print Conflict Locking**:
  - The **Export CSV** and **Print Schedule** actions are automatically locked and disabled if active time conflicts exist, preventing accidental registration in overlapping courses.
  - Built-in `@media print` protections hide conflicted matrices and display clear resolution warnings if standard browser print (`Ctrl+P`) is triggered prematurely.

- **🎨 Dual-View Schedule Visualization**:
  - **14-Column Matrix Table**: Formatted to official academic specifications with credit calculation, faculty initials, room assignments, and responsive horizontal scrolling.
  - **Weekly Timetable Visualizer**: A visual 7-day schedule grid (08:00 AM – 07:00 PM) displaying course blocks with room tags and session times.

- **🔍 Smart Course Offering Browser**:
  - Searchable modal table allowing students to filter courses by program code or search by course code, title, section, or instructor.
  - One-click course code addition.

- **🧑‍🏫 Intelligent Faculty Formatting**:
  - Accurately decouples faculty names and initials.
  - Distinguishes between assigned faculty and unassigned sections, cleanly displaying `"TBA"` without duplicate or confusing placeholder badges.

---

## 📋 Table Structure

The PDF parser detects and reconstructs standard 14-column university schedule tables:

| # | Column | Description | Example |
|---|---|---|---|
| 1 | **sl** | Serial number | `1` |
| 2 | **Program** | Academic program/department | `BSCSE` |
| 3 | **Course Code** | University course code | `ACT 2111`, `CSE 1110` |
| 4 | **Title** | Full course title | `Financial and Managerial Accounting` |
| 5 | **Section** | Section identifier | `A`, `B`, `01` |
| 6 | **Room1** | Classroom for Session 1 | `301` |
| 7 | **Room2** | Classroom for Session 2 | `301` |
| 8 | **Day1** | Day of the week for Session 1 | `Sat`, `Sun` |
| 9 | **Day2** | Day of the week for Session 2 | `Tue`, `Wed` |
| 10 | **Time1** | Time slot for Session 1 | `08:30:AM - 09:50:AM` |
| 11 | **Time2** | Time slot for Session 2 | `08:30:AM - 09:50:AM` |
| 12 | **Faculty Name** | Full name of the instructor | `Ishrat Jahan` |
| 13 | **Faculty Initial** | Official instructor initial | `IJ` |
| 14 | **Credit** | Course credit hours | `3` |

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18.0.0 or higher recommended)
- `npm` or `pnpm` / `yarn`

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/course-schedule-matrix-builder.git
   cd course-schedule-matrix-builder
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the local development server**:
   ```bash
   npm run dev
   ```
   Open your browser and navigate to `http://localhost:5173`.

---

## 💻 Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Starts the Vite development server with Hot Module Replacement (HMR). |
| `npm run build` | Runs TypeScript type checks (`tsc`) and compiles the production bundle. |
| `npm run preview` | Locally preview the compiled production build in `dist/`. |
| `npm run test` | Runs the Vitest test suite for conflict detector and time utilities. |

---

## 🧪 Testing

The application includes automated unit test suites covering the conflict detection engine, time interval math, and faculty sanitization rules:

```bash
npm run test
```

Test coverage includes:
- Interval overlap calculations (`doTimesOverlap`, `parseTimeRange`).
- Complex time formatting (`08:30:AM - 09:50:AM`, standard AM/PM, 24-hour).
- Multi-day session conflict matrix generation.
- Faculty name and initial normalization under ambiguous or missing conditions.

---

## 🏗️ Architecture

```
src/
├── components/             # UI Components
│   ├── ConflictSummary.tsx # Conflict alerts & pair breakdown
│   ├── CourseInput.tsx     # Code entry (paste, chips, auto-extract)
│   ├── Navbar.tsx          # App header with logo & privacy badge
│   ├── OfferingBrowser.tsx # Search & filter modal for courses
│   ├── ScheduleTable.tsx   # 14-column schedule matrix & actions
│   ├── SectionPicker.tsx   # Interactive section cards with conflict badges
│   ├── TimetableGrid.tsx   # 7-day visual weekly timetable
│   └── UploadZone.tsx      # Drag-and-drop PDF uploader with progress bar
├── types/
│   └── schedule.ts         # TypeScript data structures and interfaces
├── utils/                  # Core algorithms & utilities
│   ├── conflictDetector.ts # Time conflict analysis algorithm
│   ├── courseExtractor.ts  # String normalizers & code extractors
│   ├── csvExporter.ts      # Client-side CSV generation & download
│   ├── formatFaculty.ts    # Instructor name and initial normalizer
│   ├── pdfParserClient.ts  # Web Worker client wrapper
│   ├── pdfWorker.ts        # PDF.js text grouping & table reconstruction
│   ├── sampleData.ts       # Preloaded demonstration data
│   └── timeUtils.ts        # Pure time parsing, day mapping & formatting
├── App.tsx                 # Root application state & composition
├── index.css               # Tailwind CSS design system tokens
└── main.tsx                # React application entry point
```

---

## 🤝 Contributing

Contributions, feedback, and issue reports are welcome!
1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for more information.
