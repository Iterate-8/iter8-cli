import click
import os

@click.command()
def testaddcomment():
    """Adds a comment line to main.py after line 3."""
    # Path to main.py
    main_py = os.path.join(os.path.dirname(__file__), '..', '..', 'iter8_cli', 'main.py')
    main_py = os.path.abspath(main_py)
    if not os.path.exists(main_py):
        click.echo(f"main.py not found at {main_py}")
        return
    with open(main_py, 'r') as f:
        lines = f.readlines()
    # Insert after line 3 (1-based index)
    insert_line = 3
    comment_to_insert = "# This comment was added by testaddcomment command!\n"
    lines.insert(insert_line, comment_to_insert)
    with open(main_py, 'w') as f:
        f.writelines(lines)
    click.echo(f"Added comment to main.py after line {insert_line}.") 