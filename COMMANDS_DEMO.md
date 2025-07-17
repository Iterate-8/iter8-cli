# iter8-cli: Step-by-Step Command Demo

This guide will walk you through running and testing the custom CLI commands in your iter8-cli project.

---

## 1. **Activate Your Python Environment**
Make sure you are using the correct Python environment (e.g., Anaconda) where all dependencies are installed.

```sh
conda activate <your-env-name>
```

---

## 2. **Install the CLI in Editable Mode**
If you haven't already, install the CLI in editable mode:

```sh
pip install -e .
```

---

## 3. **Use the Standalone CLI Script**
All commands below use the standalone script. Make sure you are in the project root and the script is executable:

```sh
chmod +x ./iter8-cli
```

---

## 4. **List Available Commands**
See all available commands:

```sh
./iter8-cli --help
```

You should see commands like `testaddcode`, `testaddfunction`, `testaddline`, `testaddcomment`, etc.

---

## 5. **Try Each Command**

### a. **Add a Print Line**
Inserts a print statement after line 5 in `main.py`:
```sh
./iter8-cli testaddcode
```
- Check `src/iter8_cli/main.py` to see the new print line.

### b. **Add a Test Function**
Inserts a test function after line 10 in `main.py`:
```sh
./iter8-cli testaddfunction
```
- Check `src/iter8_cli/main.py` for the new function definition.

### c. **Add a Print Line at a Different Location**
Inserts a print statement after line 15 in `main.py`:
```sh
./iter8-cli testaddline
```
- Check `src/iter8_cli/main.py` for the new print line.

### d. **Add a Comment**
Inserts a comment after line 3 in `main.py`:
```sh
./iter8-cli testaddcomment
```
- Check `src/iter8_cli/main.py` for the new comment line.

---

## 6. **Verify the Changes**
Open `src/iter8_cli/main.py` in your editor (e.g., Cursor, VSCode) and confirm that the lines/functions/comments have been inserted at the correct locations.

---

## 7. **Troubleshooting**
- If a command fails with `main.py not found`, make sure your project structure matches:
  - `src/iter8_cli/main.py`
- If you get a `ModuleNotFoundError`, ensure all dependencies are installed:
  ```sh
  pip install -r requirements.txt
  ```
- If the CLI script does not run, check the shebang (`#!/opt/anaconda3/bin/python`) and permissions.

---

## 8. **Resetting main.py**
If you want to reset `main.py` to its original state, manually remove the lines/functions/comments added by the commands.

---

## 9. **Add Your Own Commands**
You can use the provided command files as templates to create your own code-modifying commands!

---

Happy testing! 🎉 