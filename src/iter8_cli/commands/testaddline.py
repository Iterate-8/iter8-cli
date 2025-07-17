import click
import os

@click.command()
def testaddline():
    """Adds a print line to main.py after line 15."""
    # Path to main.py
    main_py = os.path.join(os.path.dirname(__file__), '..', '..', 'iter8_cli', 'main.py')
    main_py = os.path.abspath(main_py)
    if not os.path.exists(main_py):
        click.echo(f"main.py not found at {main_py}")
        return
    with open(main_py, 'r') as f:
        lines = f.readlines()
    # Insert after line 15 (1-based index)
    insert_line = 15
    line_to_insert = "print('This line was added by testaddline command!')\n"
    lines.insert(insert_line, line_to_insert)
    with open(main_py, 'w') as f:
        f.writelines(lines)
    click.echo(f"Added print line to main.py after line {insert_line}.") 