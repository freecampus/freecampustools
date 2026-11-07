import json
import re
import shutil
import subprocess
from pathlib import Path

import pytest

from freecampustools.questions import MultipleChoiceQuestion, Quiz

QUARTO = shutil.which("quarto")


@pytest.mark.skipif(QUARTO is None, reason="Quarto CLI is unavailable")
def test_quarto_installs_and_renders_quizzes(tmp_path: Path) -> None:
    assert QUARTO is not None
    repo = Path(__file__).resolve().parents[1]
    quiz = Quiz(
        id="symbols",
        title="Symbols & signs",
        questions=(
            MultipleChoiceQuestion(
                id="example",
                prompt="Which text closes a script element?",
                options=("</script>", "&"),
                answer_index=0,
                explanation="The closing tag starts with a slash.",
            ),
        ),
    )
    (tmp_path / "_quarto.yml").write_text(
        "project:\n  type: website\nfilters: [quiz]\n", encoding="utf-8"
    )
    (tmp_path / "index.qmd").write_text("# Plain page\n", encoding="utf-8")
    lessons = tmp_path / "course" / "lessons"
    lessons.mkdir(parents=True)
    (lessons / "example.qmd").write_text(
        f"# Quiz page\n\n{quiz.to_json_script()}\n\n"
        f"```{{.freecampus-quiz}}\n{quiz.to_json()}\n```\n",
        encoding="utf-8",
    )

    subprocess.run([QUARTO, "add", str(repo), "--no-prompt"], cwd=tmp_path, check=True)
    subprocess.run([QUARTO, "render"], cwd=tmp_path, check=True)

    output = tmp_path / "_site" / "course" / "lessons" / "example.html"
    html = output.read_text(encoding="utf-8")
    for asset in ("quiz.js", "quiz.css"):
        paths = re.findall(rf'["\']([^"\']+/{re.escape(asset)})["\']', html)
        assert len(paths) == 1
        assert (output.parent / paths[0]).is_file()
        assert asset not in (tmp_path / "_site" / "index.html").read_text(
            encoding="utf-8"
        )
    for css_class in ("fcpython-ojs-quiz-config", "freecampus-quiz-config"):
        config = re.search(rf'class="{css_class}">(.*?)</script>', html, re.S)
        assert config is not None
        assert json.loads(config[1]) == quiz.to_dict()

    (tmp_path / "static.qmd").write_text(
        f"```{{.freecampus-quiz}}\n{quiz.to_json()}\n```\n", encoding="utf-8"
    )
    subprocess.run(
        [QUARTO, "render", "static.qmd", "--to", "gfm"], cwd=tmp_path, check=True
    )
    markdown = (tmp_path / "_site" / "static.md").read_text(encoding="utf-8")
    assert quiz.title in markdown
    assert quiz.questions[0].prompt in markdown
    assert "answer_index" not in markdown
    assert "<script" not in markdown
