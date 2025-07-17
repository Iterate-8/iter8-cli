from rich.console import Console
from rich.table import Table
from rich.markdown import Markdown
from rich.json import JSON
from rich.panel import Panel
import json
from typing import Dict, Any, List

console = Console()

def format_response(response: Dict[str, Any], format_type: str = "text"):
    if format_type == "json":
        return JSON(json.dumps(response, indent=2))
    elif format_type == "table":
        return _create_table(response)
    else:
        content = response.get('response', str(response))
        return Markdown(content)

def _create_table(data: Dict[str, Any]) -> Table:
    table = Table(title="Response")
    table.add_column("Key", style="cyan")
    table.add_column("Value", style="green")
    for key, value in data.items():
        table.add_row(str(key), str(value))
    return table

def print_success(message: str):
    console.print(f"[green]✓ {message}[/green]")

def print_error(message: str):
    console.print(f"[red]✗ {message}[/red]")

def print_warning(message: str):
    console.print(f"[yellow]⚠ {message}[/yellow]")

def print_info(message: str):
    console.print(f"[blue]ℹ {message}[/blue]")

def print_panel(content: str, title: str = "Info", style: str = "blue"):
    panel = Panel(content, title=title, style=style)
    console.print(panel)

def print_json(data: Dict[str, Any]):
    json_obj = JSON(json.dumps(data, indent=2))
    console.print(json_obj)

def print_table(headers: List[str], rows: List[List[str]], title: str = "Data"):
    table = Table(title=title)
    for header in headers:
        table.add_column(header, style="cyan")
    for row in rows:
        table.add_row(*row)
    console.print(table) 