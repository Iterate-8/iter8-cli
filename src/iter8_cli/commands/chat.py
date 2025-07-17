import click
from rich.console import Console
from rich.markdown import Markdown
from ..utils.api import APIClient
from ..utils.output import format_response

console = Console()

@click.command()
@click.argument('message', required=False)
@click.option('--output', '-o', type=click.File('w'), help='Save response to file')
@click.option('--json', 'output_json', is_flag=True, help='Output as JSON')
@click.pass_context
def chat(ctx, message, output, output_json):
    """Send a message to the iter8 assistant (placeholder)"""
    if not message:
        message = click.prompt('Message', type=str)

    # Placeholder: just echo the message
    response = {'response': f"Echo: {message}"}

    if output_json:
        import json
        result = json.dumps(response, indent=2)
        console.print(result)
        if output:
            output.write(result)
    else:
        formatted = format_response(response)
        console.print(formatted)
        if output:
            output.write(formatted) 