# FreeCampus Tools

FreeCampus Tools provides shared multiple-choice quizzes for
[FreeCampus](https://freecampus.org) courses, with a Quarto extension for course
websites and a Python library for Jupyter and Colab.

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
`freecampustools.widgets`.

## Use quizzes in Quarto

From the directory containing your course's `_quarto.yml`, install the extension
with Quarto 1.9.38 or later.

```bash
quarto add freecampus/freecampustools
```

Commit the installed `_extensions/freecampus/quiz/` directory with your course.
To install a specific release that includes the extension, append `@` followed
by the release tag to the repository name. Add the filter to `_quarto.yml`.

```yaml
filters:
  - freecampus/quiz
```

In a `.qmd` lesson, put a quiz wherever the learner should see it.

````markdown
```{.freecampus-quiz}
{
  "id": "map-scale",
  "title": "Reading a map scale",
  "questions": [
    {
      "id": "distance",
      "prompt": "On this map, 1 cm represents 2 km. What does 3 cm represent?",
      "options": ["2 km", "5 km", "6 km"],
      "answer_index": 2,
      "explanation": "Multiply the 3 cm on the map by 2 km per centimeter."
    }
  ]
}
```
````

`answer_index` counts from zero. Quarto bundles the renderer's JavaScript and
CSS on pages with quizzes. Formats such as PDF and EPUB render fenced quizzes as
a list of questions and options. HTML quizzes are for self-checks. The quiz
data, including answers, is visible in the page source.

The extension also reads the existing `fcpython-ojs-quiz-config` JSON script
blocks. When migrating an existing course, keep those blocks and remove the
matching `ojs-quiz.qmd` includes to avoid rendering each quiz twice. Keep the
existing block format while any custom PDF or notebook exporters depend on it.
To generate a quiz from Python, print `quiz.to_json_script()` in a Quarto Python
cell with `#| output: asis` and `#| echo: false`.

The quiz models, notebook renderer, and web renderer originated in
[FreeCampus Python](https://github.com/freecampus/python/tree/24de39c5b5e8801cdd7e95061f3cedce25d81f31).

## Develop

```bash
conda env create --file conda.yaml
conda activate freecampustools
POETRY_VIRTUALENVS_CREATE=false poetry install --extras notebook
makim all.ci
```

With Quarto on `PATH`, the tests also check extension installation and
rendering.

## Release

Before the first release, configure a [PyPI Trusted Publisher] for the
`freecampustools` project with owner `freecampus`, repository `freecampustools`,
workflow `release.yml`, and environment `pypi`. Use a pending publisher if the
project is new to PyPI.

Make sure `pyproject.toml` and `src/freecampustools/__init__.py` both have the
intended version and that the commit has passed CI on upstream `main`. Create a
matching `MAJOR.MINOR.PATCH` tag on that commit and push it to the upstream
repository. The workflow builds and checks the wheel and source distribution,
publishes them to PyPI, and attaches both files to the GitHub release with
generated notes.

If a release fails, fix the cause and rerun the failed jobs from the same
workflow run. Keep the original tag in place.

[PyPI Trusted Publisher]: https://docs.pypi.org/trusted-publishers/

Licensed under the [BSD 3-Clause License](LICENSE).
