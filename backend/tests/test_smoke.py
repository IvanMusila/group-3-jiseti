from backend import create_app


def test_app_factory_runs():
    app = create_app()
    assert app.name == 'backend.app'
