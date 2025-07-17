import json
import yaml
import keyring
from pathlib import Path
from typing import Dict, Any, Optional
import click

class Config:
    def __init__(self, config_file: Optional[str] = None):
        self.config_dir = Path.home() / '.iter8'
        self.config_file = Path(config_file) if config_file else self.config_dir / 'config.yaml'
        self.config_dir.mkdir(exist_ok=True)
        self._data = self._load_config()
    
    def _load_config(self) -> Dict[str, Any]:
        if not self.config_file.exists():
            return self._create_default_config()
        try:
            with open(self.config_file) as f:
                if self.config_file.suffix == '.yaml':
                    return yaml.safe_load(f) or {}
                else:
                    return json.load(f)
        except Exception as e:
            raise click.ClickException(f"Error loading config: {e}")
    
    def _create_default_config(self) -> Dict[str, Any]:
        default = {
            'api': {
                'base_url': 'https://api.anthropic.com',
                'model': 'claude-3-sonnet-20240229',
                'timeout': 30
            },
            'output': {
                'format': 'text',
                'color': True,
                'word_wrap': True
            },
            'history': {
                'enabled': True,
                'max_entries': 100
            }
        }
        self.save(default)
        return default
    
    def get(self, key: str, default=None):
        keys = key.split('.')
        value = self._data
        for k in keys:
            if isinstance(value, dict) and k in value:
                value = value[k]
            else:
                return default
        return value
    
    def set(self, key: str, value: Any):
        keys = key.split('.')
        target = self._data
        for k in keys[:-1]:
            if k not in target:
                target[k] = {}
            target = target[k]
        target[keys[-1]] = value
    
    def save(self, data: Dict[str, Any] = None):
        if data:
            self._data = data
        with open(self.config_file, 'w') as f:
            if self.config_file.suffix == '.yaml':
                yaml.dump(self._data, f, default_flow_style=False)
            else:
                json.dump(self._data, f, indent=2)
    
    def get_api_key(self) -> Optional[str]:
        return keyring.get_password('iter8', 'api_key')
    
    def set_api_key(self, api_key: str):
        keyring.set_password('iter8', 'api_key', api_key) 