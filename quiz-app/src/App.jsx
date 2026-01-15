import { useState, useEffect } from 'react'
import './App.css'
import part1Questions from './part1.json'
import part2Questions from './part2.json'

// Quiz categories
const CATEGORIES = {
  PART1: {
    id: 'part1',
    name: 'Part 1',
    nameAr: 'الجزء الأول',
    questions: part1Questions,
    icon: '📘',
    color: '#3b82f6',
  },
  PART2: {
    id: 'part2',
    name: 'Part 2',
    nameAr: 'الجزء الثاني',
    questions: part2Questions,
    icon: '📗',
    color: '#10b981',
  },
}

// Screen types
const SCREENS = {
  HOME: 'home',
  QUIZ: 'quiz',
  RESULTS: 'results',
}

// LocalStorage key
const STORAGE_KEY = 'quiz_app_state'

// Helper to get saved data for a category
const getSavedCategoryData = (categoryKey) => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      return parsed.categories?.[categoryKey] || null
    }
  } catch (e) {
    console.error('Failed to get saved category data:', e)
  }
  return null
}

// Helper to get progress percentage for a category
const getCategoryProgress = (categoryKey) => {
  const saved = getSavedCategoryData(categoryKey)
  if (saved && saved.userAnswers) {
    const answeredCount = Object.keys(saved.userAnswers).length
    const totalQuestions = CATEGORIES[categoryKey].questions.length
    return Math.round((answeredCount / totalQuestions) * 100)
  }
  return 0
}

function App() {
  const [screen, setScreen] = useState(SCREENS.HOME)
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [userAnswers, setUserAnswers] = useState({})
  const [selectedOption, setSelectedOption] = useState(null)
  const [isTransitioning, setIsTransitioning] = useState(false)

  // Get current questions based on selected category
  const questions = selectedCategory ? CATEGORIES[selectedCategory].questions : []

  // Load state from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem(STORAGE_KEY)
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState)
        // Restore current view state
        setScreen(parsed.currentView?.screen || SCREENS.HOME)
        const savedCategory = parsed.currentView?.selectedCategory || null
        setSelectedCategory(savedCategory)
        
        // If there's a selected category, load its state
        if (savedCategory && parsed.categories?.[savedCategory]) {
          const categoryState = parsed.categories[savedCategory]
          setCurrentQuestion(categoryState.currentQuestion || 0)
          setUserAnswers(categoryState.userAnswers || {})
          setSelectedOption(categoryState.selectedOption || null)
        }
      } catch (e) {
        console.error('Failed to parse saved state:', e)
      }
    }
  }, [])

  // Save state to localStorage whenever it changes
  useEffect(() => {
    try {
      // Get existing saved data
      const existingSaved = localStorage.getItem(STORAGE_KEY)
      const existing = existingSaved ? JSON.parse(existingSaved) : { categories: {} }
      
      // Update current view
      existing.currentView = {
        screen,
        selectedCategory,
      }
      
      // Update category-specific data if a category is selected
      if (selectedCategory) {
        existing.categories = existing.categories || {}
        existing.categories[selectedCategory] = {
          currentQuestion,
          userAnswers,
          selectedOption,
        }
      }
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(existing))
    } catch (e) {
      console.error('Failed to save state:', e)
    }
  }, [screen, selectedCategory, currentQuestion, userAnswers, selectedOption])

  const selectCategory = (categoryKey) => {
    setIsTransitioning(true)
    setTimeout(() => {
      // Load saved state for this category if it exists
      const savedCategoryState = getSavedCategoryData(categoryKey)
      
      setSelectedCategory(categoryKey)
      setScreen(SCREENS.QUIZ)
      
      if (savedCategoryState) {
        setCurrentQuestion(savedCategoryState.currentQuestion || 0)
        setUserAnswers(savedCategoryState.userAnswers || {})
        setSelectedOption(savedCategoryState.selectedOption || null)
      } else {
        setCurrentQuestion(0)
        setUserAnswers({})
        setSelectedOption(null)
      }
      
      setIsTransitioning(false)
    }, 300)
  }

  const selectOption = (option) => {
    setSelectedOption(option)
  }

  const nextQuestion = () => {
    if (selectedOption === null) return

    setIsTransitioning(true)

    const newAnswers = { ...userAnswers, [currentQuestion]: selectedOption }
    setUserAnswers(newAnswers)

    setTimeout(() => {
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1)
        setSelectedOption(newAnswers[currentQuestion + 1] || null)
      }
      setIsTransitioning(false)
    }, 300)
  }

  const prevQuestion = () => {
    if (currentQuestion === 0) return

    setIsTransitioning(true)

    // Save current selection before going back
    if (selectedOption !== null) {
      setUserAnswers({ ...userAnswers, [currentQuestion]: selectedOption })
    }

    setTimeout(() => {
      setCurrentQuestion(currentQuestion - 1)
      setSelectedOption(userAnswers[currentQuestion - 1] || null)
      setIsTransitioning(false)
    }, 300)
  }

  const finishQuiz = () => {
    if (selectedOption === null) return

    setIsTransitioning(true)
    const newAnswers = { ...userAnswers, [currentQuestion]: selectedOption }
    setUserAnswers(newAnswers)

    setTimeout(() => {
      setScreen(SCREENS.RESULTS)
      setIsTransitioning(false)
    }, 300)
  }

  const restartQuiz = () => {
    setIsTransitioning(true)
    setTimeout(() => {
      // Clear only current category's data
      setScreen(SCREENS.QUIZ)
      setCurrentQuestion(0)
      setUserAnswers({})
      setSelectedOption(null)
      setIsTransitioning(false)
    }, 300)
  }

  const goToHome = () => {
    setIsTransitioning(true)
    setTimeout(() => {
      // Go to home but keep category data saved
      setScreen(SCREENS.HOME)
      setSelectedCategory(null)
      setCurrentQuestion(0)
      setUserAnswers({})
      setSelectedOption(null)
      setIsTransitioning(false)
    }, 300)
  }

  const clearCategoryData = (categoryKey) => {
    try {
      const existingSaved = localStorage.getItem(STORAGE_KEY)
      if (existingSaved) {
        const existing = JSON.parse(existingSaved)
        if (existing.categories?.[categoryKey]) {
          delete existing.categories[categoryKey]
          localStorage.setItem(STORAGE_KEY, JSON.stringify(existing))
        }
      }
    } catch (e) {
      console.error('Failed to clear category data:', e)
    }
  }

  const calculateScore = () => {
    let correct = 0
    questions.forEach((q, index) => {
      if (userAnswers[index] === q.answer) {
        correct++
      }
    })
    return correct
  }

  const getPercentage = () => {
    return Math.round((calculateScore() / questions.length) * 100)
  }

  // Home Screen with Category Selection
  if (screen === SCREENS.HOME) {
    return (
      <div className={`app-container home-screen ${isTransitioning ? 'fade-out' : 'fade-in'}`}>
        <div className="home-content">
          <div className="logo-container">
            <div className="logo-icon">
              <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="3" />
                <path
                  d="M35 45C35 39 40 35 50 35C60 35 65 40 65 47C65 54 58 56 50 60"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
                <circle cx="50" cy="72" r="4" fill="currentColor" />
              </svg>
            </div>
          </div>
          <h1 className="app-title">Communication Technology Quiz</h1>
          <p className="app-subtitle">اختبار تكنولوجيا الاتصالات</p>
          <p className="app-instruction">اختر القسم الذي تريد اختباره</p>

          <div className="category-grid">
            {Object.entries(CATEGORIES).map(([key, category]) => {
              const progress = getCategoryProgress(key)
              const savedData = getSavedCategoryData(key)
              const answeredCount = savedData?.userAnswers ? Object.keys(savedData.userAnswers).length : 0
              
              return (
                <button
                  key={key}
                  className={`category-card ${progress > 0 ? 'has-progress' : ''}`}
                  style={{ '--category-color': category.color }}
                  onClick={() => selectCategory(key)}
                >
                  <span className="category-icon">{category.icon}</span>
                  <span className="category-name">{category.name}</span>
                  <span className="category-name-ar">{category.nameAr}</span>
                  <span className="category-count">{category.questions.length} سؤال</span>
                  {progress > 0 && (
                    <div className="category-progress">
                      <div className="category-progress-bar">
                        <div 
                          className="category-progress-fill" 
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                      <span className="category-progress-text">
                        {answeredCount} / {category.questions.length} ({progress}%)
                      </span>
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>
        <div className="home-decoration">
          <div className="floating-shape shape-1"></div>
          <div className="floating-shape shape-2"></div>
          <div className="floating-shape shape-3"></div>
        </div>
      </div>
    )
  }

  // Quiz Screen
  if (screen === SCREENS.QUIZ) {
    const question = questions[currentQuestion]
    const isLastQuestion = currentQuestion === questions.length - 1
    const progress = ((currentQuestion + 1) / questions.length) * 100
    const category = CATEGORIES[selectedCategory]

    return (
      <div className={`app-container quiz-screen ${isTransitioning ? 'fade-out' : 'fade-in'}`}>
        <div className="quiz-header">
          <div className="quiz-header-top">
            <div className="quiz-category-badge" style={{ '--category-color': category.color }}>
              <span>{category.icon}</span>
              <span>{category.name}</span>
            </div>
            <button className="back-home-btn" onClick={goToHome}>
              <span>🏠</span>
              <span>الرئيسية</span>
            </button>
          </div>
          <div className="progress-info">
            <span className="progress-text">
              Question {currentQuestion + 1} / {questions.length}
            </span>
            <span className="progress-text-ar">
              السؤال {currentQuestion + 1} من {questions.length}
            </span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }}></div>
          </div>
        </div>

        <div className="question-container">
          <div className="question-number">Q{currentQuestion + 1}</div>
          <h2 className="question-text">{question.question}</h2>
        </div>

        <div className="options-container">
          {question.options.map((option, index) => (
            <button
              key={index}
              className={`option-btn ${selectedOption === option ? 'selected' : ''}`}
              onClick={() => selectOption(option)}
            >
              <span className="option-letter">{String.fromCharCode(65 + index)}</span>
              <span className="option-text">{option}</span>
              {selectedOption === option && <span className="check-mark">✓</span>}
            </button>
          ))}
        </div>

        <div className="quiz-navigation">
          <button
            className="nav-btn prev-btn"
            onClick={prevQuestion}
            disabled={currentQuestion === 0}
          >
            <span className="nav-icon">←</span>
            <span>Previous</span>
          </button>

          {isLastQuestion ? (
            <button
              className="nav-btn finish-btn"
              onClick={finishQuiz}
              disabled={selectedOption === null}
            >
              <span>Finish Quiz</span>
              <span className="nav-icon">🏁</span>
            </button>
          ) : (
            <button
              className="nav-btn next-btn"
              onClick={nextQuestion}
              disabled={selectedOption === null}
            >
              <span>Next</span>
              <span className="nav-icon">→</span>
            </button>
          )}
        </div>
      </div>
    )
  }

  // Results Screen
  if (screen === SCREENS.RESULTS) {
    const score = calculateScore()
    const percentage = getPercentage()
    const category = CATEGORIES[selectedCategory]

    let gradeClass = 'grade-low'
    let gradeEmoji = '😔'
    if (percentage >= 80) {
      gradeClass = 'grade-excellent'
      gradeEmoji = '🏆'
    } else if (percentage >= 60) {
      gradeClass = 'grade-good'
      gradeEmoji = '👍'
    } else if (percentage >= 40) {
      gradeClass = 'grade-average'
      gradeEmoji = '📚'
    }

    return (
      <div className={`app-container results-screen ${isTransitioning ? 'fade-out' : 'fade-in'}`}>
        <div className="results-header">
          <div className="quiz-category-badge" style={{ '--category-color': category.color }}>
            <span>{category.icon}</span>
            <span>{category.name}</span>
          </div>
          <h1 className="results-title">Quiz Complete! 🎉</h1>
          <p className="results-subtitle">اكتمل الاختبار</p>
        </div>

        <div className={`score-card ${gradeClass}`}>
          <div className="score-emoji">{gradeEmoji}</div>
          <div className="score-main">
            <span className="score-number">{score}</span>
            <span className="score-divider">/</span>
            <span className="score-total">{questions.length}</span>
          </div>
          <div className="score-percentage">{percentage}%</div>
          <div className="score-label">
            {percentage >= 80
              ? 'Excellent! / ممتاز!'
              : percentage >= 60
              ? 'Good Job! / جيد جداً!'
              : percentage >= 40
              ? 'Keep Trying! / استمر!'
              : 'Need More Practice / تحتاج مراجعة'}
          </div>
        </div>

        <div className="review-section">
          <h2 className="review-title">Review Answers / مراجعة الإجابات</h2>

          <div className="review-list">
            {questions.map((question, index) => {
              const userAnswer = userAnswers[index]
              const isCorrect = userAnswer === question.answer

              return (
                <div key={index} className={`review-card ${isCorrect ? 'correct' : 'incorrect'}`}>
                  <div className="review-header">
                    <span className="review-number">Q{index + 1}</span>
                    <span
                      className={`review-status ${
                        isCorrect ? 'status-correct' : 'status-incorrect'
                      }`}
                    >
                      {isCorrect ? '✅ Correct' : '❌ Incorrect'}
                    </span>
                  </div>
                  <p className="review-question">{question.question}</p>

                  <div className="review-answers">
                    {question.options.map((option, optIndex) => {
                      const isUserAnswer = option === userAnswer
                      const isCorrectAnswer = option === question.answer

                      let optionClass = ''
                      if (isCorrectAnswer) {
                        optionClass = 'option-correct'
                      } else if (isUserAnswer && !isCorrect) {
                        optionClass = 'option-wrong'
                      }

                      return (
                        <div key={optIndex} className={`review-option ${optionClass}`}>
                          <span className="option-letter">
                            {String.fromCharCode(65 + optIndex)}
                          </span>
                          <span className="option-text">{option}</span>
                          {isCorrectAnswer && (
                            <span className="option-badge correct-badge">✓ Correct</span>
                          )}
                          {isUserAnswer && !isCorrect && (
                            <span className="option-badge wrong-badge">✗ Your Answer</span>
                          )}
                          {isUserAnswer && isCorrect && (
                            <span className="option-badge your-badge">Your Answer</span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="results-actions">
          <button className="action-btn restart-btn" onClick={restartQuiz}>
            <span className="action-icon">🔄</span>
            <span className="action-text-ar">إعادة الاختبار</span>
            <span className="action-text-en">Restart Quiz</span>
          </button>

          <button className="action-btn home-btn" onClick={goToHome}>
            <span className="action-icon">🏠</span>
            <span className="action-text-ar">العودة للرئيسية</span>
            <span className="action-text-en">Back to Home</span>
          </button>
        </div>
      </div>
    )
  }

  return null
}

export default App
