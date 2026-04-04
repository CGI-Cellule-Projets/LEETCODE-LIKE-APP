import io
import json
import sys
import time
import traceback
import tracemalloc


source_path = sys.argv[1]
result_path = sys.argv[2]


def write_result(execution_time_ms: float, memory_bytes: int) -> None:
    with open(result_path, "w", encoding="utf-8") as result_file:
        json.dump(
            {
                "executionTime": execution_time_ms,
                "memory": memory_bytes,
            },
            result_file,
        )


def format_value(value):
    if isinstance(value, str):
        return value
    return repr(value)


stdin_data = sys.stdin.read()
sys.stdin = io.StringIO(stdin_data)

namespace = {"__name__": "__main__", "stdin": stdin_data}

tracemalloc.start()
start_time = time.perf_counter()

try:
    with open(source_path, "r", encoding="utf-8") as source_file:
        source_code = source_file.read()

    compiled = compile(source_code, source_path, "exec")
    exec(compiled, namespace)

    solution = namespace.get("solution")
    if callable(solution):
        result = solution(stdin_data)
        if result is not None:
            sys.stdout.write(f"{format_value(result)}\n")

    current_memory, peak_memory = tracemalloc.get_traced_memory()
    write_result((time.perf_counter() - start_time) * 1000, max(current_memory, peak_memory))
except Exception:
    current_memory, peak_memory = tracemalloc.get_traced_memory()
    write_result((time.perf_counter() - start_time) * 1000, max(current_memory, peak_memory))
    traceback.print_exc(file=sys.stderr)
    sys.exit(1)

