// ============================================
// 100 Days Better Me - Production Logic
// Data Model: { currentDay, streak, days: { 1: {...}, 2: {...} }, whyStarted }
// ============================================

// ============================================
// DATA MODEL & INITIALIZATION
// ============================================

/**
 * Initialize or load data from localStorage
 * Data structure:
 * {
 *   currentDay: number (1-100),
 *   streak: number,
 *   days: {
 *     1: { sleep, water, workout, study, food, completedHabits: {...}, score, completed },
 *     2: { ... }
 *   },
 *   whyStarted: string
 * }
 */
let appData = JSON.parse(localStorage.getItem("betterMe")) || {
  currentDay: 1,
  streak: 0,
  days: {},
  whyStarted: ""
};

// Habit completion rules (STRICT - must meet these to be completed)
const HABIT_RULES = {
  sleep: { min: 7 },           // ≥ 7 hours
  water: { min: 8 },           // ≥ 8 glasses
  workout: { min: 30 },        // ≥ 30 minutes
  study: { min: 60 },         // ≥ 60 minutes
  food: { min: 2000, max: 2500 } // Between 2000-2500 calories
};

// Points per habit
const POINTS_PER_HABIT = 20;
const MAX_SCORE = 100;

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Get current day's data
 * Returns the data object for the current day
 */
function getCurrentDayData() {
  const day = appData.currentDay;
  if (!appData.days[day]) {
    appData.days[day] = {
      sleep: null,
      water: null,
      workout: null,
      study: null,
      food: null,
      completedHabits: {
        sleep: false,
        water: false,
        workout: false,
        study: false,
        food: false
      },
      score: 0,
      completed: false
    };
  }
  return appData.days[day];
}

/**
 * Save data to localStorage
 */
function saveData() {
  localStorage.setItem("betterMe", JSON.stringify(appData));
}

/**
 * Check if a habit value meets the completion rule
 * Returns true only if the value strictly meets the requirement
 */
function isHabitCompleted(habit, value) {
  if (value === null || value === undefined) {
    return false;
  }
  
  const rule = HABIT_RULES[habit];
  if (!rule) return false;
  
  switch (habit) {
    case 'sleep':
      return value >= rule.min;
    case 'water':
      return value >= rule.min;
    case 'workout':
      return value >= rule.min;
    case 'study':
      return value >= rule.min;
    case 'food':
      return value >= rule.min && value <= rule.max;
    default:
      return false;
  }
}

/**
 * Calculate score for a single habit
 * Returns points (0-20) based on completion
 */
function calculateHabitScore(habit, value) {
  if (isHabitCompleted(habit, value)) {
    return POINTS_PER_HABIT;
  }
  return 0;
}

/**
 * Calculate total score for a day
 * Returns score (0-100) based on all completed habits
 */
function calculateDayScore(dayData) {
  const habits = ['sleep', 'water', 'workout', 'study', 'food'];
  let totalScore = 0;
  
  habits.forEach(habit => {
    const value = dayData[habit];
    totalScore += calculateHabitScore(habit, value);
  });
  
  return totalScore;
}

/**
 * Check if all 5 habits are completed for a day
 */
function areAllHabitsCompleted(dayData) {
  const habits = ['sleep', 'water', 'workout', 'study', 'food'];
  return habits.every(habit => dayData.completedHabits[habit] === true);
}

// ============================================
// SAVE HABIT FUNCTION
// ============================================

/**
 * Save a habit value for the current day
 * Validates input, checks completion, updates UI, and handles day progression
 */
function saveHabit(habit) {
  // Get input element
  const inputElement = document.getElementById(habit);
  if (!inputElement) {
    alert("Input field not found!");
    return;
  }
  
  // Get and validate value
  let value = parseFloat(inputElement.value);
  if (isNaN(value) || value < 0) {
    alert(`Please enter a valid number for ${habit}!`);
    return;
  }
  
  // Get current day data
  const dayData = getCurrentDayData();
  
  // Check if current day is already completed (locked)
  if (dayData.completed) {
    alert("This day is already completed and locked!");
    return;
  }
  
  // Save the value
  dayData[habit] = value;
  
  // Check if habit is completed (STRICT RULE)
  const isCompleted = isHabitCompleted(habit, value);
  dayData.completedHabits[habit] = isCompleted;
  
  // Calculate and update score
  dayData.score = calculateDayScore(dayData);
  
  // Save to localStorage
  saveData();
  
  // Update UI
  updateHabitUI(habit, value, isCompleted);
  updateScoreDisplay();
  
  // Check if all habits are completed
  if (areAllHabitsCompleted(dayData)) {
    completeCurrentDay();
  } else {
    // Show feedback
    if (isCompleted) {
      showFeedback(`${habit.charAt(0).toUpperCase() + habit.slice(1)} completed! ✔`);
    } else {
      showFeedback(`${habit.charAt(0).toUpperCase() + habit.slice(1)} saved, but not completed.`);
      showCompletionRequirement(habit, value);
    }
  }
}

/**
 * Show what's required to complete a habit
 */
function showCompletionRequirement(habit, value) {
  const rule = HABIT_RULES[habit];
  let message = "";
  
  switch (habit) {
    case 'sleep':
      message = `Sleep needs to be ≥ ${rule.min} hours. You entered ${value} hours.`;
      break;
    case 'water':
      message = `Water needs to be ≥ ${rule.min} glasses. You entered ${value} glasses.`;
      break;
    case 'workout':
      message = `Workout needs to be ≥ ${rule.min} minutes. You entered ${value} minutes.`;
      break;
    case 'study':
      message = `Study needs to be ≥ ${rule.min} minutes. You entered ${value} minutes.`;
      break;
    case 'food':
      message = `Food calories need to be between ${rule.min}-${rule.max}. You entered ${value} calories.`;
      break;
  }
  
  setTimeout(() => {
    alert(message);
  }, 500);
}

// ============================================
// UI UPDATE FUNCTIONS
// ============================================

/**
 * Update UI for a specific habit card
 * Shows/hides tick, updates progress bar, adds completed class
 */
function updateHabitUI(habit, value, isCompleted) {
  const card = document.querySelector(`[data-habit="${habit}"]`);
  if (!card) return;
  
  // Update tick icon
  const tickIcon = document.getElementById(`tick-${habit}`);
  if (tickIcon) {
    tickIcon.style.display = isCompleted ? "inline" : "none";
  }
  
  // Update progress bar
  const progressFill = document.getElementById(`progress-${habit}`);
  if (progressFill) {
    progressFill.style.width = isCompleted ? "100%" : "0%";
    progressFill.style.transition = "width 0.3s ease";
  }
  
  // Update completed class
  if (isCompleted) {
    card.classList.add("completed");
  } else {
    card.classList.remove("completed");
  }
}

/**
 * Update score display on dashboard
 */
function updateScoreDisplay() {
  const dayData = getCurrentDayData();
  const scoreElement = document.getElementById("score");
  if (scoreElement) {
    scoreElement.innerText = dayData.score + "%";
  }
}

/**
 * Load and display current day's data in the UI
 */
function loadCurrentDayUI() {
  const dayData = getCurrentDayData();
  const habits = ['sleep', 'water', 'workout', 'study', 'food'];
  
  habits.forEach(habit => {
    const value = dayData[habit];
    const inputElement = document.getElementById(habit);
    
    // Load value into input
    if (inputElement) {
      if (value !== null && value !== undefined) {
        inputElement.value = value;
      } else {
        inputElement.value = "";
      }
    }
    
    // Update UI based on completion status
    const isCompleted = dayData.completedHabits[habit] === true;
    updateHabitUI(habit, value, isCompleted);
  });
  
  // Update score
  updateScoreDisplay();
  
  // Update current day display
  const currentDayElement = document.getElementById("currentDay");
  if (currentDayElement) {
    currentDayElement.innerText = appData.currentDay;
  }
  
  // Update streak
  const streakElement = document.getElementById("streak");
  if (streakElement) {
    streakElement.innerText = appData.streak + " 🔥";
  }
  
  // Update progress (completed days / 100)
  const progressElement = document.getElementById("progress");
  if (progressElement) {
    const completedDays = Object.keys(appData.days).filter(day => {
      return appData.days[day].completed === true;
    }).length;
    progressElement.innerText = `${completedDays} / 100`;
  }
  
  // Enable/disable inputs based on completion status
  habits.forEach(habit => {
    const inputElement = document.getElementById(habit);
    if (inputElement) {
      if (dayData.completed) {
        inputElement.disabled = true;
        inputElement.style.opacity = "0.6";
      } else {
        inputElement.disabled = false;
        inputElement.style.opacity = "1";
      }
    }
  });
}

// ============================================
// DAY COMPLETION LOGIC
// ============================================

/**
 * Complete the current day
 * Called when all 5 habits are completed
 * Increases streak, moves to next day, locks previous day
 */
function completeCurrentDay() {
  const dayData = getCurrentDayData();
  const completedDayNum = appData.currentDay; // Capture before incrementing
  
  // Mark day as completed
  dayData.completed = true;
  
  // Increase streak
  appData.streak++;
  
  // Move to next day (if not already at day 100)
  if (appData.currentDay < 100) {
    appData.currentDay++;
  }
  
  // Save data
  saveData();
  
  // Show celebration
  showFeedback("🎉 Day Completed! All habits done! Moving to next day...");
  
  // Reload UI for new day
  setTimeout(() => {
    loadCurrentDayUI();
    renderCalendar();
    
    // Show alert
    alert(`Congratulations! Day ${completedDayNum} completed!\n\nStreak: ${appData.streak} days 🔥\n\nStarting Day ${appData.currentDay}...`);
  }, 1000);
}

/**
 * Update streak based on consecutive completed days
 * Streak resets if a day is skipped
 */
function updateStreak() {
  let streak = 0;
  
  // Check backwards from current day
  for (let day = appData.currentDay; day >= 1; day--) {
    const dayData = appData.days[day];
    
    if (dayData && dayData.completed) {
      streak++;
    } else {
      // Streak breaks if any day is not completed
      break;
    }
  }
  
  appData.streak = streak;
  saveData();
  
  // Update UI
  const streakElement = document.getElementById("streak");
  if (streakElement) {
    streakElement.innerText = streak + " 🔥";
  }
}

// ============================================
// CALENDAR / RECORDS
// ============================================

/**
 * Render the 100-day calendar
 * Shows completed days in green, incomplete in red, current day highlighted
 */
function renderCalendar() {
  const calendarElement = document.getElementById("calendar");
  if (!calendarElement) return;
  
  calendarElement.innerHTML = "";
  
  for (let day = 1; day <= 100; day++) {
    const cell = document.createElement("div");
    cell.innerText = day;
    cell.style.cursor = "pointer";
    
    const dayData = appData.days[day];
    
    if (dayData && dayData.completed) {
      // Completed day - green
      cell.classList.add("done");
    } else if (dayData && !dayData.completed && day < appData.currentDay) {
      // Incomplete past day - red
      cell.classList.add("incomplete");
    }
    
    if (day === appData.currentDay) {
      // Current day - highlighted
      cell.classList.add("current");
    }
    
    // Click to view day details
    cell.addEventListener("click", () => {
      showDayDetails(day);
    });
    
    calendarElement.appendChild(cell);
  }
}

/**
 * Show details for a specific day
 */
function showDayDetails(day) {
  const dayData = appData.days[day];
  const detailsElement = document.getElementById("day-details");
  const dayNumElement = document.getElementById("selected-day-num");
  const contentElement = document.getElementById("day-details-content");
  
  if (!detailsElement || !dayNumElement || !contentElement) return;
  
  if (dayNumElement) {
    dayNumElement.innerText = day;
  }
  
  if (!dayData) {
    contentElement.innerHTML = "<p>No data recorded for this day.</p>";
  } else {
    let html = `<p><strong>Status:</strong> ${dayData.completed ? "✅ Completed" : "❌ Incomplete"}</p>`;
    html += `<p><strong>Score:</strong> ${dayData.score}%</p>`;
    html += `<p><strong>Habits:</strong></p>`;
    html += `<ul style="margin-left:1.5rem; margin-top:0.5rem;">`;
    
    const habits = [
      { key: 'sleep', label: 'Sleep', unit: 'hours' },
      { key: 'water', label: 'Water', unit: 'glasses' },
      { key: 'workout', label: 'Workout', unit: 'minutes' },
      { key: 'study', label: 'Study', unit: 'minutes' },
      { key: 'food', label: 'Food', unit: 'calories' }
    ];
    
    habits.forEach(habit => {
      const value = dayData[habit.key];
      const completed = dayData.completedHabits[habit.key];
      const status = completed ? "✅" : "❌";
      html += `<li>${status} ${habit.label}: ${value !== null ? value + " " + habit.unit : "Not logged"}</li>`;
    });
    
    html += `</ul>`;
    contentElement.innerHTML = html;
  }
  
  detailsElement.style.display = "block";
}

/**
 * Close day details view
 */
function closeDayDetails() {
  const detailsElement = document.getElementById("day-details");
  if (detailsElement) {
    detailsElement.style.display = "none";
  }
}

// ============================================
// MOTIVATION
// ============================================

/**
 * Load motivation text
 */
function loadMotivation() {
  const whyElement = document.getElementById("why");
  if (whyElement && appData.whyStarted) {
    whyElement.value = appData.whyStarted;
  }
}

/**
 * Save motivation text
 */
function saveWhy() {
  const whyElement = document.getElementById("why");
  if (whyElement) {
    appData.whyStarted = whyElement.value;
    saveData();
    showFeedback("Motivation saved!");
  }
}

// ============================================
// NAVIGATION
// ============================================


function setupNavigation() {
  // Handle all navigation buttons (top and bottom)
  const allNavButtons = document.querySelectorAll(".nav-btn, .nav-btn-bottom");
  
  allNavButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      // Update active page
      document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
      const pageId = btn.dataset.page === "progress" ? "progressPage" : btn.dataset.page || "dashboard";
      const pageElement = document.getElementById(pageId);
      if (pageElement) {
        pageElement.classList.add("active");
      }
      
      // Update active nav buttons (both top and bottom)
      document.querySelectorAll(".nav-btn, .nav-btn-bottom").forEach(b => b.classList.remove("active"));
      allNavButtons.forEach(b => {
        if (b.dataset.page === btn.dataset.page) {
          b.classList.add("active");
        }
      });
      
      // Re-render calendar if on progress page
      if (pageId === "progressPage") {
        renderCalendar();
      }
      
      // Scroll to top on mobile
      if (window.innerWidth < 768) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  });
}

// ============================================
// FEEDBACK MESSAGES
// ============================================

/**
 * Show temporary feedback message
 */
function showFeedback(message) {
  const feedback = document.createElement('div');
  feedback.textContent = message;
  feedback.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    color: white;
    padding: 1rem 1.5rem;
    border-radius: 10px;
    z-index: 1000;
    animation: slideIn 0.3s ease;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  `;
  
  document.body.appendChild(feedback);
  
  setTimeout(() => {
    feedback.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => feedback.remove(), 300);
  }, 3000);
}

// Add animation styles
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(100%);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);

// ============================================
// INITIALIZATION
// ============================================

/**
 * Initialize the application
 * Loads data, sets up UI, renders calendar
 */
function init() {
  try {
    // Ensure data structure is valid
    if (!appData.days) {
      appData.days = {};
    }
    if (typeof appData.currentDay !== 'number' || appData.currentDay < 1) {
      appData.currentDay = 1;
    }
    if (typeof appData.streak !== 'number' || appData.streak < 0) {
      appData.streak = 0;
    }
    
    // Update streak based on completed days
    updateStreak();
    
    // Load current day UI
    loadCurrentDayUI();
    
    // Render calendar
    renderCalendar();
    
    // Load motivation
    loadMotivation();
    
    // Setup navigation
    setupNavigation();
    
    // Setup mobile input scrolling
    setupMobileInputScrolling();
    
    // Save initial state
    saveData();
  } catch (error) {
    console.error("Error initializing app:", error);
    alert("Error loading app. Please refresh the page.");
  }
}

/**
 * Setup mobile input scrolling - ensures inputs scroll into view when focused
 */
function setupMobileInputScrolling() {
  const inputs = document.querySelectorAll('input, textarea');
  
  inputs.forEach(input => {
    input.addEventListener('focus', function() {
      // Small delay to ensure keyboard is shown
      setTimeout(() => {
        this.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center',
          inline: 'nearest'
        });
      }, 300);
    });
  });
}

// ============================================
// RESTART CHALLENGE
// ============================================

/**
 * Restart the challenge - clears all data and resets to day 1
 * Only asks for confirmation if challenge is completed (Day 100)
 */
function restartChallenge() {
  // Check if challenge is completed (Day 100 is completed)
  const isCompleted = appData.currentDay >= 100 && 
                      appData.days[100] && 
                      appData.days[100].completed === true;
  
  let confirmed = true;
  let keepMotivation = true; // Default to keeping motivation
  
  // Only ask for confirmation if challenge is completed
  if (isCompleted) {
    confirmed = confirm(
      "⚠️ Are you sure you want to restart the challenge?\n\n" +
      "This will:\n" +
      "• Reset to Day 1\n" +
      "• Clear all progress data\n" +
      "• Reset your streak to 0\n" +
      "• Clear all habit records\n\n" +
      "Your motivation text will be kept.\n\n" +
      "This action cannot be undone!"
    );
    
    if (confirmed) {
      // Keep motivation text if user wants
      keepMotivation = confirm(
        "Do you want to keep your 'Why I Started' motivation text?\n\n" +
        "Click OK to keep it, or Cancel to clear everything."
      );
    }
  }
  
  if (confirmed) {
    // Reset app data
    appData = {
      currentDay: 1,
      streak: 0,
      days: {},
      whyStarted: keepMotivation ? appData.whyStarted : ""
    };
    
    // Clear localStorage
    localStorage.setItem("betterMe", JSON.stringify(appData));
    
    // Show success message
    showFeedback("🔄 Challenge restarted! Starting fresh...");
    
    // Reload UI
    setTimeout(() => {
      // Clear all input fields
      const habits = ['sleep', 'water', 'workout', 'study', 'food'];
      habits.forEach(habit => {
        const input = document.getElementById(habit);
        if (input) {
          input.value = "";
        }
        // Reset UI
        updateHabitUI(habit, null, false);
      });
      
      // Reload current day UI
      loadCurrentDayUI();
      
      // Update dashboard
      updateStreak();
      
      // Render calendar
      renderCalendar();
      
      // Reload motivation if kept
      if (keepMotivation) {
        loadMotivation();
      } else {
        const whyElement = document.getElementById("why");
        if (whyElement) {
          whyElement.value = "";
        }
      }
      
      // Show completion message only if challenge was completed
      if (isCompleted) {
        alert("✅ Challenge restarted successfully!\n\nYou're now on Day 1. Good luck on your new journey! 💪");
      }
    }, 500);
  }
}

// Run when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
