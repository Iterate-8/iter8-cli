from setuptools import setup, find_packages

setup(
    name="iter8",
    version="0.1.0",
    packages=find_packages(where="src"),
    package_dir={"": "src"},
    install_requires=[
        "click>=8.0.0",
        "requests>=2.25.0",
        "rich>=12.0.0",
        "pyyaml>=6.0",
        "keyring>=23.0.0",
    ],
    entry_points={
        "console_scripts": [
            "iter8=iter8_cli.main:main",
        ],
    },
    python_requires=">=3.7",
) 