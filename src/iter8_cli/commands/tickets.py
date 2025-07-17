import os
import yaml
import click
from rich import print as rprint

TICKETS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), '..', '..', 'tickets')

@click.group()
def tickets():
    """Manage code change tickets."""
    pass

@tickets.command()
def list():
    """List all tickets."""
    files = [f for f in os.listdir(TICKETS_DIR) if f.endswith('.yaml')]
    if not files:
        rprint('[yellow]No tickets found.[/yellow]')
        return
    for f in files:
        with open(os.path.join(TICKETS_DIR, f)) as ticket_file:
            ticket = yaml.safe_load(ticket_file)
            rprint(f"[bold]{ticket['id']}[/bold]: {ticket['title']}")

@tickets.command()
@click.argument('ticket_id')
def show(ticket_id):
    """Show details of a ticket."""
    path = os.path.join(TICKETS_DIR, f'{ticket_id}.yaml')
    if not os.path.exists(path):
        rprint(f'[red]Ticket {ticket_id} not found.[/red]')
        return
    with open(path) as ticket_file:
        ticket = yaml.safe_load(ticket_file)
        rprint(ticket)

@tickets.command()
@click.argument('ticket_id')
def apply(ticket_id):
    """Apply the code change described in the ticket."""
    path = os.path.join(TICKETS_DIR, f'{ticket_id}.yaml')
    if not os.path.exists(path):
        rprint(f'[red]Ticket {ticket_id} not found.[/red]')
        return
    with open(path) as ticket_file:
        ticket = yaml.safe_load(ticket_file)
    file_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..', ticket['file']))
    if not os.path.exists(file_path):
        rprint(f"[red]Target file {ticket['file']} not found.[/red]")
        return
    with open(file_path, 'r') as f:
        lines = f.readlines()
    # Insert content at the specified line (1-based index)
    idx = max(0, int(ticket['line']) - 1)
    lines.insert(idx, ticket['content'] + '\n')
    with open(file_path, 'w') as f:
        f.writelines(lines)
    rprint(f"[green]Applied ticket {ticket_id} to {ticket['file']}.[/green]") 