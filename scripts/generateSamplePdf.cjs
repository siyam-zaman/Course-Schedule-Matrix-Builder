const fs = require('fs');
const path = require('path');

function createPdf(filename, lines) {
  // lines: array of { x, y, text, size }
  let streamContent = 'BT\n';
  for (const item of lines) {
    const textSafe = item.text.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
    streamContent += `/F1 ${item.size || 9} Tf\n`;
    streamContent += `1 0 0 1 ${item.x} ${item.y} Tm\n`;
    streamContent += `(${textSafe}) Tj\n`;
  }
  streamContent += 'ET\n';

  const streamLen = Buffer.byteLength(streamContent, 'utf-8');

  let pdf = '%PDF-1.4\n';
  const offsets = [];

  function addObj(objStr) {
    offsets.push(Buffer.byteLength(pdf, 'utf-8'));
    pdf += objStr + '\n';
  }

  // Obj 1: Catalog
  addObj('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj');
  // Obj 2: Pages
  addObj('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj');
  // Obj 3: Page
  addObj('3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 1100 700] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj');
  // Obj 4: Content stream
  addObj(`4 0 obj\n<< /Length ${streamLen} >>\nstream\n${streamContent}endstream\nendobj`);
  // Obj 5: Font
  addObj('5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj');

  const startXref = Buffer.byteLength(pdf, 'utf-8');
  pdf += 'xref\n0 6\n0000000000 65535 f \n';
  for (const off of offsets) {
    pdf += off.toString().padStart(10, '0') + ' 00000 n \n';
  }
  pdf += `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${startXref}\n%%EOF\n`;

  fs.writeFileSync(filename, pdf, 'utf-8');
  console.log(`Generated sample PDF at: ${filename} (${fs.statSync(filename).size} bytes)`);
}

// 1. Generate sample offering PDF with exact 14 columns
const headers = [
  { name: 'sl', x: 30 },
  { name: 'Program', x: 60 },
  { name: 'Course Code', x: 130 },
  { name: 'Title', x: 230 },
  { name: 'Section', x: 440 },
  { name: 'Room1', x: 490 },
  { name: 'Room2', x: 550 },
  { name: 'Day1', x: 610 },
  { name: 'Day2', x: 660 },
  { name: 'Time1', x: 710 },
  { name: 'Time2', x: 840 },
  { name: 'Faculty Name', x: 920 },
  { name: 'Faculty Initial', x: 1010 },
  { name: 'Credit', x: 1060 },
];

const sampleRows = [
  ['1', 'BSCSE', 'CSE115', 'Programming Language I', '1', 'SAC301', '', 'ST', '', '08:30 AM - 10:00 AM', '', 'Alan Turing', 'ALT', '3'],
  ['2', 'BSCSE', 'CSE115', 'Programming Language I', '2', 'SAC302', '', 'MW', '', '10:00 AM - 11:30 AM', '', 'Grace Hopper', 'GHP', '3'],
  ['3', 'BSCSE', 'MAT120', 'Calculus and Analytic Geometry I', '1', 'SAC401', '', 'ST', '', '09:00 AM - 10:30 AM', '', 'Leonhard Euler', 'LEU', '3'],
  ['4', 'BSCSE', 'MAT120', 'Calculus and Analytic Geometry I', '2', 'SAC402', '', 'ST', '', '11:30 AM - 01:00 PM', '', 'Carl Gauss', 'CGS', '3'],
  ['5', 'BSCSE', 'PHY107', 'General Physics I', '1', 'SAC201', 'SAC202', 'ST', 'Mon', '10:00 AM - 11:30 AM', '09:00 AM - 10:30 AM', 'Richard Feynman', 'RFY', '4'],
  ['6', 'BBA', 'ENG102', 'English Composition and Rhetoric', '1', 'NAC302', '', 'ST', '', '08:30 AM - 10:00 AM', '', 'Maya Angelou', 'MAN', '3'],
  ['7', 'BBA', 'ENG102', 'English Composition and Rhetoric', '2', 'NAC305', '', 'MW', '', '08:30 AM - 10:00 AM', '', 'George Orwell', 'GOR', '3'],
];

const offeringPdfLines = [];
let y = 640;

// Header row
for (const h of headers) {
  offeringPdfLines.push({ x: h.x, y, text: h.name, size: 9 });
}

// Data rows
for (const row of sampleRows) {
  y -= 25;
  for (let i = 0; i < headers.length; i++) {
    const val = row[i] || '';
    if (val) {
      offeringPdfLines.push({ x: headers[i].x, y, text: val, size: 8 });
    }
  }
}

// Write sample offering PDF
const targetOfferingPdf = path.join(__dirname, '..', 'sample_university_offering.pdf');
createPdf(targetOfferingPdf, offeringPdfLines);

// 2. Generate sample advising slip PDF for Course Selection input (2nd PDF)
const advisingLines = [
  { x: 50, y: 640, text: 'Student Advising Slip - Fall Semester', size: 14 },
  { x: 50, y: 610, text: 'Student ID: 2024-001   Name: Jane Doe   Major: BSCSE', size: 10 },
  { x: 50, y: 570, text: 'Recommended Approved Courses for Registration:', size: 10 },
  { x: 70, y: 540, text: '1. CSE115 - Programming Language I (3 Credits)', size: 9 },
  { x: 70, y: 520, text: '2. MAT120 - Calculus and Analytic Geometry I (3 Credits)', size: 9 },
  { x: 70, y: 500, text: '3. PHY107 - General Physics I (4 Credits)', size: 9 },
  { x: 70, y: 480, text: '4. ENG102 - English Composition and Rhetoric (3 Credits)', size: 9 },
];
const targetAdvisingPdf = path.join(__dirname, '..', 'sample_advising_slip.pdf');
createPdf(targetAdvisingPdf, advisingLines);
