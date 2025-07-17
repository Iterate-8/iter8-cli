import click
import os

@click.command()
def testaddcode():
    """Insert a print line into main.py below a certain line."""
    # Path to main.py
    main_py = os.path.join(os.path.dirname(__file__), '..', '..', 'iter8_cli', 'main.py')
    main_py = os.path.abspath(main_py)
    if not os.path.exists(main_py):
        click.echo(f"main.py not found at {main_py}")
        return
    with open(main_py, 'r') as f:
        lines = f.readlines()
    # Insert after line 5 (1-based index)
    insert_line = 5
    code_to_insert = "print('This is a test print line inserted by testaddcode command!')\n"
    lines.insert(insert_line, code_to_insert)
    with open(main_py, 'w') as f:
        f.writelines(lines)
    click.echo(f"Inserted print line into main.py after line {insert_line}.") 