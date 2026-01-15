import { useState, useEffect } from 'react'
import './App.css'
import questions from './part1.json'

// Screen types
const SCREENS = {
  HOME: 'home',
  QUIZ: 'quiz',
  RESULTS: 'results',
}

// LocalStorage key
const STORAGE_KEY = 'quiz_app_state'

function App() {
  const [screen, setScreen] = useState(SCREENS.HOME)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [userAnswers, setUserAnswers] = useState({})
  const [selectedOption, setSelectedOption] = useState(null)
  const [isTransitioning, setIsTransitioning] = useState(false)

  // Load state from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem(STORAGE_KEY)
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState)
        setScreen(parsed.screen || SCREENS.HOME)
        setCurrentQuestion(parsed.currentQuestion || 0)
        setUserAnswers(parsed.userAnswers || {})
        setSelectedOption(parsed.selectedOption || null)
      } catch (e) {
        console.error('Failed to parse saved state:', e)
      }
    }
  }, [])

  // Save state to localStorage whenever it changes
  useEffect(() => {
    const stateToSave = {
      screen,
      currentQuestion,
      userAnswers,
      selectedOption,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave))
  }, [screen, currentQuestion, userAnswers, selectedOption])

  const startQuiz = () => {
    setIsTransitioning(true)
    setTimeout(() => {
      setScreen(SCREENS.QUIZ)
      setCurrentQuestion(0)
      setUserAnswers({})
      setSelectedOption(null)
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
      setScreen(SCREENS.HOME)
      setCurrentQuestion(0)
      setUserAnswers({})
      setSelectedOption(null)
      localStorage.removeItem(STORAGE_KEY)
      setIsTransitioning(false)
    }, 300)
  }

  const calculateScore = () => {
    let correct = 0
    questions.forEach((q, index) => {
      if (userAnswers[index] === q.correctAnswer) {
        correct++
      }
    })
    return correct
  }

  const getPercentage = () => {
    return Math.round((calculateScore() / questions.length) * 100)
  }

  // Home Screen
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
          <div className="home-stats">
            <div className="stat-item">
              <span className="stat-number">{questions.length}</span>
              <span className="stat-label">Questions / أسئلة</span>
            </div>
          </div>
          <button className="start-btn" onClick={startQuiz}>
            <span className="btn-text-ar">ابدأ الاختبار</span>
            <span className="btn-icon">→</span>
          </button>
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

    return (
      <div className={`app-container quiz-screen ${isTransitioning ? 'fade-out' : 'fade-in'}`}>
        <div className="quiz-header">
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
              const isCorrect = userAnswer === question.correctAnswer

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
                      const isCorrectAnswer = option === question.correctAnswer

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

        <button className="restart-btn" onClick={restartQuiz}>
          <span className="restart-icon">🔄</span>
          <span className="restart-text">إعادة الاختبار</span>
          <span className="restart-text-en">Restart Quiz</span>
        </button>
      </div>
    )
  }

  return null
}

export default App
