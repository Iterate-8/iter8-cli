import click
from rich.console import Console
from rich import print as rprint
from .config import Config
from .commands import chat, config as config_cmd

console = Console()

@click.group(invoke_without_command=True)
@click.option('--verbose', '-v', is_flag=True, help='Enable verbose output')
@click.option('--config-file', help='Path to config file')
@click.option('--version', is_flag=True, help='Show version and exit')
@click.pass_context
def cli(ctx, verbose, config_file, version):
    """iter8werful CLI toolkit for building command-line applications"""
    
    if version:
        rprint("bold blue]iter8 v0.1ld blue]")
        return
    
    ctx.ensure_object(dict)
    ctx.obj['verbose'] = verbose
    ctx.obj['config'] = Config(config_file)
    
    if verbose:
        console.print("[dim]Verbose mode enabled[/dim]")  
    # Show help if no subcommand provided
    if ctx.invoked_subcommand is None:
        rprint("[bold]iter8 - CLI Toolkit[/bold]")
        rprint("Use --help for more information on commands.")

# Register command groups
cli.add_command(chat.chat)
cli.add_command(config_cmd.config)

def main():
    cli(obj={})

if __name__ == '__main__':
    main() 