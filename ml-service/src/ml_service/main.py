"""Entry point of the ML service.

Run with ``make main`` or ``uv run src/ml_service/main.py``.
"""


def main() -> None:
    """Start the service.

    Side effects: prints a startup message to stdout.
    """
    print("ml-service ready")


if __name__ == "__main__":
    main()
