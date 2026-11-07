(() => {
  const checkedAnswer = "input[type='radio']:checked";

  function isQuestion(question) {
    return (
      typeof question?.prompt === "string" &&
      Array.isArray(question.options) &&
      question.options.length >= 2 &&
      question.options.every((option) => typeof option === "string") &&
      Number.isInteger(question.answer_index) &&
      question.answer_index >= 0 &&
      question.answer_index < question.options.length &&
      typeof question.explanation === "string"
    );
  }

  function renderQuiz(quiz, instanceId) {
    const container = document.createElement("div");
    container.className = "freecampus-quiz";
    const title = document.createElement("h3");
    title.textContent = quiz.title;
    container.appendChild(title);

    const instructions = document.createElement("p");
    instructions.textContent =
      quiz.instructions ?? "Choose an answer, then check your work.";
    container.appendChild(instructions);

    const progress = document.createElement("div");
    progress.className = "freecampus-quiz-progress";

    const counter = document.createElement("p");
    counter.className = "freecampus-quiz-counter";
    counter.setAttribute("aria-live", "polite");
    progress.appendChild(counter);

    const tabs = document.createElement("div");
    tabs.className = "freecampus-quiz-steps";
    tabs.setAttribute("role", "tablist");
    tabs.setAttribute("aria-label", "Quiz questions");
    progress.appendChild(tabs);
    container.appendChild(progress);

    const questions = document.createElement("div");
    questions.className = "freecampus-quiz-questions";

    const feedbackNodes = [];
    const questionPanels = [];
    const stepButtons = [];
    let currentQuestion = 0;

    function setStepStatus(questionIndex, status) {
      const step = stepButtons[questionIndex];
      const question = quiz.questions[questionIndex];
      const statuses = {
        answered: "answered",
        correct: "correct",
        incorrect: "incorrect",
        unanswered: "not answered",
      };

      step.classList.remove(
        "is-answered",
        "is-correct",
        "is-incorrect",
        "is-unanswered",
      );
      if (status) {
        step.classList.add(`is-${status}`);
      }

      const statusLabel = status ? `, ${statuses[status]}` : "";
      step.setAttribute(
        "aria-label",
        `Question ${questionIndex + 1}: ${question.prompt}${statusLabel}`,
      );
    }

    function showQuestion(questionIndex, focusPanel = false) {
      currentQuestion = Math.max(
        0,
        Math.min(questionIndex, quiz.questions.length - 1),
      );

      questionPanels.forEach((panel, index) => {
        panel.hidden = index !== currentQuestion;
      });
      stepButtons.forEach((step, index) => {
        const isCurrent = index === currentQuestion;
        step.classList.toggle("is-current", isCurrent);
        step.setAttribute("aria-selected", String(isCurrent));
        step.tabIndex = isCurrent ? 0 : -1;
      });

      counter.textContent = `Question ${currentQuestion + 1} of ${
        quiz.questions.length
      }`;

      const selected =
        questionPanels[currentQuestion].querySelector(checkedAnswer);
      const isLastQuestion = currentQuestion === quiz.questions.length - 1;
      previous.hidden = currentQuestion === 0;
      next.hidden = isLastQuestion || !selected;
      check.hidden = !isLastQuestion;

      if (focusPanel) {
        questionPanels[currentQuestion].focus();
      }
    }

    quiz.questions.forEach((question, questionIndex) => {
      const tabId = `${instanceId}-question-tab-${questionIndex + 1}`;
      const panelId = `${instanceId}-question-panel-${questionIndex + 1}`;

      const step = document.createElement("button");
      step.type = "button";
      step.className = "freecampus-quiz-step";
      step.id = tabId;
      step.textContent = String(questionIndex + 1);
      step.setAttribute("role", "tab");
      step.setAttribute("aria-controls", panelId);
      step.setAttribute("aria-selected", "false");
      step.tabIndex = -1;
      step.addEventListener("click", () => showQuestion(questionIndex));
      step.addEventListener("keydown", (event) => {
        let destination = null;
        if (event.key === "ArrowRight") {
          destination = (questionIndex + 1) % quiz.questions.length;
        } else if (event.key === "ArrowLeft") {
          destination =
            (questionIndex - 1 + quiz.questions.length) % quiz.questions.length;
        } else if (event.key === "Home") {
          destination = 0;
        } else if (event.key === "End") {
          destination = quiz.questions.length - 1;
        }

        if (destination !== null) {
          event.preventDefault();
          showQuestion(destination);
          stepButtons[destination].focus();
        }
      });
      stepButtons.push(step);
      tabs.appendChild(step);
      setStepStatus(questionIndex, "");

      const panel = document.createElement("div");
      panel.className = "freecampus-quiz-panel";
      panel.id = panelId;
      panel.setAttribute("role", "tabpanel");
      panel.setAttribute("aria-labelledby", tabId);
      panel.tabIndex = -1;

      const fieldset = document.createElement("fieldset");
      fieldset.className = "freecampus-quiz-question";

      const legend = document.createElement("legend");
      legend.textContent = question.prompt;
      fieldset.appendChild(legend);

      question.options.forEach((option, optionIndex) => {
        const label = document.createElement("label");
        label.className = "freecampus-quiz-option";

        const input = document.createElement("input");
        input.type = "radio";
        input.name = `${instanceId}-${questionIndex + 1}`;
        input.value = String(optionIndex);
        input.addEventListener("change", () => {
          setStepStatus(questionIndex, "answered");
          feedbackNodes[questionIndex].textContent = "";
          feedbackNodes[questionIndex].className = "freecampus-quiz-feedback";
          score.textContent = "";
          showQuestion(questionIndex);
        });

        const text = document.createElement("span");
        text.textContent = option;

        label.appendChild(input);
        label.appendChild(text);
        fieldset.appendChild(label);
      });

      const feedback = document.createElement("p");
      feedback.className = "freecampus-quiz-feedback";
      feedback.setAttribute("aria-live", "polite");
      feedbackNodes.push(feedback);
      fieldset.appendChild(feedback);
      panel.appendChild(fieldset);
      questionPanels.push(panel);
      questions.appendChild(panel);
    });

    container.appendChild(questions);

    const actions = document.createElement("div");
    actions.className = "freecampus-quiz-actions";

    const previous = document.createElement("button");
    previous.type = "button";
    previous.className = "freecampus-quiz-secondary";
    previous.textContent = "Previous";
    previous.addEventListener("click", () => {
      showQuestion(currentQuestion - 1, true);
    });

    const next = document.createElement("button");
    next.type = "button";
    next.textContent = "Next question";
    next.addEventListener("click", () => {
      showQuestion(currentQuestion + 1, true);
    });

    const check = document.createElement("button");
    check.type = "button";
    check.textContent = "Check answers";

    const reset = document.createElement("button");
    reset.type = "button";
    reset.className = "freecampus-quiz-secondary freecampus-quiz-reset";
    reset.textContent = "Reset";

    const score = document.createElement("p");
    score.className = "freecampus-quiz-score";
    score.setAttribute("aria-live", "polite");

    check.addEventListener("click", () => {
      let correctCount = 0;
      let firstQuestionToReview = null;

      quiz.questions.forEach((question, questionIndex) => {
        const selected =
          questionPanels[questionIndex].querySelector(checkedAnswer);
        const feedback = feedbackNodes[questionIndex];

        if (!selected) {
          feedback.textContent = "Choose an answer before checking.";
          feedback.className = "freecampus-quiz-feedback";
          setStepStatus(questionIndex, "unanswered");
          if (firstQuestionToReview === null) {
            firstQuestionToReview = questionIndex;
          }
          return;
        }

        const selectedIndex = Number(selected.value);
        if (selectedIndex === question.answer_index) {
          correctCount += 1;
          feedback.textContent = `✅ Correct. ${question.explanation}`;
          feedback.className = "freecampus-quiz-feedback is-correct";
          setStepStatus(questionIndex, "correct");
        } else {
          const answer = question.options[question.answer_index];
          feedback.textContent = `❌ Not yet. Correct answer: ${answer}. ${question.explanation}`;
          feedback.className = "freecampus-quiz-feedback is-incorrect";
          setStepStatus(questionIndex, "incorrect");
          if (firstQuestionToReview === null) {
            firstQuestionToReview = questionIndex;
          }
        }
      });

      score.textContent = `Score: ${correctCount}/${quiz.questions.length}`;
      if (firstQuestionToReview !== null) {
        showQuestion(firstQuestionToReview, true);
      }
    });

    reset.addEventListener("click", () => {
      container.querySelectorAll("input[type='radio']").forEach((input) => {
        input.checked = false;
      });
      feedbackNodes.forEach((feedback) => {
        feedback.textContent = "";
        feedback.className = "freecampus-quiz-feedback";
      });
      stepButtons.forEach((_, questionIndex) => {
        setStepStatus(questionIndex, "");
      });
      score.textContent = "";
      showQuestion(0, true);
    });

    actions.appendChild(previous);
    actions.appendChild(next);
    actions.appendChild(check);
    actions.appendChild(reset);
    container.appendChild(actions);
    container.appendChild(score);
    showQuestion(0);
    return container;
  }

  const configs = document.querySelectorAll(
    'script[type="application/json"].fcpython-ojs-quiz-config, ' +
      'script[type="application/json"].freecampus-quiz-config',
  );
  for (const [index, script] of configs.entries()) {
    if (script.hasAttribute("data-freecampus-quiz-mounted")) {
      continue;
    }
    script.setAttribute("data-freecampus-quiz-mounted", "");
    try {
      const quiz = JSON.parse(script.textContent);
      if (
        typeof quiz?.title !== "string" ||
        (quiz.instructions !== undefined &&
          typeof quiz.instructions !== "string") ||
        !Array.isArray(quiz.questions) ||
        quiz.questions.length === 0 ||
        !quiz.questions.every(isQuestion)
      ) {
        throw new Error(
          "Expected a quiz title and at least one valid question.",
        );
      }
      script.after(renderQuiz(quiz, `freecampus-quiz-${index + 1}`));
    } catch (error) {
      const warning = document.createElement("p");
      warning.className = "freecampus-quiz freecampus-quiz-warning";
      warning.textContent = "This quiz could not be loaded.";
      script.after(warning);
      console.error("Could not render FreeCampus quiz", error);
    }
  }
})();
