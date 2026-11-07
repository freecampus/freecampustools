from importlib.metadata import version

import freecampustools


def test_package_exposes_version() -> None:
    assert freecampustools.__version__ == version("freecampustools")
