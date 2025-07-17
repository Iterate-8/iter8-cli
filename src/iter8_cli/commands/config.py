import click
from rich.console import Console

console = Console()

@click.group()
def config():
    """Configuration commands for iter8"""
    pass

@config.command('set-key')
@click.pass_context
def set_key(ctx):
    """Set API key (placeholder for future use)"""
    api_key = click.prompt('Enter your API key', hide_input=True)
    ctx.obj['config'].set_api_key(api_key)
    console.print('[green]API key saved (placeholder, not used yet).[/green]') 