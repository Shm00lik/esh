import os

IGNORE_DIRS = {
    "__pycache__", ".git", ".idea", ".vscode", "node_modules", "build", "dist", ".venv", "venv"
}
IGNORE_EXTENSIONS = {
    ".pyc", ".pyo", ".exe", ".dll", ".so", ".dylib", ".bin", ".class", ".jar", ".zip", ".tar", ".gz", ".7z"
}

def write_files_recursive(base_dir, output_file, extra_dirs=None, extra_files=None):
    if extra_dirs is None:
        extra_dirs = []
    if extra_files is None:
        extra_files = []

    all_dirs = [base_dir] + extra_dirs

    with open(output_file, "w", encoding="utf-8") as out:
        for base in all_dirs:
            for root, dirs, files in os.walk(base):
                # Filter ignored directories
                dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]
                for file in files:
                    # Skip ignored extensions
                    if any(file.endswith(ext) for ext in IGNORE_EXTENSIONS):
                        continue
                    file_path = os.path.join(root, file)
                    # Skip drawable/mipmap directories
                    if 'drawable-' in file_path or 'mipmap-' in file_path:
                        continue
                    rel_path = os.path.relpath(file_path, base)
                    out.write(f"@@@ File: {os.path.join(base, rel_path)} @@@\n")
                    try:
                        with open(file_path, "r", encoding="utf-8") as f:
                            out.write(f.read())
                    except Exception as e:
                        out.write(f"## Could not read {rel_path}: {e}\n")
                    out.write("\n\n")
        # Handle extra files
        for file_path in extra_files:
            out.write(f"@@@ File: {file_path} @@@\n")
            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    out.write(f.read())
            except Exception as e:
                out.write(f"## Could not read {file_path}: {e}\n")
            out.write("\n\n")

if __name__ == "__main__":
    write_files_recursive("backend", "source.txt")
