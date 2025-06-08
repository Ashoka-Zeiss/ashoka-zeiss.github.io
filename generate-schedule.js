// generate-schedule.js
const fs = require('fs');
const path = require('path');

// Configuration
const CONFERENCE_START = '2025-06-10';
const CONFERENCE_END = '2025-08-30';

// Conference data structure
const conferenceData = {
  metadata: {
    conferenceStart: CONFERENCE_START,
    conferenceEnd: CONFERENCE_END,
    timezone: "Asia/Kolkata"
  },
  instructors: {
    "sarah-chen": {
      id: "sarah-chen",
      name: "Dr. Sarah Chen",
      title: "Principal Investigator",
      specialization: "Confocal Microscopy",
      email: "s.chen@institute.edu"
    },
    "james-wilson": {
      id: "james-wilson",
      name: "Prof. James Wilson",
      title: "Director of Imaging Core",
      specialization: "Two-Photon Microscopy",
      email: "j.wilson@institute.edu"
    },
    "maria-garcia": {
      id: "maria-garcia",
      name: "Maria Garcia",
      title: "Lab Manager",
      specialization: "Sample Preparation",
      email: "m.garcia@institute.edu"
    },
    "alex-thompson": {
      id: "alex-thompson",
      name: "Dr. Alex Thompson",
      title: "Computational Biologist",
      specialization: "Image Analysis",
      email: "a.thompson@institute.edu"
    },
    "priya-patel": {
      id: "priya-patel",
      name: "Dr. Priya Patel",
      title: "Application Specialist",
      specialization: "Super-Resolution Imaging",
      email: "p.patel@institute.edu"
    },
    "robert-liu": {
      id: "robert-liu",
      name: "Dr. Robert Liu",
      title: "Research Scientist",
      specialization: "FLIM/FRET",
      email: "r.liu@institute.edu"
    }
  },
  schedule: []
};

const sessionTemplates = [
  {
    id: "confocal-basics",
    title: "Confocal Microscopy Fundamentals",
    category: "campus",
    labType: "theory",
    capacity: 30,
    prerequisites: null,
    equipment: ["Zeiss LSM 980"],
    description: "Introduction to confocal microscopy principles, including point scanning, optical sectioning, and fluorescence basics.",
    location: "Building 3, Lecture Hall A"
  },
  {
    id: "confocal-advanced",
    title: "Advanced Confocal Techniques",
    category: "online",
    labType: "theory",
    capacity: 50,
    prerequisites: "confocal-basics",
    equipment: ["Zeiss LSM 980"],
    description: "Deep dive into advanced confocal techniques including spectral imaging, FRAP, and live cell imaging strategies.",
    zoomLink: "https://zoom.us/j/987654321"
  },
  {
    id: "two-photon-workshop",
    title: "Two-Photon Imaging Workshop",
    category: "campus",
    labType: "wet-lab",
    capacity: 8,
    prerequisites: "confocal-basics",
    equipment: ["Bruker Ultima 2P"],
    description: "Hands-on training with two-photon microscopy for deep tissue imaging. Includes live sample preparation.",
    location: "Building 3, Imaging Core Facility"
  },
  {
    id: "sample-prep-basics",
    title: "Sample Preparation Techniques",
    category: "campus",
    labType: "wet-lab",
    capacity: 12,
    prerequisites: null,
    equipment: ["General lab equipment"],
    description: "Essential techniques for preparing biological samples for fluorescence microscopy, including fixation, permeabilization, and labeling.",
    location: "Building 2, Teaching Lab"
  },
  {
    id: "image-analysis-fiji",
    title: "Image Analysis with ImageJ/FIJI",
    category: "online",
    labType: "computational",
    capacity: 50,
    prerequisites: null,
    equipment: [],
    description: "Comprehensive workshop on image processing, quantification, and batch analysis using open-source tools.",
    zoomLink: "https://zoom.us/j/123456789"
  },
  {
    id: "python-microscopy",
    title: "Python for Microscopy Data",
    category: "online",
    labType: "computational",
    capacity: 40,
    prerequisites: "image-analysis-fiji",
    equipment: [],
    description: "Learn to analyze microscopy data using Python, including scikit-image, napari, and custom analysis pipelines.",
    zoomLink: "https://zoom.us/j/456789123"
  },
  {
    id: "sted-super-res",
    title: "STED Super-Resolution Imaging",
    category: "offcampus",
    labType: "dry-lab",
    capacity: 10,
    prerequisites: "confocal-advanced",
    equipment: ["Leica STED 3X"],
    description: "Advanced super-resolution imaging using STED microscopy. Learn principles and hands-on operation.",
    location: "Partner Institute, Super-Res Core"
  },
  {
    id: "live-cell-imaging",
    title: "Live Cell Imaging Methods",
    category: "campus",
    labType: "wet-lab",
    capacity: 6,
    prerequisites: "sample-prep-basics",
    equipment: ["Environmental chamber", "Spinning disk confocal"],
    description: "Master techniques for imaging living cells, including environmental control, minimizing phototoxicity, and time-lapse strategies.",
    location: "Building 3, Live Cell Suite"
  },
  {
    id: "flim-workshop",
    title: "Fluorescence Lifetime Imaging",
    category: "campus",
    labType: "dry-lab",
    capacity: 8,
    prerequisites: "confocal-advanced",
    equipment: ["PicoQuant FLIM system"],
    description: "Introduction to FLIM principles and applications, including FRET analysis and metabolic imaging.",
    location: "Building 3, Advanced Microscopy Lab"
  }
];

// Time slot definitions with varied session times
const timeSlots = {
  morning: ['09:00', '10:00', '10:30'],
  afternoon: ['14:00', '15:00', '16:00']
};

// Session duration based on type (in minutes)
const sessionDurations = {
  'theory': 90,
  'wet-lab': 180,
  'dry-lab': 120,
  'computational': 120
};

// Helper function to add minutes to time
function addMinutes(time, minutes) {
  const [hours, mins] = time.split(':').map(Number);
  const totalMinutes = hours * 60 + mins + minutes;
  const newHours = Math.floor(totalMinutes / 60);
  const newMinutes = totalMinutes % 60;
  return `${newHours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')}`;
}

// Generate schedule
function generateSchedule() {
  const schedule = [];
  const startDate = new Date(CONFERENCE_START);
  const endDate = new Date(CONFERENCE_END);

  let sessionIdCounter = 1;

  for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
    // Determine number of sessions for the day (2-4)
    const sessionsPerDay = Math.floor(Math.random() * 3) + 2;

    // Mix morning and afternoon sessions
    const availableSlots = [
      ...timeSlots.morning.slice(0, 2),
      ...timeSlots.afternoon.slice(0, 2)
    ];

    // Shuffle available slots
    availableSlots.sort(() => Math.random() - 0.5);

    // Track used end times to prevent overlaps
    const usedTimeRanges = [];

    for (let i = 0; i < sessionsPerDay && i < availableSlots.length; i++) {
      const templateIndex = Math.floor(Math.random() * sessionTemplates.length);
      const template = sessionTemplates[templateIndex];
      const instructorId = Object.keys(conferenceData.instructors)[Math.floor(Math.random() * Object.keys(conferenceData.instructors).length)];
      const instructor = conferenceData.instructors[instructorId];

      const startTime = availableSlots[i];
      const duration = sessionDurations[template.labType];
      const endTime = addMinutes(startTime, duration);

      // Check for time conflicts
      let hasConflict = false;
      for (const range of usedTimeRanges) {
        if ((startTime >= range.start && startTime < range.end) ||
          (endTime > range.start && endTime <= range.end)) {
          hasConflict = true;
          break;
        }
      }

      if (!hasConflict) {
        usedTimeRanges.push({ start: startTime, end: endTime });
        const enrolled = Math.floor(Math.random() * (template.capacity * 0.8));

        // Create session object in the desired format
        schedule.push({
          id: `session-${sessionIdCounter++}`,
          date: date.toISOString().split('T')[0],
          startTime: startTime,
          endTime: endTime,
          title: template.title,
          instructor: instructor.name,
          instructorTitle: instructor.title,
          category: template.category,
          labType: template.labType,
          capacity: template.capacity,
          enrolled: enrolled,
          prerequisites: template.prerequisites,
          description: template.description,
          location: template.location || null,
          zoomLink: template.zoomLink || null
        });
      }
    }
  }

  return schedule;
}

// Generate the schedule
conferenceData.schedule = generateSchedule();

// Create data directory if it doesn't exist
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

// Write JSON file
const outputPath = path.join(dataDir, 'conference.json');
fs.writeFileSync(outputPath, JSON.stringify(conferenceData, null, 2));

console.log(`✅ Conference schedule generated successfully!`);
console.log(`📄 Output: ${outputPath}`);
console.log(`📊 Total sessions: ${conferenceData.schedule.length}`);
console.log(`📅 Date range: ${CONFERENCE_START} to ${CONFERENCE_END}`);

// Calculate session categories for summary
const stats = {
  online: conferenceData.schedule.filter(s => s.category === 'online').length,
  campus: conferenceData.schedule.filter(s => s.category === 'campus').length,
  offcampus: conferenceData.schedule.filter(s => s.category === 'offcampus').length
};

console.log(`📍 Session breakdown: ${stats.campus} campus, ${stats.online} online, ${stats.offcampus} off-campus`);
