# FreeCampus Tools

A Python library for tools shared across [FreeCampus](https://freecampus.org)
courses. It currently provides multiple-choice quizzes, JSON export for web
renderers, and interactive widgets for Jupyter and Colab.

## Install from GitHub

```bash
python -m pip install "freecampustools @ git+https://github.com/freecampus/freecampustools.git"
```

To use notebook widgets, install the `notebook` extra.

```bash
python -m pip install "freecampustools[notebook] @ git+https://github.com/freecampus/freecampustools.git"
```

In a notebook, run the same command with `%pip` in place of `python -m pip`.

## Create a quiz

Store questions alongside your course materials. You can use the same quiz in a
notebook and on a course page.

```python
from freecampustools.questions import MultipleChoiceQuestion, Quiz

quiz = Quiz(
    id="map-scale",
    title="Reading a map scale",
    questions=(
        MultipleChoiceQuestion(
            id="distance",
            prompt="On this map, 1 cm represents 2 km. What does 3 cm represent?",
            options=("2 km", "5 km", "6 km"),
            answer_index=2,
            explanation="Multiply the 3 cm on the map by 2 km per centimeter.",
        ),
    ),
)
```

In Jupyter or Colab, display the widget after creating the quiz.

```python
from IPython.display import display

from freecampustools.widgets import show_quiz

display(show_quiz(quiz))
```

For a plain-text list of prompts, use `quiz_summary(quiz)` from
`freecampustools.widgets`. For a web renderer, use `quiz.to_json()` or print
`quiz.to_json_script()` in a Quarto Python cell with `#| output: asis` and
`#| echo: false`. The script contains quiz data, including answers, for
self-checks. Pair it with a renderer such as the
[FreeCampus Python Quarto include](https://github.com/freecampus/python/blob/24de39c5b5e8801cdd7e95061f3cedce25d81f31/docs/_includes/ojs-quiz.qmd).

The quiz models and notebook renderer originated in
[FreeCampus Python](https://github.com/freecampus/python/tree/24de39c5b5e8801cdd7e95061f3cedce25d81f31/src/fcpython).

## Develop

```bash
conda env create --file conda.yaml
conda activate freecampustools
POETRY_VIRTUALENVS_CREATE=false poetry install --extras notebook
makim all.ci
```

Licensed under the [BSD 3-Clause License](LICENSE).
