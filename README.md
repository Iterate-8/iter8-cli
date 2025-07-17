# iter8 CLI

A powerful, extensible command-line interface tool.

## Installation

```bash
pip install -e .
```

## Usage

```bash
iter8 chat 'Hello, world!'

# Set API key (for future use)
iter8 config set-key
```

## Project Structure

```
iter8-cli/
├── src/
│   └── iter8_cli/
│       ├── __init__.py
│       ├── main.py
│       ├── config.py
│       ├── commands/
│       │   ├── __init__.py
│       │   ├── chat.py
│       │   └── config.py
│       └── utils/
│           ├── __init__.py
│           ├── api.py
│           └── output.py
├── tests/
├── setup.py
├── requirements.txt
└── README.md
```
