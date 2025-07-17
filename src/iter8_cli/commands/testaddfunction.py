import click
import os

@click.command()
def testaddfunction():
    """Inserts a test function into main.py below a certain line."""
    # Path to main.py
    main_py = os.path.join(os.path.dirname(__file__), '..', '..', 'iter8_cli', 'main.py')
    main_py = os.path.abspath(main_py)
    if not os.path.exists(main_py):
        click.echo(f"main.py not found at {main_py}")
        return
    with open(main_py, 'r') as f:
        lines = f.readlines()
    # Insert after line101 index)
    insert_line = 10
    function_to_insert = """def test_function():
    \"\"\"This is a test function inserted by testaddfunction command.\"\"\
    print("Hello from test function!")
    return "test completed"
"""
    lines.insert(insert_line, function_to_insert)
    with open(main_py, 'w') as f:
        f.writelines(lines)
    click.echo(f"Inserted test function into main.py after line {insert_line}.") 