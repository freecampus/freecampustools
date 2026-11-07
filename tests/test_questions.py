import json

import pytest

from freecampustools.questions import MultipleChoiceQuestion, Quiz
from freecampustools.widgets import quiz_summary, show_quiz


@pytest.fixture
def quiz() -> Quiz:
    return Quiz(
        id="symbols",
        title="Símbolos & sinais",
        questions=(
            MultipleChoiceQuestion(
                id="less-than",
                prompt='Which symbol means "less than"?',
                options=("<", ">"),
                answer_index=0,
                explanation="In 2 < 3, 2 is less than 3.",
            ),
        ),
    )


def test_multiple_choice_question_validates_answer_index() -> None:
    with pytest.raises(ValueError, match="answer_index"):
        MultipleChoiceQuestion(
            id="invalid",
            prompt="Which symbol means less than?",
            options=("<", ">"),
            answer_index=2,
            explanation="< means less than.",
        )


def test_quiz_rejects_duplicate_question_ids(quiz: Quiz) -> None:
    with pytest.raises(ValueError, match="unique"):
        Quiz(id="duplicates", title="Duplicate questions", questions=quiz.questions * 2)


def test_quiz_json_contains_question_data(quiz: Quiz) -> None:
    payload = json.loads(quiz.to_json())
    assert payload == {
        "id": "symbols",
        "title": "Símbolos & sinais",
        "instructions": "Choose an answer, then check your work.",
        "questions": [
            {
                "id": "less-than",
                "prompt": 'Which symbol means "less than"?',
                "options": ["<", ">"],
                "answer_index": 0,
                "explanation": "In 2 < 3, 2 is less than 3.",
            }
        ],
    }


def test_quiz_json_script_round_trips_raw_text(quiz: Quiz) -> None:
    quiz = Quiz(
        id=quiz.id,
        title=quiz.title,
        questions=quiz.questions,
        instructions="Use < and & literally, even in </ScRiPt>.",
    )
    opening_tag, _, rest = quiz.to_json_script().partition("\n")
    payload, _, closing_tag = rest.rpartition("\n")

    assert opening_tag == (
        '<script type="application/json" class="fcpython-ojs-quiz-config">'
    )
    assert closing_tag == "</script>"
    assert "<" not in payload
    assert json.loads(payload) == quiz.to_dict()


def test_quiz_json_script_escapes_custom_class(quiz: Quiz) -> None:
    script = quiz.to_json_script(css_class='custom"quiz', indent=None)
    assert 'class="custom&quot;quiz"' in script


def test_quiz_summary_returns_prompts(quiz: Quiz) -> None:
    assert quiz_summary(quiz) == ('Which symbol means "less than"?',)


def test_show_quiz_checks_answers_and_resets(quiz: Quiz) -> None:
    widget = show_quiz(quiz)
    title, _, radio, feedback, controls, score = widget.children
    check, reset = controls.children

    assert "Símbolos &amp; sinais" in title.value
    assert radio.value is None

    check.click()
    assert "Choose an answer" in feedback.value

    radio.value = 1
    check.click()
    assert "0/1" in score.value
    assert "<strong>&lt;</strong>" in feedback.value

    radio.value = 0
    check.click()
    assert "1/1" in score.value
    assert "2 &lt; 3" in feedback.value

    reset.click()
    assert radio.value is None
    assert feedback.value == score.value == ""
